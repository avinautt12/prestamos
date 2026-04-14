<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use Illuminate\Database\Seeder;

class CategoriasDistribuidoraSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            ['codigo' => 'COBRE', 'nombre' => 'Cobre', 'porcentaje_comision' => 4.0000, 'puntos_por_cada_1200' => 2, 'castigo_pct_atraso' => 25.0000],
            ['codigo' => 'PLATA', 'nombre' => 'Plata', 'porcentaje_comision' => 7.5000, 'puntos_por_cada_1200' => 3, 'castigo_pct_atraso' => 20.0000],
            ['codigo' => 'ORO', 'nombre' => 'Oro', 'porcentaje_comision' => 11.0000, 'puntos_por_cada_1200' => 4, 'castigo_pct_atraso' => 15.0000],
            ['codigo' => 'DIAMANTE', 'nombre' => 'Diamante', 'porcentaje_comision' => 13.5000, 'puntos_por_cada_1200' => 5, 'castigo_pct_atraso' => 10.0000],
        ];

        foreach ($categorias as $categoria) {
            CategoriaDistribuidora::updateOrCreate(
                ['codigo' => $categoria['codigo']],
                $categoria + [
                    'activo' => true,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
        }

        if ($this->command) {
            $this->command->info('Categorias de distribuidora creadas o actualizadas.');
        }
    }
}
