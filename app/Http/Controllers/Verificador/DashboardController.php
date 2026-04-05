<?php

namespace App\Http\Controllers\Verificador;

use App\Http\Controllers\Controller;
use App\Models\Solicitud;
use App\Models\VerificacionesSolicitud;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $sucursal = $usuario->sucursales()->first();
        $sucursalId = $sucursal?->id;

        $solicitudesPendientes = Solicitud::where('sucursal_id', $sucursalId)
            ->where('estado', 'EN_REVISION')
            ->whereNull('verificador_asignado_id')
            ->count();

        $solicitudesPorRevision = Solicitud::where('sucursal_id', $sucursalId)
            ->where('estado', 'EN_REVISION')
            ->where('verificador_asignado_id', $usuario->id)
            ->count();

        $solicitudesDisponibles = Solicitud::with(['persona'])
            ->where('sucursal_id', $sucursalId)
            ->where('estado', 'EN_REVISION')
            ->whereNull('verificador_asignado_id')
            ->orderBy('creado_en', 'asc')
            ->take(5)
            ->get();

        $solicitudesEnProceso = Solicitud::with(['persona', 'verificacion'])
            ->where('sucursal_id', $sucursalId)
            ->where('estado', 'EN_REVISION')
            ->where('verificador_asignado_id', $usuario->id)
            ->orderBy('creado_en', 'asc')
            ->take(5)
            ->get();

        $solicitudesVerificadas = Solicitud::where('sucursal_id', $sucursalId)
            ->where('estado', 'VERIFICADA')
            ->count();

        $validacionesHoy = VerificacionesSolicitud::where('verificador_usuario_id', $usuario->id)
            ->whereDate('fecha_visita', today())
            ->count();

        $solicitudesRechazadas = Solicitud::where('sucursal_id', $sucursalId)
            ->where('estado', 'RECHAZADA')
            ->count();

        return Inertia::render('Verificador/VerificadorDashboard', [
            'stats' => [
                'solicitudes_pendientes' => $solicitudesPendientes,
                'solicitudes_por_revision' => $solicitudesPorRevision,
                'solicitudes_en_proceso' => $solicitudesEnProceso->count(),
                'solicitudes_verificadas' => $solicitudesVerificadas,
                'validaciones_hoy' => $validacionesHoy,
                'solicitudes_rechazadas' => $solicitudesRechazadas,
            ],
            'solicitudesDisponibles' => $solicitudesDisponibles,
            'solicitudesEnProceso' => $solicitudesEnProceso,
            'usuario' => $usuario
        ]);
    }

    public function solicitudesPendientes()
    {
        return Inertia::render('Verificador/Solicitudes/Index');
    }

    public function validaciones()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $validaciones = VerificacionesSolicitud::with(['solicitud.persona'])
            ->where('verificador_usuario_id', $usuario->id)
            ->orderByDesc('fecha_visita')
            ->paginate(10);

        return Inertia::render('Verificador/Validaciones', [
            'validaciones' => $validaciones,
            'usuario' => $usuario,
        ]);
    }
}
