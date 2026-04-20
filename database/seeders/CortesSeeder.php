<?php

namespace Database\Seeders;

use App\Models\Conciliacion;
use App\Models\Corte;
use App\Models\CuentaBancaria;
use App\Models\Distribuidora;
use App\Models\MovimientoBancario;
use App\Models\MovimientoPunto;
use App\Models\PagoDistribuidora;
use App\Models\PartidaRelacionCorte;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\Vale;
use Illuminate\Database\Seeder;

class CortesSeeder extends Seeder
{
    /**
     * Crea el flujo completo de cortes para la sucursal Centro:
     *   - 3 cortes cubriendo estados PROGRAMADO, EJECUTADO y CERRADO
     *   - 5 relaciones_corte cubriendo estados GENERADA, PARCIAL, PAGADA, VENCIDA, CERRADA
     *   - Partidas por cada relación
     *   - PagosDistribuidora cubriendo REPORTADO y CONCILIADO
     *   - Conciliaciones cubriendo CONCILIADA, CON_DIFERENCIA, RECHAZADA
     *   - MovimientosBancarios y cuenta empresa
     *   - MovimientosPuntos cubriendo 5 tipos de movimiento
     */
    public function run(): void
    {
        $centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();
        if (!$centro) {
            $this->command?->warn('Sucursal Centro no encontrada.');
            return;
        }

        $cajera = Usuario::where('nombre_usuario', 'cajera')->first();
        $distActiva = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->where('sucursal_id', $centro->id)
            ->orderBy('id')
            ->first();

        if (!$distActiva) {
            $this->command?->warn('No hay distribuidora ACTIVA en Centro.');
            return;
        }

        // 1. Cuenta bancaria de empresa (polimorfica)
        $cuentaEmpresa = CuentaBancaria::updateOrCreate(
            [
                'tipo_propietario' => CuentaBancaria::TIPO_EMPRESA,
                'propietario_id'   => $centro->id,
            ],
            [
                'banco'                   => 'BBVA',
                'nombre_titular'          => 'Prestamo Facil SA de CV',
                'numero_cuenta_mascarado' => '****7890',
                'clabe'                   => '012180000123457890',
                'convenio'                => 'CIE1234',
                'referencia_base'         => 'SUC-TRC-CENTRO',
                'es_principal'            => true,
                'verificada_en'           => now()->subYear(),
                'creado_en'               => now(),
                'actualizado_en'          => now(),
            ]
        );

        // 2. Cortes (3 estados)
        $cortes = [
            [
                'tipo' => Corte::TIPO_PAGOS,
                'estado' => Corte::ESTADO_PROGRAMADO,
                'fecha_programada' => now()->addDays(7),
                'fecha_ejecucion' => null,
                'observaciones' => 'Proximo corte programado (dia 28).',
            ],
            [
                'tipo' => Corte::TIPO_PAGOS,
                'estado' => Corte::ESTADO_EJECUTADO,
                'fecha_programada' => now()->subDays(5),
                'fecha_ejecucion' => now()->subDays(5),
                'observaciones' => 'Corte ejecutado, en proceso de cobranza.',
            ],
            [
                'tipo' => Corte::TIPO_PAGOS,
                'estado' => Corte::ESTADO_CERRADO,
                'fecha_programada' => now()->subDays(20),
                'fecha_ejecucion' => now()->subDays(20),
                'observaciones' => 'Corte cerrado con todas sus relaciones pagadas.',
            ],
        ];

        $cortesCreados = [];
        foreach ($cortes as $i => $c) {
            $corte = Corte::updateOrCreate(
                [
                    'sucursal_id' => $centro->id,
                    'tipo_corte' => $c['tipo'],
                    'fecha_programada' => $c['fecha_programada'],
                ],
                [
                    'dia_base_mes' => 14,
                    'hora_base' => '18:00:00',
                    'fecha_ejecucion' => $c['fecha_ejecucion'],
                    'mantener_fecha_en_inhabil' => false,
                    'estado' => $c['estado'],
                    'observaciones' => $c['observaciones'],
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
            $cortesCreados[$c['estado']] = $corte;
        }

        // 3. Relaciones de corte (5 estados) — usar el corte EJECUTADO como padre
        $cortePadre = $cortesCreados[Corte::ESTADO_EJECUTADO];

        $vales = Vale::where('distribuidora_id', $distActiva->id)
            ->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL, Vale::ESTADO_LIQUIDADO, Vale::ESTADO_MOROSO])
            ->orderBy('id')
            ->get();

        $estadosRelacion = [
            RelacionCorte::ESTADO_GENERADA,
            RelacionCorte::ESTADO_PARCIAL,
            RelacionCorte::ESTADO_PAGADA,
            RelacionCorte::ESTADO_VENCIDA,
            RelacionCorte::ESTADO_CERRADA,
        ];

        $relacionesCreadas = [];
        foreach ($estadosRelacion as $idx => $estado) {
            $consecutivo = sprintf('REL-COMP-%03d', $idx + 1);
            $referencia = sprintf('PFCEN001-%s', chr(65 + $idx)); // A, B, C, D, E

            // Cada relación agrupa 1 vale representativo
            $vale = $vales[$idx % max($vales->count(), 1)] ?? null;

            $totalComision = $vale ? (float) $vale->monto_comision_empresa : 400.00;
            $totalPago = $vale ? (float) $vale->monto_quincenal : 1200.00;
            $totalRecargos = $estado === RelacionCorte::ESTADO_VENCIDA ? 300.00 : 0.00;
            $totalAPagar = round($totalComision + $totalPago + $totalRecargos, 2);

            $relacion = RelacionCorte::updateOrCreate(
                ['numero_relacion' => $consecutivo],
                [
                    'corte_id' => $cortePadre->id,
                    'distribuidora_id' => $distActiva->id,
                    'referencia_pago' => $referencia,
                    'fecha_limite_pago' => now()->subDays(5)->addDays(10)->toDateString(),
                    'fecha_inicio_pago_anticipado' => now()->subDays(5)->toDateString(),
                    'fecha_fin_pago_anticipado' => now()->subDays(5)->addDays(3)->toDateString(),
                    'limite_credito_snapshot' => $distActiva->limite_credito,
                    'credito_disponible_snapshot' => $distActiva->credito_disponible,
                    'puntos_snapshot' => $distActiva->puntos_actuales,
                    'total_comision' => $totalComision,
                    'total_pago' => $totalPago,
                    'total_recargos' => $totalRecargos,
                    'total_a_pagar' => $totalAPagar,
                    'estado' => $estado,
                    'generada_en' => now()->subDays(5),
                ]
            );
            $relacionesCreadas[$estado] = $relacion;

            // Partida (1 por relación)
            if ($vale) {
                PartidaRelacionCorte::updateOrCreate(
                    [
                        'relacion_corte_id' => $relacion->id,
                        'vale_id' => $vale->id,
                    ],
                    [
                        'cliente_id' => $vale->cliente_id,
                        'nombre_producto_snapshot' => 'Prestamo 8/12000',
                        'pagos_realizados' => $vale->pagos_realizados,
                        'pagos_totales' => $vale->quincenas_totales,
                        'monto_comision' => $totalComision,
                        'monto_pago' => $totalPago,
                        'monto_recargo' => $totalRecargos,
                        'monto_total_linea' => $totalAPagar,
                        'creado_en' => now()->subDays(5),
                    ]
                );
            }
        }

        // 4. Pagos distribuidora + conciliaciones + movimientos bancarios
        // PAGADA: REPORTADO + CONCILIADO + movimiento bancario + conciliación CONCILIADA
        $relPagada = $relacionesCreadas[RelacionCorte::ESTADO_PAGADA];
        $movPagada = MovimientoBancario::updateOrCreate(
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => $relPagada->referencia_pago,
            ],
            [
                'fecha_movimiento' => now()->subDays(3)->toDateString(),
                'hora_movimiento' => '10:15:00',
                'monto' => $relPagada->total_a_pagar,
                'tipo_movimiento' => 'DEPOSITO',
                'folio' => 'FOL-' . strtoupper(substr(md5('pagada'), 0, 8)),
                'nombre_pagador' => $distActiva->persona->primer_nombre . ' ' . $distActiva->persona->apellido_paterno,
                'concepto_raw' => 'Pago relacion ' . $relPagada->numero_relacion,
                'creado_en' => now()->subDays(3),
            ]
        );
        $pagoPagada = PagoDistribuidora::updateOrCreate(
            ['relacion_corte_id' => $relPagada->id],
            [
                'distribuidora_id' => $distActiva->id,
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'monto' => $relPagada->total_a_pagar,
                'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
                'referencia_reportada' => $relPagada->referencia_pago,
                'fecha_pago' => now()->subDays(3),
                'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
                'observaciones' => 'Pago conciliado contra banco sin diferencia.',
                'creado_en' => now()->subDays(3),
            ]
        );
        Conciliacion::updateOrCreate(
            ['pago_distribuidora_id' => $pagoPagada->id],
            [
                'movimiento_bancario_id' => $movPagada->id,
                'conciliado_por_usuario_id' => $cajera?->id,
                'conciliado_en' => now()->subDays(3),
                'monto_conciliado' => $relPagada->total_a_pagar,
                'diferencia_monto' => 0.00,
                'estado' => Conciliacion::ESTADO_CONCILIADA,
                'observaciones' => 'Match automatico por referencia.',
            ]
        );

        // PARCIAL: REPORTADO + CON_DIFERENCIA
        $relParcial = $relacionesCreadas[RelacionCorte::ESTADO_PARCIAL];
        $movParcial = MovimientoBancario::updateOrCreate(
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => $relParcial->referencia_pago,
            ],
            [
                'fecha_movimiento' => now()->subDays(2)->toDateString(),
                'hora_movimiento' => '14:30:00',
                'monto' => round($relParcial->total_a_pagar * 0.6, 2),
                'tipo_movimiento' => 'DEPOSITO',
                'folio' => 'FOL-' . strtoupper(substr(md5('parcial'), 0, 8)),
                'nombre_pagador' => $distActiva->persona->primer_nombre . ' ' . $distActiva->persona->apellido_paterno,
                'concepto_raw' => 'Pago parcial ' . $relParcial->numero_relacion,
                'creado_en' => now()->subDays(2),
            ]
        );
        $pagoParcial = PagoDistribuidora::updateOrCreate(
            ['relacion_corte_id' => $relParcial->id],
            [
                'distribuidora_id' => $distActiva->id,
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'monto' => round($relParcial->total_a_pagar * 0.6, 2),
                'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
                'referencia_reportada' => $relParcial->referencia_pago,
                'fecha_pago' => now()->subDays(2),
                'estado' => PagoDistribuidora::ESTADO_REPORTADO,
                'observaciones' => 'Pago parcial, monto menor al esperado.',
                'creado_en' => now()->subDays(2),
            ]
        );
        Conciliacion::updateOrCreate(
            ['pago_distribuidora_id' => $pagoParcial->id],
            [
                'movimiento_bancario_id' => $movParcial->id,
                'conciliado_por_usuario_id' => $cajera?->id,
                'conciliado_en' => now()->subDays(2),
                'monto_conciliado' => round($relParcial->total_a_pagar * 0.6, 2),
                'diferencia_monto' => round($relParcial->total_a_pagar * 0.4, 2),
                'estado' => Conciliacion::ESTADO_CON_DIFERENCIA,
                'observaciones' => 'El deposito no cubre el total de la relacion.',
            ]
        );

        // VENCIDA: REPORTADO pero conciliación RECHAZADA (intento de fraude)
        $relVencida = $relacionesCreadas[RelacionCorte::ESTADO_VENCIDA];
        $movVencida = MovimientoBancario::updateOrCreate(
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => 'REF-INVALIDA-123',
            ],
            [
                'fecha_movimiento' => now()->subDays(10)->toDateString(),
                'hora_movimiento' => '09:00:00',
                'monto' => 500.00,
                'tipo_movimiento' => 'DEPOSITO',
                'folio' => 'FOL-' . strtoupper(substr(md5('vencida'), 0, 8)),
                'nombre_pagador' => 'Desconocido',
                'concepto_raw' => 'Deposito sin referencia valida',
                'creado_en' => now()->subDays(10),
            ]
        );
        $pagoVencida = PagoDistribuidora::updateOrCreate(
            ['relacion_corte_id' => $relVencida->id],
            [
                'distribuidora_id' => $distActiva->id,
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'monto' => 500.00,
                'metodo_pago' => PagoDistribuidora::METODO_DEPOSITO,
                'referencia_reportada' => 'REF-INVALIDA-123',
                'fecha_pago' => now()->subDays(10),
                'estado' => PagoDistribuidora::ESTADO_RECHAZADO,
                'observaciones' => 'Pago rechazado por referencia incorrecta.',
                'creado_en' => now()->subDays(10),
            ]
        );
        Conciliacion::updateOrCreate(
            ['pago_distribuidora_id' => $pagoVencida->id],
            [
                'movimiento_bancario_id' => $movVencida->id,
                'conciliado_por_usuario_id' => $cajera?->id,
                'conciliado_en' => now()->subDays(9),
                'monto_conciliado' => 0.00,
                'diferencia_monto' => $relVencida->total_a_pagar,
                'estado' => Conciliacion::ESTADO_RECHAZADA,
                'observaciones' => 'Referencia no corresponde a relacion activa.',
            ]
        );

        // 5. Movimientos bancarios sin match (para operacion manual)
        MovimientoBancario::updateOrCreate(
            [
                'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
                'referencia' => 'SINREF-' . strtoupper(substr(md5('extra'), 0, 6)),
            ],
            [
                'fecha_movimiento' => now()->subDay()->toDateString(),
                'hora_movimiento' => '15:45:00',
                'monto' => 2500.00,
                'tipo_movimiento' => 'DEPOSITO',
                'folio' => 'FOL-EXTRA',
                'nombre_pagador' => 'Pagador Externo',
                'concepto_raw' => 'Deposito sin identificar',
                'creado_en' => now()->subDay(),
            ]
        );

        // 6. Movimientos de puntos (5 tipos)
        $valeActivo = Vale::where('distribuidora_id', $distActiva->id)
            ->where('estado', Vale::ESTADO_ACTIVO)
            ->first();
        $valeMoroso = Vale::where('distribuidora_id', $distActiva->id)
            ->where('estado', Vale::ESTADO_MOROSO)
            ->first();

        $movimientosPuntos = [
            [
                'tipo' => MovimientoPunto::TIPO_GANADO_ANTICIPADO,
                'puntos' => 30,
                'vale' => $valeActivo,
                'corte' => $cortePadre,
                'motivo' => 'Pago anticipado en corte ' . $cortePadre->id,
            ],
            [
                'tipo' => MovimientoPunto::TIPO_GANADO_PUNTUAL,
                'puntos' => 15,
                'vale' => $valeActivo,
                'corte' => $cortePadre,
                'motivo' => 'Pago puntual',
            ],
            [
                'tipo' => MovimientoPunto::TIPO_PENALIZACION_ATRASO,
                'puntos' => -20,
                'vale' => $valeMoroso,
                'corte' => $cortePadre,
                'motivo' => 'Penalizacion 20% por relacion con atraso',
            ],
            [
                'tipo' => MovimientoPunto::TIPO_AJUSTE_MANUAL,
                'puntos' => 10,
                'vale' => null,
                'corte' => null,
                'motivo' => 'Ajuste manual autorizado por Gerente',
            ],
            [
                'tipo' => MovimientoPunto::TIPO_CANJE,
                'puntos' => -50,
                'vale' => null,
                'corte' => null,
                'motivo' => 'Canje de puntos contra relacion de corte',
            ],
        ];

        foreach ($movimientosPuntos as $i => $mp) {
            MovimientoPunto::create([
                'distribuidora_id' => $distActiva->id,
                'vale_id' => $mp['vale']?->id,
                'corte_id' => $mp['corte']?->id,
                'pago_cliente_id' => null,
                'tipo_movimiento' => $mp['tipo'],
                'puntos' => $mp['puntos'],
                'valor_punto_snapshot' => 2.00,
                'motivo' => $mp['motivo'],
                'creado_en' => now()->subDays(5 - $i),
            ]);
        }

        $this->command?->info('Cortes completos: 3 cortes + 5 relaciones + partidas + pagos + 3 conciliaciones + 5 movimientos puntos.');
    }
}
