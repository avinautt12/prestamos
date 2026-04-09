<?php

namespace Database\Seeders;

use App\Models\Conciliacion;
use App\Models\CuentaBancaria;
use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\MovimientoBancario;
use App\Models\PagoDistribuidora;
use App\Models\Persona;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class ConciliacionesCajeraSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SucursalesSeeder::class,
            RolesSeeder::class,
            UsuarioTestSeeder::class,
        ]);

        $sucursal = Sucursal::query()->firstOrCreate(
            ['codigo' => 'SUC-TRC-CENTRO'],
            ['nombre' => 'Sucursal Torreon Centro', 'activo' => true]
        );

        $cuentaEmpresa = CuentaBancaria::query()->firstOrCreate(
            [
                'tipo_propietario' => CuentaBancaria::TIPO_EMPRESA,
                'propietario_id' => 1,
                'clabe' => '012345678901234567',
            ],
            [
                'banco' => 'Banco Demo',
                'nombre_titular' => 'Prestamo Facil SA de CV',
                'numero_cuenta_mascarado' => '****4567',
                'convenio' => 'PF-2026',
                'referencia_base' => 'PFTRC',
                'es_principal' => true,
            ]
        );

        $distribuidoras = collect([
            ['numero' => 'DIST-CNC-001', 'curp' => 'DCCN0000000000001', 'nombre' => 'Laura', 'paterno' => 'Noriega', 'materno' => 'Mendez', 'tel' => '8712001101', 'limite' => 20000, 'disponible' => 12000],
            ['numero' => 'DIST-CNC-002', 'curp' => 'DCCN0000000000002', 'nombre' => 'Martha', 'paterno' => 'Ruiz', 'materno' => 'Soto', 'tel' => '8712001102', 'limite' => 18000, 'disponible' => 9000],
            ['numero' => 'DIST-CNC-003', 'curp' => 'DCCN0000000000003', 'nombre' => 'Norma', 'paterno' => 'Castro', 'materno' => 'Luna', 'tel' => '8712001103', 'limite' => 23000, 'disponible' => 14000],
            ['numero' => 'DIST-CNC-004', 'curp' => 'DCCN0000000000004', 'nombre' => 'Rocio', 'paterno' => 'Galvan', 'materno' => 'Paz', 'tel' => '8712001104', 'limite' => 21000, 'disponible' => 12500],
            ['numero' => 'DIST-CNC-005', 'curp' => 'DCCN0000000000005', 'nombre' => 'Irma', 'paterno' => 'Lopez', 'materno' => 'Mata', 'tel' => '8712001105', 'limite' => 17500, 'disponible' => 8400],
        ])->map(function (array $distData) use ($sucursal) {
            $persona = Persona::query()->firstOrCreate(
                ['curp' => $distData['curp']],
                [
                    'primer_nombre' => $distData['nombre'],
                    'apellido_paterno' => $distData['paterno'],
                    'apellido_materno' => $distData['materno'],
                    'telefono_celular' => $distData['tel'],
                ]
            );

            return Distribuidora::query()->firstOrCreate(
                ['numero_distribuidora' => $distData['numero']],
                [
                    'persona_id' => $persona->id,
                    'sucursal_id' => $sucursal->id,
                    'estado' => Distribuidora::ESTADO_ACTIVA,
                    'limite_credito' => $distData['limite'],
                    'credito_disponible' => $distData['disponible'],
                    'puede_emitir_vales' => true,
                ]
            );
        });

        $corte = Corte::query()->firstOrCreate(
            [
                'sucursal_id' => $sucursal->id,
                'tipo_corte' => Corte::TIPO_PAGOS,
                'fecha_programada' => now()->startOfDay(),
            ],
            [
                'estado' => Corte::ESTADO_EJECUTADO,
                'fecha_ejecucion' => now(),
                'dia_base_mes' => now()->day,
                'hora_base' => now()->format('H:i:s'),
            ]
        );

        $escenarios = [
            ['rel' => 'REL-CNC-2026-001', 'ref' => '16A67819042', 'monto' => 2100.00, 'estado_rel' => RelacionCorte::ESTADO_PAGADA, 'mov_folio' => 'A178934', 'mov_tipo' => 'Transferencia', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_CONCILIADA, 'mov_hora' => '13:25:00'],
            ['rel' => 'REL-CNC-2026-002', 'ref' => '26B99988001', 'monto' => 4800.00, 'estado_rel' => RelacionCorte::ESTADO_GENERADA, 'mov_folio' => '561290', 'mov_tipo' => 'Pago en ventanilla', 'conciliar' => false, 'mov_hora' => '14:00:00'],
            ['rel' => 'REL-CNC-2026-003', 'ref' => '37C88877001', 'monto' => 3650.00, 'estado_rel' => RelacionCorte::ESTADO_PAGADA, 'mov_folio' => 'C190011', 'mov_tipo' => 'SPEI', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_CONCILIADA, 'mov_hora' => '10:10:00'],
            ['rel' => 'REL-CNC-2026-004', 'ref' => '48D77766001', 'monto' => 5200.00, 'estado_rel' => RelacionCorte::ESTADO_PARCIAL, 'mov_folio' => 'D220330', 'mov_tipo' => 'Transferencia', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_CON_DIFERENCIA, 'monto_conciliado' => 5000.00, 'mov_hora' => '09:40:00'],
            ['rel' => 'REL-CNC-2026-005', 'ref' => '59E66655001', 'monto' => 2750.00, 'estado_rel' => RelacionCorte::ESTADO_VENCIDA, 'mov_folio' => 'E114488', 'mov_tipo' => 'Pago en ventanilla', 'conciliar' => false, 'mov_hora' => '16:00:00'],
            ['rel' => 'REL-CNC-2026-006', 'ref' => '60F55544001', 'monto' => 6100.00, 'estado_rel' => RelacionCorte::ESTADO_PAGADA, 'mov_folio' => 'F997731', 'mov_tipo' => 'Transferencia', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_CONCILIADA, 'mov_hora' => '12:45:00'],
            ['rel' => 'REL-CNC-2026-007', 'ref' => '71G44433001', 'monto' => 3300.00, 'estado_rel' => RelacionCorte::ESTADO_GENERADA, 'mov_folio' => 'G100245', 'mov_tipo' => 'Transferencia', 'conciliar' => false, 'mov_hora' => '08:30:00'],
            ['rel' => 'REL-CNC-2026-008', 'ref' => '82H33322001', 'monto' => 4500.00, 'estado_rel' => RelacionCorte::ESTADO_PAGADA, 'mov_folio' => 'H888000', 'mov_tipo' => 'SPEI', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_RECHAZADA, 'monto_conciliado' => 0.00, 'mov_hora' => '11:15:00'],
            ['rel' => 'REL-CNC-2026-009', 'ref' => '93I22211001', 'monto' => 2950.00, 'estado_rel' => RelacionCorte::ESTADO_PARCIAL, 'mov_folio' => 'I300771', 'mov_tipo' => 'Transferencia', 'conciliar' => false, 'mov_hora' => '15:25:00'],
            ['rel' => 'REL-CNC-2026-010', 'ref' => '04J11100001', 'monto' => 7000.00, 'estado_rel' => RelacionCorte::ESTADO_PAGADA, 'mov_folio' => 'J755992', 'mov_tipo' => 'Transferencia', 'conciliar' => true, 'conc_estado' => Conciliacion::ESTADO_CONCILIADA, 'mov_hora' => '13:05:00'],
        ];

        $cajera = Usuario::query()->where('nombre_usuario', 'cajera')->first();

        foreach ($escenarios as $index => $escenario) {
            $distribuidora = $distribuidoras[$index % $distribuidoras->count()];

            $relacion = RelacionCorte::query()->firstOrCreate(
                ['numero_relacion' => $escenario['rel']],
                [
                    'corte_id' => $corte->id,
                    'distribuidora_id' => $distribuidora->id,
                    'referencia_pago' => $escenario['ref'],
                    'fecha_limite_pago' => now()->addDays(4)->toDateString(),
                    'total_a_pagar' => $escenario['monto'],
                    'estado' => $escenario['estado_rel'],
                ]
            );

            $movimiento = MovimientoBancario::query()->firstOrCreate(
                ['folio' => $escenario['mov_folio']],
                [
                    'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                    'referencia' => $escenario['ref'],
                    'fecha_movimiento' => now()->toDateString(),
                    'hora_movimiento' => $escenario['mov_hora'],
                    'monto' => $escenario['monto_conciliado'] ?? $escenario['monto'],
                    'tipo_movimiento' => $escenario['mov_tipo'],
                    'nombre_pagador' => $escenario['ref'],
                    'concepto_raw' => "Seeder conciliaciones {$escenario['rel']}",
                ]
            );

            if (!($escenario['conciliar'] ?? false)) {
                $relacion->estado = $escenario['estado_rel'];
                $relacion->save();
                continue;
            }

            if ($movimiento->conciliacion()->exists()) {
                $relacion->estado = $escenario['estado_rel'];
                $relacion->save();
                continue;
            }

            $montoConciliado = $escenario['monto_conciliado'] ?? $escenario['monto'];
            $estadoConciliacion = $escenario['conc_estado'] ?? Conciliacion::ESTADO_CONCILIADA;

            $pago = PagoDistribuidora::query()->create([
                'relacion_corte_id' => $relacion->id,
                'distribuidora_id' => $distribuidora->id,
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'monto' => $montoConciliado,
                'metodo_pago' => str_contains(strtoupper($escenario['mov_tipo']), 'VENTANILLA')
                    ? PagoDistribuidora::METODO_DEPOSITO
                    : PagoDistribuidora::METODO_TRANSFERENCIA,
                'referencia_reportada' => $escenario['ref'],
                'fecha_pago' => now(),
                'estado' => $estadoConciliacion === Conciliacion::ESTADO_RECHAZADA
                    ? PagoDistribuidora::ESTADO_RECHAZADO
                    : PagoDistribuidora::ESTADO_CONCILIADO,
                'observaciones' => "Seed demo {$estadoConciliacion}",
            ]);

            Conciliacion::query()->create([
                'pago_distribuidora_id' => $pago->id,
                'movimiento_bancario_id' => $movimiento->id,
                'conciliado_por_usuario_id' => $cajera?->id,
                'conciliado_en' => now()->subMinutes($index * 4),
                'monto_conciliado' => $montoConciliado,
                'diferencia_monto' => round($montoConciliado - (float) $escenario['monto'], 2),
                'estado' => $estadoConciliacion,
                'observaciones' => "Registro semilla {$escenario['rel']}",
            ]);

            $relacion->estado = $escenario['estado_rel'];
            $relacion->save();
        }

        // Movimientos extra sin relación para forzar escenarios manuales/revisión
        MovimientoBancario::query()->firstOrCreate(
            ['folio' => 'SINREF001'],
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => null,
                'fecha_movimiento' => now()->toDateString(),
                'hora_movimiento' => '17:10:00',
                'monto' => 1234.56,
                'tipo_movimiento' => 'Transferencia',
                'nombre_pagador' => 'Sin referencia demo',
                'concepto_raw' => 'Movimiento sin referencia para prueba manual',
            ]
        );

        MovimientoBancario::query()->firstOrCreate(
            ['folio' => 'REFNOEX001'],
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => 'REF-NO-EXISTE',
                'fecha_movimiento' => now()->toDateString(),
                'hora_movimiento' => '18:05:00',
                'monto' => 999.99,
                'tipo_movimiento' => 'Pago en ventanilla',
                'nombre_pagador' => 'Referencia no existente',
                'concepto_raw' => 'Movimiento con referencia que no empata',
            ]
        );

        $this->command?->info('ConciliacionesCajeraSeeder listo con escenarios amplios: conciliadas, diferencias, rechazadas y pendientes manuales.');
        $this->command?->info('Se generaron 10 relaciones demo + movimientos extra sin match para operación manual.');
    }
}
