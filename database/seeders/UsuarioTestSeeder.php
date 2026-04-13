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

class UsuarioTestSeeder extends Seeder
{
    public function run(): void
    {
        $passwordDemo = 'password123';
        $credenciales = [];

        foreach (['personas', 'usuarios', 'roles', 'sucursales', 'usuario_rol'] as $tabla) {
            if (!Schema::hasTable($tabla)) {
                throw new \RuntimeException("Falta la tabla {$tabla}. Ejecuta migrate primero.");
            }
        }

        if (!Rol::query()->exists()) {
            Rol::insert([
                ['codigo' => 'GERENTE', 'nombre' => 'Gerente', 'descripcion' => 'Gerente de sucursal', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()],
                ['codigo' => 'COORDINADOR', 'nombre' => 'Coordinador', 'descripcion' => 'Coordinador de sucursal', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()],
                ['codigo' => 'VERIFICADOR', 'nombre' => 'Verificador', 'descripcion' => 'Verificador de solicitudes', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()],
                ['codigo' => 'CAJERA', 'nombre' => 'Cajera', 'descripcion' => 'Cajera de sucursal', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()],
                ['codigo' => 'DISTRIBUIDORA', 'nombre' => 'Distribuidora', 'descripcion' => 'Distribuidora demo', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()],
            ]);
        }

        $sucursales = Sucursal::query()->orderBy('codigo')->get()->keyBy('codigo');
        $roles = Rol::query()->pluck('id', 'codigo');

        $sucursalesData = [
            ['codigo' => 'SUC-TRC-CENTRO', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27000', 'count' => 3],
            ['codigo' => 'SUC-TRC-ORIENTE', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27010', 'count' => 3],
            ['codigo' => 'SUC-TRC-NORTE', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27020', 'count' => 3],
            ['codigo' => 'SUC-GPO-CENTRO', 'city' => 'Gomez Palacio', 'state' => 'Durango', 'cp' => '35000', 'count' => 2],
            ['codigo' => 'SUC-GPO-ESTACION', 'city' => 'Gomez Palacio', 'state' => 'Durango', 'cp' => '35010', 'count' => 2],
        ];

        // Nombres reales por rol
        $nombres = [
            'GERENTE' => ['Carlos García', 'Miguel Rodríguez', 'Jorge López', 'Ricardo Sánchez', 'Fernando Martínez'],
            'COORDINADOR' => ['María Rodríguez', 'Ana Martínez', 'Gloria García', 'Carmen López', 'Sofía González'],
            'CAJERA' => ['Patricia Ruiz', 'Luz Domínguez', 'Rosa Jiménez', 'Isabel Méndez', 'Verónica Ortiz'],
            'DISTRIBUIDORA' => ['Juan Pérez', 'Roberto Flores', 'Andrés Cortés', 'Héctor Reyes', 'Oscar Vega'],
            'VERIFICADOR' => ['Eduardo Sánchez', 'Pedro González', 'Marco Herrera', 'Luis Chávez', 'Javier Morales', 'Daniel Vargas', 'Ángel Mendoza', 'Francisco Torres', 'Raúl Ugarte', 'Arturo Rivas', 'Víctor Ibáñez', 'Emilio Castillo', 'Ramón Navarro', 'Benito Acosta', 'Manuel Delgado'],
        ];

        foreach ($sucursalesData as $idx => $sucursalData) {
            $sucursal = $sucursales[$sucursalData['codigo']] ?? Sucursal::updateOrCreate(
                ['codigo' => $sucursalData['codigo']],
                [
                    'nombre' => str_replace('SUC-', 'Sucursal ', str_replace('-', ' ', $sucursalData['codigo'])),
                    'direccion_texto' => $sucursalData['city'] . ', ' . $sucursalData['state'],
                    'telefono' => '871' . (3000000 + $idx),
                    'activo' => true,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            $suffix = (string) ($idx + 1);
            $users = [
                ['rol' => 'GERENTE', 'username' => 'gerente' . $suffix, 'nombre' => $nombres['GERENTE'][$idx] ?? 'Gerente'],
                ['rol' => 'COORDINADOR', 'username' => 'coordinador' . $suffix, 'nombre' => $nombres['COORDINADOR'][$idx] ?? 'Coordinador'],
                ['rol' => 'CAJERA', 'username' => 'cajera' . $suffix, 'nombre' => $nombres['CAJERA'][$idx] ?? 'Cajera'],
                ['rol' => 'DISTRIBUIDORA', 'username' => 'distribuidora' . $suffix, 'nombre' => $nombres['DISTRIBUIDORA'][$idx] ?? 'Distribuidora'],
            ];

            foreach ($users as $userIndex => $userData) {
                $nombrePartes = explode(' ', $userData['nombre']);
                $primer_nombre = $nombrePartes[0];
                $apellido = $nombrePartes[1] ?? 'Demo';

                $persona = $this->upsertPersona(
                    $userData['username'] . '@prestamofacil.com',
                    $primer_nombre,
                    $apellido,
                    $sucursalData['city'],
                    $sucursalData['state'],
                    $sucursalData['cp'],
                    $userData['rol'],
                    $suffix,
                    (string) $userIndex,
                    $userIndex % 2 === 0 ? 'M' : 'F'
                );

                $usuario = Usuario::updateOrCreate(
                    ['nombre_usuario' => $userData['username']],
                    [
                        'persona_id' => $persona->id,
                        'clave_hash' => Hash::make($passwordDemo),
                        'activo' => true,
                        'requiere_vpn' => $userData['rol'] === 'GERENTE',
                        'canal_login' => 'WEB',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                DB::table('usuario_rol')->updateOrInsert(
                    [
                        'usuario_id' => $usuario->id,
                        'rol_id' => $roles[$userData['rol']],
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'asignado_en' => now(),
                        'revocado_en' => null,
                        'es_principal' => true,
                    ]
                );

                $credenciales[] = [
                    'sucursal' => $sucursalData['codigo'],
                    'rol' => $userData['rol'],
                    'usuario' => $userData['username'],
                ];
            }

            for ($verificador = 1; $verificador <= $sucursalData['count']; $verificador++) {
                $username = 'verificador' . $suffix . chr(96 + $verificador);

                // Seleccionar nombre real para verificador
                $indexVerificador = (($idx * 3) + $verificador - 1) % count($nombres['VERIFICADOR']);
                $nombreVerificador = $nombres['VERIFICADOR'][$indexVerificador];
                $nombrePartes = explode(' ', $nombreVerificador);
                $primer_nombre = $nombrePartes[0];
                $apellido = $nombrePartes[1] ?? 'Demo';

                $persona = $this->upsertPersona(
                    $username . '@prestamofacil.com',
                    $primer_nombre,
                    $apellido,
                    $sucursalData['city'],
                    $sucursalData['state'],
                    $sucursalData['cp'],
                    'VERIFICADOR',
                    $suffix,
                    (string) $verificador,
                    $verificador % 2 === 0 ? 'F' : 'M'
                );

                $usuario = Usuario::updateOrCreate(
                    ['nombre_usuario' => $username],
                    [
                        'persona_id' => $persona->id,
                        'clave_hash' => Hash::make($passwordDemo),
                        'activo' => true,
                        'requiere_vpn' => false,
                        'canal_login' => 'WEB',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                DB::table('usuario_rol')->updateOrInsert(
                    [
                        'usuario_id' => $usuario->id,
                        'rol_id' => $roles['VERIFICADOR'],
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'asignado_en' => now(),
                        'revocado_en' => null,
                        'es_principal' => true,
                    ]
                );

                $credenciales[] = [
                    'sucursal' => $sucursalData['codigo'],
                    'rol' => 'VERIFICADOR',
                    'usuario' => $username,
                ];
            }
        }

        $this->command?->info('Usuarios por sucursal creados: 5 sucursales con gerente, coordinador, cajera, distribuidora y 2-3 verificadores.');

        if ($this->command) {
            $this->command->warn('LOGIN DEMO: todos los usuarios tienen password = ' . $passwordDemo);
            foreach ($credenciales as $credencial) {
                $this->command->line(
                    '[LOGIN] ' . $credencial['sucursal'] . ' | ' . $credencial['rol'] . ' | usuario: ' . $credencial['usuario'] . ' | password: ' . $passwordDemo
                );
            }
        }
    }

    private function upsertPersona(string $correo, string $nombre, string $apellido, string $ciudad, string $estado, string $cp, string $rol, string $sucursal, string $slot, string $sexo): Persona
    {
        return Persona::updateOrCreate(
            ['correo_electronico' => $correo],
            [
                'primer_nombre' => $nombre,
                'apellido_paterno' => $apellido,
                'apellido_materno' => 'Demo',
                'sexo' => $sexo,
                'curp' => $this->curpPrueba($rol, $sucursal, $slot),
                'rfc' => $this->rfcPrueba($rol, $sucursal, $slot),
                'telefono_celular' => '871' . $sucursal . $slot . '5000',
                'correo_electronico' => $correo,
                'ciudad' => $ciudad,
                'estado' => $estado,
                'codigo_postal' => $cp,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]
        );
    }

    private function curpPrueba(string $rol, string $sucursal, string $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad($sucursal, 2, '0', STR_PAD_LEFT) . str_pad($slot, 2, '0', STR_PAD_LEFT) . 'TRC26X';
        return substr(str_pad($seed, 18, 'X'), 0, 18);
    }

    private function rfcPrueba(string $rol, string $sucursal, string $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad($sucursal, 2, '0', STR_PAD_LEFT) . str_pad($slot, 2, '0', STR_PAD_LEFT) . 'A';
        return substr(str_pad($seed, 13, 'X'), 0, 13);
    }
}
