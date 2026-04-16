<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\RelacionCorte;
use App\Models\Vale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CobranzaController extends Controller
{
    /**
     * Vista principal del módulo de cobranza.
     * Muestra resumen y lista de distribuidoras con deuda.
     */
    public function index(Request $request)
    {
        $sucursal = $request->user()->sucursales()->first();
        $sucursalId = $sucursal?->id;

        // ── Stats globales ──────────────────────────────────────────
        $totalAdeudado = (float) RelacionCorte::query()
            ->whereIn('estado', [RelacionCorte::ESTADO_VENCIDA, RelacionCorte::ESTADO_PARCIAL, RelacionCorte::ESTADO_GENERADA])
            ->whereHas('distribuidora', fn ($q) => $q->where('sucursal_id', $sucursalId))
            ->sum('total_a_pagar');

        $totalPagado = (float) DB::table('pagos_distribuidora')
            ->join('relaciones_corte', 'pagos_distribuidora.relacion_corte_id', '=', 'relaciones_corte.id')
            ->join('distribuidoras', 'relaciones_corte.distribuidora_id', '=', 'distribuidoras.id')
            ->where('distribuidoras.sucursal_id', $sucursalId)
            ->whereIn('relaciones_corte.estado', [RelacionCorte::ESTADO_VENCIDA, RelacionCorte::ESTADO_PARCIAL])
            ->whereIn('pagos_distribuidora.estado', ['CONCILIADO', 'REPORTADO', 'DETECTADO'])
            ->sum('pagos_distribuidora.monto');

        $distribuidorasConDeuda = Distribuidora::query()
            ->where('sucursal_id', $sucursalId)
            ->whereHas('relacionesCorte', fn ($q) => $q->whereIn('estado', [
                RelacionCorte::ESTADO_VENCIDA,
                RelacionCorte::ESTADO_PARCIAL,
            ]))
            ->count();

        $relacionesVencidas = RelacionCorte::query()
            ->where('estado', RelacionCorte::ESTADO_VENCIDA)
            ->whereHas('distribuidora', fn ($q) => $q->where('sucursal_id', $sucursalId))
            ->count();

        $stats = [
            'total_adeudado'          => round($totalAdeudado - $totalPagado, 2),
            'distribuidoras_con_deuda' => $distribuidorasConDeuda,
            'relaciones_vencidas'     => $relacionesVencidas,
        ];

        // ── Lista de distribuidoras con deuda ───────────────────────
        $busqueda = $request->input('q', '');
        $filtroEstado = $request->input('estado', 'TODAS');

        $distribuidoras = Distribuidora::query()
            ->where('sucursal_id', $sucursalId)
            ->with(['persona:id,primer_nombre,apellido_paterno,apellido_materno'])
            // Solo distribuidoras con relaciones problemáticas o que ya están MOROSA/BLOQUEADA
            ->where(function ($q) use ($filtroEstado) {
                if ($filtroEstado === 'MOROSA') {
                    $q->where('estado', Distribuidora::ESTADO_MOROSA);
                } elseif ($filtroEstado === 'BLOQUEADA') {
                    $q->where('estado', Distribuidora::ESTADO_BLOQUEADA);
                } elseif ($filtroEstado === 'ACTIVA') {
                    $q->where('estado', Distribuidora::ESTADO_ACTIVA)
                      ->whereHas('relacionesCorte', fn ($r) => $r->whereIn('estado', [
                          RelacionCorte::ESTADO_VENCIDA,
                          RelacionCorte::ESTADO_PARCIAL,
                      ]));
                } else {
                    // TODAS: cualquiera que tenga deuda o esté MOROSA/BLOQUEADA
                    $q->where(function ($sub) {
                        $sub->whereHas('relacionesCorte', fn ($r) => $r->whereIn('estado', [
                            RelacionCorte::ESTADO_VENCIDA,
                            RelacionCorte::ESTADO_PARCIAL,
                        ]))
                        ->orWhereIn('estado', [
                            Distribuidora::ESTADO_MOROSA,
                            Distribuidora::ESTADO_BLOQUEADA,
                        ]);
                    });
                }
            })
            // Búsqueda por nombre o número
            ->when($busqueda, function ($q) use ($busqueda) {
                $q->where(function ($sub) use ($busqueda) {
                    $sub->where('numero_distribuidora', 'like', "%{$busqueda}%")
                        ->orWhereHas('persona', function ($p) use ($busqueda) {
                            $p->where('primer_nombre', 'like', "%{$busqueda}%")
                              ->orWhere('apellido_paterno', 'like', "%{$busqueda}%");
                        });
                });
            })
            // Agregar conteos y montos
            ->withCount([
                'relacionesCorte as relaciones_vencidas_count' => fn ($q) => $q->where('estado', RelacionCorte::ESTADO_VENCIDA),
                'relacionesCorte as relaciones_parciales_count' => fn ($q) => $q->where('estado', RelacionCorte::ESTADO_PARCIAL),
            ])
            ->withSum(
                ['relacionesCorte as monto_total_adeudado' => fn ($q) => $q->whereIn('estado', [
                    RelacionCorte::ESTADO_VENCIDA,
                    RelacionCorte::ESTADO_PARCIAL,
                    RelacionCorte::ESTADO_GENERADA,
                ])],
                'total_a_pagar'
            )
            ->orderByDesc('relaciones_vencidas_count')
            ->paginate(15)
            ->withQueryString();

        // Cargar relaciones vencidas por distribuidora (detalle expandible)
        $distribuidoraIds = $distribuidoras->pluck('id');
        $relacionesDetalle = RelacionCorte::query()
            ->whereIn('distribuidora_id', $distribuidoraIds)
            ->whereIn('estado', [RelacionCorte::ESTADO_VENCIDA, RelacionCorte::ESTADO_PARCIAL])
            ->with(['corte:id,fecha_programada'])
            ->orderByDesc('fecha_limite_pago')
            ->get()
            ->groupBy('distribuidora_id')
            ->map(fn ($grupo) => $grupo->values());

        return Inertia::render('Cajera/Cobranza/Index', [
            'stats'              => $stats,
            'distribuidoras'     => $distribuidoras,
            'relacionesDetalle'  => $relacionesDetalle,
            'filtros'            => [
                'q'      => $busqueda,
                'estado' => $filtroEstado,
            ],
        ]);
    }

    /**
     * Bloquear distribuidora por morosidad.
     * Cambia estado a MOROSA y deshabilita emisión de vales.
     */
    public function bloquear(Request $request, $distribuidoraId)
    {
        $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
        ]);

        $distribuidora = Distribuidora::findOrFail($distribuidoraId);

        if ($distribuidora->estado === Distribuidora::ESTADO_MOROSA) {
            return back()->with('error', 'La distribuidora ya se encuentra en estado MOROSA.');
        }

        if (!in_array($distribuidora->estado, [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA])) {
            return back()->with('error', 'Solo se pueden bloquear distribuidoras en estado ACTIVA.');
        }

        DB::transaction(function () use ($distribuidora, $request) {
            $distribuidora->update([
                'estado'            => Distribuidora::ESTADO_MOROSA,
                'puede_emitir_vales' => false,
            ]);

            // Marcar relaciones vencidas/parciales de esta distribuidora
            RelacionCorte::query()
                ->where('distribuidora_id', $distribuidora->id)
                ->where('estado', RelacionCorte::ESTADO_GENERADA)
                ->where('fecha_limite_pago', '<', now()->toDateString())
                ->update(['estado' => RelacionCorte::ESTADO_VENCIDA]);
        });

        return back()->with('message', "Distribuidora {$distribuidora->numero_distribuidora} bloqueada por morosidad.");
    }

    /**
     * Desbloquear distribuidora.
     * Restaura estado a ACTIVA y habilita emisión de vales.
     */
    public function desbloquear(Request $request, $distribuidoraId)
    {
        $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
        ]);

        $distribuidora = Distribuidora::findOrFail($distribuidoraId);

        if (!in_array($distribuidora->estado, [Distribuidora::ESTADO_MOROSA, Distribuidora::ESTADO_BLOQUEADA])) {
            return back()->with('error', 'Solo se pueden desbloquear distribuidoras en estado MOROSA o BLOQUEADA.');
        }

        // Verificar que no tenga relaciones vencidas sin pagar
        $relacionesVencidas = RelacionCorte::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->where('estado', RelacionCorte::ESTADO_VENCIDA)
            ->count();

        if ($relacionesVencidas > 0) {
            return back()->with('error', "No se puede desbloquear: tiene {$relacionesVencidas} relación(es) vencida(s) sin pagar.");
        }

        $distribuidora->update([
            'estado'            => Distribuidora::ESTADO_ACTIVA,
            'puede_emitir_vales' => true,
        ]);

        return back()->with('message', "Distribuidora {$distribuidora->numero_distribuidora} desbloqueada exitosamente.");
    }
}
