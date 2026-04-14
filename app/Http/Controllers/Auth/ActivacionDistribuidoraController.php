<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ActivacionDistribuidoraController extends Controller
{
    public function show(string $token): Response
    {
        $registro = $this->obtenerRegistroPorToken($token);

        return Inertia::render('Auth/ActivarCuentaDistribuidora', [
            'token' => $token,
            'valido' => (bool) $registro,
            'expirado' => $registro ? now()->gt($registro->expira_en) : false,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        return DB::transaction(function () use ($request, $token) {
            $registro = DB::table('activaciones_distribuidora')
                ->where('token_hash', hash('sha256', $token))
                ->lockForUpdate()
                ->first();

            if (!$registro || $registro->usado_en || now()->gt($registro->expira_en)) {
                return back()->withErrors([
                    'password' => 'El enlace de activacion no es valido o ya expiro.',
                ]);
            }

            $usuario = Usuario::query()->find((int) $registro->usuario_id);

            if (!$usuario) {
                return back()->withErrors([
                    'password' => 'No se encontro la cuenta para activar.',
                ]);
            }

            $usuario->update([
                'clave_hash' => Hash::make((string) $request->input('password')),
                'activo' => true,
            ]);

            DB::table('activaciones_distribuidora')
                ->where('id', $registro->id)
                ->update([
                    'usado_en' => now(),
                    'actualizado_en' => now(),
                ]);

            return redirect()->route('login')->with('status', 'Cuenta activada. Ya puedes iniciar sesion.');
        });
    }

    private function obtenerRegistroPorToken(string $token): ?object
    {
        return DB::table('activaciones_distribuidora')
            ->where('token_hash', hash('sha256', $token))
            ->first();
    }
}
