<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();
        /** @var \App\Models\Usuario $user */
        // Obtener el rol principal del usuario
        $userRole = $user->obtenerRolPrincipal();

        // Si no tiene rol asignado
        if (!$userRole) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'nombre_usuario' => 'No tienes un rol asignado. Contacta al administrador.',
            ]);
        }

        // Verificar si el usuario tiene alguno de los roles permitidos
        foreach ($roles as $role) {
            if ($userRole->codigo === $role) {
                return $next($request);
            }
        }

        // Si no tiene permiso, redirigir según su rol
        $rolNombre = strtolower($userRole->codigo);

        switch ($rolNombre) {
            case 'gerente':
                return redirect()->route('gerente.dashboard');
            case 'coordinador':
                return redirect()->route('coordinador.dashboard');
            case 'verificador':
                return redirect()->route('verificador.dashboard');
            case 'cajera':
                return redirect()->route('cajera.dashboard');
            case 'distribuidora':
                return redirect()->route('distribuidora.dashboard');
            default:
                return redirect()->route('login');
        }
    }
}
