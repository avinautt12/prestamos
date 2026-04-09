<?php

namespace App\Http\Controllers\Coordinador;

use App\Http\Controllers\Controller;
use App\Models\Solicitud;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Vale;
use App\Models\Sucursal;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

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

    public function clientes(Request $request)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $clientesQuery = Cliente::query()
            ->with(['persona', 'distribuidoras' => function ($query) {
                $query->select('distribuidoras.id', 'numero_distribuidora', 'coordinador_usuario_id', 'sucursal_id');
            }])
            ->whereHas('distribuidoras', function ($query) use ($usuario, $sucursalId) {
                $query->where(function ($scope) use ($usuario, $sucursalId) {
                    $scope->where('coordinador_usuario_id', $usuario->id);

                    if ($sucursalId) {
                        $scope->orWhere('sucursal_id', $sucursalId);
                    }
                });
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();

                $query->where(function ($q) use ($search) {
                    $q->where('codigo_cliente', 'LIKE', "%{$search}%")
                        ->orWhereHas('persona', function ($personaQuery) use ($search) {
                            $personaQuery->where('primer_nombre', 'LIKE', "%{$search}%")
                                ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                                ->orWhere('apellido_materno', 'LIKE', "%{$search}%")
                                ->orWhere('curp', 'LIKE', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('estado'), function ($query) use ($request) {
                $query->where('estado', $request->string('estado')->toString());
            });

        $clientes = (clone $clientesQuery)
            ->orderByDesc('id')
            ->paginate(12)
            ->appends($request->query());

        $estadisticas = [
            'total' => (clone $clientesQuery)->count(),
            'activos' => (clone $clientesQuery)->where('estado', Cliente::ESTADO_ACTIVO)->count(),
            'morosos' => (clone $clientesQuery)->where('estado', Cliente::ESTADO_MOROSO)->count(),
            'bloqueados' => (clone $clientesQuery)->where('estado', Cliente::ESTADO_BLOQUEADO)->count(),
        ];

        return Inertia::render('Coordinador/Clientes', [
            'clientes' => $clientes,
            'estadisticas' => $estadisticas,
            'filters' => $request->only(['search', 'estado']),
        ]);
    }

    public function misDistribuidoras(Request $request)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $distribuidorasQuery = Distribuidora::query()
            ->with(['persona', 'categoria'])
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();

                $query->where(function ($q) use ($search) {
                    $q->where('numero_distribuidora', 'LIKE', "%{$search}%")
                        ->orWhereHas('persona', function ($personaQuery) use ($search) {
                            $personaQuery->where('primer_nombre', 'LIKE', "%{$search}%")
                                ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                                ->orWhere('apellido_materno', 'LIKE', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('estado'), function ($query) use ($request) {
                $query->where('estado', $request->string('estado')->toString());
            });

        $distribuidoras = (clone $distribuidorasQuery)
            ->orderByDesc('id')
            ->paginate(12)
            ->appends($request->query());

        $estadisticas = [
            'total' => (clone $distribuidorasQuery)->count(),
            'activas' => (clone $distribuidorasQuery)->where('estado', Distribuidora::ESTADO_ACTIVA)->count(),
            'morosas' => (clone $distribuidorasQuery)->where('estado', Distribuidora::ESTADO_MOROSA)->count(),
            'bloqueadas' => (clone $distribuidorasQuery)->where('estado', Distribuidora::ESTADO_BLOQUEADA)->count(),
        ];

        return Inertia::render('Coordinador/MisDistribuidoras', [
            'distribuidoras' => $distribuidoras,
            'estadisticas' => $estadisticas,
            'filters' => $request->only(['search', 'estado']),
        ]);
    }
}
