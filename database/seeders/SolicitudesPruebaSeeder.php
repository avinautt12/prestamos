<?php

namespace Database\Seeders;

use App\Models\CuentaBancaria;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\VerificacionesSolicitud;
use Illuminate\Database\Seeder;

class SolicitudesPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = [
            ['codigo' => 'SUC-TRC-CENTRO', 'coordinador' => 'coordinador1', 'verificador' => 'verificador1a', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27000', 'branch' => 1],
            ['codigo' => 'SUC-TRC-ORIENTE', 'coordinador' => 'coordinador2', 'verificador' => 'verificador2a', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27010', 'branch' => 2],
            ['codigo' => 'SUC-TRC-NORTE', 'coordinador' => 'coordinador3', 'verificador' => 'verificador3a', 'city' => 'Torreon', 'state' => 'Coahuila', 'cp' => '27020', 'branch' => 3],
            ['codigo' => 'SUC-GPO-CENTRO', 'coordinador' => 'coordinador4', 'verificador' => 'verificador4a', 'city' => 'Gomez Palacio', 'state' => 'Durango', 'cp' => '35000', 'branch' => 4],
            ['codigo' => 'SUC-GPO-ESTACION', 'coordinador' => 'coordinador5', 'verificador' => 'verificador5a', 'city' => 'Gomez Palacio', 'state' => 'Durango', 'cp' => '35010', 'branch' => 5],
        ];

        $estados = [Solicitud::ESTADO_PRE, Solicitud::ESTADO_EN_REVISION, Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA, Solicitud::ESTADO_RECHAZADA];
        $nombres = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Fermin', 'Gabriela', 'Hugo', 'Ines', 'Javier', 'Karen', 'Luis'];
        $apellidos = ['Lopez', 'Martinez', 'Sanchez', 'Torres', 'Ramirez', 'Gomez', 'Castro', 'Ortiz', 'Reyes', 'Vargas'];

        foreach ($sucursales as $config) {
            $sucursal = Sucursal::where('codigo', $config['codigo'])->first();
            $coordinador = Usuario::where('nombre_usuario', $config['coordinador'])->first();
            $verificador = Usuario::where('nombre_usuario', $config['verificador'])->first();

            foreach ($estados as $i => $estado) {
                $nombre = $nombres[($config['branch'] + $i) % count($nombres)];
                $apPat = $apellidos[($config['branch'] + $i) % count($apellidos)];
                $apMat = $apellidos[($config['branch'] + $i + 3) % count($apellidos)];
                $correo = strtolower($nombre . '.' . $apPat . '.' . $config['branch'] . '.' . $i) . '@demo.local';

                $persona = Persona::updateOrCreate(
                    ['correo_electronico' => $correo],
                    [
                        'primer_nombre' => $nombre,
                        'apellido_paterno' => $apPat,
                        'apellido_materno' => $apMat,
                        'sexo' => $i % 2 === 0 ? 'F' : 'M',
                        'curp' => $this->curpPrueba($nombre, $config['branch'], $i),
                        'rfc' => $this->rfcPrueba($apPat, $config['branch'], $i),
                        'telefono_celular' => '871' . $config['branch'] . str_pad((string) $i, 7, '0', STR_PAD_LEFT),
                        'correo_electronico' => $correo,
                        'calle' => $config['city'] . ' Calle ' . ($i + 10),
                        'numero_exterior' => (string) (100 + $i),
                        'colonia' => 'Centro',
                        'ciudad' => $config['city'],
                        'estado' => $config['state'],
                        'codigo_postal' => $config['cp'],
                        'latitud' => $config['branch'] >= 4 ? 25.52 + ($i * 0.001) : 25.54 + ($i * 0.001),
                        'longitud' => $config['branch'] >= 4 ? -103.49 - ($i * 0.001) : -103.42 - ($i * 0.001),
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $cuentaId = null;
                if (in_array($estado, [Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA], true)) {
                    $cuenta = CuentaBancaria::updateOrCreate(
                        ['tipo_propietario' => 'PERSONA', 'propietario_id' => $persona->id, 'clabe' => '4444' . $config['branch'] . $i . '260000000'],
                        [
                            'banco' => $config['branch'] % 2 === 0 ? 'Banorte' : 'BBVA',
                            'nombre_titular' => trim($persona->primer_nombre . ' ' . $persona->apellido_paterno . ' ' . $persona->apellido_materno),
                            'numero_cuenta_mascarado' => '****' . str_pad((string) (1000 + $config['branch'] * 10 + $i), 4, '0', STR_PAD_LEFT),
                            'es_principal' => true,
                            'creado_en' => now(),
                            'actualizado_en' => now(),
                        ]
                    );
                    $cuentaId = $cuenta->id;
                }

                $solicitud = Solicitud::updateOrCreate(
                    ['persona_solicitante_id' => $persona->id, 'sucursal_id' => $sucursal->id],
                    [
                        'capturada_por_usuario_id' => $coordinador?->id,
                        'coordinador_usuario_id' => $coordinador?->id,
                        'verificador_asignado_id' => $verificador?->id,
                        'cuenta_bancaria_id' => $cuentaId,
                        'estado' => $estado,
                        'categoria_inicial_codigo' => ['COBRE', 'PLATA', 'ORO', 'DIAMANTE', 'PLATA'][$i],
                        'datos_familiares_json' => ['dependientes' => $i + 1, 'tipo_vivienda' => $i % 2 === 0 ? 'PROPIA' : 'RENTA'],
                        'afiliaciones_externas_json' => ['ingreso_mensual_estimado' => 8500 + ($config['branch'] * 1200) + ($i * 650), 'actividad_principal' => $i % 2 === 0 ? 'Comercio' : 'Servicios'],
                        'vehiculos_json' => ['tiene_vehiculo' => $i % 3 === 0],
                        'ine_frente_path' => 'seed/ine_frente_' . $config['branch'] . '_' . $i . '.jpg',
                        'ine_reverso_path' => 'seed/ine_reverso_' . $config['branch'] . '_' . $i . '.jpg',
                        'comprobante_domicilio_path' => 'seed/comprobante_' . $config['branch'] . '_' . $i . '.pdf',
                        'reporte_buro_path' => 'seed/buro_' . $config['branch'] . '_' . $i . '.pdf',
                        'limite_credito_solicitado' => 5000 + ($config['branch'] * 2500) + ($i * 1500),
                        'resultado_buro' => $estado === Solicitud::ESTADO_RECHAZADA ? 'NEGADO' : ($estado === Solicitud::ESTADO_PRE ? 'SIN_REPORTE' : 'APTO'),
                        'motivo_rechazo' => $estado === Solicitud::ESTADO_RECHAZADA ? 'Inconsistencia en ingresos y referencias' : null,
                        'prevale_aprobado' => in_array($estado, [Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA], true),
                        'fotos_casa_completas' => $estado !== Solicitud::ESTADO_PRE,
                        'enviada_en' => now()->subDays(10 - $i),
                        'tomada_en' => $estado !== Solicitud::ESTADO_PRE ? now()->subDays(9 - $i) : null,
                        'revisada_en' => in_array($estado, [Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA, Solicitud::ESTADO_RECHAZADA], true) ? now()->subDays(8 - $i) : null,
                        'decidida_en' => in_array($estado, [Solicitud::ESTADO_APROBADA, Solicitud::ESTADO_RECHAZADA], true) ? now()->subDays(7 - $i) : null,
                    ]
                );

                if (in_array($estado, [Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA], true) && $verificador) {
                    VerificacionesSolicitud::updateOrCreate(
                        ['solicitud_id' => $solicitud->id],
                        [
                            'verificador_usuario_id' => $verificador->id,
                            'resultado' => 'VERIFICADA',
                            'observaciones' => 'Solicitud validada para la presentacion.',
                            'latitud_verificacion' => $persona->latitud,
                            'longitud_verificacion' => $persona->longitud,
                            'fecha_visita' => now()->subDays(6 - $i),
                            'checklist_json' => json_encode(['domicilio_correcto' => true, 'documentos_validos' => true, 'referencias_ok' => true]),
                            'distancia_metros' => 32.5 + $i,
                            'creado_en' => now(),
                            'actualizado_en' => now(),
                        ]
                    );
                }
            }
        }

        $this->command?->info('Solicitudes mixtas creadas: 25 solicitudes con estados PRE, EN_REVISION, VERIFICADA, APROBADA y RECHAZADA.');
    }

    private function curpPrueba(string $nombre, int $sucursal, int $indice): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $nombre), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $indice, 2, '0', STR_PAD_LEFT) . 'TRC26X';
        return substr(str_pad($seed, 18, 'X'), 0, 18);
    }

    private function rfcPrueba(string $apellido, int $sucursal, int $indice): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Z]/', '', $apellido), 0, 4));
        $seed = $base . str_pad((string) $sucursal, 2, '0', STR_PAD_LEFT) . str_pad((string) $indice, 2, '0', STR_PAD_LEFT) . 'A';
        return substr(str_pad($seed, 13, 'X'), 0, 13);
    }
}
