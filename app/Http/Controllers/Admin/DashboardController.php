<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\Solicitud;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\Vale;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $sucursalesActivas = Sucursal::query()->where('activo', true)->count();

        return Inertia::render('Admin/Dashboard', [
            'resumen' => [
                'sucursales_activas' => $sucursalesActivas,
                'solicitudes_totales' => Solicitud::query()->count(),
                'solicitudes_pendientes' => Solicitud::query()->where('estado', Solicitud::ESTADO_VERIFICADA)->count(),
                'distribuidoras_activas' => Distribuidora::query()->where('estado', Distribuidora::ESTADO_ACTIVA)->count(),
                'vales_activos' => Vale::query()->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL])->count(),
            ],
        ]);
    }

    public function calendario(): Response
    {
        $sucursal = Sucursal::query()->with('configuracion')->first();
        $diaCorte = (int) ($sucursal?->configuracion?->dia_corte ?? 15);
        
        $ahora = now();
        $diasMesActual = $ahora->copy()->endOfMonth()->day;
        $dia1 = min($diaCorte, $diasMesActual);
        
        $fechasProgramadas = [
            $ahora->copy()->day($dia1)->format('Y-m-d'),
            $ahora->copy()->day($dia1)->addDays(15)->format('Y-m-d')
        ];

        return Inertia::render('Admin/Calendario', [
            'fechas_programadas' => $fechasProgramadas,
            'dia_corte_base' => $diaCorte
        ]);
    }

    public function reportes(Request $request): Response
    {
        $periodo = $request->string('periodo')->toString();
        if (!in_array($periodo, ['mes', 'trimestre', 'anio'], true)) {
            $periodo = 'mes';
        }

        $inicioPeriodo = match ($periodo) {
            'trimestre' => now()->startOfQuarter(),
            'anio' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $sucursalId = $request->integer('sucursal_id');

        $solicitudes = Solicitud::query()
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->where('creado_en', '>=', $inicioPeriodo);

        $vales = Vale::query()
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId));

        $distribuidoras = Distribuidora::query()
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId));

        $solicitudesPeriodo = (clone $solicitudes)->count();
        $solicitudesAprobadas = (clone $solicitudes)->where('estado', Solicitud::ESTADO_APROBADA)->count();
        $solicitudesRechazadas = (clone $solicitudes)->where('estado', Solicitud::ESTADO_RECHAZADA)->count();
        $solicitudesPendientes = (clone $solicitudes)->where('estado', Solicitud::ESTADO_VERIFICADA)->count();

        $decisionesTomadas = $solicitudesAprobadas + $solicitudesRechazadas;
        $tasaAprobacion = $decisionesTomadas > 0
            ? round(($solicitudesAprobadas / $decisionesTomadas) * 100, 2)
            : 0;
        $tasaRechazo = $decisionesTomadas > 0
            ? round(($solicitudesRechazadas / $decisionesTomadas) * 100, 2)
            : 0;

        $distribuidorasActivas = (clone $distribuidoras)->where('estado', Distribuidora::ESTADO_ACTIVA)->count();
        $distribuidorasMorosas = (clone $distribuidoras)->where('estado', Distribuidora::ESTADO_MOROSA)->count();
        $distribuidorasTotales = (clone $distribuidoras)->count();
        $indiceMorosidad = $distribuidorasTotales > 0
            ? round(($distribuidorasMorosas / $distribuidorasTotales) * 100, 2)
            : 0;

        $valesActivos = (clone $vales)->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL])->count();
        $valesMorosos = (clone $vales)->where('estado', Vale::ESTADO_MOROSO)->count();
        $capitalEnRiesgo = (float) ((clone $vales)->where('estado', Vale::ESTADO_MOROSO)->sum('saldo_actual') ?? 0);
        $capitalColocado = (float) ((clone $vales)->whereIn('estado', [
            Vale::ESTADO_ACTIVO,
            Vale::ESTADO_PAGO_PARCIAL,
            Vale::ESTADO_MOROSO,
        ])->sum('saldo_actual') ?? 0);

        $cortesDisponibles = \App\Models\Corte::query()
            ->with('sucursal:id,codigo,nombre')
            ->orderByDesc('fecha_programada')
            ->limit(50)
            ->get(['id', 'sucursal_id', 'tipo_corte', 'estado', 'fecha_programada', 'fecha_ejecucion'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'label' => '#' . $c->id . ' — ' . ($c->sucursal?->codigo ?? 'N/A') . ' — ' . $c->tipo_corte
                    . ' — ' . ($c->fecha_programada?->format('Y-m-d') ?? 'sin fecha') . ' (' . $c->estado . ')',
                'sucursal_id' => $c->sucursal_id,
            ]);

        return Inertia::render('Admin/Reportes', [
            'filtro' => [
                'periodo' => $periodo,
                'sucursal_id' => $sucursalId,
                'inicio' => $inicioPeriodo,
            ],
            'sucursales' => Sucursal::query()->where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'cortesDisponibles' => $cortesDisponibles,
            'resumen' => [
                'solicitudes_periodo' => $solicitudesPeriodo,
                'solicitudes_aprobadas' => $solicitudesAprobadas,
                'solicitudes_rechazadas' => $solicitudesRechazadas,
                'solicitudes_pendientes' => $solicitudesPendientes,
                'decisiones_tomadas' => $decisionesTomadas,
                'tasa_aprobacion' => $tasaAprobacion,
                'tasa_rechazo' => $tasaRechazo,
                'distribuidoras_activas' => $distribuidorasActivas,
                'distribuidoras_morosas' => $distribuidorasMorosas,
                'distribuidoras_totales' => $distribuidorasTotales,
                'indice_morosidad' => $indiceMorosidad,
                'vales_activos' => $valesActivos,
                'vales_morosos' => $valesMorosos,
                'capital_en_riesgo' => $capitalEnRiesgo,
                'capital_colocado' => $capitalColocado,
            ],
        ]);
    }
    public function rentabilidad(Request $request): Response
    {
        $fechaDesde = $request->string('fecha_desde', now()->startOfMonth()->toDateString())->toString();
        $fechaHasta = $request->string('fecha_hasta', now()->toDateString())->toString();

        $datosRentabilidad = DB::table('relaciones_corte as rc')
            ->join('cortes as c', 'c.id', '=', 'rc.corte_id')
            ->join('sucursales as s', 's.id', '=', 'c.sucursal_id')
            ->whereBetween('c.fecha_ejecucion', [$fechaDesde, $fechaHasta])
            ->where('rc.estado', '!=', RelacionCorte::ESTADO_GENERADA) // Solo lo que ya tiene compromiso de pago o pagado
            ->select([
                's.id as sucursal_id',
                's.nombre as sucursal_nombre',
                DB::raw('SUM(rc.total_comision) as total_comisiones'),
                DB::raw('SUM(rc.total_recargos) as total_recargos'),
                DB::raw('SUM(rc.total_pago) as capital_recuperado'),
                DB::raw('COUNT(DISTINCT rc.distribuidora_id) as distribuidoras_atendidas'),
                DB::raw('COUNT(rc.id) as cortes_procesados'),
            ])
            ->groupBy('s.id', 's.nombre')
            ->get()
            ->map(function ($item) {
                $item->ingresos_totales = (float) $item->total_comisiones + (float) $item->total_recargos;
                $item->total_comisiones = (float) $item->total_comisiones;
                $item->total_recargos = (float) $item->total_recargos;
                $item->capital_recuperado = (float) $item->capital_recuperado;
                return $item;
            });

        return Inertia::render('Admin/Rentabilidad', [
            'datos' => $datosRentabilidad,
            'filtros' => [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
            ],
            'resumen_global' => [
                'ingresos_totales' => $datosRentabilidad->sum('ingresos_totales'),
                'comisiones_totales' => $datosRentabilidad->sum('total_comisiones'),
                'recargos_totales' => $datosRentabilidad->sum('total_recargos'),
                'capital_total' => $datosRentabilidad->sum('capital_recuperado'),
            ]
        ]);
    }
}