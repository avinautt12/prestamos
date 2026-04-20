<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\PagoCliente;
use App\Models\ProductoFinanciero;
use App\Models\Usuario;
use App\Models\Vale;
use Illuminate\Database\Seeder;

class ValesSeeder extends Seeder
{
    /**
     * Por cada distribuidora ACTIVA:
     *   - Toma todos sus clientes (2–3 según ClientesSeeder).
     *   - El primer cliente recibe un vale en estado ACTIVO (sin pagos, saldo completo).
     *   - Los clientes restantes reciben un vale LIQUIDADO (todas las quincenas pagadas).
     *
     * Resultado total aprox: 4 vales ACTIVOS + 6 LIQUIDADOS = 10 vales.
     * Los vales LIQUIDADOS generan sus PagoCliente históricos para llenar el histórico
     * en la UI de la distribuidora.
     */
    public function run(): void
    {
        $distribuidorasActivas = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->orderBy('id')
            ->get();

        if ($distribuidorasActivas->isEmpty()) {
            $this->command?->warn('No hay distribuidoras ACTIVA. Corre DistribuidorasSeeder primero.');
            return;
        }

        $producto = ProductoFinanciero::where('codigo', 'PRESTAMO-8/12000')->first();
        if (!$producto) {
            $this->command?->warn('Producto PRESTAMO-8/12000 no encontrado. Corre ProductosFinancierosSeeder primero.');
            return;
        }

        $totalVales = 0;
        $totalActivos = 0;
        $totalLiquidados = 0;
        $seedSeq = 0;

        foreach ($distribuidorasActivas as $distribuidora) {
            $cajera = Usuario::where('canal_login', 'WEB')
                ->whereHas('roles', fn ($q) => $q->where('codigo', 'CAJERA'))
                ->whereHas('sucursales', fn ($q) => $q->where('sucursales.id', $distribuidora->sucursal_id))
                ->first();

            $clientes = Cliente::where('estado', Cliente::ESTADO_ACTIVO)
                ->whereHas('distribuidoras', fn ($q) => $q->where('distribuidoras.id', $distribuidora->id))
                ->orderBy('id')
                ->get();

            if ($clientes->isEmpty()) {
                continue;
            }

            $monto = (float) $producto->monto_principal;
            $quincenas = (int) $producto->numero_quincenas;
            $comisionEmpresa = round($monto * ((float) $producto->porcentaje_comision_empresa / 100), 2);
            $interes = round($monto * ((float) $producto->porcentaje_interes_quincenal / 100) * $quincenas, 2);
            $seguro = (float) $producto->monto_seguro;
            $gananciaDist = round($monto * ((float) ($distribuidora->categoria?->porcentaje_comision ?? 3) / 100), 2);
            $totalDeuda = round($monto + $comisionEmpresa + $seguro + $interes, 2);
            $quincenal = round($totalDeuda / $quincenas, 2);

            foreach ($clientes as $i => $cliente) {
                $esActivo = ($i === 0);
                $seedSeq++;
                $numeroVale = 'VALE-' . now()->format('ymd') . '-' . strtoupper(substr(md5("seed-{$distribuidora->id}-{$cliente->id}-{$seedSeq}"), 0, 6));

                if ($esActivo) {
                    $estado = Vale::ESTADO_ACTIVO;
                    $saldo = $totalDeuda;
                    $pagosRealizados = 0;
                    $fechaEmision = now()->subDays(7);
                    $fechaTransferencia = now()->subDays(7);
                } else {
                    $estado = Vale::ESTADO_LIQUIDADO;
                    $saldo = 0.00;
                    $pagosRealizados = $quincenas;
                    $fechaEmision = now()->subDays(180);
                    $fechaTransferencia = now()->subDays(180);
                }

                $vale = Vale::updateOrCreate(
                    ['numero_vale' => $numeroVale],
                    [
                        'distribuidora_id'                 => $distribuidora->id,
                        'cliente_id'                       => $cliente->id,
                        'producto_financiero_id'           => $producto->id,
                        'sucursal_id'                      => $distribuidora->sucursal_id,
                        'creado_por_usuario_id'            => $distribuidora->persona->usuario?->id ?? null,
                        'aprobado_por_usuario_id'          => $cajera?->id,
                        'estado'                           => $estado,
                        'monto'                            => $monto,
                        'porcentaje_comision_empresa_snap' => $producto->porcentaje_comision_empresa,
                        'monto_comision_empresa'           => $comisionEmpresa,
                        'monto_seguro_snap'                => $seguro,
                        'porcentaje_interes_snap'          => $producto->porcentaje_interes_quincenal,
                        'monto_interes'                    => $interes,
                        'porcentaje_ganancia_dist_snap'    => $distribuidora->categoria?->porcentaje_comision ?? 3,
                        'monto_ganancia_distribuidora'     => $gananciaDist,
                        'monto_multa_snap'                 => $producto->monto_multa_tardia,
                        'monto_total_deuda'                => $totalDeuda,
                        'monto_quincenal'                  => $quincenal,
                        'quincenas_totales'                => $quincenas,
                        'pagos_realizados'                 => $pagosRealizados,
                        'saldo_actual'                     => $saldo,
                        'fecha_emision'                    => $fechaEmision,
                        'fecha_transferencia'              => $fechaTransferencia,
                        'fecha_limite_pago'                => $fechaEmision->copy()->addDays($quincenas * 15),
                        'fecha_inicio_pago_anticipado'     => $fechaEmision->copy()->addDays(max(0, ($quincenas - 2) * 15)),
                        'fecha_fin_pago_anticipado'        => $fechaEmision->copy()->addDays($quincenas * 15),
                        'motivo_reclamo'                   => null,
                        'cancelado'                        => false,
                        'cancelado_en'                     => null,
                        'notas'                            => null,
                    ]
                );

                // Pagos cliente sólo para LIQUIDADOS (historial completo)
                if (!$esActivo) {
                    for ($p = 1; $p <= $quincenas; $p++) {
                        PagoCliente::updateOrCreate(
                            [
                                'vale_id'    => $vale->id,
                                'fecha_pago' => $fechaEmision->copy()->addDays($p * 15),
                            ],
                            [
                                'cliente_id'             => $cliente->id,
                                'distribuidora_id'       => $distribuidora->id,
                                'cobrado_por_usuario_id' => null,
                                'monto'                  => $quincenal,
                                'metodo_pago'            => PagoCliente::METODO_EFECTIVO,
                                'es_parcial'             => false,
                                'afecta_puntos'          => true,
                                'notas'                  => 'Pago generado por seeder (vale liquidado)',
                                'creado_en'              => $fechaEmision->copy()->addDays($p * 15),
                            ]
                        );
                    }
                }

                $totalVales++;
                if ($esActivo) {
                    $totalActivos++;
                } else {
                    $totalLiquidados++;
                }
            }
        }

        $this->command?->info("{$totalVales} vales creados: {$totalActivos} ACTIVO + {$totalLiquidados} LIQUIDADO.");
    }
}
