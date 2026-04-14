<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'codigo' => 'GERENTE',
                'nombre' => 'Gerente',
                'descripcion' => 'Gerente de sucursal - Acceso a reportes y administración general',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'COORDINADOR',
                'nombre' => 'Coordinador',
                'descripcion' => 'Coordinador de distribuidoras - Registro y gestión de solicitudes',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'VERIFICADOR',
                'nombre' => 'Verificador',
                'descripcion' => 'Valida solicitudes y verifica información domiciliaria',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'CAJERA',
                'nombre' => 'Cajera',
                'descripcion' => 'Opera prevale y cobros, gestiona pagos',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'DISTRIBUIDORA',
                'nombre' => 'Distribuidora',
                'descripcion' => 'Distribuidora del sistema - Emisión de vales y gestión de puntos',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'ADMIN',
                'nombre' => 'Administrador',
                'descripcion' => 'Acceso total al sistema - Gestión de usuarios, roles y configuración',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'ADIM',
                'nombre' => 'Administrador (Alias)',
                'descripcion' => 'Alias temporal para compatibilidad con ambientes que referencian ADIM',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
        ];

        foreach ($roles as $role) {
            Rol::updateOrCreate(
                ['codigo' => $role['codigo']],
                $role
            );
        }

        $this->command->info('Roles creados exitosamente');
    }
}
