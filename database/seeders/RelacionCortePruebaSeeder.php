<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Corte;
use App\Models\CuentaBancaria;
use App\Models\Distribuidora;
use App\Models\PartidaRelacionCorte;
use App\Models\ProductoFinanciero;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\Vale;
use Illuminate\Database\Seeder;

class RelacionCortePruebaSeeder extends Seeder
{
    public function run(): void
    {
        $distribuidora = Distribuidora::where('numero_distribuidora', 'DIST-PRUEBA-001')->first();

        if (!$distribuidora) {
            $this->command?->warn('No se encontró la distribuidora de prueba.');
            return;
        }

        $sucursal = $distribuidora->sucursal ?? Sucursal::first();
        $clientes = Cliente::whereHas('distribuidoras', fn ($q) => $q->where('distribuidora_id', $distribuidora->id))->get();

        if ($clientes->isEmpty()) {
            $this->command?->warn('No hay clientes ligados a la distribuidora de prueba.');
            return;
        }

        $producto = ProductoFinanciero::where('activo', true)->first();

        // Crear cuentas bancarias de la empresa
        CuentaBancaria::updateOrCreate(
            ['tipo_propietario' => CuentaBancaria::TIPO_EMPRESA, 'clabe' => '002115016003241108'],
            [
                'propietario_id' => 1,
                'banco' => 'BBVA',
                'nombre_titular' => 'Prestamo Fácil SA de CV',
                'numero_cuenta_mascarado' => '****2411',
                'convenio' => '1628789',
                'referencia_base' => 'PFBBVA',
                'es_principal' => true,
            ]
        );

        CuentaBancaria::updateOrCreate(
            ['tipo_propietario' => CuentaBancaria::TIPO_EMPRESA, 'clabe' => '147878941962371005'],
            [
                'propietario_id' => 1,
                'banco' => 'BANORTE',
                'nombre_titular' => 'Prestamo Fácil SA de CV',
                'numero_cuenta_mascarado' => '****3710',
                'convenio' => '57148',
                'referencia_base' => 'PFBNRT',
                'es_principal' => false,
            ]
        );

        // Crear corte para la sucursal matriz
        $corte = Corte::updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'tipo_corte' => Corte::TIPO_PAGOS, 'fecha_programada' => now()->startOfDay()],
            [
                'estado' => Corte::ESTADO_EJECUTADO,
                'fecha_ejecucion' => now(),
                'dia_base_mes' => 14,
                'hora_base' => '10:00:00',
            ]
        );

        // Crear vales activos solo para los primeros 2 clientes (el 3ro queda libre para probar pre vale)
        $clientesConVale = $clientes->take(2);
        $vales = [];
        foreach ($clientesConVale as $index => $cliente) {
            $vales[] = Vale::updateOrCreate(
                ['numero_vale' => 'VALE-CORTE-PRUEBA-' . ($index + 1)],
                [
                    'distribuidora_id'                 => $distribuidora->id,
                    'cliente_id'                       => $cliente->id,
                    'producto_financiero_id'           => $producto->id,
                    'sucursal_id'                      => $sucursal->id,
                    'creado_por_usuario_id'            => 5,
                    'estado'                           => Vale::ESTADO_ACTIVO,
                    'porcentaje_comision_empresa_snap' => $producto->porcentaje_comision_empresa,
                    'monto_comision_empresa'           => round((float) $producto->monto_principal * (float) $producto->porcentaje_comision_empresa / 100, 2),
                    'monto_seguro_snap'                => $producto->monto_seguro,
                    'porcentaje_interes_snap'          => $producto->porcentaje_interes_quincenal,
                    'monto_interes'                    => round((float) $producto->monto_principal * (float) $producto->porcentaje_interes_quincenal / 100 * (int) $producto->numero_quincenas, 2),
                    'porcentaje_ganancia_dist_snap'    => 6.0000,
                    'monto_ganancia_distribuidora'     => round((float) $producto->monto_principal * 6 / 100, 2),
                    'monto_multa_snap'                 => $producto->monto_multa_tardia,
                    'monto_total_deuda'                => round((float) $producto->monto_principal * 1.15, 2),
                    'monto_quincenal'                  => round((float) $producto->monto_principal * 1.15 / (int) $producto->numero_quincenas, 2),
                    'quincenas_totales'                => $producto->numero_quincenas,
                    'pagos_realizados'                 => $index + 1,
                    'saldo_actual'                     => round((float) $producto->monto_principal * 1.15 - (($index + 1) * (float) $producto->monto_principal * 1.15 / (int) $producto->numero_quincenas), 2),
                    'fecha_emision'                    => now()->subDays(30),
                ]
            );
        }

        // Relación 1: GENERADA (pendiente de pago)
        $relacion1 = RelacionCorte::updateOrCreate(
            ['numero_relacion' => 'REL-PRUEBA-2026-001'],
            [
                'corte_id'                      => $corte->id,
                'distribuidora_id'              => $distribuidora->id,
                'referencia_pago'               => 'PFDIST001260414',
                'fecha_limite_pago'             => now()->addDays(7)->toDateString(),
                'fecha_inicio_pago_anticipado'  => now()->addDays(4)->toDateString(),
                'fecha_fin_pago_anticipado'     => now()->addDays(6)->toDateString(),
                'limite_credito_snapshot'       => 100000.00,
                'credito_disponible_snapshot'   => 76000.00,
                'puntos_snapshot'               => 24,
                'total_comision'                => 1200.00,
                'total_pago'                    => 4800.00,
                'total_recargos'                => 300.00,
                'total_a_pagar'                 => 4800.00,
                'estado'                        => RelacionCorte::ESTADO_GENERADA,
            ]
        );

        // Partidas para relación 1
        foreach ($vales as $index => $vale) {
            $comision = round((float) $vale->monto_comision_empresa / max(1, (int) $vale->quincenas_totales), 2);
            $pago = (float) $vale->monto_quincenal;
            $recargo = $index === 2 ? 300.00 : 0.00;

            PartidaRelacionCorte::updateOrCreate(
                ['relacion_corte_id' => $relacion1->id, 'vale_id' => $vale->id],
                [
                    'cliente_id'              => $vale->cliente_id,
                    'nombre_producto_snapshot' => $producto->nombre,
                    'pagos_realizados'        => $vale->pagos_realizados,
                    'pagos_totales'           => $vale->quincenas_totales,
                    'monto_comision'          => $comision,
                    'monto_pago'              => $pago,
                    'monto_recargo'           => $recargo,
                    'monto_total_linea'       => round($comision + $pago + $recargo, 2),
                ]
            );
        }

        // Relación 2: PAGADA (histórica)
        $relacion2 = RelacionCorte::updateOrCreate(
            ['numero_relacion' => 'REL-PRUEBA-2026-002'],
            [
                'corte_id'                      => $corte->id,
                'distribuidora_id'              => $distribuidora->id,
                'referencia_pago'               => 'PFDIST001260328',
                'fecha_limite_pago'             => now()->subDays(14)->toDateString(),
                'fecha_inicio_pago_anticipado'  => now()->subDays(17)->toDateString(),
                'fecha_fin_pago_anticipado'     => now()->subDays(15)->toDateString(),
                'limite_credito_snapshot'       => 100000.00,
                'credito_disponible_snapshot'   => 82000.00,
                'puntos_snapshot'               => 18,
                'total_comision'                => 900.00,
                'total_pago'                    => 3600.00,
                'total_recargos'                => 0.00,
                'total_a_pagar'                 => 3600.00,
                'estado'                        => RelacionCorte::ESTADO_PAGADA,
            ]
        );

        // Partidas para relación 2 (pagada, sin recargos)
        foreach ($vales as $index => $vale) {
            $comision = round((float) $vale->monto_comision_empresa / max(1, (int) $vale->quincenas_totales), 2);
            $pago = (float) $vale->monto_quincenal;

            PartidaRelacionCorte::updateOrCreate(
                ['relacion_corte_id' => $relacion2->id, 'vale_id' => $vale->id],
                [
                    'cliente_id'              => $vale->cliente_id,
                    'nombre_producto_snapshot' => $producto->nombre,
                    'pagos_realizados'        => $vale->pagos_realizados,
                    'pagos_totales'           => $vale->quincenas_totales,
                    'monto_comision'          => $comision,
                    'monto_pago'              => $pago,
                    'monto_recargo'           => 0.00,
                    'monto_total_linea'       => round($comision + $pago, 2),
                ]
            );
        }

        $this->command?->info('2 relaciones de corte con partidas creadas para distribuidora de prueba.');
    }
}
