<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Models\BitacoraDecisionGerente;
use App\Models\Distribuidora;
use App\Models\Solicitud;
use App\Models\Usuario;
use App\Models\Vale;
use App\Services\CorteService;
use Illuminate\Support\Facades\Auth;
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
            ->where('sucursal_id', $sucursalId)
            ->whereIn('estado', [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
            ]);

        $totalValesActivos = (clone $valesActivosQuery)->count();

        $montoPrestado = (float) ((clone $valesActivosQuery)->sum('monto_principal') ?? 0);

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

    public function reportes()
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);
        $sucursalId = $sucursal?->id;

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

        $proximoCorte = $sucursal ? $this->corteService->obtenerProximoCorte($sucursal) : null;

        return Inertia::render('Gerente/Reportes', [
            'sucursal' => $sucursal,
            'resumen' => [
                'vales_morosos' => (clone $valesMorosos)->count(),
                'capital_en_riesgo' => $capitalEnRiesgo,
                'distribuidoras_morosas' => $distribuidorasMorosas->count(),
                'proximo_corte' => $proximoCorte,
            ],
            'distribuidorasMorosas' => $distribuidorasMorosas,
        ]);
    }
}
