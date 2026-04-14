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
     * Crea 10 vales, uno por cada estado del ciclo:
     * BORRADOR, APROBADO, TRANSFERIDO, ACTIVO, PAGO_PARCIAL, PAGADO,
     * MOROSO, RECLAMADO, CANCELADO, REVERSADO.
     *
     * Los vales con pagos (ACTIVO, PAGO_PARCIAL, PAGADO, MOROSO) generan
     * sus PagoCliente correspondientes.
     *
     * Todos los vales se asignan a la primera distribuidora ACTIVA (Centro, dist1)
     * y a clientes con estado ACTIVO de esa distribuidora.
     */
    public function run(): void
    {
        $distribuidora = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->orderBy('id')
            ->first();

        if (!$distribuidora) {
            $this->command?->warn('No hay distribuidoras ACTIVA. Corre DistribuidorasSeeder primero.');
            return;
        }

        $cajera  = Usuario::where('nombre_usuario', 'cajera')->first();
        $producto = ProductoFinanciero::where('codigo', 'PRESTAMO-8/12000')->first();

        if (!$producto) {
            $this->command?->warn('Producto PRESTAMO-8/12000 no encontrado. Corre ProductosFinancierosSeeder primero.');
            return;
        }

        $clientes = Cliente::where('estado', Cliente::ESTADO_ACTIVO)
            ->whereHas('distribuidoras', fn ($q) => $q->where('distribuidoras.id', $distribuidora->id))
            ->orderBy('id')
            ->take(10)
            ->get();

        if ($clientes->count() < 2) {
            $this->command?->warn('Faltan clientes ACTIVO asociados a la distribuidora. Corre ClientesSeeder primero.');
            return;
        }

        $monto = (float) $producto->monto_principal;
        $quincenas = (int) $producto->numero_quincenas;
        $comisionEmpresa = round($monto * ((float) $producto->porcentaje_comision_empresa / 100), 2);
        $interes = round($monto * ((float) $producto->porcentaje_interes_quincenal / 100) * $quincenas, 2);
        $seguro = (float) $producto->monto_seguro;
        $gananciaDist = round($monto * ((float) ($distribuidora->categoria?->porcentaje_comision ?? 3) / 100), 2);
        $totalDeuda = round($monto + $comisionEmpresa + $seguro + $interes, 2);
        $quincenal = round($totalDeuda / $quincenas, 2);

        $definiciones = [
            [
                'estado' => Vale::ESTADO_BORRADOR,
                'pagos_realizados' => 0,
                'saldo_actual' => $totalDeuda,
                'fecha_emision' => now()->subDays(1),
                'fecha_transferencia' => null,
                'cancelado' => false,
                'pagos' => [],
            ],
            [
                'estado' => Vale::ESTADO_APROBADO,
                'pagos_realizados' => 0,
                'saldo_actual' => $totalDeuda,
                'fecha_emision' => now()->subDays(1),
                'fecha_transferencia' => null,
                'cancelado' => false,
                'pagos' => [],
            ],
            [
                'estado' => Vale::ESTADO_TRANSFERIDO,
                'pagos_realizados' => 0,
                'saldo_actual' => $totalDeuda,
                'fecha_emision' => now()->subDays(2),
                'fecha_transferencia' => now()->subDays(1),
                'cancelado' => false,
                'pagos' => [],
            ],
            [
                'estado' => Vale::ESTADO_ACTIVO,
                'pagos_realizados' => 2,
                'saldo_actual' => round($totalDeuda - ($quincenal * 2), 2),
                'fecha_emision' => now()->subDays(35),
                'fecha_transferencia' => now()->subDays(35),
                'cancelado' => false,
                'pagos' => [2, $quincenal],
            ],
            [
                'estado' => Vale::ESTADO_PAGO_PARCIAL,
                'pagos_realizados' => 3,
                'saldo_actual' => round($totalDeuda - ($quincenal * 3), 2),
                'fecha_emision' => now()->subDays(50),
                'fecha_transferencia' => now()->subDays(50),
                'cancelado' => false,
                'pagos' => [3, $quincenal],
            ],
            [
                'estado' => Vale::ESTADO_PAGADO,
                'pagos_realizados' => $quincenas,
                'saldo_actual' => 0.00,
                'fecha_emision' => now()->subDays(180),
                'fecha_transferencia' => now()->subDays(180),
                'cancelado' => false,
                'pagos' => [$quincenas, $quincenal],
            ],
            [
                'estado' => Vale::ESTADO_MOROSO,
                'pagos_realizados' => 1,
                'saldo_actual' => round($totalDeuda - $quincenal, 2),
                'fecha_emision' => now()->subDays(90),
                'fecha_transferencia' => now()->subDays(90),
                'cancelado' => false,
                'pagos' => [1, $quincenal],
            ],
            [
                'estado' => Vale::ESTADO_RECLAMADO,
                'pagos_realizados' => 0,
                'saldo_actual' => $totalDeuda,
                'fecha_emision' => now()->subDays(30),
                'fecha_transferencia' => now()->subDays(30),
                'cancelado' => false,
                'motivo_reclamo' => 'Cliente reporta no haber recibido transferencia completa.',
                'pagos' => [],
            ],
            [
                'estado' => Vale::ESTADO_CANCELADO,
                'pagos_realizados' => 0,
                'saldo_actual' => $totalDeuda,
                'fecha_emision' => now()->subDays(5),
                'fecha_transferencia' => null,
                'cancelado' => true,
                'cancelado_en' => now()->subDays(5),
                'notas' => 'Cancelado por distribuidora antes de transferencia.',
                'pagos' => [],
            ],
            [
                'estado' => Vale::ESTADO_REVERSADO,
                'pagos_realizados' => 1,
                'saldo_actual' => round($totalDeuda - $quincenal, 2),
                'fecha_emision' => now()->subDays(40),
                'fecha_transferencia' => now()->subDays(40),
                'cancelado' => true,
                'cancelado_en' => now()->subDays(10),
                'notas' => 'Vale reversado por ajuste contable.',
                'pagos' => [1, $quincenal],
            ],
        ];

        foreach ($definiciones as $i => $d) {
            $cliente = $clientes[$i % $clientes->count()];
            $numeroVale = 'VALE-' . now()->format('ymd') . '-' . strtoupper(substr(md5("seed-{$i}"), 0, 6));

            $vale = Vale::updateOrCreate(
                ['numero_vale' => $numeroVale],
                [
                    'distribuidora_id'                 => $distribuidora->id,
                    'cliente_id'                       => $cliente->id,
                    'producto_financiero_id'           => $producto->id,
                    'sucursal_id'                      => $distribuidora->sucursal_id,
                    'creado_por_usuario_id'            => $distribuidora->persona->usuario?->id ?? null,
                    'aprobado_por_usuario_id'          => in_array($d['estado'], [Vale::ESTADO_BORRADOR, Vale::ESTADO_CANCELADO], true) ? null : $cajera?->id,
                    'estado'                           => $d['estado'],
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
                    'pagos_realizados'                 => $d['pagos_realizados'],
                    'saldo_actual'                     => $d['saldo_actual'],
                    'fecha_emision'                    => $d['fecha_emision'],
                    'fecha_transferencia'              => $d['fecha_transferencia'],
                    'fecha_limite_pago'                => $d['fecha_emision']->copy()->addDays($quincenas * 15),
                    'fecha_inicio_pago_anticipado'     => $d['fecha_emision']->copy()->addDays(($quincenas - 2) * 15),
                    'fecha_fin_pago_anticipado'        => $d['fecha_emision']->copy()->addDays($quincenas * 15),
                    'motivo_reclamo'                   => $d['motivo_reclamo'] ?? null,
                    'cancelado'                        => $d['cancelado'],
                    'cancelado_en'                     => $d['cancelado_en'] ?? null,
                    'notas'                            => $d['notas'] ?? null,
                ]
            );

            // Crear pagos cliente si aplica
            if (!empty($d['pagos'])) {
                [$cantidadPagos, $montoPorPago] = $d['pagos'];
                for ($p = 1; $p <= $cantidadPagos; $p++) {
                    PagoCliente::updateOrCreate(
                        [
                            'vale_id'    => $vale->id,
                            'fecha_pago' => $d['fecha_emision']->copy()->addDays($p * 15),
                        ],
                        [
                            'cliente_id'             => $cliente->id,
                            'distribuidora_id'       => $distribuidora->id,
                            'cobrado_por_usuario_id' => null,
                            'monto'                  => $montoPorPago,
                            'metodo_pago'            => PagoCliente::METODO_EFECTIVO,
                            'es_parcial'             => false,
                            'afecta_puntos'          => $d['estado'] !== Vale::ESTADO_MOROSO,
                            'notas'                  => 'Pago generado por seeder',
                            'creado_en'              => $d['fecha_emision']->copy()->addDays($p * 15),
                        ]
                    );
                }
            }
        }

        $this->command?->info('10 vales creados (1 por cada estado del ciclo) con sus pagos cliente correspondientes.');
    }
}
