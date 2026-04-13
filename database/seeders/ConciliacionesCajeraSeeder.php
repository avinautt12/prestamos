<?php

namespace Database\Seeders;

use App\Models\Conciliacion;
use App\Models\CuentaBancaria;
use App\Models\MovimientoBancario;
use App\Models\PagoDistribuidora;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class ConciliacionesCajeraSeeder extends Seeder
{
    public function run(): void
    {
        $sucursalesConEnfasis = ['SUC-TRC-CENTRO', 'SUC-TRC-ORIENTE'];
        $conciliacionesEnfasis = 0;

        $cuentaEmpresa = CuentaBancaria::query()->firstOrCreate(
            ['tipo_propietario' => 'EMPRESA', 'clabe' => '002115016003241108'],
            [
                'propietario_id' => 1,
                'banco' => 'BBVA',
                'nombre_titular' => 'Prestamos del Norte SA de CV',
                'numero_cuenta_mascarado' => '****2411',
                'convenio' => '1628789',
                'referencia_base' => 'PNBBVA',
                'es_principal' => true,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]
        );

        $sucursales = Sucursal::query()->orderBy('codigo')->get();

        foreach ($sucursales as $index => $sucursal) {
            $cajera = Usuario::where('nombre_usuario', 'cajera' . ($index + 1))->first();
            $relaciones = RelacionCorte::query()
                ->whereHas('corte', fn($query) => $query->where('sucursal_id', $sucursal->id))
                ->orderBy('id')
                ->take(3)
                ->get();

            foreach ($relaciones as $relIndex => $relacion) {
                $monto = (float) $relacion->total_a_pagar;
                $fecha = now()->subDays(30 - ($index * 2) - $relIndex);

                $movimiento = MovimientoBancario::query()->updateOrCreate(
                    ['folio' => 'MOV-' . $index . '-' . $relIndex],
                    [
                        'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                        'referencia' => $relacion->referencia_pago,
                        'fecha_movimiento' => $fecha->toDateString(),
                        'hora_movimiento' => '12:3' . $relIndex . ':00',
                        'monto' => $relIndex === 1 ? $monto - 120 : $monto,
                        'tipo_movimiento' => 'SPEI',
                        'nombre_pagador' => 'Distribuidora demo',
                        'concepto_raw' => 'Conciliacion semilla ' . $relacion->numero_relacion,
                    ]
                );

                $pago = PagoDistribuidora::query()->updateOrCreate(
                    ['relacion_corte_id' => $relacion->id, 'referencia_reportada' => $relacion->referencia_pago],
                    [
                        'distribuidora_id' => $relacion->distribuidora_id,
                        'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                        'monto' => $relIndex === 1 ? $monto - 120 : $monto,
                        'metodo_pago' => $relIndex === 0 ? 'TRANSFERENCIA' : ($relIndex === 1 ? 'DEPOSITO' : 'OTRO'),
                        'fecha_pago' => $fecha,
                        'estado' => $relIndex === 2 ? 'RECHAZADO' : 'CONCILIADO',
                        'observaciones' => $relIndex === 2 ? 'Pago rechazado por referencia incorrecta' : 'Pago conciliado desde semilla',
                    ]
                );

                Conciliacion::query()->updateOrCreate(
                    ['pago_distribuidora_id' => $pago->id, 'movimiento_bancario_id' => $movimiento->id],
                    [
                        'conciliado_por_usuario_id' => $cajera?->id,
                        'conciliado_en' => now()->subHours($index + $relIndex),
                        'monto_conciliado' => $relIndex === 1 ? $monto - 120 : $monto,
                        'diferencia_monto' => $relIndex === 1 ? -120 : 0,
                        'estado' => $relIndex === 1 ? 'CON_DIFERENCIA' : 'CONCILIADA',
                        'observaciones' => 'Conciliacion generada para demo de caja',
                    ]
                );

                if (in_array($sucursal->codigo, $sucursalesConEnfasis, true) && $relIndex < 2) {
                    $diferencia = $relIndex === 0 ? 0 : -180;
                    $montoExtra = $monto + $diferencia;

                    $movimientoExtra = MovimientoBancario::query()->updateOrCreate(
                        ['folio' => 'ENF-MOV-' . $index . '-' . $relIndex],
                        [
                            'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                            'referencia' => $relacion->referencia_pago . '-ENF',
                            'fecha_movimiento' => $fecha->copy()->addDay()->toDateString(),
                            'hora_movimiento' => '16:2' . $relIndex . ':00',
                            'monto' => $montoExtra,
                            'tipo_movimiento' => 'SPEI',
                            'nombre_pagador' => 'Distribuidora demo enfasis',
                            'concepto_raw' => 'Escenario enfasis ' . $relacion->numero_relacion,
                        ]
                    );

                    $pagoExtra = PagoDistribuidora::query()->updateOrCreate(
                        ['relacion_corte_id' => $relacion->id, 'referencia_reportada' => $relacion->referencia_pago . '-ENF'],
                        [
                            'distribuidora_id' => $relacion->distribuidora_id,
                            'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                            'monto' => $montoExtra,
                            'metodo_pago' => 'TRANSFERENCIA',
                            'fecha_pago' => $fecha->copy()->addDay(),
                            'estado' => 'CONCILIADO',
                            'observaciones' => $diferencia === 0
                                ? 'Escenario enfasis: conciliacion exacta'
                                : 'Escenario enfasis: conciliacion con diferencia para revision',
                        ]
                    );

                    Conciliacion::query()->updateOrCreate(
                        ['pago_distribuidora_id' => $pagoExtra->id, 'movimiento_bancario_id' => $movimientoExtra->id],
                        [
                            'conciliado_por_usuario_id' => $cajera?->id,
                            'conciliado_en' => now()->subMinutes(10 + $relIndex),
                            'monto_conciliado' => $montoExtra,
                            'diferencia_monto' => $diferencia,
                            'estado' => $diferencia === 0 ? 'CONCILIADA' : 'CON_DIFERENCIA',
                            'observaciones' => 'Escenario reforzado para presentacion de conciliacion',
                        ]
                    );

                    $conciliacionesEnfasis++;
                }
            }

            MovimientoBancario::query()->updateOrCreate(
                ['folio' => 'SINREF-' . $index],
                [
                    'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                    'referencia' => null,
                    'fecha_movimiento' => now()->subDays(2)->toDateString(),
                    'hora_movimiento' => '17:10:00',
                    'monto' => 1234.56,
                    'tipo_movimiento' => 'TRANSFERENCIA',
                    'nombre_pagador' => 'Sin referencia',
                    'concepto_raw' => 'Movimiento sin referencia para conciliacion manual',
                ]
            );

            if (in_array($sucursal->codigo, $sucursalesConEnfasis, true)) {
                MovimientoBancario::query()->updateOrCreate(
                    ['folio' => 'ENF-SINREF-' . $index],
                    [
                        'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                        'referencia' => null,
                        'fecha_movimiento' => now()->subDay()->toDateString(),
                        'hora_movimiento' => '18:40:00',
                        'monto' => 2850.30 + ($index * 100),
                        'tipo_movimiento' => 'DEPOSITO',
                        'nombre_pagador' => 'Sin referencia enfasis',
                        'concepto_raw' => 'Movimiento extra para cola de conciliacion manual en presentacion',
                    ]
                );
            }
        }

        $this->command?->info('Conciliaciones, movimientos y pagos de caja creados por sucursal.');
        $this->command?->warn('Enfasis conciliacion aplicado en SUC-TRC-CENTRO y SUC-TRC-ORIENTE. Escenarios extra: ' . $conciliacionesEnfasis);
    }
}
