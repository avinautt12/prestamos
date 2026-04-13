<?php

namespace Database\Seeders;

use App\Models\CuentaBancaria;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class PrevalesCajeraSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = Sucursal::query()->orderBy('codigo')->get();

        foreach ($sucursales as $index => $sucursal) {
            $coordinador = Usuario::where('nombre_usuario', 'coordinador' . ($index + 1))->first();

            foreach (
                [
                    ['estado' => Solicitud::ESTADO_VERIFICADA, 'cuenta' => true],
                    ['estado' => Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA, 'cuenta' => false],
                ] as $i => $scenario
            ) {
                $persona = Persona::updateOrCreate(
                    ['correo_electronico' => 'prevale.' . strtolower($sucursal->codigo) . '.' . $i . '@demo.local'],
                    [
                        'primer_nombre' => 'Prevale ' . ($index + 1) . '-' . ($i + 1),
                        'apellido_paterno' => 'Demo',
                        'apellido_materno' => $sucursal->codigo,
                        'sexo' => $i % 2 === 0 ? 'F' : 'M',
                        'curp' => $this->curpPrueba('PRE', $index + 1, $i),
                        'rfc' => $this->rfcPrueba('PRE', $index + 1, $i),
                        'telefono_celular' => '872' . $index . $i . '1122',
                        'correo_electronico' => 'prevale.' . strtolower($sucursal->codigo) . '.' . $i . '@demo.local',
                        'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                        'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                        'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $cuentaId = null;
                if ($scenario['cuenta']) {
                    $cuenta = CuentaBancaria::updateOrCreate(
                        ['tipo_propietario' => 'PERSONA', 'propietario_id' => $persona->id, 'clabe' => '5555' . ($index + 1) . $i . '260000000'],
                        [
                            'banco' => $index % 2 === 0 ? 'BBVA' : 'Banorte',
                            'nombre_titular' => trim($persona->primer_nombre . ' ' . $persona->apellido_paterno . ' ' . $persona->apellido_materno),
                            'numero_cuenta_mascarado' => '****' . str_pad((string) (2000 + ($index * 10) + $i), 4, '0', STR_PAD_LEFT),
                            'es_principal' => true,
                            'creado_en' => now(),
                            'actualizado_en' => now(),
                        ]
                    );
                    $cuentaId = $cuenta->id;
                }

                Solicitud::updateOrCreate(
                    ['persona_solicitante_id' => $persona->id, 'sucursal_id' => $sucursal->id],
                    [
                        'capturada_por_usuario_id' => $coordinador?->id,
                        'coordinador_usuario_id' => $coordinador?->id,
                        'cuenta_bancaria_id' => $cuentaId,
                        'estado' => $scenario['estado'],
                        'categoria_inicial_codigo' => $i === 0 ? 'PLATA' : 'COBRE',
                        'limite_credito_solicitado' => 6000 + ($index * 2000) + ($i * 1500),
                        'datos_familiares_json' => ['dependientes' => 2 + $i],
                        'afiliaciones_externas_json' => ['ingreso_mensual_estimado' => 7000 + ($index * 900)],
                        'vehiculos_json' => ['tiene_vehiculo' => $i === 0],
                        'resultado_buro' => $scenario['estado'] === Solicitud::ESTADO_VERIFICADA ? 'APTO' : 'SIN_REPORTE',
                        'prevale_aprobado' => false,
                        'fotos_casa_completas' => $scenario['cuenta'],
                        'enviada_en' => now()->subDays(2 + $i),
                        'tomada_en' => now()->subDay(),
                        'revisada_en' => $scenario['estado'] === Solicitud::ESTADO_VERIFICADA ? now() : null,
                        'decidida_en' => null,
                    ]
                );
            }
        }

        $this->command?->info('Prevales y posibles distribuidoras creadas por sucursal.');
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
