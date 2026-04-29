<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use App\Models\PagoCliente;
use App\Models\PartidaRelacionCorte;
use App\Models\Vale;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MisValesController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = auth()->user();
        $cajeraId = (int) $usuario->id;
        $sucursalId = $usuario->sucursales->first()->id ?? null;

        $filtros = [
            'q'             => trim((string) $request->string('q', '')),
            'estado'        => (string) $request->string('estado', 'TODOS'),
            'intervencion'  => (string) $request->string('intervencion', 'TODOS'),
            'desde'         => (string) $request->string('desde', ''),
            'hasta'         => (string) $request->string('hasta', ''),
            'distribuidora' => (string) $request->string('distribuidora', 'TODOS'),
        ];

        $valeIdsAprobo = Vale::query()
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->where('aprobado_por_usuario_id', $cajeraId)
            ->pluck('id');

        $valeIdsCobro = PagoCliente::query()
            ->whereNull('revertido_en')
            ->where('cobrado_por_usuario_id', $cajeraId)
            ->when($sucursalId, fn($q) => $q->whereHas('vale', fn($sub) => $sub->where('sucursal_id', $sucursalId)))
            ->pluck('vale_id');

        $valeIdsConcilio = PartidaRelacionCorte::query()
            ->whereIn('relacion_corte_id', function ($sub) use ($cajeraId) {
                $sub->select('pd.relacion_corte_id')
                    ->from('pagos_distribuidora as pd')
                    ->join('conciliaciones as c', 'c.pago_distribuidora_id', '=', 'pd.id')
                    ->where('c.conciliado_por_usuario_id', $cajeraId);
            })
            ->when($sucursalId, fn($q) => $q->whereHas('vale', fn($sub) => $sub->where('sucursal_id', $sucursalId)))
            ->pluck('vale_id');

        $valeIds = collect()
            ->merge($valeIdsAprobo)
            ->merge($valeIdsCobro)
            ->merge($valeIdsConcilio)
            ->unique()
            ->values();

        $setAprobo = $valeIdsAprobo->flip();
        $setCobro = $valeIdsCobro->flip();
        $setConcilio = $valeIdsConcilio->flip();

        $query = Vale::query()
            ->with([
                'cliente.persona',
                'distribuidora.persona',
            ])
            ->whereIn('id', $valeIds)
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId));

        if ($filtros['estado'] !== 'TODOS') {
            $query->where('estado', $filtros['estado']);
        }

        if ($filtros['intervencion'] === 'FERIADO') {
            $query->whereIn('id', $valeIdsAprobo);
        } elseif ($filtros['intervencion'] === 'COBRO') {
            $query->whereIn('id', $valeIdsCobro);
        } elseif ($filtros['intervencion'] === 'CONCILIO') {
            $query->whereIn('id', $valeIdsConcilio);
        }

        if ($filtros['distribuidora'] !== 'TODOS' && is_numeric($filtros['distribuidora'])) {
            $query->where('distribuidora_id', (int) $filtros['distribuidora']);
        }

        if ($filtros['q'] !== '') {
            $termino = $filtros['q'];
            $query->where(function ($sub) use ($termino) {
                $sub->where('numero_vale', 'like', "%{$termino}%")
                    ->orWhereHas('cliente.persona', function ($personaQuery) use ($termino) {
                        $personaQuery->where('primer_nombre', 'like', "%{$termino}%")
                            ->orWhere('apellido_paterno', 'like', "%{$termino}%")
                            ->orWhere('apellido_materno', 'like', "%{$termino}%");
                    })
                    ->orWhereHas('distribuidora.persona', function ($personaQuery) use ($termino) {
                        $personaQuery->where('primer_nombre', 'like', "%{$termino}%")
                            ->orWhere('apellido_paterno', 'like', "%{$termino}%");
                    });
            });
        }

        $fechasIntervencionPorVale = $this->calcularFechasIntervencion(
            $valeIds,
            $cajeraId,
            $filtros['desde'] ?? null,
            $filtros['hasta'] ?? null
        );

        if ($filtros['desde'] !== '' || $filtros['hasta'] !== '') {
            $query->whereIn('id', $fechasIntervencionPorVale->keys()->all());
        }

        $valesPaginados = $query
            ->orderByDesc('fecha_emision')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $valesPaginados->getCollection()->transform(function (Vale $vale) use ($setAprobo, $setCobro, $setConcilio, $fechasIntervencionPorVale) {
            $clientePersona = $vale->cliente?->persona;
            $distPersona = $vale->distribuidora?->persona;

            $intervenciones = [];
            if ($setAprobo->has($vale->id)) $intervenciones[] = 'FERIADO';
            if ($setCobro->has($vale->id)) $intervenciones[] = 'COBRO';
            if ($setConcilio->has($vale->id)) $intervenciones[] = 'CONCILIO';

            return [
                'id'                  => $vale->id,
                'numero_vale'         => $vale->numero_vale,
                'estado'              => $vale->estado,
                'monto'               => (float) $vale->monto,
                'monto_total_deuda'   => (float) $vale->monto_total_deuda,
                'saldo_actual'        => (float) $vale->saldo_actual,
                'fecha_emision'       => optional($vale->fecha_emision)->toDateTimeString(),
                'cliente_nombre'      => trim(($clientePersona?->primer_nombre ?? '') . ' ' . ($clientePersona?->apellido_paterno ?? '') . ' ' . ($clientePersona?->apellido_materno ?? '')),
                'distribuidora_nombre' => trim(($distPersona?->primer_nombre ?? '') . ' ' . ($distPersona?->apellido_paterno ?? '')),
                'intervenciones'      => $intervenciones,
                'fecha_intervencion'  => $fechasIntervencionPorVale->get($vale->id),
            ];
        });

        $resumen = [
            'total_vales'      => $valeIds->count(),
            'total_feriados'   => $valeIdsAprobo->unique()->count(),
            'monto_feriado'    => (float) Vale::whereIn('id', $valeIdsAprobo)->sum('monto'),
            'total_cobros'     => $valeIdsCobro->count(),
            'monto_cobrado'    => (float) PagoCliente::whereNull('revertido_en')
                ->where('cobrado_por_usuario_id', $cajeraId)
                ->sum('monto'),
            'total_conciliados' => $valeIdsConcilio->unique()->count(),
        ];

        $distribuidorasOpciones = Vale::query()
            ->whereIn('id', $valeIds)
            ->with('distribuidora.persona')
            ->get()
            ->pluck('distribuidora')
            ->filter()
            ->unique('id')
            ->map(fn($d) => [
                'id' => $d->id,
                'nombre' => trim(($d->persona?->primer_nombre ?? '') . ' ' . ($d->persona?->apellido_paterno ?? '')),
            ])
            ->sortBy('nombre')
            ->values();

        return Inertia::render('Cajera/MisVales/Index', [
            'vales'                  => $valesPaginados,
            'resumen'                => $resumen,
            'filtros'                => $filtros,
            'distribuidorasOpciones' => $distribuidorasOpciones,
            'estadosOpciones'        => [
                Vale::ESTADO_BORRADOR,
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
                Vale::ESTADO_PAGADO,
                Vale::ESTADO_LIQUIDADO,
                Vale::ESTADO_MOROSO,
                Vale::ESTADO_RECLAMADO,
                Vale::ESTADO_CANCELADO,
                Vale::ESTADO_REVERSADO,
            ],
        ]);
    }

    private function calcularFechasIntervencion($valeIds, int $cajeraId, ?string $desde, ?string $hasta)
    {
        $aprobaciones = Vale::query()
            ->whereIn('id', $valeIds)
            ->where('aprobado_por_usuario_id', $cajeraId)
            ->whereNotNull('fecha_transferencia')
            ->pluck('fecha_transferencia', 'id');

        $cobros = PagoCliente::query()
            ->whereIn('vale_id', $valeIds)
            ->where('cobrado_por_usuario_id', $cajeraId)
            ->whereNull('revertido_en')
            ->selectRaw('vale_id, MAX(fecha_pago) as ultima')
            ->groupBy('vale_id')
            ->pluck('ultima', 'vale_id');

        $conciliaciones = PartidaRelacionCorte::query()
            ->whereIn('vale_id', $valeIds)
            ->join('relaciones_corte as rc', 'rc.id', '=', 'partidas_relacion_corte.relacion_corte_id')
            ->join('pagos_distribuidora as pd', 'pd.relacion_corte_id', '=', 'rc.id')
            ->join('conciliaciones as c', 'c.pago_distribuidora_id', '=', 'pd.id')
            ->where('c.conciliado_por_usuario_id', $cajeraId)
            ->selectRaw('partidas_relacion_corte.vale_id, MAX(c.conciliado_en) as ultima')
            ->groupBy('partidas_relacion_corte.vale_id')
            ->pluck('ultima', 'vale_id');

        $resultado = collect();
        foreach ($valeIds as $valeId) {
            $fechas = collect([
                $aprobaciones->get($valeId),
                $cobros->get($valeId),
                $conciliaciones->get($valeId),
            ])->filter()->map(fn($f) => Carbon::parse($f));

            if ($fechas->isEmpty()) continue;

            $masReciente = $fechas->max();

            $cumpleDesde = !$desde || $masReciente->gte(Carbon::parse($desde)->startOfDay());
            $cumpleHasta = !$hasta || $masReciente->lte(Carbon::parse($hasta)->endOfDay());

            if ($cumpleDesde && $cumpleHasta) {
                $resultado->put($valeId, $masReciente->toDateTimeString());
            }
        }

        return $resultado;
    }
}
