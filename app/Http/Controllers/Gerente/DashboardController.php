<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Models\BitacoraDecisionGerente;
use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\RelacionCorte;
use App\Models\Solicitud;
use App\Models\Usuario;
use App\Models\Vale;
use App\Services\CorteService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function __construct(private readonly CorteService $corteService) {}

    public function index()
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);
        $sucursalId = $sucursal?->id;

        if (!$sucursalId) {
            return Inertia::render('Gerente/GerenteDashboard', [
                'stats' => [
                    'sucursal_nombre' => null,
                    'total_distribuidoras' => 0,
                    'total_vales_activos' => 0,
                    'monto_prestado' => 0,
                    'solicitudes_pendientes' => 0,
                    'solicitudes_aprobadas_mes' => 0,
                    'solicitudes_rechazadas_mes' => 0,
                    'distribuidoras_morosas' => 0,
                    'capital_en_riesgo' => 0,
                    'proximo_corte' => null,
                ],
                'actividadReciente' => [],
            ]);
        }

        $totalDistribuidoras = Distribuidora::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Distribuidora::ESTADO_ACTIVA)
            ->count();

        $valesActivosQuery = Vale::query()
            ->where('vales.sucursal_id', $sucursalId) // Especificamos 'vales.' por si acaso
            ->whereIn('vales.estado', [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
            ]);

        $totalValesActivos = (clone $valesActivosQuery)->count();

        // NUEVO: Hacemos join con productos_financieros para sumar la columna que movieron
        $montoPrestado = (float) ((clone $valesActivosQuery)
            ->join('productos_financieros', 'vales.producto_financiero_id', '=', 'productos_financieros.id')
            ->sum('productos_financieros.monto_principal') ?? 0);

        $solicitudesPendientes = Solicitud::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->count();

        $inicioMes = now()->startOfMonth();

        $solicitudesAprobadasMes = Solicitud::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Solicitud::ESTADO_APROBADA)
            ->where('decidida_en', '>=', $inicioMes)
            ->count();

        $solicitudesRechazadasMes = Solicitud::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Solicitud::ESTADO_RECHAZADA)
            ->where('decidida_en', '>=', $inicioMes)
            ->count();

        $distribuidorasMorosas = Distribuidora::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Distribuidora::ESTADO_MOROSA)
            ->count();

        $capitalEnRiesgo = (float) (Vale::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Vale::ESTADO_MOROSO)
            ->sum('saldo_actual') ?? 0);

        $proximoCorte = $sucursal ? $this->corteService->obtenerProximoCorte($sucursal) : null;

        $actividadReciente = BitacoraDecisionGerente::query()
            ->with(['solicitud.persona'])
            ->where('gerente_usuario_id', $gerente->id)
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(function (BitacoraDecisionGerente $item) {
                $persona = $item->solicitud?->persona;
                $nombre = $persona
                    ? trim(implode(' ', array_filter([
                        $persona->primer_nombre,
                        $persona->apellido_paterno,
                        $persona->apellido_materno,
                    ])))
                    : 'Solicitud sin nombre';

                return [
                    'id' => $item->id,
                    'solicitud_id' => $item->solicitud_id,
                    'tipo_evento' => $item->tipo_evento,
                    'monto_anterior' => (float) $item->monto_anterior,
                    'monto_nuevo' => (float) $item->monto_nuevo,
                    'creado_en' => $item->creado_en,
                    'prospecto' => $nombre,
                ];
            })
            ->values();

        return Inertia::render('Gerente/GerenteDashboard', [
            'stats' => [
                'sucursal_nombre' => $sucursal?->nombre,
                'total_distribuidoras' => $totalDistribuidoras,
                'total_vales_activos' => $totalValesActivos,
                'monto_prestado' => $montoPrestado,
                'solicitudes_pendientes' => $solicitudesPendientes,
                'solicitudes_aprobadas_mes' => $solicitudesAprobadasMes,
                'solicitudes_rechazadas_mes' => $solicitudesRechazadasMes,
                'distribuidoras_morosas' => $distribuidorasMorosas,
                'capital_en_riesgo' => $capitalEnRiesgo,
                'proximo_corte' => $proximoCorte,
            ],
            'actividadReciente' => $actividadReciente,
        ]);
    }

    public function reportes(Request $request)
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);
        $sucursalId = $sucursal?->id;

        $periodo = $request->string('periodo')->toString();
        if (! in_array($periodo, ['mes', 'trimestre', 'anio'], true)) {
            $periodo = 'mes';
        }

        $inicioPeriodo = match ($periodo) {
            'trimestre' => now()->startOfQuarter(),
            'anio' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        if (! $sucursalId) {
            return Inertia::render('Gerente/Reportes', [
                'sucursal' => null,
                'filtro' => [
                    'periodo' => $periodo,
                    'inicio' => $inicioPeriodo,
                ],
                'resumen' => [
                    'vales_morosos' => 0,
                    'capital_en_riesgo' => 0,
                    'distribuidoras_morosas' => 0,
                    'proximo_corte' => null,
                    'saldo_cortes' => 0,
                    'relaciones_abiertas' => 0,
                    'monto_vencido_cortes' => 0,
                    'presolicitudes_pendientes' => 0,
                    'presolicitudes_validadas' => 0,
                ],
                'distribuidorasMorosas' => [],
                'saldoCortes' => [
                    'relaciones_abiertas' => 0,
                    'saldo_total' => 0,
                    'monto_vencido' => 0,
                ],
                'presolicitudes' => [
                    'pendientes' => 0,
                    'validadas' => 0,
                    'aprobadas' => 0,
                    'rechazadas' => 0,
                    'tasa_validacion' => 0,
                ],
                'puntosPorDistribuidora' => [],
                'corteReferencia' => null,
            ]);
        }

        $valesMorosos = Vale::query()
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Vale::ESTADO_MOROSO);

        $capitalEnRiesgo = (float) ((clone $valesMorosos)->sum('saldo_actual') ?? 0);

        $distribuidorasMorosas = Distribuidora::query()
            ->with(['persona'])
            ->where('sucursal_id', $sucursalId)
            ->where('estado', Distribuidora::ESTADO_MOROSA)
            ->orderByDesc('actualizado_en')
            ->take(10)
            ->get();

        $estadosRelacionAbierta = [
            RelacionCorte::ESTADO_GENERADA,
            RelacionCorte::ESTADO_PARCIAL,
            RelacionCorte::ESTADO_VENCIDA,
        ];

        $saldoCortesQuery = RelacionCorte::query()
            ->whereHas('corte', function ($query) use ($sucursalId) {
                $query->where('sucursal_id', $sucursalId);
            });

        $saldoCortes = (float) ((clone $saldoCortesQuery)
            ->whereIn('estado', $estadosRelacionAbierta)
            ->selectRaw('COALESCE(SUM(GREATEST(total_a_pagar - total_pago, 0)), 0) as saldo_total')
            ->value('saldo_total') ?? 0);

        $montoVencidoCortes = (float) ((clone $saldoCortesQuery)
            ->where('estado', RelacionCorte::ESTADO_VENCIDA)
            ->selectRaw('COALESCE(SUM(GREATEST(total_a_pagar - total_pago, 0)), 0) as saldo_vencido')
            ->value('saldo_vencido') ?? 0);

        $relacionesAbiertas = (clone $saldoCortesQuery)
            ->whereIn('estado', $estadosRelacionAbierta)
            ->count();

        $presolicitudesBase = Solicitud::query()
            ->where('sucursal_id', $sucursalId)
            ->where('creado_en', '>=', $inicioPeriodo);

        $presolicitudesPendientes = (clone $presolicitudesBase)
            ->whereIn('estado', [
                Solicitud::ESTADO_PRE,
                Solicitud::ESTADO_MODIFICADA,
                Solicitud::ESTADO_EN_REVISION,
            ])
            ->count();

        $presolicitudesValidadas = (clone $presolicitudesBase)
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->count();

        $presolicitudesAprobadas = (clone $presolicitudesBase)
            ->where('estado', Solicitud::ESTADO_APROBADA)
            ->count();

        $presolicitudesRechazadas = (clone $presolicitudesBase)
            ->where('estado', Solicitud::ESTADO_RECHAZADA)
            ->count();

        $totalPreSolicitudes = $presolicitudesPendientes + $presolicitudesValidadas;
        $tasaValidacion = $totalPreSolicitudes > 0
            ? round(($presolicitudesValidadas / $totalPreSolicitudes) * 100, 1)
            : 0;

        $corteReferencia = Corte::query()
            ->where('sucursal_id', $sucursalId)
            ->orderByRaw('fecha_ejecucion IS NULL')
            ->orderByDesc('fecha_ejecucion')
            ->orderByDesc('fecha_programada')
            ->first();

        $puntosPorDistribuidora = collect();
        if ($corteReferencia) {
            $puntosPorDistribuidora = RelacionCorte::query()
                ->with(['distribuidora.persona'])
                ->where('corte_id', $corteReferencia->id)
                ->orderByDesc('puntos_snapshot')
                ->limit(8)
                ->get()
                ->map(function (RelacionCorte $relacion) {
                    $persona = $relacion->distribuidora?->persona;
                    $nombre = $persona
                        ? trim(implode(' ', array_filter([
                            $persona->primer_nombre,
                            $persona->apellido_paterno,
                            $persona->apellido_materno,
                        ])))
                        : 'Sin nombre';

                    return [
                        'id' => $relacion->id,
                        'distribuidora_id' => $relacion->distribuidora_id,
                        'nombre' => $nombre,
                        'numero_distribuidora' => $relacion->distribuidora?->numero_distribuidora,
                        'puntos_snapshot' => (float) $relacion->puntos_snapshot,
                        'saldo_relacion' => max((float) $relacion->total_a_pagar - (float) $relacion->total_pago, 0),
                        'estado_relacion' => $relacion->estado,
                    ];
                })
                ->values();
        }

        $proximoCorte = $sucursal ? $this->corteService->obtenerProximoCorte($sucursal) : null;

        return Inertia::render('Gerente/Reportes', [
            'sucursal' => $sucursal,
            'filtro' => [
                'periodo' => $periodo,
                'inicio' => $inicioPeriodo,
            ],
            'resumen' => [
                'vales_morosos' => (clone $valesMorosos)->count(),
                'capital_en_riesgo' => $capitalEnRiesgo,
                'distribuidoras_morosas' => $distribuidorasMorosas->count(),
                'proximo_corte' => $proximoCorte,
                'saldo_cortes' => $saldoCortes,
                'relaciones_abiertas' => $relacionesAbiertas,
                'monto_vencido_cortes' => $montoVencidoCortes,
                'presolicitudes_pendientes' => $presolicitudesPendientes,
                'presolicitudes_validadas' => $presolicitudesValidadas,
            ],
            'distribuidorasMorosas' => $distribuidorasMorosas,
            'saldoCortes' => [
                'relaciones_abiertas' => $relacionesAbiertas,
                'saldo_total' => $saldoCortes,
                'monto_vencido' => $montoVencidoCortes,
            ],
            'presolicitudes' => [
                'pendientes' => $presolicitudesPendientes,
                'validadas' => $presolicitudesValidadas,
                'aprobadas' => $presolicitudesAprobadas,
                'rechazadas' => $presolicitudesRechazadas,
                'tasa_validacion' => $tasaValidacion,
            ],
            'puntosPorDistribuidora' => $puntosPorDistribuidora,
            'corteReferencia' => $corteReferencia,
        ]);
    }
}
