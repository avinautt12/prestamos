<?php

namespace Database\Seeders;

use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use Illuminate\Database\Seeder;

class SucursalConfiguracionesSeeder extends Seeder
{
    public function run(): void
    {
        $configuraciones = [
            'SUC-TRC-CENTRO' => [
                'dia_corte' => 14,
                'hora_corte' => '18:00:00',
                'linea_credito_default' => 50000.00,
                'porcentaje_comision_apertura' => 10.0000,
                'porcentaje_interes_quincenal' => 5.0000,
                'multa_incumplimiento_monto' => 300.00,
            ],
            'SUC-TRC-NTE' => [
                'dia_corte' => 14,
                'hora_corte' => '17:00:00',
                'linea_credito_default' => 40000.00,
                'porcentaje_comision_apertura' => 10.0000,
                'porcentaje_interes_quincenal' => 5.0000,
                'multa_incumplimiento_monto' => 300.00,
            ],
            'SUC-TRC-SUR' => [
                'dia_corte' => 14,
                'hora_corte' => '19:00:00',
                'linea_credito_default' => 35000.00,
                'porcentaje_comision_apertura' => 10.0000,
                'porcentaje_interes_quincenal' => 5.0000,
                'multa_incumplimiento_monto' => 300.00,
            ],
        ];

        foreach ($configuraciones as $codigoSucursal => $config) {
            $sucursal = Sucursal::where('codigo', $codigoSucursal)->first();

            if (!$sucursal) {
                $this->command?->warn("Sucursal {$codigoSucursal} no encontrada. Corre SucursalesSeeder primero.");
                continue;
            }

            SucursalConfiguracion::updateOrCreate(
                ['sucursal_id' => $sucursal->id],
                array_merge($config, [
                    'frecuencia_pago_dias' => 14,
                    'plazo_pago_dias' => 15,
                    'factor_divisor_puntos' => 1200,
                    'multiplicador_puntos' => 3,
                    'valor_punto_mxn' => 2.00,
                    'seguro_tabuladores_json' => null,
                    'categorias_config_json' => null,
                    'productos_config_json' => null,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ])
            );
        }

        $this->command?->info('Configuraciones por sucursal creadas (3).');
    }
}
