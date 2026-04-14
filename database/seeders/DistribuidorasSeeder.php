<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\CuentaBancaria;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DistribuidorasSeeder extends Seeder
{
    /**
     * Crea 15 distribuidoras cubriendo todos los estados del flujo:
     *   - 9 ACTIVA (3 por sucursal), cada una con su usuario, persona, cuenta bancaria y categoria
     *   - 1 CANDIDATA (ligada a solicitud POSIBLE_DISTRIBUIDORA)
     *   - 1 POSIBLE (ligada a solicitud APROBADA)
     *   - 1 INACTIVA (Centro)
     *   - 1 MOROSA (Centro)
     *   - 1 BLOQUEADA (Norte)
     *   - 1 CERRADA (Sur)
     *
     * Password comun: password123
     * Alias corto: `distribuidora` -> dist1.trc_centro (primera ACTIVA de Centro)
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        $centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();
        $norte  = Sucursal::where('codigo', 'SUC-TRC-NTE')->first();
        $sur    = Sucursal::where('codigo', 'SUC-TRC-SUR')->first();

        $coordCentro = Usuario::where('nombre_usuario', 'coordinador')->first();
        $coordNorte  = Usuario::where('nombre_usuario', 'coord.trc_nte')->first();
        $coordSur    = Usuario::where('nombre_usuario', 'coord.trc_sur')->first();

        $catCobre = CategoriaDistribuidora::where('codigo', 'COBRE')->first();
        $catPlata = CategoriaDistribuidora::where('codigo', 'PLATA')->first();
        $catOro   = CategoriaDistribuidora::where('codigo', 'ORO')->first();

        $rolDist = Rol::where('codigo', 'DISTRIBUIDORA')->first();

        // Solicitudes para CANDIDATA y POSIBLE (ya creadas en SolicitudesSeeder)
        $solicitudPosibleDist = Solicitud::where('estado', Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA)->first();
        $solicitudAprobada    = Solicitud::where('estado', Solicitud::ESTADO_APROBADA)->first();

        $definiciones = [
            // --- ACTIVA x 3 por sucursal ---
            ['usuario' => 'distribuidora',        'alias' => 'dist1.trc_centro', 'nombre' => 'Abarrotes',      'paterno' => 'Martinez', 'materno' => 'Ortega',   'sexo' => 'F', 'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 50000, 'credito' => 38000, 'puntos' => 210, 'solicitud' => null],
            ['usuario' => 'dist2.trc_centro',     'alias' => null,               'nombre' => 'Depósito',       'paterno' => 'Garcia',   'materno' => 'Reyes',    'sexo' => 'M', 'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catPlata, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 80000, 'credito' => 62000, 'puntos' => 480, 'solicitud' => null],
            ['usuario' => 'dist3.trc_centro',     'alias' => null,               'nombre' => 'Miscelánea',     'paterno' => 'Perez',    'materno' => 'Vera',     'sexo' => 'F', 'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catOro,   'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 120000,'credito' => 95000, 'puntos' => 750, 'solicitud' => null],

            ['usuario' => 'dist1.trc_nte',        'alias' => null,               'nombre' => 'Tiendita',       'paterno' => 'Lopez',    'materno' => 'Cantu',    'sexo' => 'F', 'sucursal' => $norte,  'coord' => $coordNorte,  'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 40000, 'credito' => 32000, 'puntos' => 180, 'solicitud' => null],
            ['usuario' => 'dist2.trc_nte',        'alias' => null,               'nombre' => 'Bodega',         'paterno' => 'Ramirez',  'materno' => 'Solis',    'sexo' => 'M', 'sucursal' => $norte,  'coord' => $coordNorte,  'cat' => $catPlata, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 70000, 'credito' => 55000, 'puntos' => 390, 'solicitud' => null],
            ['usuario' => 'dist3.trc_nte',        'alias' => null,               'nombre' => 'Tendajon',       'paterno' => 'Mendez',   'materno' => 'Chavarria','sexo' => 'F', 'sucursal' => $norte,  'coord' => $coordNorte,  'cat' => $catOro,   'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 110000,'credito' => 88000, 'puntos' => 620, 'solicitud' => null],

            ['usuario' => 'dist1.trc_sur',        'alias' => null,               'nombre' => 'Estanquillo',    'paterno' => 'Fuentes',  'materno' => 'Nieto',    'sexo' => 'M', 'sucursal' => $sur,    'coord' => $coordSur,    'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 35000, 'credito' => 27000, 'puntos' => 140, 'solicitud' => null],
            ['usuario' => 'dist2.trc_sur',        'alias' => null,               'nombre' => 'El Changarro',   'paterno' => 'Ibanez',   'materno' => 'Luna',     'sexo' => 'F', 'sucursal' => $sur,    'coord' => $coordSur,    'cat' => $catPlata, 'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 65000, 'credito' => 51000, 'puntos' => 340, 'solicitud' => null],
            ['usuario' => 'dist3.trc_sur',        'alias' => null,               'nombre' => 'La Fortuna',     'paterno' => 'Estrada',  'materno' => 'Palacios', 'sexo' => 'M', 'sucursal' => $sur,    'coord' => $coordSur,    'cat' => $catOro,   'estado' => Distribuidora::ESTADO_ACTIVA, 'limite' => 100000,'credito' => 80000, 'puntos' => 570, 'solicitud' => null],

            // --- Estados especiales ---
            ['usuario' => 'dist.candidata',       'alias' => null,               'nombre' => 'Candidata',      'paterno' => 'Tovar',    'materno' => 'Kessler',  'sexo' => 'M', 'sucursal' => $norte,  'coord' => $coordNorte,  'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_CANDIDATA, 'limite' => 0,    'credito' => 0,     'puntos' => 0,   'solicitud' => $solicitudPosibleDist, 'persona_existente' => $solicitudPosibleDist?->persona_solicitante_id],
            ['usuario' => 'dist.posible',         'alias' => null,               'nombre' => 'Posible',        'paterno' => 'Urrutia',  'materno' => 'Leon',     'sexo' => 'F', 'sucursal' => $sur,    'coord' => $coordSur,    'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_POSIBLE,   'limite' => 20000,'credito' => 20000, 'puntos' => 0,   'solicitud' => $solicitudAprobada, 'persona_existente' => $solicitudAprobada?->persona_solicitante_id],
            ['usuario' => 'dist.inactiva',        'alias' => null,               'nombre' => 'Inactiva',       'paterno' => 'Saucedo',  'materno' => 'Barrios',  'sexo' => 'M', 'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_INACTIVA,  'limite' => 30000,'credito' => 30000, 'puntos' => 50,  'solicitud' => null],
            ['usuario' => 'dist.morosa',          'alias' => null,               'nombre' => 'Morosa',         'paterno' => 'Trevino',  'materno' => 'Delgado',  'sexo' => 'F', 'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catPlata, 'estado' => Distribuidora::ESTADO_MOROSA,    'limite' => 45000,'credito' => 5000,  'puntos' => 20,  'solicitud' => null],
            ['usuario' => 'dist.bloqueada',       'alias' => null,               'nombre' => 'Bloqueada',      'paterno' => 'Quiroz',   'materno' => 'Acevedo',  'sexo' => 'M', 'sucursal' => $norte,  'coord' => $coordNorte,  'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_BLOQUEADA, 'limite' => 30000,'credito' => 10000, 'puntos' => 0,   'solicitud' => null],
            ['usuario' => 'dist.cerrada',         'alias' => null,               'nombre' => 'Cerrada',        'paterno' => 'Zavala',   'materno' => 'Yanez',    'sexo' => 'F', 'sucursal' => $sur,    'coord' => $coordSur,    'cat' => $catCobre, 'estado' => Distribuidora::ESTADO_CERRADA,   'limite' => 25000,'credito' => 25000, 'puntos' => 0,   'solicitud' => null],
        ];

        $consecutivos = ['SUC-TRC-CENTRO' => 0, 'SUC-TRC-NTE' => 0, 'SUC-TRC-SUR' => 0];
        $sufijoSucursal = ['SUC-TRC-CENTRO' => 'C', 'SUC-TRC-NTE' => 'N', 'SUC-TRC-SUR' => 'S'];

        foreach ($definiciones as $i => $d) {
            $codSuc = $d['sucursal']->codigo;
            $consecutivos[$codSuc]++;
            $numeroDistribuidora = sprintf('PFDIST%03d-%s', $consecutivos[$codSuc], $sufijoSucursal[$codSuc]);

            // 1. Persona (reutilizar si es CANDIDATA/POSIBLE ligada a solicitud existente)
            if (!empty($d['persona_existente'])) {
                $persona = Persona::find($d['persona_existente']);
            } else {
                $curp = strtoupper(substr($d['paterno'], 0, 2) . substr($d['materno'], 0, 1) . substr($d['nombre'], 0, 1))
                    . '850101' . $d['sexo'] . 'CLDIST' . str_pad((string) ($i + 20), 2, '0', STR_PAD_LEFT);
                $curp = substr(str_pad($curp, 18, 'X'), 0, 18);
                $rfc = strtoupper(substr($d['paterno'], 0, 2) . substr($d['materno'], 0, 1) . substr($d['nombre'], 0, 1))
                    . '850101' . substr(md5($d['usuario']), 0, 3);
                $rfc = strtoupper(substr($rfc, 0, 13));

                $persona = Persona::updateOrCreate(
                    ['curp' => $curp],
                    [
                        'primer_nombre'      => $d['nombre'],
                        'apellido_paterno'   => $d['paterno'],
                        'apellido_materno'   => $d['materno'],
                        'sexo'               => $d['sexo'],
                        'fecha_nacimiento'   => '1985-01-01',
                        'rfc'                => $rfc,
                        'telefono_celular'   => '87160' . str_pad((string) ($i + 10), 5, '0', STR_PAD_LEFT),
                        'correo_electronico' => $d['usuario'] . '@distribuidoras.test',
                        'calle'              => 'Av. Comercio',
                        'numero_exterior'    => (string) (100 + $i),
                        'colonia'            => 'Industrial',
                        'ciudad'             => 'Torreon',
                        'estado'             => 'Coahuila',
                        'codigo_postal'      => '27000',
                        'latitud'            => 25.5428,
                        'longitud'           => -103.4068,
                        'creado_en'          => now(),
                        'actualizado_en'     => now(),
                    ]
                );
            }

            // 2. Usuario con rol DISTRIBUIDORA
            $usuario = Usuario::updateOrCreate(
                ['nombre_usuario' => $d['usuario']],
                [
                    'persona_id'     => $persona->id,
                    'clave_hash'     => $password,
                    'activo'         => $d['estado'] !== Distribuidora::ESTADO_BLOQUEADA,
                    'requiere_vpn'   => false,
                    'canal_login'    => 'MOVIL',
                    'creado_en'      => now(),
                    'actualizado_en' => now(),
                ]
            );

            DB::table('usuario_rol')->updateOrInsert(
                [
                    'usuario_id'  => $usuario->id,
                    'rol_id'      => $rolDist->id,
                    'sucursal_id' => $d['sucursal']->id,
                ],
                [
                    'asignado_en'  => now(),
                    'revocado_en'  => null,
                    'es_principal' => true,
                ]
            );

            // 3. Cuenta bancaria polimorfica (para la distribuidora)
            $clabe = '0460900000' . str_pad((string) ($i + 1000), 8, '0', STR_PAD_LEFT);
            // 4. Distribuidora (primero sin cuenta; después asignamos)
            $distribuidora = Distribuidora::updateOrCreate(
                ['numero_distribuidora' => $numeroDistribuidora],
                [
                    'persona_id'           => $persona->id,
                    'solicitud_id'         => $d['solicitud']?->id,
                    'sucursal_id'          => $d['sucursal']->id,
                    'coordinador_usuario_id' => $d['coord']?->id,
                    'categoria_id'         => $d['cat']->id,
                    'cuenta_bancaria_id'   => null,
                    'estado'               => $d['estado'],
                    'limite_credito'       => $d['limite'],
                    'credito_disponible'   => $d['credito'],
                    'sin_limite'           => false,
                    'puntos_actuales'      => $d['puntos'],
                    'puede_emitir_vales'   => $d['estado'] === Distribuidora::ESTADO_ACTIVA,
                    'es_externa'           => false,
                    'activada_en'          => in_array($d['estado'], [
                        Distribuidora::ESTADO_ACTIVA,
                        Distribuidora::ESTADO_MOROSA,
                        Distribuidora::ESTADO_INACTIVA,
                        Distribuidora::ESTADO_BLOQUEADA,
                        Distribuidora::ESTADO_CERRADA,
                    ], true) ? now()->subDays(30) : null,
                    'desactivada_en'       => in_array($d['estado'], [
                        Distribuidora::ESTADO_INACTIVA,
                        Distribuidora::ESTADO_BLOQUEADA,
                        Distribuidora::ESTADO_CERRADA,
                    ], true) ? now()->subDays(5) : null,
                ]
            );

            // Cuenta bancaria asociada a la distribuidora (propietario polimorfico)
            $cuenta = CuentaBancaria::updateOrCreate(
                [
                    'tipo_propietario' => CuentaBancaria::TIPO_DISTRIBUIDORA,
                    'propietario_id'   => $distribuidora->id,
                ],
                [
                    'banco'                 => 'BBVA',
                    'nombre_titular'        => $d['nombre'] . ' ' . $d['paterno'] . ' ' . $d['materno'],
                    'numero_cuenta_mascarado' => '****' . substr($clabe, -4),
                    'clabe'                 => $clabe,
                    'convenio'              => null,
                    'referencia_base'       => $numeroDistribuidora,
                    'es_principal'          => true,
                    'verificada_en'         => now(),
                    'creado_en'             => now(),
                    'actualizado_en'        => now(),
                ]
            );

            // Ligar la cuenta a la distribuidora
            $distribuidora->update(['cuenta_bancaria_id' => $cuenta->id]);
        }

        $this->command?->info('15 distribuidoras creadas (9 ACTIVA + 6 estados especiales) con sus usuarios y cuentas bancarias.');
        $this->command?->info('Alias: distribuidora = dist1 de Centro');
    }
}
