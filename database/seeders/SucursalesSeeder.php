<?php

namespace Database\Seeders;

use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class SucursalesSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = [
            ['codigo' => 'SUC-TRC-CENTRO', 'nombre' => 'Sucursal Torreon Centro', 'direccion_texto' => 'Av. Hidalgo 450 Sur, Centro, Torreon, Coahuila, Mexico', 'telefono' => '8711000000'],
            ['codigo' => 'SUC-TRC-ORIENTE', 'nombre' => 'Sucursal Torreon Oriente', 'direccion_texto' => 'Blvd. Revolucion 3200 Ote, Torreon, Coahuila, Mexico', 'telefono' => '8711000001'],
            ['codigo' => 'SUC-TRC-NORTE', 'nombre' => 'Sucursal Torreon Norte', 'direccion_texto' => 'Periferico Raul Lopez Sanchez 5500, Torreon, Coahuila, Mexico', 'telefono' => '8711000002'],
            ['codigo' => 'SUC-GPO-CENTRO', 'nombre' => 'Sucursal Gomez Palacio Centro', 'direccion_texto' => 'Av. Victoria 120, Centro, Gomez Palacio, Durango, Mexico', 'telefono' => '8713000000'],
            ['codigo' => 'SUC-GPO-ESTACION', 'nombre' => 'Sucursal Gomez Palacio Estacion', 'direccion_texto' => 'Calz. Lazaro Cardenas 900, Gomez Palacio, Durango, Mexico', 'telefono' => '8713000001'],
        ];

        foreach ($sucursales as $sucursal) {
            Sucursal::updateOrCreate(
                ['codigo' => $sucursal['codigo']],
                $sucursal + [
                    'activo' => true,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
        }

        $this->command?->info('5 sucursales base creadas o actualizadas.');
    }
}
