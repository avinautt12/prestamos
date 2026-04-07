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
        $sucursal = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();

        if (!$sucursal) {
            $this->command?->warn('No se encontro la sucursal SUC-TRC-CENTRO. Ejecuta primero UsuarioTestSeeder.');
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
                    'telefono_celular' => '8712000001',
                    'calle' => 'Av Juarez',
                    'numero_exterior' => '101',
                    'colonia' => 'Centro',
                    'ciudad' => 'Torreon',
                    'estado' => 'Coahuila',
                    'codigo_postal' => '27000',
                    'latitud' => 25.5428000,
                    'longitud' => -103.4068000,
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
                    'telefono_celular' => '8712000002',
                    'calle' => 'Calz Colon',
                    'numero_exterior' => '202',
                    'colonia' => 'Nueva California',
                    'ciudad' => 'Torreon',
                    'estado' => 'Coahuila',
                    'codigo_postal' => '27089',
                    'latitud' => 25.5319000,
                    'longitud' => -103.4469000,
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
                    'telefono_celular' => '8712000003',
                    'calle' => 'Blvd Independencia',
                    'numero_exterior' => '303',
                    'colonia' => 'El Fresno',
                    'ciudad' => 'Torreon',
                    'estado' => 'Coahuila',
                    'codigo_postal' => '27018',
                    'latitud' => 25.5503000,
                    'longitud' => -103.4215000,
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
                    'prevale_aprobado' => false,
                    'fotos_casa_completas' => true,
                    'enviada_en' => now(),
                    'revisada_en' => null,
                    'decidida_en' => null,
                ]
            );
        }

        $this->command?->info('3 solicitudes EN_REVISION en Torreon, Coahuila creadas/actualizadas para pruebas del verificador.');
    }
}
