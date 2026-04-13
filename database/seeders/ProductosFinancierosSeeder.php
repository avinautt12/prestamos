<?php

namespace Database\Seeders;

use App\Models\ProductoFinanciero;
use Illuminate\Database\Seeder;

class ProductosFinancierosSeeder extends Seeder
{
    public function run(): void
    {
        $productos = [
            ['codigo' => 'PRESTAMO-4/8000', 'nombre' => 'Prestamo 4/8000', 'descripcion' => '4 quincenas, $8,000 MXN', 'monto_principal' => 8000.00, 'numero_quincenas' => 4, 'porcentaje_comision_empresa' => 5.5000, 'monto_seguro' => 180.00, 'porcentaje_interes_quincenal' => 2.1000, 'monto_multa_tardia' => 200.00, 'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA],
            ['codigo' => 'PRESTAMO-8/12000', 'nombre' => 'Prestamo 8/12000', 'descripcion' => '8 quincenas, $12,000 MXN', 'monto_principal' => 12000.00, 'numero_quincenas' => 8, 'porcentaje_comision_empresa' => 5.2000, 'monto_seguro' => 280.00, 'porcentaje_interes_quincenal' => 1.8000, 'monto_multa_tardia' => 250.00, 'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA],
            ['codigo' => 'PRESTAMO-10/15000', 'nombre' => 'Prestamo 10/15000', 'descripcion' => '10 quincenas, $15,000 MXN', 'monto_principal' => 15000.00, 'numero_quincenas' => 10, 'porcentaje_comision_empresa' => 5.0000, 'monto_seguro' => 360.00, 'porcentaje_interes_quincenal' => 1.7000, 'monto_multa_tardia' => 280.00, 'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA],
            ['codigo' => 'PRESTAMO-12/18000', 'nombre' => 'Prestamo 12/18000', 'descripcion' => '12 quincenas, $18,000 MXN', 'monto_principal' => 18000.00, 'numero_quincenas' => 12, 'porcentaje_comision_empresa' => 4.8000, 'monto_seguro' => 420.00, 'porcentaje_interes_quincenal' => 1.5000, 'monto_multa_tardia' => 300.00, 'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA],
            ['codigo' => 'PRESTAMO-18/24000', 'nombre' => 'Prestamo 18/24000', 'descripcion' => '18 quincenas, $24,000 MXN', 'monto_principal' => 24000.00, 'numero_quincenas' => 18, 'porcentaje_comision_empresa' => 4.5000, 'monto_seguro' => 500.00, 'porcentaje_interes_quincenal' => 1.3000, 'monto_multa_tardia' => 350.00, 'modo_desembolso' => ProductoFinanciero::MODO_MIXTO],
            ['codigo' => 'PRESTAMO-24/30000', 'nombre' => 'Prestamo 24/30000', 'descripcion' => '24 quincenas, $30,000 MXN', 'monto_principal' => 30000.00, 'numero_quincenas' => 24, 'porcentaje_comision_empresa' => 4.2000, 'monto_seguro' => 650.00, 'porcentaje_interes_quincenal' => 1.2000, 'monto_multa_tardia' => 400.00, 'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA],
        ];

        foreach ($productos as $producto) {
            ProductoFinanciero::updateOrCreate(
                ['codigo' => $producto['codigo']],
                $producto + [
                    'activo' => true,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
        }

        $this->command?->info('Productos financieros creados o actualizados.');
    }
}
