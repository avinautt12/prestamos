<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $usuario = $request->user();
        $sucursalId = null;

        if ($usuario) {
            $rolPrincipal = $usuario->roles()
                ->wherePivotNull('revocado_en')
                ->whereNotNull('usuario_rol.sucursal_id')
                ->orderByDesc('usuario_rol.es_principal')
                ->orderByDesc('usuario_rol.asignado_en')
                ->first();

            $sucursalId = $rolPrincipal?->pivot?->sucursal_id;
            
            $usuario->rol_nombre = $rolPrincipal?->nombre; 
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $usuario,
                'sucursal_id' => $sucursalId,
            ],
        ];
    }
}
