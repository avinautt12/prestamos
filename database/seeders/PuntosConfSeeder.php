<?php

namespace Database\Seeders;

use App\Models\PuntosConf;
use Illuminate\Database\Seeder;

class PuntosConfSeeder extends Seeder
{
    /**
     * Inserta la unica fila de configuracion global de puntos con los defaults
     * acordados con el cliente (regla de negocio #15):
     *   - Formula puntos: floor(total / 1200) x 3
     *   - Valor por punto: $2.00 MXN
     *   - Castigo por mora: 20% sobre el total acumulado
     */
    public function run(): void
    {
        PuntosConf::updateOrCreate(
            ['id' => 1],
            [
                'factor_divisor_puntos' => 1200,
                'multiplicador_puntos'  => 3,
                'valor_punto_mxn'       => 2.00,
                'castigo_pct_atraso'    => 20.0000,
            ]
        );

        $this->command?->info('Configuracion global de puntos creada (factor=1200, mult=3, valor=$2.00, castigo=20%).');
    }
}
