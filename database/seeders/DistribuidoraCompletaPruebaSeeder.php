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
            // Cliente 1: vale ACTIVO (con pagos parciales)
            ['cliente' => 'CLI-COMP-001', 'numero' => 'VALE-COMP-001', 'producto' => $prod1, 'estado' => Vale::ESTADO_ACTIVO, 'pagos' => 3, 'dias_emision' => 60],
            // Cliente 2: vale PAGO_PARCIAL
            ['cliente' => 'CLI-COMP-002', 'numero' => 'VALE-COMP-002', 'producto' => $prod2, 'estado' => Vale::ESTADO_PAGO_PARCIAL, 'pagos' => 5, 'dias_emision' => 90],
            // Cliente 3: vale PAGADO (libre para nuevo vale)
            ['cliente' => 'CLI-COMP-003', 'numero' => 'VALE-COMP-003', 'producto' => $prod1, 'estado' => Vale::ESTADO_PAGADO, 'pagos' => (int) $prod1->numero_quincenas, 'dias_emision' => 180],
            // Cliente 6: vale MOROSO
            ['cliente' => 'CLI-COMP-006', 'numero' => 'VALE-COMP-004', 'producto' => $prod1, 'estado' => Vale::ESTADO_MOROSO, 'pagos' => 1, 'dias_emision' => 120],
            // Cliente 7: vale CANCELADO
            ['cliente' => 'CLI-COMP-007', 'numero' => 'VALE-COMP-005', 'producto' => $prod2, 'estado' => Vale::ESTADO_CANCELADO, 'pagos' => 0, 'dias_emision' => 10],
            // Cliente 1: segundo vale BORRADOR (reciente)
            ['cliente' => 'CLI-COMP-001', 'numero' => 'VALE-COMP-006', 'producto' => $prod2, 'estado' => Vale::ESTADO_BORRADOR, 'pagos' => 0, 'dias_emision' => 1],
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

        $relacionesData = [
            ['numero' => 'REL-COMP-001', 'ref' => 'PFDIST001-A', 'estado' => RelacionCorte::ESTADO_GENERADA, 'total' => 4800, 'comision' => 1200, 'recargos' => 300, 'limite_dias' => 7, 'anticipado_inicio' => 4, 'anticipado_fin' => 6],
            ['numero' => 'REL-COMP-002', 'ref' => 'PFDIST001-B', 'estado' => RelacionCorte::ESTADO_PARCIAL, 'total' => 3200, 'comision' => 800, 'recargos' => 0, 'limite_dias' => 5, 'anticipado_inicio' => 2, 'anticipado_fin' => 4],
            ['numero' => 'REL-COMP-003', 'ref' => 'PFDIST001-C', 'estado' => RelacionCorte::ESTADO_VENCIDA, 'total' => 5600, 'comision' => 1400, 'recargos' => 600, 'limite_dias' => -10, 'anticipado_inicio' => -13, 'anticipado_fin' => -11],
            ['numero' => 'REL-COMP-004', 'ref' => 'PFDIST001-D', 'estado' => RelacionCorte::ESTADO_PAGADA, 'total' => 3600, 'comision' => 900, 'recargos' => 0, 'limite_dias' => -30, 'anticipado_inicio' => -33, 'anticipado_fin' => -31],
            ['numero' => 'REL-COMP-005', 'ref' => 'PFDIST001-E', 'estado' => RelacionCorte::ESTADO_CERRADA, 'total' => 2800, 'comision' => 700, 'recargos' => 0, 'limite_dias' => -60, 'anticipado_inicio' => -63, 'anticipado_fin' => -61],
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
        // 5. PAGOS DISTRIBUIDORA (diferentes estados)
        // =====================================================================
        // Pago CONCILIADO para relación PAGADA
        $pagoConciliado = PagoDistribuidora::create([
            'relacion_corte_id' => $relaciones['REL-COMP-004']->id,
            'distribuidora_id' => $distribuidora->id,
            'cuenta_banco_empresa_id' => $cuentaBBVA->id,
            'monto' => 3600, 'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
            'referencia_reportada' => 'PFDIST001-D', 'fecha_pago' => now()->subDays(28),
            'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
        ]);

        $movBancario = MovimientoBancario::create([
            'cuenta_banco_empresa_id' => $cuentaBBVA->id,
            'referencia' => 'PFDIST001-D', 'fecha_movimiento' => now()->subDays(28)->toDateString(),
            'hora_movimiento' => '14:30:00', 'monto' => 3600,
            'tipo_movimiento' => 'SPEI', 'nombre_pagador' => 'DIST-PRUEBA-001',
            'concepto_raw' => 'Pago relacion REL-COMP-004',
        ]);

        Conciliacion::create([
            'pago_distribuidora_id' => $pagoConciliado->id,
            'movimiento_bancario_id' => $movBancario->id,
            'conciliado_por_usuario_id' => 4,
            'conciliado_en' => now()->subDays(27),
            'monto_conciliado' => 3600, 'diferencia_monto' => 0,
            'estado' => Conciliacion::ESTADO_CONCILIADA,
        ]);

        // Pago REPORTADO para relación PARCIAL
        PagoDistribuidora::create([
            'relacion_corte_id' => $relaciones['REL-COMP-002']->id,
            'distribuidora_id' => $distribuidora->id,
            'cuenta_banco_empresa_id' => $cuentaBBVA->id,
            'monto' => 1500, 'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
            'referencia_reportada' => 'PFDIST001-B', 'fecha_pago' => now()->subDays(3),
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

        $valorPunto = (float) ($distribuidora->categoria?->valor_punto ?? 2);

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

        $this->command?->info('Seeder completo: 7 clientes, 6 vales, 5 relaciones, pagos, conciliaciones, 10 mov. puntos (210 pts).');
    }
}
