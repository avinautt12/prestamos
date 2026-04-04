<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategoriaDistribuidora;

class CategoriasDistribuidoraSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            [
                'codigo' => 'COBRE',
                'nombre' => 'Cobre',
                'porcentaje_comision' => 3.0000,
                'puntos_por_cada_1200' => 3,
                'valor_punto' => 2.00,
                'castigo_pct_atraso' => 20.0000,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'PLATA',
                'nombre' => 'Plata',
                'porcentaje_comision' => 6.0000,
                'puntos_por_cada_1200' => 3,
                'valor_punto' => 2.00,
                'castigo_pct_atraso' => 20.0000,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'ORO',
                'nombre' => 'Oro',
                'porcentaje_comision' => 10.0000,
                'puntos_por_cada_1200' => 3,
                'valor_punto' => 2.00,
                'castigo_pct_atraso' => 20.0000,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
        ];

        foreach ($categorias as $categoria) {
            CategoriaDistribuidora::updateOrCreate(
                ['codigo' => $categoria['codigo']],
                $categoria
            );
        }

        $this->command->info('Categorías de distribuidora creadas exitosamente');
    }
}
