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
     * Deja un único corte histórico totalmente pagado para la sucursal Centro.
     *
     * Propósito: el distribuidor ya tiene un corte cerrado en su histórico pero
     * no tiene relaciones abiertas que bloqueen la emisión de nuevos vales.
     *
     * Se sobreescribe cualquier corte/relación/pago previo de la sucursal Centro
     * antes de crear el nuevo estado limpio.
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

        $this->limpiarEstadoPrevio($centro);

        // 1. Cuenta bancaria de empresa (polimórfica, persistente)
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

        // 2. Un único corte CERRADO histórico (ejecutado y cerrado hace ~30 días)
        $corte = Corte::create([
            'sucursal_id'             => $centro->id,
            'tipo_corte'              => Corte::TIPO_PAGOS,
            'dia_base_mes'            => 14,
            'hora_base'               => '18:00:00',
            'fecha_programada'        => now()->subDays(30),
            'fecha_ejecucion'         => now()->subDays(30),
            'mantener_fecha_en_inhabil' => false,
            'estado'                  => Corte::ESTADO_CERRADO,
            'observaciones'           => 'Corte histórico cerrado con todas las relaciones pagadas.',
            'creado_en'               => now()->subDays(30),
            'actualizado_en'          => now()->subDays(25),
        ]);

        // 3. Un vale LIQUIDADO como partida del corte (representa la quincena pagada)
        $valeLiquidado = Vale::where('distribuidora_id', $distActiva->id)
            ->where('estado', Vale::ESTADO_LIQUIDADO)
            ->orderBy('id')
            ->first();

        $totalComision = $valeLiquidado ? (float) $valeLiquidado->monto_comision_empresa : 400.00;
        $totalPago = $valeLiquidado ? (float) $valeLiquidado->monto_quincenal : 1200.00;
        $totalRecargos = 0.00;
        $totalAPagar = round($totalComision + $totalPago + $totalRecargos, 2);

        $relacion = RelacionCorte::create([
            'corte_id'                      => $corte->id,
            'distribuidora_id'              => $distActiva->id,
            'numero_relacion'               => 'REL-COMP-001',
            'referencia_pago'               => 'PFCEN001-A',
            'fecha_limite_pago'             => now()->subDays(20)->toDateString(),
            'fecha_inicio_pago_anticipado'  => now()->subDays(30)->toDateString(),
            'fecha_fin_pago_anticipado'     => now()->subDays(27)->toDateString(),
            'limite_credito_snapshot'       => $distActiva->limite_credito,
            'credito_disponible_snapshot'   => $distActiva->credito_disponible,
            'puntos_snapshot'               => $distActiva->puntos_actuales,
            'total_comision'                => $totalComision,
            'total_pago'                    => $totalPago,
            'total_recargos'                => $totalRecargos,
            'total_a_pagar'                 => $totalAPagar,
            'estado'                        => RelacionCorte::ESTADO_CERRADA,
            'generada_en'                   => now()->subDays(30),
        ]);

        if ($valeLiquidado) {
            PartidaRelacionCorte::create([
                'relacion_corte_id'        => $relacion->id,
                'vale_id'                  => $valeLiquidado->id,
                'cliente_id'               => $valeLiquidado->cliente_id,
                'nombre_producto_snapshot' => 'Prestamo 8/12000',
                'pagos_realizados'         => $valeLiquidado->pagos_realizados,
                'pagos_totales'            => $valeLiquidado->quincenas_totales,
                'monto_comision'           => $totalComision,
                'monto_pago'               => $totalPago,
                'monto_recargo'            => $totalRecargos,
                'monto_total_linea'        => $totalAPagar,
                'creado_en'                => now()->subDays(30),
            ]);
        }

        // 4. Movimiento bancario + pago CONCILIADO + conciliación CONCILIADA
        $movimientoBanco = MovimientoBancario::create([
            'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
            'fecha_movimiento'        => now()->subDays(25)->toDateString(),
            'hora_movimiento'         => '10:15:00',
            'monto'                   => $totalAPagar,
            'tipo_movimiento'         => 'DEPOSITO',
            'folio'                   => 'FOL-' . strtoupper(substr(md5('cerrado-'.$corte->id), 0, 8)),
            'referencia'              => $relacion->referencia_pago,
            'nombre_pagador'          => $distActiva->persona->primer_nombre . ' ' . $distActiva->persona->apellido_paterno,
            'concepto_raw'            => 'Pago relación ' . $relacion->numero_relacion,
            'creado_en'               => now()->subDays(25),
        ]);

        $pagoDist = PagoDistribuidora::create([
            'relacion_corte_id'       => $relacion->id,
            'distribuidora_id'        => $distActiva->id,
            'cuenta_banco_empresa_id' => $cuentaEmpresa->id,
            'monto'                   => $totalAPagar,
            'metodo_pago'             => PagoDistribuidora::METODO_TRANSFERENCIA,
            'referencia_reportada'    => $relacion->referencia_pago,
            'fecha_pago'              => now()->subDays(25),
            'estado'                  => PagoDistribuidora::ESTADO_CONCILIADO,
            'observaciones'           => 'Pago conciliado automáticamente contra archivo bancario.',
            'creado_en'               => now()->subDays(25),
        ]);

        Conciliacion::create([
            'pago_distribuidora_id'      => $pagoDist->id,
            'movimiento_bancario_id'     => $movimientoBanco->id,
            'conciliado_por_usuario_id'  => $cajera?->id,
            'conciliado_en'              => now()->subDays(25),
            'monto_conciliado'           => $totalAPagar,
            'diferencia_monto'           => 0.00,
            'estado'                     => Conciliacion::ESTADO_CONCILIADA,
            'observaciones'              => 'Match automático por referencia.',
        ]);

        // 5. Movimientos de puntos históricos (solo positivos — sin penalizaciones)
        // La distribuidora asociada al corte gana puntos por pago puntual/anticipado.
        $puntosGanadosCorte = 0;
        if ($valeLiquidado) {
            MovimientoPunto::create([
                'distribuidora_id'     => $distActiva->id,
                'vale_id'              => $valeLiquidado->id,
                'corte_id'             => $corte->id,
                'pago_cliente_id'      => null,
                'tipo_movimiento'      => MovimientoPunto::TIPO_GANADO_ANTICIPADO,
                'puntos'               => 30,
                'valor_punto_snapshot' => 2.00,
                'motivo'               => 'Pago anticipado del corte ' . $corte->id,
                'creado_en'            => now()->subDays(25),
            ]);
            MovimientoPunto::create([
                'distribuidora_id'     => $distActiva->id,
                'vale_id'              => $valeLiquidado->id,
                'corte_id'             => $corte->id,
                'pago_cliente_id'      => null,
                'tipo_movimiento'      => MovimientoPunto::TIPO_GANADO_PUNTUAL,
                'puntos'               => 15,
                'valor_punto_snapshot' => 2.00,
                'motivo'               => 'Pago puntual del corte ' . $corte->id,
                'creado_en'            => now()->subDays(25),
            ]);
            $puntosGanadosCorte = 45;
        }
        $distActiva->update(['puntos_actuales' => $puntosGanadosCorte]);

        // 6. Corte actual (EJECUTADO) con una relación GENERADA pendiente de pago
        // para que la distribuidora principal pueda probar canje de puntos.
        $corteActual = Corte::create([
            'sucursal_id'               => $centro->id,
            'tipo_corte'                => Corte::TIPO_PAGOS,
            'dia_base_mes'              => 14,
            'hora_base'                 => '18:00:00',
            'fecha_programada'          => now()->subDays(2),
            'fecha_ejecucion'           => now()->subDays(2),
            'mantener_fecha_en_inhabil' => false,
            'estado'                    => Corte::ESTADO_EJECUTADO,
            'observaciones'             => 'Corte ejecutado pendiente de cobranza.',
            'creado_en'                 => now()->subDays(2),
            'actualizado_en'            => now()->subDays(2),
        ]);

        $valeActivo = Vale::where('distribuidora_id', $distActiva->id)
            ->where('estado', Vale::ESTADO_ACTIVO)
            ->orderBy('id')
            ->first();

        $totalComisionGen = $valeActivo ? (float) $valeActivo->monto_comision_empresa : 400.00;
        $totalPagoGen = $valeActivo ? (float) $valeActivo->monto_quincenal : 1200.00;
        $totalAPagarGen = round($totalComisionGen + $totalPagoGen, 2);

        $relacionPendiente = RelacionCorte::create([
            'corte_id'                      => $corteActual->id,
            'distribuidora_id'              => $distActiva->id,
            'numero_relacion'               => 'REL-COMP-002',
            'referencia_pago'               => 'PFCEN001-B',
            'fecha_limite_pago'             => now()->addDays(13)->toDateString(),
            'fecha_inicio_pago_anticipado'  => now()->subDays(2)->toDateString(),
            'fecha_fin_pago_anticipado'     => now()->addDays(1)->toDateString(),
            'limite_credito_snapshot'       => $distActiva->limite_credito,
            'credito_disponible_snapshot'   => $distActiva->credito_disponible,
            'puntos_snapshot'               => $distActiva->puntos_actuales,
            'total_comision'                => $totalComisionGen,
            'total_pago'                    => $totalPagoGen,
            'total_recargos'                => 0.00,
            'total_a_pagar'                 => $totalAPagarGen,
            'estado'                        => RelacionCorte::ESTADO_GENERADA,
            'generada_en'                   => now()->subDays(2),
        ]);

        if ($valeActivo) {
            PartidaRelacionCorte::create([
                'relacion_corte_id'        => $relacionPendiente->id,
                'vale_id'                  => $valeActivo->id,
                'cliente_id'               => $valeActivo->cliente_id,
                'nombre_producto_snapshot' => 'Prestamo 8/12000',
                'pagos_realizados'         => $valeActivo->pagos_realizados,
                'pagos_totales'            => $valeActivo->quincenas_totales,
                'monto_comision'           => $totalComisionGen,
                'monto_pago'               => $totalPagoGen,
                'monto_recargo'            => 0.00,
                'monto_total_linea'        => $totalAPagarGen,
                'creado_en'                => now()->subDays(2),
            ]);
        }

        // 7. Repartir puntos a las demás distribuidoras ACTIVAS como ajuste inicial
        // (montos distintos para probar canje con saldos variados).
        $puntosIniciales = [
            'dist2.trc_centro' => 30,
            'dist1.trc_nte'    => 60,
            'dist2.trc_nte'    => 50,
        ];

        foreach ($puntosIniciales as $nombreUsuario => $puntos) {
            $dist = Distribuidora::query()
                ->where('estado', Distribuidora::ESTADO_ACTIVA)
                ->whereHas('persona.usuario', fn ($q) => $q->where('nombre_usuario', $nombreUsuario))
                ->first();

            if (!$dist) {
                continue;
            }

            MovimientoPunto::create([
                'distribuidora_id'     => $dist->id,
                'vale_id'              => null,
                'corte_id'             => null,
                'pago_cliente_id'      => null,
                'tipo_movimiento'      => MovimientoPunto::TIPO_AJUSTE_MANUAL,
                'puntos'               => $puntos,
                'valor_punto_snapshot' => 2.00,
                'motivo'               => 'Ajuste inicial de puntos para pruebas',
                'creado_en'            => now()->subDays(20),
            ]);

            $dist->update(['puntos_actuales' => $puntos]);
        }

        $totalDistribuido = $puntosGanadosCorte + array_sum($puntosIniciales);
        $this->command?->info(
            'CortesSeeder: 1 corte histórico CERRADO + 1 relación CERRADA totalmente pagada. '
            . "Puntos repartidos a distribuidoras activas: total {$totalDistribuido}."
        );
    }

    /**
     * Elimina cortes, relaciones, pagos, partidas, conciliaciones, movimientos
     * bancarios y puntos previos de la sucursal Centro para evitar data mixta.
     */
    private function limpiarEstadoPrevio(Sucursal $centro): void
    {
        $corteIds = Corte::where('sucursal_id', $centro->id)->pluck('id');

        if ($corteIds->isNotEmpty()) {
            $relacionIds = RelacionCorte::whereIn('corte_id', $corteIds)->pluck('id');

            if ($relacionIds->isNotEmpty()) {
                $pagoIds = PagoDistribuidora::whereIn('relacion_corte_id', $relacionIds)->pluck('id');

                if ($pagoIds->isNotEmpty()) {
                    Conciliacion::whereIn('pago_distribuidora_id', $pagoIds)->delete();
                    PagoDistribuidora::whereIn('id', $pagoIds)->delete();
                }

                PartidaRelacionCorte::whereIn('relacion_corte_id', $relacionIds)->delete();
                RelacionCorte::whereIn('id', $relacionIds)->delete();
            }

            MovimientoPunto::whereIn('corte_id', $corteIds)->delete();
            Corte::whereIn('id', $corteIds)->delete();
        }

        // Movimientos bancarios ligados a la cuenta empresa de esta sucursal
        $cuentaEmpresa = CuentaBancaria::where('tipo_propietario', CuentaBancaria::TIPO_EMPRESA)
            ->where('propietario_id', $centro->id)
            ->first();
        if ($cuentaEmpresa) {
            MovimientoBancario::where('cuenta_banco_empresa_id', $cuentaEmpresa->id)->delete();
        }
    }
}
