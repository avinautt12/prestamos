<?php

namespace Database\Seeders;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UsuariosDemoSencillosSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['personas', 'usuarios', 'roles', 'sucursales', 'usuario_rol'] as $tabla) {
            if (!Schema::hasTable($tabla)) {
                throw new \RuntimeException("Falta la tabla {$tabla}. Ejecuta migrate primero.");
            }
        }

        $passwordDemo = 'password123';
        $roles = Rol::query()->whereIn('codigo', ['ADMIN', 'GERENTE'])->get()->keyBy('codigo');
        $sucursalDemo = Sucursal::query()->where('activo', true)->orderBy('id')->first();

        if (!$roles->has('ADMIN') || !$roles->has('GERENTE')) {
            throw new \RuntimeException('Faltan roles ADMIN o GERENTE. Ejecuta RolesSeeder primero.');
        }

        if (!$sucursalDemo) {
            throw new \RuntimeException('No hay sucursales activas para asignar al usuario gerente demo.');
        }

        $usuarios = [
            [
                'nombre_usuario' => 'adminDemo',
                'correo' => 'admindemo@prestamofacil.com',
                'primer_nombre' => 'Admin',
                'apellido_paterno' => 'Demo',
                'rol_codigo' => 'ADMIN',
                'sucursal_id' => null,
                'requiere_vpn' => false,
            ],
            [
                'nombre_usuario' => 'gerenteDemo',
                'correo' => 'gerentedemo@prestamofacil.com',
                'primer_nombre' => 'Gerente',
                'apellido_paterno' => 'Demo',
                'rol_codigo' => 'GERENTE',
                'sucursal_id' => $sucursalDemo->id,
                'requiere_vpn' => true,
            ],
        ];

        foreach ($usuarios as $usuarioData) {
            DB::transaction(function () use ($usuarioData, $passwordDemo, $roles) {
                $persona = Persona::updateOrCreate(
                    ['correo_electronico' => $usuarioData['correo']],
                    [
                        'primer_nombre' => $usuarioData['primer_nombre'],
                        'apellido_paterno' => $usuarioData['apellido_paterno'],
                        'apellido_materno' => 'Demo',
                        'sexo' => 'OTRO',
                        'correo_electronico' => $usuarioData['correo'],
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $usuario = Usuario::updateOrCreate(
                    ['nombre_usuario' => $usuarioData['nombre_usuario']],
                    [
                        'persona_id' => $persona->id,
                        'clave_hash' => Hash::make($passwordDemo),
                        'activo' => true,
                        'requiere_vpn' => $usuarioData['requiere_vpn'],
                        'canal_login' => 'WEB',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                DB::table('usuario_rol')
                    ->where('usuario_id', $usuario->id)
                    ->update([
                        'revocado_en' => now(),
                        'es_principal' => false,
                    ]);

                DB::table('usuario_rol')->updateOrInsert(
                    [
                        'usuario_id' => $usuario->id,
                        'rol_id' => $roles[$usuarioData['rol_codigo']]->id,
                        'sucursal_id' => $usuarioData['sucursal_id'],
                    ],
                    [
                        'asignado_en' => now(),
                        'revocado_en' => null,
                        'es_principal' => true,
                    ]
                );
            });
        }

        if ($this->command) {
            $this->command->info('Usuarios demo creados o actualizados: adminDemo y gerenteDemo.');
            $this->command->line('adminDemo | password: password123 | rol: ADMIN');
            $this->command->line('gerenteDemo | password: password123 | rol: GERENTE');
        }
    }
}
