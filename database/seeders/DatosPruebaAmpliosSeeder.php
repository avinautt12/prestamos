<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use Illuminate\Database\Seeder;

class DatosPruebaAmpliosSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = CategoriaDistribuidora::query()->orderBy('id')->get()->values();
        $productos = ProductoFinanciero::query()->orderBy('id')->get()->values();
        $sucursales = Sucursal::query()->orderBy('codigo')->get()->values();

        foreach ($sucursales as $index => $sucursal) {
            $categoriaOverrides = [];
            foreach ($categorias as $catIndex => $categoria) {
                $categoriaOverrides[(string) $categoria->id] = [
                    'nombre' => $categoria->nombre,
                    'porcentaje_comision' => round((float) $categoria->porcentaje_comision + ($index * 0.35) - ($catIndex * 0.1), 4),
                ];
            }

            $productoOverrides = [];
            foreach ($productos as $producto) {
                $productoOverrides[(string) $producto->id] = [
                    'monto_principal' => (float) $producto->monto_principal,
                    'monto_seguro' => round((float) $producto->monto_seguro + ($index * 15), 2),
                    'porcentaje_comision_empresa' => round((float) $producto->porcentaje_comision_empresa + ($index * 0.15), 4),
                    'porcentaje_interes_quincenal' => round((float) $producto->porcentaje_interes_quincenal + ($index * 0.05), 4),
                    'numero_quincenas' => (int) $producto->numero_quincenas,
                ];
            }

            SucursalConfiguracion::updateOrCreate(
                ['sucursal_id' => $sucursal->id],
                [
                    'dia_corte' => 10 + $index,
                    'hora_corte' => '18:00:00',
                    'frecuencia_pago_dias' => 14,
                    'plazo_pago_dias' => 15,
                    'linea_credito_default' => 25000 + ($index * 7500),
                    'seguro_tabuladores_json' => [
                        ['desde' => 0, 'hasta' => 10000, 'monto' => 120],
                        ['desde' => 10001, 'hasta' => 25000, 'monto' => 220],
                        ['desde' => 25001, 'hasta' => null, 'monto' => 350],
                    ],
                    'porcentaje_comision_apertura' => 10,
                    'porcentaje_interes_quincenal' => 5,
                    'multa_incumplimiento_monto' => 300,
                    'factor_divisor_puntos' => 1200 + ($index * 10),
                    'multiplicador_puntos' => 3 + ($index % 2),
                    'valor_punto_mxn' => 2 + ($index * 0.25),
                    'categorias_config_json' => $categoriaOverrides,
                    'productos_config_json' => $productoOverrides,
                    'actualizado_en' => now(),
                ]
            );

            foreach (
                [
                    ['estado' => Solicitud::ESTADO_MODIFICADA, 'etiqueta' => 'modificada'],
                    ['estado' => Solicitud::ESTADO_RECHAZADA, 'etiqueta' => 'rechazo'],
                ] as $extraIndex => $extra
            ) {
                $persona = Persona::updateOrCreate(
                    ['correo_electronico' => 'extra.' . strtolower($sucursal->codigo) . '.' . $extra['etiqueta'] . '@demo.local'],
                    [
                        'primer_nombre' => 'Extra ' . $extra['etiqueta'],
                        'apellido_paterno' => 'Sucursal',
                        'apellido_materno' => $sucursal->codigo,
                        'sexo' => $extraIndex % 2 === 0 ? 'F' : 'M',
                        'curp' => $this->curpPrueba('EXT', $index + 1, $extraIndex),
                        'rfc' => $this->rfcPrueba('EXT', $index + 1, $extraIndex),
                        'telefono_celular' => '8718' . $index . $extraIndex . '8800',
                        'correo_electronico' => 'extra.' . strtolower($sucursal->codigo) . '.' . $extra['etiqueta'] . '@demo.local',
                        'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                        'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                        'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                Solicitud::updateOrCreate(
                    ['persona_solicitante_id' => $persona->id, 'sucursal_id' => $sucursal->id],
                    [
                        'estado' => $extra['estado'],
                        'categoria_inicial_codigo' => $extraIndex === 0 ? 'PLATA' : 'COBRE',
                        'datos_familiares_json' => ['dependientes' => 1 + $extraIndex, 'tipo_vivienda' => $extraIndex === 0 ? 'RENTA' : 'PROPIA'],
                        'afiliaciones_externas_json' => ['ingreso_mensual_estimado' => 7800 + ($index * 900), 'actividad_principal' => 'Servicios'],
                        'vehiculos_json' => ['tiene_vehiculo' => $extraIndex === 0],
                        'resultado_buro' => $extra['estado'] === Solicitud::ESTADO_RECHAZADA ? 'NEGADO' : 'EN_PROCESO',
                        'motivo_rechazo' => $extra['estado'] === Solicitud::ESTADO_RECHAZADA ? 'Referencia laboral no confirmada' : null,
                        'prevale_aprobado' => false,
                        'fotos_casa_completas' => $extraIndex === 0,
                        'enviada_en' => now()->subDays(4 + $extraIndex),
                        'revisada_en' => now()->subDays(2 + $extraIndex),
                        'decidida_en' => $extra['estado'] === Solicitud::ESTADO_RECHAZADA ? now()->subDay() : null,
                    ]
                );
            }
        }

        $this->command?->info('Configuraciones por sucursal y solicitudes extra creadas para cada sede.');
    }

    private function curpPrueba(string $rol, int $sucursal, int $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . 'GPO26X';
        return substr(str_pad($seed, 18, 'X'), 0, 18);
    }

    private function rfcPrueba(string $rol, int $sucursal, int $slot): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $rol), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . 'B';
        return substr(str_pad($seed, 13, 'X'), 0, 13);
    }
}
