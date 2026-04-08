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
                'codigo' => 'PRESTAMO-4/8000',
                'nombre' => 'Prestamo 4/8000',
                'descripcion' => '4 quincenas, $8,000 MXN',
                'monto_principal' => 8000.00,
                'numero_quincenas' => 4,
                'porcentaje_comision_empresa' => 5.0000,
                'monto_seguro' => 150.00,
                'porcentaje_interes_quincenal' => 2.0000,
                'monto_multa_tardia' => 200.00,
                'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'PRESTAMO-8/12000',
                'nombre' => 'Prestamo 8/12000',
                'descripcion' => '8 quincenas, $12,000 MXN',
                'monto_principal' => 12000.00,
                'numero_quincenas' => 8,
                'porcentaje_comision_empresa' => 5.0000,
                'monto_seguro' => 250.00,
                'porcentaje_interes_quincenal' => 1.8000,
                'monto_multa_tardia' => 250.00,
                'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'PRESTAMO-12/18000',
                'nombre' => 'Prestamo 12/18000',
                'descripcion' => '12 quincenas, $18,000 MXN',
                'monto_principal' => 18000.00,
                'numero_quincenas' => 12,
                'porcentaje_comision_empresa' => 4.5000,
                'monto_seguro' => 350.00,
                'porcentaje_interes_quincenal' => 1.5000,
                'monto_multa_tardia' => 300.00,
                'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
                'activo' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ],
            [
                'codigo' => 'PRESTAMO-24/30000',
                'nombre' => 'Prestamo 24/30000',
                'descripcion' => '24 quincenas, $30,000 MXN',
                'monto_principal' => 30000.00,
                'numero_quincenas' => 24,
                'porcentaje_comision_empresa' => 4.0000,
                'monto_seguro' => 500.00,
                'porcentaje_interes_quincenal' => 1.2000,
                'monto_multa_tardia' => 400.00,
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
