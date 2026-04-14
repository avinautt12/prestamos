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
                'codigo' => 'SUC-TRC-CENTRO',
                'nombre' => 'Sucursal Torreon Centro',
                'direccion_texto' => 'Av. Hidalgo 450 Sur, Centro, Torreon, Coahuila, Mexico',
                'telefono' => '8711000000',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'SUC-TRC-NTE',
                'nombre' => 'Sucursal Torreon Norte',
                'direccion_texto' => 'Blvd. Revolucion 1800 Nte, Col. Las Magdalenas, Torreon, Coahuila, Mexico',
                'telefono' => '8711000001',
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'SUC-TRC-SUR',
                'nombre' => 'Sucursal Torreon Sur',
                'direccion_texto' => 'Periferico Raul Lopez Sanchez 3200, Col. La Rosita, Torreon, Coahuila, Mexico',
                'telefono' => '8711000002',
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

        $this->command?->info('3 sucursales de Torreon creadas: Centro, Norte y Sur');
    }
}
