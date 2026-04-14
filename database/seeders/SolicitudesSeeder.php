<?php

namespace Database\Seeders;

use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\VerificacionesSolicitud;
use Illuminate\Database\Seeder;

class SolicitudesSeeder extends Seeder
{
    /**
     * Crea 7 solicitudes, una por cada estado del flujo:
     * PRE, MODIFICADA, EN_REVISION, VERIFICADA, POSIBLE_DISTRIBUIDORA, APROBADA, RECHAZADA.
     *
     * Las solicitudes con dictamen (VERIFICADA, POSIBLE_DISTRIBUIDORA, APROBADA, RECHAZADA)
     * generan también su verificaciones_solicitud.
     *
     * La solicitud APROBADA se referencia después en DistribuidorasSeeder.
     */
    public function run(): void
    {
        $centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();
        $norte  = Sucursal::where('codigo', 'SUC-TRC-NTE')->first();
        $sur    = Sucursal::where('codigo', 'SUC-TRC-SUR')->first();

        $coordCentro = Usuario::where('nombre_usuario', 'coordinador')->first();
        $coordNorte  = Usuario::where('nombre_usuario', 'coord.trc_nte')->first();
        $coordSur    = Usuario::where('nombre_usuario', 'coord.trc_sur')->first();

        $verifCentro = Usuario::where('nombre_usuario', 'verificador')->first();
        $verifNorte  = Usuario::where('nombre_usuario', 'verif1.trc_nte')->first();
        $verifSur    = Usuario::where('nombre_usuario', 'verif1.trc_sur')->first();

        $solicitudes = [
            [
                'estado' => Solicitud::ESTADO_PRE,
                'sucursal' => $centro,
                'coordinador' => $coordCentro,
                'verificador' => null,
                'persona' => $this->crearPersonaSolicitante('SOL01', 'Armando', 'Prado', 'Chavez', 'M'),
                'enviada_en' => null,
                'tomada_en' => null,
                'revisada_en' => null,
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => null,
            ],
            [
                'estado' => Solicitud::ESTADO_MODIFICADA,
                'sucursal' => $norte,
                'coordinador' => $coordNorte,
                'verificador' => $verifNorte,
                'persona' => $this->crearPersonaSolicitante('SOL02', 'Beatriz', 'Quintero', 'Dominguez', 'F'),
                'enviada_en' => now()->subDays(5),
                'tomada_en' => now()->subDays(4),
                'revisada_en' => now()->subDays(3),
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => 'PENDIENTE',
            ],
            [
                'estado' => Solicitud::ESTADO_EN_REVISION,
                'sucursal' => $sur,
                'coordinador' => $coordSur,
                'verificador' => null,
                'persona' => $this->crearPersonaSolicitante('SOL03', 'Cesar', 'Rodriguez', 'Ibarra', 'M'),
                'enviada_en' => now()->subDays(2),
                'tomada_en' => null,
                'revisada_en' => null,
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => null,
            ],
            [
                'estado' => Solicitud::ESTADO_VERIFICADA,
                'sucursal' => $centro,
                'coordinador' => $coordCentro,
                'verificador' => $verifCentro,
                'persona' => $this->crearPersonaSolicitante('SOL04', 'Diana', 'Salazar', 'Jaramillo', 'F'),
                'enviada_en' => now()->subDays(4),
                'tomada_en' => now()->subDays(3),
                'revisada_en' => now()->subDays(2),
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado' => Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA,
                'sucursal' => $norte,
                'coordinador' => $coordNorte,
                'verificador' => $verifNorte,
                'persona' => $this->crearPersonaSolicitante('SOL05', 'Enrique', 'Tovar', 'Kessler', 'M'),
                'enviada_en' => now()->subDays(7),
                'tomada_en' => now()->subDays(6),
                'revisada_en' => now()->subDays(5),
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado' => Solicitud::ESTADO_APROBADA,
                'sucursal' => $sur,
                'coordinador' => $coordSur,
                'verificador' => $verifSur,
                'persona' => $this->crearPersonaSolicitante('SOL06', 'Fabiola', 'Urrutia', 'Leon', 'F'),
                'enviada_en' => now()->subDays(10),
                'tomada_en' => now()->subDays(9),
                'revisada_en' => now()->subDays(8),
                'decidida_en' => now()->subDays(7),
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado' => Solicitud::ESTADO_RECHAZADA,
                'sucursal' => $centro,
                'coordinador' => $coordCentro,
                'verificador' => $verifCentro,
                'persona' => $this->crearPersonaSolicitante('SOL07', 'Gilberto', 'Valdez', 'Morales', 'M'),
                'enviada_en' => now()->subDays(6),
                'tomada_en' => now()->subDays(5),
                'revisada_en' => now()->subDays(4),
                'decidida_en' => now()->subDays(3),
                'motivo_rechazo' => 'Buró de crédito con reportes negativos activos.',
                'dictamen' => 'RECHAZADA',
            ],
        ];

        foreach ($solicitudes as $s) {
            $solicitud = Solicitud::updateOrCreate(
                [
                    'persona_solicitante_id' => $s['persona']->id,
                    'sucursal_id' => $s['sucursal']->id,
                ],
                [
                    'capturada_por_usuario_id' => $s['coordinador']->id,
                    'coordinador_usuario_id'   => $s['coordinador']->id,
                    'verificador_asignado_id'  => $s['verificador']?->id,
                    'estado'                   => $s['estado'],
                    'categoria_inicial_codigo' => 'COBRE',
                    'limite_credito_solicitado' => 15000.00,
                    'datos_familiares_json'     => json_encode([
                        ['parentesco' => 'Conyuge', 'nombre' => 'Familiar Prueba', 'edad' => 30],
                    ]),
                    'afiliaciones_externas_json' => json_encode([
                        ['empresa' => 'Empresa Demo', 'antiguedad_anios' => 5, 'limite_credito' => 10000],
                    ]),
                    'vehiculos_json' => json_encode([
                        ['marca' => 'Nissan', 'modelo' => 'Versa', 'anio' => 2018],
                    ]),
                    'ine_frente_path'            => 'solicitudes/demo/ine_frente.jpg',
                    'ine_reverso_path'           => 'solicitudes/demo/ine_reverso.jpg',
                    'comprobante_domicilio_path' => 'solicitudes/demo/comprobante.jpg',
                    'reporte_buro_path'          => 'solicitudes/demo/buro.pdf',
                    'resultado_buro'             => $s['dictamen'] === 'RECHAZADA' ? 'Con reportes negativos' : 'Apto / Buen historial',
                    'motivo_rechazo'             => $s['motivo_rechazo'],
                    'enviada_en'                 => $s['enviada_en'],
                    'tomada_en'                  => $s['tomada_en'],
                    'revisada_en'                => $s['revisada_en'],
                    'decidida_en'                => $s['decidida_en'],
                ]
            );

            // Verificación para las que tienen dictamen.
            if ($s['dictamen'] !== null && $s['verificador']) {
                VerificacionesSolicitud::updateOrCreate(
                    ['solicitud_id' => $solicitud->id],
                    [
                        'verificador_usuario_id' => $s['verificador']->id,
                        'resultado'              => $s['dictamen'],
                        'observaciones'          => $s['dictamen'] === 'RECHAZADA'
                            ? 'Domicilio visible pero con observaciones negativas.'
                            : 'Domicilio confirmado, persona identificada, documentos en orden.',
                        'latitud_verificacion'   => 25.54,
                        'longitud_verificacion'  => -103.42,
                        'distancia_metros'       => 35,
                        'fecha_visita'           => $s['revisada_en'],
                        'checklist_json'         => json_encode([
                            'identidad' => true,
                            'domicilio' => true,
                            'referencias' => $s['dictamen'] !== 'RECHAZADA',
                        ]),
                        'foto_fachada'           => 'verificaciones/demo/fachada.jpg',
                        'foto_ine_con_persona'   => 'verificaciones/demo/ine_persona.jpg',
                        'foto_comprobante'       => 'verificaciones/demo/comprobante.jpg',
                    ]
                );
            }
        }

        $this->command?->info('7 solicitudes creadas (1 por cada estado) + verificaciones donde corresponde.');
    }

    private function crearPersonaSolicitante(string $sufijo, string $nombre, string $apPat, string $apMat, string $sexo): Persona
    {
        $curp = strtoupper(substr($apPat, 0, 2) . substr($apMat, 0, 1) . substr($nombre, 0, 1))
            . '900101' . $sexo . 'CLXXXX' . str_pad($sufijo, 4, '0', STR_PAD_LEFT);
        $curp = substr($curp, 0, 18); // máx 18 chars
        if (strlen($curp) < 18) {
            $curp = str_pad($curp, 18, 'X');
        }

        $rfc = strtoupper(substr($apPat, 0, 2) . substr($apMat, 0, 1) . substr($nombre, 0, 1))
            . '900101' . substr(md5($sufijo), 0, 3);
        $rfc = strtoupper(substr($rfc, 0, 13));

        return Persona::updateOrCreate(
            ['curp' => $curp],
            [
                'primer_nombre'    => $nombre,
                'apellido_paterno' => $apPat,
                'apellido_materno' => $apMat,
                'sexo'             => $sexo,
                'fecha_nacimiento' => '1990-01-01',
                'rfc'              => $rfc,
                'telefono_celular' => '871500' . str_pad(substr($sufijo, -2), 4, '0', STR_PAD_LEFT),
                'correo_electronico' => strtolower($nombre . '.' . $apPat) . '@clientes.test',
                'calle'            => 'Calle ' . $nombre,
                'numero_exterior'  => rand(100, 999),
                'colonia'          => 'Centro',
                'ciudad'           => 'Torreon',
                'estado'           => 'Coahuila',
                'codigo_postal'    => '27000',
                'latitud'          => 25.5428,
                'longitud'         => -103.4068,
                'creado_en'        => now(),
                'actualizado_en'   => now(),
            ]
        );
    }
}
