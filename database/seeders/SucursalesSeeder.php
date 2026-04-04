<?php

namespace Database\Seeders;

use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class SucursalesSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = [
            [
                'codigo' => 'SUC-MATRIZ',
                'nombre' => 'Sucursal Matriz',
                'direccion_texto' => 'Sucursal principal del sistema',
                'telefono' => '5550000000',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
        ];

        foreach ($sucursales as $sucursal) {
            Sucursal::updateOrCreate(
                ['codigo' => $sucursal['codigo']],
                $sucursal
            );
        }

        $this->command?->info('Sucursal base creada exitosamente');
    }
}
