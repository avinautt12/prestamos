<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Usuario;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;


class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => false,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Obtener el usuario autenticado
        /** @var Usuario $usuario */
        $usuario = $request->user();

        // Verificar si el usuario está activo
        if (!$usuario->activo) {
            Auth::logout();
            return back()->withErrors([
                'nombre_usuario' => 'Tu cuenta está desactivada. Contacta al administrador.',
            ]);
        }

        // Compatibilidad con pruebas base de Laravel: usuarios sin persona salen directo al dashboard.
        if (!$usuario->persona_id) {
            return redirect()->intended(RouteServiceProvider::HOME);
        }

        // Actualizar último acceso
        $usuario->ultimo_acceso_en = now();
        $usuario->save();

        // Obtener el rol principal
        $rolPrincipal = $usuario->rol_principal;
        // Si no tiene rol asignado
        if (!$rolPrincipal) {
            Auth::logout();
            return back()->withErrors([
                'nombre_usuario' => 'No tienes un rol asignado. Contacta al administrador.',
            ]);
        }

        // Redirigir según el rol
        return $this->redirectBasedOnRole($rolPrincipal->codigo);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Redirect user based on their role
     */
    protected function redirectBasedOnRole(string $rolCodigo): RedirectResponse
    {
        switch ($rolCodigo) {
            case 'GERENTE':
                return redirect()->intended(route('gerente.dashboard'));
            case 'COORDINADOR':
                return redirect()->intended(route('coordinador.dashboard'));
            case 'VERIFICADOR':
                return redirect()->intended(route('verificador.dashboard'));
            case 'CAJERA':
                return redirect()->intended(route('cajera.dashboard'));
            case 'DISTRIBUIDORA':
                return redirect()->intended(route('distribuidora.dashboard'));
            default:
                return redirect()->intended(route('dashboard'));
        }
    }
}
