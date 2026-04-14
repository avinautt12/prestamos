<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Vale;
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

        return Inertia::render('Admin/Reportes', [
            'filtro' => [
                'periodo' => $periodo,
                'sucursal_id' => $sucursalId,
                'inicio' => $inicioPeriodo,
            ],
            'sucursales' => Sucursal::query()->where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
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
}
