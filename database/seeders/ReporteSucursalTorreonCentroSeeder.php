<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReporteSucursalTorreonCentroSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::query()->firstOrCreate(
            ['codigo' => 'SUC-TRC-CENTRO'],
            [
                'nombre' => 'Sucursal Torreon Centro',
                'direccion_texto' => 'Av. Hidalgo 450 Sur, Centro, Torreon, Coahuila, Mexico',
                'telefono' => '8711000000',
                'activo' => true,
            ]
        );

        if ($sucursal->nombre !== 'Sucursal Torreon Centro') {
            $sucursal->update([
                'nombre' => 'Sucursal Torreon Centro',
                'activo' => true,
            ]);
        }

        $producto = ProductoFinanciero::query()->firstOrCreate(
            ['codigo' => 'PF-REPORTES'],
            [
                'nombre' => 'Producto Reportes',
                'descripcion' => 'Producto de apoyo para datos de reporteria',
                'numero_quincenas' => 12,
                'porcentaje_comision_empresa' => 10,
                'monto_seguro' => 120,
                'porcentaje_interes_quincenal' => 5,
                'monto_multa_tardia' => 250,
                'modo_desembolso' => 'TRANSFERENCIA',
                'activo' => true,
            ]
        );

        $definiciones = [
            [
                'codigo' => 'RPT-TRC-001',
                'nombre' => 'Riesgo Uno',
                'apellido' => 'Torreon',
                'monto_principal' => 4500,
                'saldo_actual' => 5200,
                'vales' => 2,
            ],
            [
                'codigo' => 'RPT-TRC-002',
                'nombre' => 'Riesgo Dos',
                'apellido' => 'Torreon',
                'monto_principal' => 6200,
                'saldo_actual' => 7100,
                'vales' => 2,
            ],
            [
                'codigo' => 'RPT-TRC-003',
                'nombre' => 'Riesgo Tres',
                'apellido' => 'Torreon',
                'monto_principal' => 8300,
                'saldo_actual' => 9200,
                'vales' => 1,
            ],
        ];

        foreach ($definiciones as $indice => $item) {
            $personaDist = Persona::query()->updateOrCreate(
                ['correo_electronico' => strtolower($item['codigo']) . '@seed.local'],
                [
                    'primer_nombre' => $item['nombre'],
                    'apellido_paterno' => $item['apellido'],
                    'apellido_materno' => 'Centro',
                    'curp' => $this->generarCurpFicticia($indice + 1),
                    'telefono_celular' => '87155' . str_pad((string) ($indice + 11111), 5, '0', STR_PAD_LEFT),
                    'ciudad' => 'Torreon',
                    'estado' => 'Coahuila',
                    'codigo_postal' => '27000',
                ]
            );

            $distribuidora = Distribuidora::query()->updateOrCreate(
                ['numero_distribuidora' => $item['codigo']],
                [
                    'persona_id' => $personaDist->id,
                    'sucursal_id' => $sucursal->id,
                    'estado' => Distribuidora::ESTADO_MOROSA,
                    'limite_credito' => $item['monto_principal'] * 2,
                    'credito_disponible' => 0,
                    'sin_limite' => false,
                    'puntos_actuales' => 0,
                    'puede_emitir_vales' => true,
                    'es_externa' => false,
                    'activada_en' => now()->subMonths(6),
                ]
            );

            $personaCliente = Persona::query()->updateOrCreate(
                ['correo_electronico' => 'cliente.' . strtolower($item['codigo']) . '@seed.local'],
                [
                    'primer_nombre' => 'Cliente',
                    'apellido_paterno' => $item['apellido'],
                    'apellido_materno' => (string) ($indice + 1),
                    'curp' => $this->generarCurpFicticia(20 + $indice),
                    'telefono_celular' => '87156' . str_pad((string) ($indice + 22222), 5, '0', STR_PAD_LEFT),
                    'ciudad' => 'Torreon',
                    'estado' => 'Coahuila',
                    'codigo_postal' => '27000',
                ]
            );

            $cliente = Cliente::query()->updateOrCreate(
                ['persona_id' => $personaCliente->id],
                [
                    'codigo_cliente' => 'CL-' . $item['codigo'],
                    'estado' => Cliente::ESTADO_MOROSO,
                    'notas' => 'Cliente de prueba para reportes gerenciales',
                ]
            );

            for ($i = 1; $i <= $item['vales']; $i++) {
                $montoPrincipal = $item['monto_principal'] + (($i - 1) * 300);
                $saldoActual = $item['saldo_actual'] + (($i - 1) * 450);

                DB::table('vales')->updateOrInsert(
                    ['numero_vale' => $item['codigo'] . '-V' . $i],
                    [
                        'distribuidora_id' => $distribuidora->id,
                        'cliente_id' => $cliente->id,
                        'producto_financiero_id' => $producto->id,
                        'sucursal_id' => $sucursal->id,
                        'estado' => 'MOROSO',
                        'monto_principal' => $montoPrincipal,
                        'porcentaje_comision_empresa_snap' => 10,
                        'monto_comision_empresa' => round($montoPrincipal * 0.10, 2),
                        'monto_seguro_snap' => 120,
                        'porcentaje_interes_snap' => 5,
                        'monto_interes' => round($montoPrincipal * 0.60, 2),
                        'porcentaje_ganancia_dist_snap' => 8,
                        'monto_ganancia_distribuidora' => round($montoPrincipal * 0.08, 2),
                        'monto_multa_snap' => 250,
                        'monto_total_deuda' => $montoPrincipal + round($montoPrincipal * 0.10, 2) + 120 + round($montoPrincipal * 0.60, 2) + 250,
                        'monto_quincenal' => round(($montoPrincipal + round($montoPrincipal * 0.60, 2)) / 12, 2),
                        'quincenas_totales' => 12,
                        'pagos_realizados' => 3,
                        'saldo_actual' => $saldoActual,
                        'fecha_emision' => now()->subMonths(5),
                        'fecha_transferencia' => now()->subMonths(5)->addDay(),
                        'fecha_limite_pago' => now()->subDays(20),
                        'notas' => 'Registro seed para capital en riesgo',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );
            }
        }

        Corte::query()->updateOrCreate(
            [
                'sucursal_id' => $sucursal->id,
                'estado' => Corte::ESTADO_PROGRAMADO,
                'observaciones' => 'SEEDER_REPORTE_TORREON',
            ],
            [
                'tipo_corte' => Corte::TIPO_PAGOS,
                'dia_base_mes' => (int) now()->day,
                'hora_base' => '18:00:00',
                'fecha_programada' => now()->addDays(3)->setTime(18, 0),
                'mantener_fecha_en_inhabil' => true,
            ]
        );

        $this->command?->info('ReporteSucursalTorreonCentroSeeder: datos de morosidad y corte programado generados.');
    }

    private function generarCurpFicticia(int $indice): string
    {
        return sprintf('SEED900101HCL%05d', $indice);
    }
}
