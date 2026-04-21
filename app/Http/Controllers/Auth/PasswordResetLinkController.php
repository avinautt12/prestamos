<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use App\Models\Usuario;
use App\Models\SolicitudPassword;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'nombre_usuario' => 'required|string',
        ]);

        $usuario = Usuario::where('nombre_usuario', $request->nombre_usuario)->first();

        if (!$usuario) {
            throw ValidationException::withMessages([
                'nombre_usuario' => 'No encontramos ningún usuario con ese nombre en el sistema.',
            ]);
        }

        // Check if there is already a pending request
        $pending = SolicitudPassword::where('usuario_id', $usuario->id)
            ->where('estado', 'PENDIENTE')
            ->first();

        if ($pending) {
            throw ValidationException::withMessages([
                'nombre_usuario' => 'Por favor, espera un correo con la confirmación de tu solicitud.',
            ]);
        }

        SolicitudPassword::create([
            'usuario_id' => $usuario->id,
            'estado' => 'PENDIENTE'
        ]);

        return back()->with('status', 'Tu solicitud ha sido enviada. Un gerente debe aprobarla. Una vez aprobada, recibirás un correo electrónico con el enlace.');
    }
}
