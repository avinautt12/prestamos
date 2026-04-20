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
     * Crea 5 distribuidoras distribuidas en las 2 sucursales:
     *
     *   CENTRO:
     *     - 2 ACTIVA (ligadas a las solicitudes APROBADAS de Centro)
     *     (No hay fila aquí para la solicitud VERIFICADA de Centro — aún está pendiente
     *      de decisión del gerente y no se ha creado la distribuidora.)
     *
     *   NORTE:
     *     - 2 ACTIVA (ligadas a las solicitudes APROBADAS de Norte)
     *     - 1 CANDIDATA (ligada a la solicitud POSIBLE_DISTRIBUIDORA de Norte)
     *
     * Password común: password123
     * Alias: `distribuidora` → dist1.trc_centro (primera ACTIVA de Centro)
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        $centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first();
        $norte  = Sucursal::where('codigo', 'SUC-TRC-NTE')->first();

        $coordCentro = Usuario::where('nombre_usuario', 'coordinador')->first();
        $coordNorte  = Usuario::where('nombre_usuario', 'coord.trc_nte')->first();

        $catCobre = CategoriaDistribuidora::where('codigo', 'COBRE')->first();
        $catPlata = CategoriaDistribuidora::where('codigo', 'PLATA')->first();

        $rolDist = Rol::where('codigo', 'DISTRIBUIDORA')->first();

        // Solicitudes APROBADAS ordenadas por ID — las primeras 2 son de Centro, las 2 siguientes de Norte.
        $aprobadasCentro = Solicitud::where('estado', Solicitud::ESTADO_APROBADA)
            ->where('sucursal_id', $centro->id)
            ->orderBy('id')
            ->get();
        $aprobadasNorte = Solicitud::where('estado', Solicitud::ESTADO_APROBADA)
            ->where('sucursal_id', $norte->id)
            ->orderBy('id')
            ->get();

        $solicitudCandidata = Solicitud::where('estado', Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA)
            ->where('sucursal_id', $norte->id)
            ->first();

        $definiciones = [
            // ---------- CENTRO ACTIVA ----------
            [
                'usuario' => 'distribuidora',
                'nombre' => 'Abarrotes', 'paterno' => 'Martinez', 'materno' => 'Ortega', 'sexo' => 'F',
                'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catCobre,
                'estado' => Distribuidora::ESTADO_ACTIVA,
                'limite' => 50000, 'credito' => 50000, 'puntos' => 0,
                'solicitud' => $aprobadasCentro[0] ?? null,
            ],
            [
                'usuario' => 'dist2.trc_centro',
                'nombre' => 'Deposito', 'paterno' => 'Garcia', 'materno' => 'Reyes', 'sexo' => 'M',
                'sucursal' => $centro, 'coord' => $coordCentro, 'cat' => $catPlata,
                'estado' => Distribuidora::ESTADO_ACTIVA,
                'limite' => 80000, 'credito' => 80000, 'puntos' => 0,
                'solicitud' => $aprobadasCentro[1] ?? null,
            ],

            // ---------- NORTE ACTIVA ----------
            [
                'usuario' => 'dist1.trc_nte',
                'nombre' => 'Tiendita', 'paterno' => 'Lopez', 'materno' => 'Cantu', 'sexo' => 'F',
                'sucursal' => $norte, 'coord' => $coordNorte, 'cat' => $catCobre,
                'estado' => Distribuidora::ESTADO_ACTIVA,
                'limite' => 40000, 'credito' => 40000, 'puntos' => 0,
                'solicitud' => $aprobadasNorte[0] ?? null,
            ],
            [
                'usuario' => 'dist2.trc_nte',
                'nombre' => 'Bodega', 'paterno' => 'Ramirez', 'materno' => 'Solis', 'sexo' => 'M',
                'sucursal' => $norte, 'coord' => $coordNorte, 'cat' => $catPlata,
                'estado' => Distribuidora::ESTADO_ACTIVA,
                'limite' => 70000, 'credito' => 70000, 'puntos' => 0,
                'solicitud' => $aprobadasNorte[1] ?? null,
            ],

            // ---------- NORTE CANDIDATA (sin aprobar) ----------
            [
                'usuario' => 'dist.candidata',
                'nombre' => 'Candidata', 'paterno' => 'Tovar', 'materno' => 'Kessler', 'sexo' => 'M',
                'sucursal' => $norte, 'coord' => $coordNorte, 'cat' => $catCobre,
                'estado' => Distribuidora::ESTADO_CANDIDATA,
                'limite' => 0, 'credito' => 0, 'puntos' => 0,
                'solicitud' => $solicitudCandidata,
                'persona_existente' => $solicitudCandidata?->persona_solicitante_id,
            ],
        ];

        $consecutivos = ['SUC-TRC-CENTRO' => 0, 'SUC-TRC-NTE' => 0];
        $sufijoSucursal = ['SUC-TRC-CENTRO' => 'C', 'SUC-TRC-NTE' => 'N'];

        foreach ($definiciones as $i => $d) {
            $codSuc = $d['sucursal']->codigo;
            $consecutivos[$codSuc]++;
            $numeroDistribuidora = sprintf('PFDIST%03d-%s', $consecutivos[$codSuc], $sufijoSucursal[$codSuc]);

            // 1. Persona (reutilizar si es CANDIDATA ligada a solicitud existente)
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
                    'activo'         => true,
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

            // 3. Distribuidora (primero sin cuenta; después asignamos)
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
                    'activada_en'          => $d['estado'] === Distribuidora::ESTADO_ACTIVA ? now()->subDays(30) : null,
                    'desactivada_en'       => null,
                ]
            );

            // 4. Cuenta bancaria (solo para ACTIVAS)
            if ($d['estado'] === Distribuidora::ESTADO_ACTIVA) {
                $clabe = '0460900000' . str_pad((string) ($i + 1000), 8, '0', STR_PAD_LEFT);
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

                $distribuidora->update(['cuenta_bancaria_id' => $cuenta->id]);
            }
        }

        $this->command?->info('5 distribuidoras creadas: 4 ACTIVA (2 por sucursal) + 1 CANDIDATA (Norte).');
        $this->command?->info('Alias: distribuidora = dist1 de Centro');
    }
}
