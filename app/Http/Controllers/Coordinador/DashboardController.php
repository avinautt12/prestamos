<?php

namespace App\Http\Controllers\Coordinador;

use App\Http\Controllers\Controller;
use App\Models\Solicitud;
use App\Models\Distribuidora;
use App\Models\Cliente;
use App\Models\Vale;
use App\Models\Sucursal;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        // Obtener la sucursal activa del coordinador usando la misma lógica del alta de solicitudes
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        // Solicitudes pendientes asignadas al coordinador o a su sucursal activa
        $solicitudesPendientes = Solicitud::whereIn('estado', [Solicitud::ESTADO_PRE, Solicitud::ESTADO_EN_REVISION])
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->count();

        // Distribuidoras activas vinculadas al coordinador o a su sucursal activa
        $distribuidorasBase = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            });

        $distribuidorasActivas = $distribuidorasBase->count();

        // Clientes activos de sus distribuidoras
        $clientesActivos = 0;
        $distribuidorasIds = (clone $distribuidorasBase)
            ->pluck('id');

        if ($distribuidorasIds->isNotEmpty()) {
            $clientesActivos = DB::table('clientes_distribuidora')
                ->whereIn('distribuidora_id', $distribuidorasIds)
                ->where('estado_relacion', 'ACTIVA')
                ->count();
        }

        // Vales activos de sus distribuidoras
        $valesActivos = Vale::whereIn('distribuidora_id', $distribuidorasIds)
            ->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL])
            ->count();

        return Inertia::render('Coordinador/CoordinadorDashboard', [
            'stats' => [
                'solicitudes_pendientes' => $solicitudesPendientes,
                'distribuidoras_activas' => $distribuidorasActivas,
                'clientes_activos' => $clientesActivos,
                'vales_activos' => $valesActivos,
            ],
            'usuario' => $usuario
        ]);
    }

    private function obtenerSucursalActivaCoordinador($usuario): ?Sucursal
    {
        $rolCoordinador = $usuario->roles()
            ->where('roles.codigo', 'COORDINADOR')
            ->wherePivotNull('revocado_en')
            ->whereNotNull('usuario_rol.sucursal_id')
            ->orderByDesc('usuario_rol.es_principal')
            ->orderByDesc('usuario_rol.asignado_en')
            ->first();

        if ($rolCoordinador && $rolCoordinador->pivot?->sucursal_id) {
            return Sucursal::find($rolCoordinador->pivot->sucursal_id);
        }

        return Sucursal::where('activo', true)->orderBy('id')->first();
    }

    public function solicitudes()
    {
        return Inertia::render('Coordinador/Solicitudes/Index');
    }

    public function clientes()
    {
        return Inertia::render('Coordinador/Clientes');
    }

    public function misDistribuidoras()
    {
        return Inertia::render('Coordinador/MisDistribuidoras');
    }
}
