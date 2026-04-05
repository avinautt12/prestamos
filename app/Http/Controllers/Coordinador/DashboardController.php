<?php

namespace App\Http\Controllers\Coordinador;

use App\Http\Controllers\Controller;
use App\Models\Solicitud;
use App\Models\Distribuidora;
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

        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $solicitudesPendientes = Solicitud::whereIn('estado', [Solicitud::ESTADO_PRE, Solicitud::ESTADO_EN_REVISION])
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->count();

        $distribuidorasBase = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            });

        $distribuidorasActivas = $distribuidorasBase->count();

        $clientesActivos = 0;
        $distribuidorasIds = (clone $distribuidorasBase)
            ->pluck('id');

        if ($distribuidorasIds->isNotEmpty()) {
            $clientesActivos = DB::table('clientes_distribuidora')
                ->whereIn('distribuidora_id', $distribuidorasIds)
                ->where('estado_relacion', 'ACTIVA')
                ->count();
        }

        $valesActivos = Vale::whereIn('distribuidora_id', $distribuidorasIds)
            ->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL])
            ->count();

        $estatusSolicitudes = Solicitud::query()
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        return Inertia::render('Coordinador/CoordinadorDashboard', [
            'stats' => [
                'solicitudes_pendientes' => $solicitudesPendientes,
                'distribuidoras_activas' => $distribuidorasActivas,
                'clientes_activos' => $clientesActivos,
                'vales_activos' => $valesActivos,
                'estatus_solicitudes' => [
                    'pre_solicitud' => (int) ($estatusSolicitudes['PRE'] ?? 0),
                    'en_verificacion' => (int) ($estatusSolicitudes['EN_REVISION'] ?? 0),
                    'verificada' => (int) ($estatusSolicitudes['VERIFICADA'] ?? 0),
                    'activa' => (int) ($estatusSolicitudes['APROBADA'] ?? 0),
                    'rechazada' => (int) ($estatusSolicitudes['RECHAZADA'] ?? 0),
                ],
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
