<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use App\Models\SolicitudPassword;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $solicitud = SolicitudPassword::with('usuario')->where('token_generado', $request->token)
            ->where('estado', 'APROBADA')
            ->first();

        if (!$solicitud) {
            throw ValidationException::withMessages([
                'email' => 'El enlace de restablecimiento es inválido o el código no concuerda.',
            ]);
        }

        if ($solicitud->usuario->nombre_usuario !== $request->email) {
            throw ValidationException::withMessages([
                'email' => 'Este enlace no pertenece a este usuario.',
            ]);
        }

        if (now()->greaterThan($solicitud->expira_en)) {
            $solicitud->update(['estado' => 'EXPIRADA']);
            throw ValidationException::withMessages([
                'email' => 'El enlace ha caducado. El límite de tiempo era de 10 minutos.',
            ]);
        }

        // Actualizar constraseña
        $usuario = $solicitud->usuario;
        $usuario->clave_hash = Hash::make($request->password);
        $usuario->save();

        // Expira inmediatamente la solicitud para evitar re-usos
        $solicitud->update(['estado' => 'EXPIRADA']);

        return redirect()->route('login')->with('status', 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.');
    }
}
