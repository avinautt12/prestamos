<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\ActivacionDistribuidoraMail;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = [
            'q' => trim((string) $request->string('q', '')),
            'rol_id' => $request->integer('rol_id') ?: null,
            'estado' => strtoupper((string) $request->string('estado', 'TODOS')),
            'per_page' => max(10, min(50, (int) $request->integer('per_page', 10))),
        ];

        if (!in_array($filtros['estado'], ['TODOS', 'ACTIVO', 'INACTIVO'], true)) {
            $filtros['estado'] = 'TODOS';
        }

        $query = Usuario::query()
            ->with([
                'persona:id,primer_nombre,apellido_paterno,correo_electronico',
                'roles' => function ($q) {
                    $q->wherePivotNull('revocado_en');
                },
            ]);

        if ($filtros['q'] !== '') {
            $termino = $filtros['q'];
            $query->where(function ($sub) use ($termino) {
                $sub->where('nombre_usuario', 'like', "%{$termino}%")
                    ->orWhereHas('persona', function ($personaQuery) use ($termino) {
                        $personaQuery->where('primer_nombre', 'like', "%{$termino}%")
                            ->orWhere('apellido_paterno', 'like', "%{$termino}%")
                            ->orWhere('correo_electronico', 'like', "%{$termino}%");
                    });
            });
        }

        if ($filtros['rol_id']) {
            $query->whereHas('roles', function ($rolesQuery) use ($filtros) {
                $rolesQuery->wherePivotNull('revocado_en')
                    ->where('roles.id', $filtros['rol_id']);
            });
        }

        if ($filtros['estado'] === 'ACTIVO') {
            $query->where('activo', true);
        }

        if ($filtros['estado'] === 'INACTIVO') {
            $query->where('activo', false);
        }

        $usuarios = $query
            ->orderByDesc('id')
            ->paginate($filtros['per_page'])
            ->appends($request->query());

        $this->agregarEstadoActivacionDistribuidora($usuarios);

        return Inertia::render('Admin/Usuarios', [
            'usuarios' => $usuarios,
            'filtros' => $filtros,
            'roles' => Rol::query()->where('activo', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'sucursales' => Sucursal::query()->where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre_usuario' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:usuarios,nombre_usuario'],
            'password' => ['required', 'string', 'min:8'],
            'primer_nombre' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'correo_electronico' => ['nullable', 'email', 'max:150'],
            'rol_id' => ['required', 'integer', Rule::exists('roles', 'id')],
            'sucursal_id' => ['nullable', 'integer', Rule::exists('sucursales', 'id')],
            'activo' => ['nullable', 'boolean'],
        ]);

        $rol = Rol::query()->findOrFail((int) $data['rol_id']);
        $this->validarReglasRol($rol, $data['sucursal_id'] ?? null);

        DB::transaction(function () use ($data, $rol) {
            $persona = Persona::query()->create([
                'primer_nombre' => trim((string) $data['primer_nombre']),
                'apellido_paterno' => trim((string) $data['apellido_paterno']),
                'correo_electronico' => $data['correo_electronico'] ?? null,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]);

            $usuario = Usuario::query()->create([
                'persona_id' => $persona->id,
                'nombre_usuario' => trim((string) $data['nombre_usuario']),
                'clave_hash' => Hash::make((string) $data['password']),
                'activo' => (bool) ($data['activo'] ?? true),
                'requiere_vpn' => false,
                'canal_login' => 'WEB',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]);

            DB::table('usuario_rol')->insert([
                'usuario_id' => $usuario->id,
                'rol_id' => $rol->id,
                'sucursal_id' => $rol->codigo === 'ADMIN' ? null : ($data['sucursal_id'] ?? null),
                'asignado_en' => now(),
                'revocado_en' => null,
                'es_principal' => true,
            ]);
        });

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function actualizarRol(Request $request, Usuario $usuario): RedirectResponse
    {
        $data = $request->validate([
            'rol_id' => ['required', 'integer', Rule::exists('roles', 'id')],
            'sucursal_id' => ['nullable', 'integer', Rule::exists('sucursales', 'id')],
        ]);

        $rol = Rol::query()->findOrFail((int) $data['rol_id']);
        $this->validarReglasRol($rol, $data['sucursal_id'] ?? null);

        DB::transaction(function () use ($usuario, $rol, $data) {
            DB::table('usuario_rol')
                ->where('usuario_id', $usuario->id)
                ->whereNull('revocado_en')
                ->update([
                    'revocado_en' => now(),
                    'es_principal' => false,
                ]);

            DB::table('usuario_rol')->insert([
                'usuario_id' => $usuario->id,
                'rol_id' => $rol->id,
                'sucursal_id' => $rol->codigo === 'ADMIN' ? null : ($data['sucursal_id'] ?? null),
                'asignado_en' => now(),
                'revocado_en' => null,
                'es_principal' => true,
            ]);
        });

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function actualizarEstado(Request $request, Usuario $usuario): RedirectResponse
    {
        $data = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $usuario->update([
            'activo' => (bool) $data['activo'],
            'actualizado_en' => now(),
        ]);

        return back()->with('success', 'Estado de usuario actualizado.');
    }

    public function reenviarActivacionDistribuidora(Usuario $usuario): RedirectResponse
    {
        $usuario->loadMissing(['persona']);

        if (!$usuario->tieneRol('DISTRIBUIDORA')) {
            return back()->withErrors([
                'general' => 'Solo se puede reenviar activacion a usuarios con rol DISTRIBUIDORA.',
            ]);
        }

        if (!Schema::hasTable('activaciones_distribuidora')) {
            return back()->withErrors([
                'general' => 'La tabla de activaciones no existe aun. Ejecuta migraciones pendientes.',
            ]);
        }

        $tokenPlano = Str::random(64);
        $expiraEn = now()->addDay();
        DB::table('activaciones_distribuidora')->updateOrInsert(
            ['usuario_id' => $usuario->id],
            [
                'token_hash' => hash('sha256', $tokenPlano),
                'expira_en' => $expiraEn,
                'usado_en' => null,
                'actualizado_en' => now(),
                'creado_en' => now(),
            ]
        );

        $activationLink = route('distribuidora.activacion.show', ['token' => $tokenPlano]);
        $correo = trim((string) ($usuario->persona?->correo_electronico ?? ''));

        if ($correo !== '') {
            $nombre = trim(implode(' ', array_filter([
                $usuario->persona?->primer_nombre,
                $usuario->persona?->apellido_paterno,
            ]))) ?: 'Distribuidora';

            try {
                logger()->info('Enviando correo de activacion desde Admin', [
                    'usuario_id' => $usuario->id,
                    'correo' => $correo,
                ]);

                Mail::to($correo)->send(new ActivacionDistribuidoraMail(
                    $nombre,
                    $activationLink,
                    $usuario->nombre_usuario
                ));

                logger()->info('Correo de activacion enviado desde Admin', [
                    'usuario_id' => $usuario->id,
                    'correo' => $correo,
                ]);

                return back()
                    ->with('success', "Correo de activacion reenviado a {$correo}.")
                    ->with('activation_link', $activationLink)
                    ->with('activation_expires_at', $expiraEn->toDateTimeString());
            } catch (\Throwable $e) {
                logger()->warning('No se pudo reenviar correo de activacion desde Admin', [
                    'usuario_id' => $usuario->id,
                    'correo' => $correo,
                    'error' => $e->getMessage(),
                ]);

                return back()
                    ->withErrors([
                        'general' => 'No se pudo enviar el correo de activacion. Comparte el enlace manualmente.',
                    ])
                    ->with('activation_link', $activationLink)
                    ->with('activation_expires_at', $expiraEn->toDateTimeString())
                    ->with('message', "Error SMTP para {$correo}. Revisa Mailtrap o comparte el enlace.");
            }
        }

        return back()
            ->with('message', 'No se pudo enviar por correo. Comparte el enlace manualmente con la distribuidora.')
            ->with('activation_link', $activationLink)
            ->with('activation_expires_at', $expiraEn->toDateTimeString());
    }

    private function agregarEstadoActivacionDistribuidora($usuarios): void
    {
        $items = $usuarios->getCollection();

        if ($items->isEmpty()) {
            return;
        }

        $activacionesPorUsuario = [];

        if (Schema::hasTable('activaciones_distribuidora')) {
            $activacionesPorUsuario = DB::table('activaciones_distribuidora')
                ->whereIn('usuario_id', $items->pluck('id'))
                ->get(['usuario_id', 'expira_en', 'usado_en'])
                ->keyBy('usuario_id');
        }

        $items->each(function (Usuario $usuario) use ($activacionesPorUsuario) {
            $esDistribuidora = $usuario->roles->contains(fn($rol) => $rol->codigo === 'DISTRIBUIDORA');
            $registro = $activacionesPorUsuario[$usuario->id] ?? null;

            $estado = 'NO_REQUIERE';
            if ($esDistribuidora) {
                if (!$registro) {
                    $estado = 'PENDIENTE';
                } elseif ($registro->usado_en) {
                    $estado = 'ACTIVADA';
                } elseif (now()->gt($registro->expira_en)) {
                    $estado = 'EXPIRADA';
                } else {
                    $estado = 'PENDIENTE';
                }
            }

            $usuario->setAttribute('activacion_estado', $estado);
            $usuario->setAttribute('activacion_expira_en', $registro?->expira_en);
            $usuario->setAttribute('activacion_usado_en', $registro?->usado_en);
        });
    }

    private function validarReglasRol(Rol $rol, ?int $sucursalId): void
    {
        if ($rol->codigo !== 'ADMIN' && !$sucursalId) {
            abort(422, 'El rol seleccionado requiere sucursal.');
        }

        if ($rol->codigo === 'ADMIN' && $sucursalId) {
            abort(422, 'El rol admin no debe tener sucursal fija.');
        }

        if (in_array($rol->codigo, ['ADMIN', 'GERENTE'], true)) {
            return;
        }
    }
}
