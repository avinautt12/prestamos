<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsuarioTestSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::updateOrCreate(
            ['codigo' => 'SUC-TRC-CENTRO'],
            [
                'nombre' => 'Sucursal Torreon Centro',
                'direccion_texto' => 'Blvd. Independencia 1200, Centro, Torreon, Coahuila, Mexico',
                'telefono' => '8711000000',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]
        );

        // Crear personas de prueba
        $personas = [
            [
                'curp' => 'GEREN123456789ABC',
                'primer_nombre' => 'Admin',
                'apellido_paterno' => 'Sistema',
                'apellido_materno' => 'Prestamo',
                'sexo' => 'M',
                'telefono_celular' => '8711234500',
                'correo_electronico' => 'admin@prestamofacil.com',
                'ciudad' => 'Torreon',
                'estado' => 'Coahuila',
                'codigo_postal' => '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'curp' => 'COORD123456789ABC',
                'primer_nombre' => 'Coordinador',
                'apellido_paterno' => 'Prueba',
                'apellido_materno' => 'Sistema',
                'sexo' => 'M',
                'telefono_celular' => '8711234501',
                'correo_electronico' => 'coordinador@prestamofacil.com',
                'ciudad' => 'Torreon',
                'estado' => 'Coahuila',
                'codigo_postal' => '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'curp' => 'VERIF123456789ABC',
                'primer_nombre' => 'Verificador',
                'apellido_paterno' => 'Prueba',
                'apellido_materno' => 'Sistema',
                'sexo' => 'M',
                'telefono_celular' => '8711234502',
                'correo_electronico' => 'verificador@prestamofacil.com',
                'ciudad' => 'Torreon',
                'estado' => 'Coahuila',
                'codigo_postal' => '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'curp' => 'CAJERA123456789ABC',
                'primer_nombre' => 'Cajera',
                'apellido_paterno' => 'Prueba',
                'apellido_materno' => 'Sistema',
                'sexo' => 'F',
                'telefono_celular' => '8711234503',
                'correo_electronico' => 'cajera@prestamofacil.com',
                'ciudad' => 'Torreon',
                'estado' => 'Coahuila',
                'codigo_postal' => '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'curp' => 'DISTRI123456789ABC',
                'primer_nombre' => 'Distribuidora',
                'apellido_paterno' => 'Prueba',
                'apellido_materno' => 'Sistema',
                'sexo' => 'F',
                'telefono_celular' => '8711234504',
                'correo_electronico' => 'distribuidora@prestamofacil.com',
                'ciudad' => 'Torreon',
                'estado' => 'Coahuila',
                'codigo_postal' => '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
        ];

        $usuarios = [
            [
                'nombre_usuario' => 'gerente',
                'rol_codigo' => 'GERENTE',
                'password' => 'password123',
            ],
            [
                'nombre_usuario' => 'coordinador',
                'rol_codigo' => 'COORDINADOR',
                'password' => 'password123',
            ],
            [
                'nombre_usuario' => 'verificador',
                'rol_codigo' => 'VERIFICADOR',
                'password' => 'password123',
            ],
            [
                'nombre_usuario' => 'cajera',
                'rol_codigo' => 'CAJERA',
                'password' => 'password123',
            ],
            [
                'nombre_usuario' => 'distribuidora',
                'rol_codigo' => 'DISTRIBUIDORA',
                'password' => 'password123',
            ],
        ];

        // Crear personas y usuarios
        foreach ($personas as $index => $personaData) {
            // Crear persona
            $persona = Persona::updateOrCreate(
                ['curp' => $personaData['curp']],
                $personaData
            );

            // Crear usuario (sin remember_token)
            $usuarioData = $usuarios[$index];
            $usuario = Usuario::updateOrCreate(
                ['nombre_usuario' => $usuarioData['nombre_usuario']],
                [
                    'persona_id' => $persona->id,
                    'clave_hash' => Hash::make($usuarioData['password']),
                    'activo' => true,
                    'requiere_vpn' => false,
                    'canal_login' => 'WEB',
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            // Asignar rol
            $rol = Rol::where('codigo', $usuarioData['rol_codigo'])->first();
            if ($rol) {
                DB::table('usuario_rol')->updateOrInsert(
                    [
                        'usuario_id' => $usuario->id,
                        'rol_id' => $rol->id,
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'asignado_en' => now(),
                        'revocado_en' => null,
                        'es_principal' => true,
                    ]
                );

                $this->command->info("Usuario {$usuarioData['nombre_usuario']} creado con rol {$usuarioData['rol_codigo']}");
            }
        }

        $this->command->info('');
        $this->command->info('=== USUARIOS DE PRUEBA ===');
        $this->command->info('gerente     / password123');
        $this->command->info('coordinador / password123');
        $this->command->info('verificador / password123');
        $this->command->info('cajera      / password123');
        $this->command->info('distribuidora / password123');
    }
}
