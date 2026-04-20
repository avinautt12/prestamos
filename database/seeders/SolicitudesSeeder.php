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
     * Crea 6 solicitudes (3 por sucursal):
     *
     *   CENTRO:
     *     - 2 APROBADA (ligan a distribuidoras ACTIVAS)
     *     - 1 VERIFICADA (pendiente de decisión del gerente — sin distribuidora creada)
     *
     *   NORTE:
     *     - 2 APROBADA (ligan a distribuidoras ACTIVAS)
     *     - 1 POSIBLE_DISTRIBUIDORA (liga a distribuidora en estado CANDIDATA)
     */
    public function run(): void
    {
        $centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();
        $norte  = Sucursal::where('codigo', 'SUC-TRC-NTE')->first();

        $coordCentro = Usuario::where('nombre_usuario', 'coordinador')->first();
        $coordNorte  = Usuario::where('nombre_usuario', 'coord.trc_nte')->first();

        $verifCentro = Usuario::where('nombre_usuario', 'verificador')->first();
        $verifNorte  = Usuario::where('nombre_usuario', 'verif1.trc_nte')->first();

        $solicitudes = [
            // ==================== CENTRO ====================
            [
                'estado'      => Solicitud::ESTADO_APROBADA,
                'sucursal'    => $centro,
                'coordinador' => $coordCentro,
                'verificador' => $verifCentro,
                'persona'     => $this->crearPersonaSolicitante('SOL01', 'Abarrotes', 'Martinez', 'Ortega', 'F'),
                'enviada_en'  => now()->subDays(40),
                'tomada_en'   => now()->subDays(39),
                'revisada_en' => now()->subDays(38),
                'decidida_en' => now()->subDays(35),
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado'      => Solicitud::ESTADO_APROBADA,
                'sucursal'    => $centro,
                'coordinador' => $coordCentro,
                'verificador' => $verifCentro,
                'persona'     => $this->crearPersonaSolicitante('SOL02', 'Deposito', 'Garcia', 'Reyes', 'M'),
                'enviada_en'  => now()->subDays(35),
                'tomada_en'   => now()->subDays(34),
                'revisada_en' => now()->subDays(33),
                'decidida_en' => now()->subDays(30),
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado'      => Solicitud::ESTADO_VERIFICADA,
                'sucursal'    => $centro,
                'coordinador' => $coordCentro,
                'verificador' => $verifCentro,
                'persona'     => $this->crearPersonaSolicitante('SOL03', 'Diana', 'Salazar', 'Jaramillo', 'F'),
                'enviada_en'  => now()->subDays(4),
                'tomada_en'   => now()->subDays(3),
                'revisada_en' => now()->subDays(2),
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],

            // ==================== NORTE ====================
            [
                'estado'      => Solicitud::ESTADO_APROBADA,
                'sucursal'    => $norte,
                'coordinador' => $coordNorte,
                'verificador' => $verifNorte,
                'persona'     => $this->crearPersonaSolicitante('SOL04', 'Tiendita', 'Lopez', 'Cantu', 'F'),
                'enviada_en'  => now()->subDays(45),
                'tomada_en'   => now()->subDays(44),
                'revisada_en' => now()->subDays(43),
                'decidida_en' => now()->subDays(40),
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado'      => Solicitud::ESTADO_APROBADA,
                'sucursal'    => $norte,
                'coordinador' => $coordNorte,
                'verificador' => $verifNorte,
                'persona'     => $this->crearPersonaSolicitante('SOL05', 'Bodega', 'Ramirez', 'Solis', 'M'),
                'enviada_en'  => now()->subDays(38),
                'tomada_en'   => now()->subDays(37),
                'revisada_en' => now()->subDays(36),
                'decidida_en' => now()->subDays(33),
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
            ],
            [
                'estado'      => Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA,
                'sucursal'    => $norte,
                'coordinador' => $coordNorte,
                'verificador' => $verifNorte,
                'persona'     => $this->crearPersonaSolicitante('SOL06', 'Enrique', 'Tovar', 'Kessler', 'M'),
                'enviada_en'  => now()->subDays(7),
                'tomada_en'   => now()->subDays(6),
                'revisada_en' => now()->subDays(5),
                'decidida_en' => null,
                'motivo_rechazo' => null,
                'dictamen' => 'VERIFICADA',
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
                    'resultado_buro'             => 'Apto / Buen historial',
                    'motivo_rechazo'             => $s['motivo_rechazo'],
                    'enviada_en'                 => $s['enviada_en'],
                    'tomada_en'                  => $s['tomada_en'],
                    'revisada_en'                => $s['revisada_en'],
                    'decidida_en'                => $s['decidida_en'],
                ]
            );

            if ($s['dictamen'] !== null && $s['verificador']) {
                VerificacionesSolicitud::updateOrCreate(
                    ['solicitud_id' => $solicitud->id],
                    [
                        'verificador_usuario_id' => $s['verificador']->id,
                        'resultado'              => $s['dictamen'],
                        'observaciones'          => 'Domicilio confirmado, persona identificada, documentos en orden.',
                        'latitud_verificacion'   => 25.54,
                        'longitud_verificacion'  => -103.42,
                        'distancia_metros'       => 35,
                        'fecha_visita'           => $s['revisada_en'],
                        'checklist_json'         => json_encode([
                            'identidad' => true,
                            'domicilio' => true,
                            'referencias' => true,
                        ]),
                        'foto_fachada'           => 'verificaciones/demo/fachada.jpg',
                        'foto_ine_con_persona'   => 'verificaciones/demo/ine_persona.jpg',
                        'foto_comprobante'       => 'verificaciones/demo/comprobante.jpg',
                    ]
                );
            }
        }

        $this->command?->info('6 solicitudes creadas (3 por sucursal: 2 APROBADA + 1 pendiente).');
    }

    private function crearPersonaSolicitante(string $sufijo, string $nombre, string $apPat, string $apMat, string $sexo): Persona
    {
        $curp = strtoupper(substr($apPat, 0, 2) . substr($apMat, 0, 1) . substr($nombre, 0, 1))
            . '900101' . $sexo . 'CLXXXX' . str_pad($sufijo, 4, '0', STR_PAD_LEFT);
        $curp = substr($curp, 0, 18);
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
