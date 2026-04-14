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
            $usuario->loadMissing('persona');
            $usuario->append('rol_nombre');

            $rolPrincipal = $usuario->obtenerRolPrincipal();

            if ($rolPrincipal) {
                $sucursalId = $usuario->roles()
                    ->where('roles.id', $rolPrincipal->id)
                    ->wherePivotNull('revocado_en')
                    ->orderByDesc('usuario_rol.es_principal')
                    ->orderByDesc('usuario_rol.asignado_en')
                    ->value('usuario_rol.sucursal_id');

                $usuario->rol_nombre = $rolPrincipal->nombre;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $usuario,
                'sucursal_id' => $sucursalId,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'message' => fn() => $request->session()->get('message'),
                'error' => fn() => $request->session()->get('error'),
                'activation_link' => fn() => $request->session()->get('activation_link'),
                'activation_expires_at' => fn() => $request->session()->get('activation_expires_at'),
                'import_result' => fn() => $request->session()->get('import_result'),
            ],
        ];
    }
}
