<?php

namespace Database\Seeders;

use App\Models\ProductoFinanciero;
use Illuminate\Database\Seeder;

class ProductosFinancierosSeeder extends Seeder
{
    public function run(): void
    {
        $productos = [
            [
                'codigo' => 'PRESTAMO-12',
                'nombre' => 'Prestamo 12 Quincenas',
                'descripcion' => 'Producto base para emisiones y pruebas del sistema',
                'numero_quincenas' => 12,
                'porcentaje_comision_empresa' => 0.0000,
                'monto_seguro' => 0.00,
                'porcentaje_interes_quincenal' => 0.0000,
                'monto_multa_tardia' => 0.00,
                'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'PRESTAMO-24',
                'nombre' => 'Prestamo 24 Quincenas',
                'descripcion' => 'Opcion base de mayor plazo para el catalogo',
                'numero_quincenas' => 24,
                'porcentaje_comision_empresa' => 0.0000,
                'monto_seguro' => 0.00,
                'porcentaje_interes_quincenal' => 0.0000,
                'monto_multa_tardia' => 0.00,
                'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
        ];

        foreach ($productos as $producto) {
            ProductoFinanciero::updateOrCreate(
                ['codigo' => $producto['codigo']],
                $producto
            );
        }

        $this->command?->info('Productos financieros base creados exitosamente');
    }
}
