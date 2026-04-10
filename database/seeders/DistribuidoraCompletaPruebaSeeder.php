<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Conciliacion;
use App\Models\Corte;
use App\Models\CuentaBancaria;
use App\Models\Distribuidora;
use App\Models\MovimientoBancario;
use App\Models\MovimientoPunto;
use App\Models\PagoDistribuidora;
use App\Models\PartidaRelacionCorte;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Vale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DistribuidoraCompletaPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $distribuidora = Distribuidora::where('numero_distribuidora', 'DIST-PRUEBA-001')->first();

        if (!$distribuidora) {
            $this->command?->warn('No se encontró la distribuidora de prueba.');
            return;
        }

        $sucursal = $distribuidora->sucursal ?? Sucursal::first();
        $productos = ProductoFinanciero::where('activo', true)->get();

        if ($productos->isEmpty()) {
            $this->command?->warn('No hay productos financieros activos.');
            return;
        }

        // =====================================================================
        // 0. CONFIGURACIÓN DE SUCURSAL (valor del punto, factor y multiplicador)
        // En producción esto lo crea/edita el gerente desde su módulo. Aquí solo
        // garantizamos que exista una fila para que el canje de puntos funcione.
        // =====================================================================
        SucursalConfiguracion::firstOrCreate(
            ['sucursal_id' => $sucursal->id],
            [
                'frecuencia_pago_dias'         => 14,
                'plazo_pago_dias'              => 15,
                'linea_credito_default'        => 0,
                'porcentaje_comision_apertura' => 10,
                'porcentaje_interes_quincenal' => 5,
                'multa_incumplimiento_monto'   => 300,
                'factor_divisor_puntos'        => 1200,
                'multiplicador_puntos'         => 3,
                'valor_punto_mxn'              => 2.00,
            ]
        );

        // =====================================================================
        // 1. CUENTAS BANCARIAS DE LA EMPRESA
        // =====================================================================
        $cuentaBBVA = CuentaBancaria::updateOrCreate(
            ['tipo_propietario' => CuentaBancaria::TIPO_EMPRESA, 'clabe' => '002115016003241108'],
            ['propietario_id' => 1, 'banco' => 'BBVA', 'nombre_titular' => 'Prestamo Fácil SA de CV', 'numero_cuenta_mascarado' => '****2411', 'convenio' => '1628789', 'referencia_base' => 'PFBBVA', 'es_principal' => true]
        );

        CuentaBancaria::updateOrCreate(
            ['tipo_propietario' => CuentaBancaria::TIPO_EMPRESA, 'clabe' => '147878941962371005'],
            ['propietario_id' => 1, 'banco' => 'BANORTE', 'nombre_titular' => 'Prestamo Fácil SA de CV', 'numero_cuenta_mascarado' => '****3710', 'convenio' => '57148', 'referencia_base' => 'PFBNRT', 'es_principal' => false]
        );

        // =====================================================================
        // 2. CLIENTES (7 escenarios diferentes)
        // =====================================================================
        $clientesData = [
            ['nombre' => 'María Elena', 'segundo' => null, 'paterno' => 'Rodríguez', 'materno' => 'Sánchez', 'sexo' => 'F', 'curp' => 'ROSM900315MDFDNR08', 'tel' => '5523456789', 'email' => 'maria.rodriguez@correo.com', 'codigo' => 'CLI-COMP-001', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'ACTIVA', 'parentesco' => false, 'banco' => 'BBVA Bancomer', 'clabe' => '012180015074685075', 'titular' => 'María Elena Rodríguez Sánchez'],
            ['nombre' => 'Carlos', 'segundo' => null, 'paterno' => 'Hernández', 'materno' => 'López', 'sexo' => 'M', 'curp' => 'HELC850720HDFRPS05', 'tel' => '5534567890', 'email' => 'carlos.hernandez@correo.com', 'codigo' => 'CLI-COMP-002', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'ACTIVA', 'parentesco' => false, 'banco' => 'Banorte', 'clabe' => '072180012345678901', 'titular' => 'Carlos Hernández López'],
            ['nombre' => 'Laura', 'segundo' => 'Patricia', 'paterno' => 'Gómez', 'materno' => 'Torres', 'sexo' => 'F', 'curp' => 'GOTL920108MDFMRR07', 'tel' => '5545678901', 'email' => 'laura.gomez@correo.com', 'codigo' => 'CLI-COMP-003', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'ACTIVA', 'parentesco' => false, 'banco' => 'Santander', 'clabe' => '014180056007891234', 'titular' => 'Laura Patricia Gómez Torres'],
            ['nombre' => 'Roberto', 'segundo' => null, 'paterno' => 'Díaz', 'materno' => 'Mendoza', 'sexo' => 'M', 'curp' => 'DIMR880512HDFZND01', 'tel' => '5556789012', 'email' => 'roberto.diaz@correo.com', 'codigo' => 'CLI-COMP-004', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'ACTIVA', 'parentesco' => true, 'obs_parentesco' => 'Hermano de la distribuidora. Bloqueado por política de familiares.', 'banco' => 'HSBC', 'clabe' => '021180045678901234', 'titular' => 'Roberto Díaz Mendoza'],
            ['nombre' => 'Ana', 'segundo' => 'Lucía', 'paterno' => 'Morales', 'materno' => 'Vega', 'sexo' => 'F', 'curp' => 'MOVA950623MDFRGN05', 'tel' => '5567890123', 'email' => 'ana.morales@correo.com', 'codigo' => 'CLI-COMP-005', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'BLOQUEADA', 'parentesco' => false, 'banco' => 'Inbursa', 'clabe' => '036180078901234567', 'titular' => 'Ana Lucía Morales Vega'],
            ['nombre' => 'Pedro', 'segundo' => null, 'paterno' => 'Ramírez', 'materno' => 'Soto', 'sexo' => 'M', 'curp' => 'RASP780930HDFMTD02', 'tel' => '5578901234', 'email' => 'pedro.ramirez@correo.com', 'codigo' => 'CLI-COMP-006', 'estado_cliente' => Cliente::ESTADO_MOROSO, 'estado_relacion' => 'ACTIVA', 'parentesco' => false, 'banco' => 'Scotiabank', 'clabe' => '044180034567890123', 'titular' => 'Pedro Ramírez Soto'],
            ['nombre' => 'Sofía', 'segundo' => null, 'paterno' => 'Jiménez', 'materno' => 'Cruz', 'sexo' => 'F', 'curp' => 'JICS010215MDFMRF08', 'tel' => '5589012345', 'email' => 'sofia.jimenez@correo.com', 'codigo' => 'CLI-COMP-007', 'estado_cliente' => Cliente::ESTADO_ACTIVO, 'estado_relacion' => 'ACTIVA', 'parentesco' => false, 'banco' => 'BBVA Bancomer', 'clabe' => '012180098765432101', 'titular' => 'Sofía Jiménez Cruz'],
        ];

        $clientes = [];
        foreach ($clientesData as $d) {
            $persona = Persona::updateOrCreate(['curp' => $d['curp']], [
                'primer_nombre' => $d['nombre'], 'segundo_nombre' => $d['segundo'],
                'apellido_paterno' => $d['paterno'], 'apellido_materno' => $d['materno'],
                'sexo' => $d['sexo'], 'telefono_celular' => $d['tel'], 'correo_electronico' => $d['email'],
            ]);

            $cliente = Cliente::updateOrCreate(['persona_id' => $persona->id], [
                'codigo_cliente' => $d['codigo'], 'estado' => $d['estado_cliente'],
                'cuenta_banco' => $d['banco'], 'cuenta_clabe' => $d['clabe'], 'cuenta_titular' => $d['titular'],
                'foto_ine_frente' => 'seed/ine_frente_' . $d['codigo'] . '.jpg',
                'foto_ine_reverso' => 'seed/ine_reverso_' . $d['codigo'] . '.jpg',
                'foto_selfie_ine' => 'seed/selfie_' . $d['codigo'] . '.jpg',
            ]);

            DB::table('clientes_distribuidora')->updateOrInsert(
                ['distribuidora_id' => $distribuidora->id, 'cliente_id' => $cliente->id],
                [
                    'estado_relacion' => $d['estado_relacion'],
                    'bloqueado_por_parentesco' => $d['parentesco'],
                    'observaciones_parentesco' => $d['obs_parentesco'] ?? null,
                    'vinculado_en' => now()->subDays(rand(30, 180)),
                ]
            );

            $clientes[$d['codigo']] = $cliente;
        }

        // =====================================================================
        // 3. VALES EN DIFERENTES ESTADOS
        // =====================================================================
        $prod1 = $productos[0];
        $prod2 = $productos->count() > 1 ? $productos[1] : $prod1;

        $valesData = [
            // Casi todos PAGADO para que los clientes queden libres y permitan crear pre vales
            ['cliente' => 'CLI-COMP-001', 'numero' => 'VALE-COMP-001', 'producto' => $prod1, 'estado' => Vale::ESTADO_PAGADO, 'pagos' => (int) $prod1->numero_quincenas, 'dias_emision' => 180],
            ['cliente' => 'CLI-COMP-002', 'numero' => 'VALE-COMP-002', 'producto' => $prod2, 'estado' => Vale::ESTADO_PAGADO, 'pagos' => (int) $prod2->numero_quincenas, 'dias_emision' => 200],
            ['cliente' => 'CLI-COMP-003', 'numero' => 'VALE-COMP-003', 'producto' => $prod1, 'estado' => Vale::ESTADO_PAGADO, 'pagos' => (int) $prod1->numero_quincenas, 'dias_emision' => 220],
            // Cliente 7: vale CANCELADO (también libre)
            ['cliente' => 'CLI-COMP-007', 'numero' => 'VALE-COMP-004', 'producto' => $prod2, 'estado' => Vale::ESTADO_CANCELADO, 'pagos' => 0, 'dias_emision' => 10],
        ];

        $vales = [];
        foreach ($valesData as $vd) {
            $cliente = $clientes[$vd['cliente']];
            $prod = $vd['producto'];
            $montoPrincipal = (float) $prod->monto_principal;
            $comision = round($montoPrincipal * (float) $prod->porcentaje_comision_empresa / 100, 2);
            $interes = round($montoPrincipal * (float) $prod->porcentaje_interes_quincenal / 100 * (int) $prod->numero_quincenas, 2);
            $seguro = (float) $prod->monto_seguro;
            $totalDeuda = round($montoPrincipal + $comision + $seguro + $interes, 2);
            $quincenal = round($totalDeuda / max(1, (int) $prod->numero_quincenas), 2);
            $saldo = round($totalDeuda - ($vd['pagos'] * $quincenal), 2);
            if ($vd['estado'] === Vale::ESTADO_PAGADO) $saldo = 0;

            $vale = Vale::updateOrCreate(['numero_vale' => $vd['numero']], [
                'distribuidora_id' => $distribuidora->id,
                'cliente_id' => $cliente->id,
                'producto_financiero_id' => $prod->id,
                'sucursal_id' => $sucursal->id,
                'creado_por_usuario_id' => 5,
                'estado' => $vd['estado'],
                'monto' => $montoPrincipal,
                'porcentaje_comision_empresa_snap' => $prod->porcentaje_comision_empresa,
                'monto_comision_empresa' => $comision,
                'monto_seguro_snap' => $seguro,
                'porcentaje_interes_snap' => $prod->porcentaje_interes_quincenal,
                'monto_interes' => $interes,
                'porcentaje_ganancia_dist_snap' => $distribuidora->categoria?->porcentaje_comision ?? 6,
                'monto_ganancia_distribuidora' => round($montoPrincipal * ($distribuidora->categoria?->porcentaje_comision ?? 6) / 100, 2),
                'monto_multa_snap' => $prod->monto_multa_tardia,
                'monto_total_deuda' => $totalDeuda,
                'monto_quincenal' => $quincenal,
                'quincenas_totales' => $prod->numero_quincenas,
                'pagos_realizados' => $vd['pagos'],
                'saldo_actual' => max(0, $saldo),
                'fecha_emision' => now()->subDays($vd['dias_emision']),
                'fecha_limite_pago' => $vd['estado'] === Vale::ESTADO_MOROSO ? now()->subDays(15) : now()->addDays(rand(7, 45)),
                'cancelado' => $vd['estado'] === Vale::ESTADO_CANCELADO,
                'cancelado_en' => $vd['estado'] === Vale::ESTADO_CANCELADO ? now()->subDays(5) : null,
            ]);

            $vales[$vd['numero']] = $vale;
        }

        // =====================================================================
        // 4. CORTES Y RELACIONES DE CORTE (5 estados diferentes)
        // =====================================================================
        $corte = Corte::updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'tipo_corte' => Corte::TIPO_PAGOS, 'fecha_programada' => now()->startOfDay()],
            ['estado' => Corte::ESTADO_EJECUTADO, 'fecha_ejecucion' => now(), 'dia_base_mes' => 14, 'hora_base' => '10:00:00']
        );

        // 8 relaciones: 7 históricas (PAGADA/CERRADA) + 1 GENERADA al final para canje
        $relacionesData = [
            ['numero' => 'REL-COMP-001', 'ref' => 'PFDIST001-A', 'estado' => RelacionCorte::ESTADO_CERRADA, 'total' => 2800, 'comision' => 700, 'recargos' => 0, 'limite_dias' => -180, 'anticipado_inicio' => -183, 'anticipado_fin' => -181],
            ['numero' => 'REL-COMP-002', 'ref' => 'PFDIST001-B', 'estado' => RelacionCorte::ESTADO_CERRADA, 'total' => 3100, 'comision' => 775, 'recargos' => 0, 'limite_dias' => -150, 'anticipado_inicio' => -153, 'anticipado_fin' => -151],
            ['numero' => 'REL-COMP-003', 'ref' => 'PFDIST001-C', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 3600, 'comision' => 900, 'recargos' => 0, 'limite_dias' => -120, 'anticipado_inicio' => -123, 'anticipado_fin' => -121],
            ['numero' => 'REL-COMP-004', 'ref' => 'PFDIST001-D', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 4200, 'comision' => 1050, 'recargos' => 0, 'limite_dias' => -90, 'anticipado_inicio' => -93, 'anticipado_fin' => -91],
            ['numero' => 'REL-COMP-005', 'ref' => 'PFDIST001-E', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 2950, 'comision' => 737, 'recargos' => 0, 'limite_dias' => -60, 'anticipado_inicio' => -63, 'anticipado_fin' => -61],
            ['numero' => 'REL-COMP-006', 'ref' => 'PFDIST001-F', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 3400, 'comision' => 850, 'recargos' => 0, 'limite_dias' => -45, 'anticipado_inicio' => -48, 'anticipado_fin' => -46],
            ['numero' => 'REL-COMP-007', 'ref' => 'PFDIST001-G', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 3800, 'comision' => 950, 'recargos' => 0, 'limite_dias' => -30, 'anticipado_inicio' => -33, 'anticipado_fin' => -31],
            // Única relación pendiente (al final, fecha límite futura)
            ['numero' => 'REL-COMP-008', 'ref' => 'PFDIST001-H', 'estado' => RelacionCorte::ESTADO_GENERADA, 'total' => 4800, 'comision' => 1200, 'recargos' => 0, 'limite_dias' => 10, 'anticipado_inicio' => 7, 'anticipado_fin' => 9],
        ];

        $relaciones = [];
        foreach ($relacionesData as $rd) {
            $relacion = RelacionCorte::updateOrCreate(['numero_relacion' => $rd['numero']], [
                'corte_id' => $corte->id,
                'distribuidora_id' => $distribuidora->id,
                'referencia_pago' => $rd['ref'],
                'fecha_limite_pago' => now()->addDays($rd['limite_dias'])->toDateString(),
                'fecha_inicio_pago_anticipado' => now()->addDays($rd['anticipado_inicio'])->toDateString(),
                'fecha_fin_pago_anticipado' => now()->addDays($rd['anticipado_fin'])->toDateString(),
                'limite_credito_snapshot' => 100000,
                'credito_disponible_snapshot' => rand(60000, 90000),
                'puntos_snapshot' => rand(50, 200),
                'total_comision' => $rd['comision'],
                'total_pago' => $rd['total'] - $rd['comision'] - $rd['recargos'],
                'total_recargos' => $rd['recargos'],
                'total_a_pagar' => $rd['total'],
                'estado' => $rd['estado'],
            ]);
            $relaciones[$rd['numero']] = $relacion;

            // Partidas para cada relación (usar vales activos)
            $valesActivos = collect($vales)->filter(fn ($v) => !in_array($v->estado, [Vale::ESTADO_CANCELADO, Vale::ESTADO_REVERSADO]))->take(3);
            foreach ($valesActivos as $i => $vale) {
                $comPartida = round($rd['comision'] / max(1, $valesActivos->count()), 2);
                $pagoPartida = round(($rd['total'] - $rd['comision'] - $rd['recargos']) / max(1, $valesActivos->count()), 2);
                $recargoPartida = $i === 0 ? $rd['recargos'] : 0;

                PartidaRelacionCorte::updateOrCreate(
                    ['relacion_corte_id' => $relacion->id, 'vale_id' => $vale->id],
                    [
                        'cliente_id' => $vale->cliente_id,
                        'nombre_producto_snapshot' => $vale->productoFinanciero?->nombre ?? 'Producto',
                        'pagos_realizados' => $vale->pagos_realizados,
                        'pagos_totales' => $vale->quincenas_totales,
                        'monto_comision' => $comPartida,
                        'monto_pago' => $pagoPartida,
                        'monto_recargo' => $recargoPartida,
                        'monto_total_linea' => round($comPartida + $pagoPartida + $recargoPartida, 2),
                    ]
                );
            }
        }

        // =====================================================================
        // 5. PAGOS DISTRIBUIDORA — 1 pago por relación pagada (excepto REL-COMP-005 con 7 pagos para probar paginación)
        // =====================================================================
        $relacionesPagadas = ['REL-COMP-001', 'REL-COMP-002', 'REL-COMP-003', 'REL-COMP-004', 'REL-COMP-006', 'REL-COMP-007'];
        foreach ($relacionesPagadas as $i => $numRel) {
            $rel = $relaciones[$numRel];
            $pago = PagoDistribuidora::create([
                'relacion_corte_id' => $rel->id,
                'distribuidora_id' => $distribuidora->id,
                'cuenta_banco_empresa_id' => $cuentaBBVA->id,
                'monto' => $rel->total_a_pagar,
                'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
                'referencia_reportada' => $rel->referencia_pago,
                'fecha_pago' => now()->subDays(180 - ($i * 25)),
                'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
            ]);

            $mov = MovimientoBancario::create([
                'cuenta_banco_empresa_id' => $cuentaBBVA->id,
                'referencia' => $rel->referencia_pago,
                'fecha_movimiento' => now()->subDays(180 - ($i * 25))->toDateString(),
                'hora_movimiento' => '14:30:00',
                'monto' => $rel->total_a_pagar,
                'tipo_movimiento' => 'SPEI',
                'nombre_pagador' => 'DIST-PRUEBA-001',
                'concepto_raw' => "Pago relacion {$numRel}",
            ]);

            Conciliacion::create([
                'pago_distribuidora_id' => $pago->id,
                'movimiento_bancario_id' => $mov->id,
                'conciliado_por_usuario_id' => 4,
                'conciliado_en' => now()->subDays(180 - ($i * 25))->addHours(2),
                'monto_conciliado' => $rel->total_a_pagar,
                'diferencia_monto' => 0,
                'estado' => Conciliacion::ESTADO_CONCILIADA,
            ]);
        }

        // REL-COMP-005: 7 pagos parciales para probar paginación de pagos
        $relConPagos = $relaciones['REL-COMP-005'];
        $montoPorPago = round($relConPagos->total_a_pagar / 7, 2);
        for ($i = 1; $i <= 7; $i++) {
            $pago = PagoDistribuidora::create([
                'relacion_corte_id' => $relConPagos->id,
                'distribuidora_id' => $distribuidora->id,
                'cuenta_banco_empresa_id' => $cuentaBBVA->id,
                'monto' => $montoPorPago,
                'metodo_pago' => $i % 2 === 0 ? PagoDistribuidora::METODO_DEPOSITO : PagoDistribuidora::METODO_TRANSFERENCIA,
                'referencia_reportada' => $relConPagos->referencia_pago . '-P' . $i,
                'fecha_pago' => now()->subDays(70 - $i),
                'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
            ]);

            $mov = MovimientoBancario::create([
                'cuenta_banco_empresa_id' => $cuentaBBVA->id,
                'referencia' => $relConPagos->referencia_pago . '-P' . $i,
                'fecha_movimiento' => now()->subDays(70 - $i)->toDateString(),
                'hora_movimiento' => sprintf('%02d:00:00', 8 + $i),
                'monto' => $montoPorPago,
                'tipo_movimiento' => 'SPEI',
                'nombre_pagador' => 'DIST-PRUEBA-001',
                'concepto_raw' => "Pago parcial {$i}/7 REL-COMP-005",
            ]);

            Conciliacion::create([
                'pago_distribuidora_id' => $pago->id,
                'movimiento_bancario_id' => $mov->id,
                'conciliado_por_usuario_id' => 4,
                'conciliado_en' => now()->subDays(70 - $i)->addHours(1),
                'monto_conciliado' => $montoPorPago,
                'diferencia_monto' => 0,
                'estado' => Conciliacion::ESTADO_CONCILIADA,
            ]);
        }

        // Pago REPORTADO (sin conciliar) en la única relación pendiente REL-COMP-008
        PagoDistribuidora::create([
            'relacion_corte_id' => $relaciones['REL-COMP-008']->id,
            'distribuidora_id' => $distribuidora->id,
            'cuenta_banco_empresa_id' => $cuentaBBVA->id,
            'monto' => 1500,
            'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
            'referencia_reportada' => 'PFDIST001-H',
            'fecha_pago' => now()->subDays(1),
            'estado' => PagoDistribuidora::ESTADO_REPORTADO,
        ]);

        // =====================================================================
        // 6. MOVIMIENTOS DE PUNTOS (historial variado)
        // =====================================================================
        $distribuidora->update(['puntos_actuales' => 210]);

        $puntosData = [
            ['tipo' => MovimientoPunto::TIPO_GANADO_ANTICIPADO, 'pts' => 45, 'motivo' => 'Pago anticipado corte enero 2026', 'dias' => 90],
            ['tipo' => MovimientoPunto::TIPO_GANADO_PUNTUAL, 'pts' => 60, 'motivo' => 'Pago puntual corte enero 2026', 'dias' => 85],
            ['tipo' => MovimientoPunto::TIPO_PENALIZACION_ATRASO, 'pts' => -21, 'motivo' => 'Atraso pago corte febrero 2026 (-20% de 105)', 'dias' => 60],
            ['tipo' => MovimientoPunto::TIPO_GANADO_ANTICIPADO, 'pts' => 30, 'motivo' => 'Pago anticipado corte febrero 2026', 'dias' => 55],
            ['tipo' => MovimientoPunto::TIPO_GANADO_PUNTUAL, 'pts' => 50, 'motivo' => 'Pago puntual corte marzo 2026', 'dias' => 30],
            ['tipo' => MovimientoPunto::TIPO_AJUSTE_MANUAL, 'pts' => 15, 'motivo' => 'Ajuste por error en corte anterior', 'dias' => 25],
            ['tipo' => MovimientoPunto::TIPO_GANADO_ANTICIPADO, 'pts' => 40, 'motivo' => 'Pago anticipado corte marzo 2026', 'dias' => 20],
            ['tipo' => MovimientoPunto::TIPO_PENALIZACION_ATRASO, 'pts' => -44, 'motivo' => 'Atraso pago corte abril 2026 (-20% de 219)', 'dias' => 10],
            ['tipo' => MovimientoPunto::TIPO_GANADO_PUNTUAL, 'pts' => 55, 'motivo' => 'Pago puntual corte abril 2026', 'dias' => 5],
            ['tipo' => MovimientoPunto::TIPO_CANJE, 'pts' => -20, 'motivo' => 'Canje aplicado a REL-COMP-004 (-$40)', 'dias' => 3],
        ];

        $valorPunto = (float) (SucursalConfiguracion::where('sucursal_id', $sucursal->id)->value('valor_punto_mxn') ?? 2);

        foreach ($puntosData as $pd) {
            MovimientoPunto::create([
                'distribuidora_id' => $distribuidora->id,
                'corte_id' => $corte->id,
                'tipo_movimiento' => $pd['tipo'],
                'puntos' => $pd['pts'],
                'valor_punto_snapshot' => $valorPunto,
                'motivo' => $pd['motivo'],
            ]);
        }

        $this->command?->info('Seeder completo: 7 clientes, 4 vales, 8 relaciones (7 históricas + 1 GENERADA), 14 pagos, 10 mov. puntos (210 pts).');
    }
}
