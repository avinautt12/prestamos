<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\Sucursal;
use App\Models\Vale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DistribuidoraCompletaPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = CategoriaDistribuidora::query()->orderBy('id')->get()->values();
        $productos = ProductoFinanciero::query()->orderBy('id')->get()->values();
        $sucursales = Sucursal::query()->orderBy('codigo')->get()->values();

        foreach ($sucursales as $branchIndex => $sucursal) {
            foreach ([['suffix' => 'A', 'estado' => Distribuidora::ESTADO_ACTIVA], ['suffix' => 'B', 'estado' => Distribuidora::ESTADO_MOROSA]] as $secIndex => $secundaria) {
                $persona = Persona::updateOrCreate(
                    ['correo_electronico' => 'dist.' . strtolower($sucursal->codigo) . '.' . $secundaria['suffix'] . '@demo.local'],
                    [
                        'primer_nombre' => 'Distribuidora',
                        'apellido_paterno' => $sucursal->codigo,
                        'apellido_materno' => $secundaria['suffix'],
                        'sexo' => $secIndex % 2 === 0 ? 'F' : 'M',
                        'curp' => $this->curpPrueba('DIST', $branchIndex + 1, $secIndex),
                        'rfc' => $this->rfcPrueba('DIST', $branchIndex + 1, $secIndex),
                        'telefono_celular' => '8719' . $branchIndex . $secIndex . '5500',
                        'correo_electronico' => 'dist.' . strtolower($sucursal->codigo) . '.' . $secundaria['suffix'] . '@demo.local',
                        'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                        'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                        'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $categoria = $categorias->count() ? $categorias[($branchIndex + $secIndex) % $categorias->count()] : null;

                $distribuidora = Distribuidora::updateOrCreate(
                    ['numero_distribuidora' => 'DIST-' . strtoupper(substr($sucursal->codigo, 4, 3)) . '-SEC-' . $secundaria['suffix']],
                    [
                        'persona_id' => $persona->id,
                        'sucursal_id' => $sucursal->id,
                        'categoria_id' => $categoria?->id,
                        'numero_distribuidora' => 'DIST-' . strtoupper(substr($sucursal->codigo, 4, 3)) . '-SEC-' . $secundaria['suffix'],
                        'estado' => $secundaria['estado'],
                        'limite_credito' => $secundaria['estado'] === Distribuidora::ESTADO_ACTIVA ? 80000 : 95000,
                        'credito_disponible' => $secundaria['estado'] === Distribuidora::ESTADO_ACTIVA ? 42000 : 12000,
                        'sin_limite' => false,
                        'puntos_actuales' => 50 + ($branchIndex * 10) + ($secIndex * 5),
                        'puede_emitir_vales' => true,
                        'es_externa' => false,
                        'activada_en' => now()->subDays(20 + ($branchIndex * 5)),
                    ]
                );

                $clientesCreados = [];

                for ($clienteIndex = 1; $clienteIndex <= 3; $clienteIndex++) {
                    $personaCliente = Persona::updateOrCreate(
                        ['correo_electronico' => 'cli.' . strtolower($distribuidora->numero_distribuidora) . '.' . $clienteIndex . '@demo.local'],
                        [
                            'primer_nombre' => 'Cliente ' . $clienteIndex,
                            'apellido_paterno' => $sucursal->codigo,
                            'apellido_materno' => $secundaria['suffix'],
                            'sexo' => $clienteIndex % 2 === 0 ? 'F' : 'M',
                            'curp' => $this->curpPrueba('CLI' . $secundaria['suffix'], $branchIndex + 1, $clienteIndex + 10),
                            'rfc' => $this->rfcPrueba('CLI' . $secundaria['suffix'], $branchIndex + 1, $clienteIndex + 10),
                            'telefono_celular' => '8718' . $branchIndex . $clienteIndex . '4400',
                            'correo_electronico' => 'cli.' . strtolower($distribuidora->numero_distribuidora) . '.' . $clienteIndex . '@demo.local',
                            'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                            'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                            'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                            'creado_en' => now(),
                            'actualizado_en' => now(),
                        ]
                    );

                    $codigoCliente = 'CL-' . strtoupper($distribuidora->numero_distribuidora) . '-' . $clienteIndex;
                    $cliente = Cliente::query()
                        ->where('persona_id', $personaCliente->id)
                        ->orWhere('codigo_cliente', $codigoCliente)
                        ->first();

                    if (!$cliente) {
                        $cliente = new Cliente();
                    }

                    $cliente->fill([
                        'persona_id' => $personaCliente->id,
                        'codigo_cliente' => $codigoCliente,
                        'estado' => $clienteIndex === 3 && $secundaria['estado'] === Distribuidora::ESTADO_MOROSA ? 'MOROSO' : 'ACTIVO',
                        'notas' => 'Cliente demo para ' . $distribuidora->numero_distribuidora,
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]);
                    $cliente->save();

                    DB::table('clientes_distribuidora')->updateOrInsert(
                        ['distribuidora_id' => $distribuidora->id, 'cliente_id' => $cliente->id],
                        [
                            'estado_relacion' => $clienteIndex === 3 ? 'BLOQUEADA' : 'ACTIVA',
                            'bloqueado_por_parentesco' => $clienteIndex === 3,
                            'observaciones_parentesco' => $clienteIndex === 3 ? 'Pariente directo para prueba de bloqueo' : null,
                            'vinculado_en' => now()->subDays(15 - $clienteIndex),
                            'desvinculado_en' => null,
                        ]
                    );

                    $clientesCreados[] = $cliente->id;
                }

                $this->crearValesDemo($distribuidora, $sucursal, $productos, $clientesCreados, $branchIndex, $secIndex);
            }
        }

        $this->command?->info('Distribuidoras secundarias, clientes y vales demo creados por sucursal.');
    }

    private function crearValesDemo(Distribuidora $distribuidora, Sucursal $sucursal, $productos, array $clienteIds, int $branchIndex, int $secIndex): void
    {
        $clientes = Cliente::query()->whereIn('id', $clienteIds)->orderBy('id')->get();

        foreach ($clientes as $clienteIndex => $cliente) {
            $producto = $productos->count() ? $productos[($branchIndex + $secIndex + $clienteIndex) % $productos->count()] : null;
            if (!$producto) {
                continue;
            }

            $principal = 7000 + ($branchIndex * 1500) + ($clienteIndex * 800);
            $comision = round($principal * ((float) $producto->porcentaje_comision_empresa / 100), 2);
            $seguro = (float) $producto->monto_seguro;
            $interes = round($principal * ((float) $producto->porcentaje_interes_quincenal / 100) * (int) $producto->numero_quincenas, 2);
            $multa = (float) $producto->monto_multa_tardia;
            $total = round($principal + $comision + $seguro + $interes + $multa, 2);
            $estado = $clienteIndex === 0 ? Vale::ESTADO_ACTIVO : ($clienteIndex === 1 ? Vale::ESTADO_PAGO_PARCIAL : ($distribuidora->estado === Distribuidora::ESTADO_MOROSA ? Vale::ESTADO_MOROSO : Vale::ESTADO_PAGADO));
            $saldo = $estado === Vale::ESTADO_PAGADO ? 0 : round($total - ($clienteIndex === 1 ? ($total * 0.45) : ($total * 0.2)), 2);

            Vale::updateOrCreate(
                ['numero_vale' => 'VALE-' . substr($distribuidora->numero_distribuidora, -8) . '-' . ($clienteIndex + 1)],
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id' => $cliente->id,
                    'producto_financiero_id' => $producto->id,
                    'sucursal_id' => $sucursal->id,
                    'estado' => $estado,
                    'monto' => $principal,
                    'porcentaje_comision_empresa_snap' => $producto->porcentaje_comision_empresa,
                    'monto_comision_empresa' => $comision,
                    'monto_seguro_snap' => $seguro,
                    'porcentaje_interes_snap' => $producto->porcentaje_interes_quincenal,
                    'monto_interes' => $interes,
                    'porcentaje_ganancia_dist_snap' => $distribuidora->categoria?->porcentaje_comision ?? 6,
                    'monto_ganancia_distribuidora' => round($principal * (($distribuidora->categoria?->porcentaje_comision ?? 6) / 100), 2),
                    'monto_multa_snap' => $multa,
                    'monto_total_deuda' => $total,
                    'monto_quincenal' => round($total / max(1, (int) $producto->numero_quincenas), 2),
                    'quincenas_totales' => (int) $producto->numero_quincenas,
                    'pagos_realizados' => $estado === Vale::ESTADO_PAGADO ? (int) $producto->numero_quincenas : ($estado === Vale::ESTADO_PAGO_PARCIAL ? 3 : 1),
                    'saldo_actual' => $saldo,
                    'fecha_emision' => now()->subDays(30 + ($clienteIndex * 3)),
                    'fecha_limite_pago' => now()->addDays(10 + ($clienteIndex * 5)),
                    'creado_por_usuario_id' => null,
                    'aprobado_por_usuario_id' => null,
                    'motivo_reclamo' => null,
                    'cancelado' => false,
                ]
            );
        }
    }

    private function curpPrueba(string $rol, int $sucursal, int $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . 'G' . substr($base, 0, 1) . '26X';
        return substr(str_pad($seed, 18, 'X'), 0, 18);
    }

    private function rfcPrueba(string $rol, int $sucursal, int $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . 'B';
        return substr(str_pad($seed, 13, 'X'), 0, 13);
    }
}
