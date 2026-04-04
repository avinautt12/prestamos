<?php

namespace Database\Seeders;

use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class SolicitudesPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::where('codigo', 'SUC-MATRIZ')->first();

        if (!$sucursal) {
            $this->command?->warn('No se encontró la sucursal SUC-MATRIZ. Ejecuta primero UsuarioTestSeeder.');
            return;
        }

        $coordinador = Usuario::where('nombre_usuario', 'coordinador')->first();

        $solicitudes = [
            [
                'persona' => [
                    'correo_electronico' => 'prueba01@prestamofacil.com',
                    'curp' => 'PRU010101HDFAAA01',
                    'primer_nombre' => 'Ana',
                    'apellido_paterno' => 'Lopez',
                    'apellido_materno' => 'Garcia',
                    'sexo' => 'F',
                    'telefono_celular' => '5551000001',
                    'calle' => 'Calle Reforma',
                    'numero_exterior' => '101',
                    'colonia' => 'Centro',
                    'ciudad' => 'Ciudad de Mexico',
                    'estado' => 'CDMX',
                    'codigo_postal' => '06000',
                    'latitud' => 19.4326000,
                    'longitud' => -99.1332000,
                ],
            ],
            [
                'persona' => [
                    'correo_electronico' => 'prueba02@prestamofacil.com',
                    'curp' => 'PRU020202HDFAAA02',
                    'primer_nombre' => 'Bruno',
                    'apellido_paterno' => 'Martinez',
                    'apellido_materno' => 'Diaz',
                    'sexo' => 'M',
                    'telefono_celular' => '5551000002',
                    'calle' => 'Av Juarez',
                    'numero_exterior' => '202',
                    'colonia' => 'Doctores',
                    'ciudad' => 'Ciudad de Mexico',
                    'estado' => 'CDMX',
                    'codigo_postal' => '06720',
                    'latitud' => 19.4331000,
                    'longitud' => -99.1329000,
                ],
            ],
            [
                'persona' => [
                    'correo_electronico' => 'prueba03@prestamofacil.com',
                    'curp' => 'PRU030303HDFAAA03',
                    'primer_nombre' => 'Carla',
                    'apellido_paterno' => 'Sanchez',
                    'apellido_materno' => 'Perez',
                    'sexo' => 'F',
                    'telefono_celular' => '5551000003',
                    'calle' => 'Calle Madero',
                    'numero_exterior' => '303',
                    'colonia' => 'Tabacalera',
                    'ciudad' => 'Ciudad de Mexico',
                    'estado' => 'CDMX',
                    'codigo_postal' => '06030',
                    'latitud' => 19.4319000,
                    'longitud' => -99.1341000,
                ],
            ],
        ];

        foreach ($solicitudes as $index => $data) {
            $persona = Persona::updateOrCreate(
                ['correo_electronico' => $data['persona']['correo_electronico']],
                array_merge($data['persona'], [
                    'notas' => 'Solicitud de prueba para verificador #' . ($index + 1),
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ])
            );

            Solicitud::updateOrCreate(
                [
                    'persona_solicitante_id' => $persona->id,
                    'sucursal_id' => $sucursal->id,
                ],
                [
                    'capturada_por_usuario_id' => $coordinador?->id,
                    'coordinador_usuario_id' => $coordinador?->id,
                    'estado' => 'EN_REVISION',
                    'datos_familiares_json' => json_encode([
                        'dependientes' => 2,
                        'tipo_vivienda' => 'PROPIA',
                    ]),
                    'afiliaciones_externas_json' => json_encode([
                        'club' => 'Ninguno',
                    ]),
                    'vehiculos_json' => json_encode([
                        'tiene_vehiculo' => false,
                    ]),
                    'resultado_buro' => 'SIN_REPORTE',
                    'observaciones_validacion' => 'Registro de prueba para verificador',
                    'prevale_aprobado' => false,
                    'fotos_casa_completas' => true,
                    'enviada_en' => now(),
                    'revisada_en' => null,
                    'decidida_en' => null,
                ]
            );
        }

        $this->command?->info('3 solicitudes EN_REVISION creadas/actualizadas para pruebas del verificador.');
    }
}
