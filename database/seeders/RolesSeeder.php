<?php

namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'codigo' => 'ADMIN',
                'nombre' => 'Admin',
                'descripcion' => 'Administrador global del sistema - gestión de usuarios, roles y configuraciones multi-sucursal',
                'activo' => true,
            ],
            [
                'codigo' => 'GERENTE',
                'nombre' => 'Gerente',
                'descripcion' => 'Gerente de sucursal - Acceso a reportes y administración general',
                'activo' => true,
            ],
            [
                'codigo' => 'COORDINADOR',
                'nombre' => 'Coordinador',
                'descripcion' => 'Coordinador de sucursal - Registro y seguimiento de solicitudes',
                'activo' => true,
            ],
            [
                'codigo' => 'VERIFICADOR',
                'nombre' => 'Verificador',
                'descripcion' => 'Valida domicilios y expedientes',
                'activo' => true,
            ],
            [
                'codigo' => 'CAJERA',
                'nombre' => 'Cajera',
                'descripcion' => 'Opera pagos, prevales y conciliaciones',
                'activo' => true,
            ],
            [
                'codigo' => 'DISTRIBUIDORA',
                'nombre' => 'Distribuidora',
                'descripcion' => 'Gestiona clientes, vales y puntos',
                'activo' => true,
            ],
        ];

        foreach ($roles as $role) {
            Rol::updateOrCreate(
                ['codigo' => $role['codigo']],
                $role + [
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
        }

        $this->command?->info('Roles base creados o actualizados.');
    }
}
