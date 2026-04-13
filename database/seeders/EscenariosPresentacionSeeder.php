<?php

namespace Database\Seeders;

use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class EscenariosPresentacionSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = Sucursal::query()->orderBy('codigo')->get();

        foreach ($sucursales as $index => $sucursal) {
            $corte = Corte::updateOrCreate(
                [
                    'sucursal_id' => $sucursal->id,
                    'tipo_corte' => 'PAGOS',
                    'estado' => 'PROGRAMADO',
                    'fecha_programada' => now()->addDays(2 + $index)->setTime(18, 0),
                ],
                [
                    'dia_base_mes' => 10 + $index,
                    'hora_base' => '18:00:00',
                    'mantener_fecha_en_inhabil' => true,
                    'observaciones' => 'AUTO_PRESENTACION',
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            $distribuidora = Distribuidora::query()
                ->where('sucursal_id', $sucursal->id)
                ->where('estado', Distribuidora::ESTADO_ACTIVA)
                ->orderBy('id')
                ->first();

            if (!$distribuidora) {
                continue;
            }

            $relaciones = [
                ['estado' => 'GENERADA', 'pago' => 0.00, 'recargos' => 0.00, 'puntos' => 65],
                ['estado' => 'PARCIAL', 'pago' => 2800, 'recargos' => 120.00, 'puntos' => 92],
                ['estado' => 'VENCIDA', 'pago' => 2400, 'recargos' => 250.00, 'puntos' => 118],
            ];

            foreach ($relaciones as $relIndex => $rel) {
                $total = 3000 + ($index * 500) + ($relIndex * 750);

                RelacionCorte::updateOrCreate(
                    ['numero_relacion' => 'REL-PRES-' . ($index + 1) . '-' . ($relIndex + 1)],
                    [
                        'corte_id' => $corte->id,
                        'distribuidora_id' => $distribuidora->id,
                        'referencia_pago' => 'PRES-' . ($index + 1) . '-' . ($relIndex + 1),
                        'fecha_limite_pago' => now()->addDays(7 - $relIndex)->toDateString(),
                        'fecha_inicio_pago_anticipado' => now()->subDays(10)->toDateString(),
                        'fecha_fin_pago_anticipado' => now()->subDays(5)->toDateString(),
                        'limite_credito_snapshot' => $distribuidora->limite_credito,
                        'credito_disponible_snapshot' => $distribuidora->credito_disponible,
                        'puntos_snapshot' => $rel['puntos'],
                        'total_comision' => 450 + ($relIndex * 250),
                        'total_pago' => $rel['pago'],
                        'total_recargos' => $rel['recargos'],
                        'total_a_pagar' => $total,
                        'estado' => $rel['estado'],
                    ]
                );
            }
        }

        $this->command?->info('Escenarios de presentación creados por sucursal.');
    }
}
