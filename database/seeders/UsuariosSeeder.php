<?php

namespace Database\Seeders;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsuariosSeeder extends Seeder
{
    /**
     * Crea 13 usuarios operativos:
     *   - 1 ADMIN global
     *   - Por sucursal (Centro y Norte): 1 gerente, 1 coordinador, 3 verificadores, 1 cajera
     *
     * Los usuarios con rol DISTRIBUIDORA se crean en DistribuidorasSeeder.
     *
     * Password común: password123
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        $usuarios = $this->definicionUsuarios();

        foreach ($usuarios as $u) {
            $sucursalId = null;
            if (!empty($u['sucursal'])) {
                $sucursal = Sucursal::where('codigo', $u['sucursal'])->first();
                if (!$sucursal) {
                    $this->command?->warn("Sucursal {$u['sucursal']} no encontrada. Saltando {$u['nombre_usuario']}.");
                    continue;
                }
                $sucursalId = $sucursal->id;
            }

            $rol = Rol::where('codigo', $u['rol'])->first();
            if (!$rol) {
                $this->command?->warn("Rol {$u['rol']} no encontrado. Saltando {$u['nombre_usuario']}.");
                continue;
            }

            $persona = Persona::updateOrCreate(
                ['curp' => $u['curp']],
                [
                    'primer_nombre'      => $u['primer_nombre'],
                    'apellido_paterno'   => $u['apellido_paterno'],
                    'apellido_materno'   => $u['apellido_materno'],
                    'sexo'               => $u['sexo'],
                    'fecha_nacimiento'   => $u['fecha_nacimiento'],
                    'rfc'                => $u['rfc'],
                    'telefono_celular'   => $u['telefono'],
                    'correo_electronico' => $u['correo'],
                    'ciudad'             => 'Torreon',
                    'estado'             => 'Coahuila',
                    'codigo_postal'      => '27000',
                    'creado_en'          => now(),
                    'actualizado_en'     => now(),
                ]
            );

            $usuario = Usuario::updateOrCreate(
                ['nombre_usuario' => $u['nombre_usuario']],
                [
                    'persona_id'     => $persona->id,
                    'clave_hash'     => $password,
                    'activo'         => true,
                    'requiere_vpn'   => false,
                    'canal_login'    => 'WEB',
                    'creado_en'      => now(),
                    'actualizado_en' => now(),
                ]
            );

            DB::table('usuario_rol')->updateOrInsert(
                [
                    'usuario_id'  => $usuario->id,
                    'rol_id'      => $rol->id,
                    'sucursal_id' => $sucursalId,
                ],
                [
                    'asignado_en'  => now(),
                    'revocado_en'  => null,
                    'es_principal' => true,
                ]
            );
        }

        $this->command?->info('13 usuarios creados: 1 admin global + 12 operativos (2 sucursales × 6 usuarios).');
        $this->command?->info('Password comun: password123');
        $this->command?->info('Alias: admin / gerente / coordinador / verificador / cajera (los 4 de Centro)');
    }

    /**
     * 13 usuarios: 1 admin + 6 por sucursal × 2 sucursales.
     */
    private function definicionUsuarios(): array
    {
        return [
            // ---------- ADMIN (global) ----------
            [
                'nombre_usuario'   => 'admin',
                'rol'              => 'ADMIN',
                'sucursal'         => null,
                'primer_nombre'    => 'Admin',
                'apellido_paterno' => 'Sistema',
                'apellido_materno' => 'Prestamofacil',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1980-01-01',
                'curp'             => 'SIPA800101HCLRRD00',
                'rfc'              => 'SIPA800101000',
                'telefono'         => '8711000000',
                'correo'           => 'admin@prestamofacil.test',
            ],

            // ==================== SUCURSAL CENTRO ====================
            // ---------- GERENTE ----------
            [
                'nombre_usuario'   => 'gerente',
                'rol'              => 'GERENTE',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Ricardo',
                'apellido_paterno' => 'Martinez',
                'apellido_materno' => 'Lopez',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1978-03-15',
                'curp'             => 'MALR780315HCLRPC01',
                'rfc'              => 'MALR780315A31',
                'telefono'         => '8711100001',
                'correo'           => 'gerente@prestamofacil.test',
            ],
            // ---------- COORDINADOR ----------
            [
                'nombre_usuario'   => 'coordinador',
                'rol'              => 'COORDINADOR',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Miguel',
                'apellido_paterno' => 'Hernandez',
                'apellido_materno' => 'Soto',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1985-05-10',
                'curp'             => 'HESM850510HCLRTG04',
                'rfc'              => 'HESM850510D14',
                'telefono'         => '8711200001',
                'correo'           => 'coordinador@prestamofacil.test',
            ],
            // ---------- VERIFICADORES (3) ----------
            [
                'nombre_usuario'   => 'verificador',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Carlos',
                'apellido_paterno' => 'Flores',
                'apellido_materno' => 'Diaz',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1990-02-14',
                'curp'             => 'FODC900214HCLLZR07',
                'rfc'              => 'FODC900214G77',
                'telefono'         => '8711300001',
                'correo'           => 'verificador@prestamofacil.test',
            ],
            [
                'nombre_usuario'   => 'verif2.trc_centro',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Andrea',
                'apellido_paterno' => 'Medina',
                'apellido_materno' => 'Salas',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1992-06-28',
                'curp'             => 'MESA920628MCLDLN08',
                'rfc'              => 'MESA920628H98',
                'telefono'         => '8711300002',
                'correo'           => 'verif2.trc_centro@prestamofacil.test',
            ],
            [
                'nombre_usuario'   => 'verif3.trc_centro',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Oscar',
                'apellido_paterno' => 'Hinojosa',
                'apellido_materno' => 'Villanueva',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1991-11-09',
                'curp'             => 'HIVO911109HCLHLL16',
                'rfc'              => 'HIVO911109Q16',
                'telefono'         => '8711300003',
                'correo'           => 'verif3.trc_centro@prestamofacil.test',
            ],
            // ---------- CAJERA ----------
            [
                'nombre_usuario'   => 'cajera',
                'rol'              => 'CAJERA',
                'sucursal'         => 'SUC-TRC-CENTRO',
                'primer_nombre'    => 'Claudia',
                'apellido_paterno' => 'Ruiz',
                'apellido_materno' => 'Mendoza',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1986-11-25',
                'curp'             => 'RUMC861125MCLZNL13',
                'rfc'              => 'RUMC861125M93',
                'telefono'         => '8711400001',
                'correo'           => 'cajera@prestamofacil.test',
            ],

            // ==================== SUCURSAL NORTE ====================
            // ---------- GERENTE ----------
            [
                'nombre_usuario'   => 'gerente.trc_nte',
                'rol'              => 'GERENTE',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Patricia',
                'apellido_paterno' => 'Gonzalez',
                'apellido_materno' => 'Fuentes',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1982-07-22',
                'curp'             => 'GOFP820722MCLNNT02',
                'rfc'              => 'GOFP820722B52',
                'telefono'         => '8711100002',
                'correo'           => 'gerente.trc_nte@prestamofacil.test',
            ],
            // ---------- COORDINADOR ----------
            [
                'nombre_usuario'   => 'coord.trc_nte',
                'rol'              => 'COORDINADOR',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Laura',
                'apellido_paterno' => 'Vazquez',
                'apellido_materno' => 'Morales',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1988-09-05',
                'curp'             => 'VAML880905MCLZRR05',
                'rfc'              => 'VAML880905E35',
                'telefono'         => '8711200002',
                'correo'           => 'coord.trc_nte@prestamofacil.test',
            ],
            // ---------- VERIFICADORES (3) ----------
            [
                'nombre_usuario'   => 'verif1.trc_nte',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Sergio',
                'apellido_paterno' => 'Ortega',
                'apellido_materno' => 'Garcia',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1987-04-03',
                'curp'             => 'OEGS870403HCLRRC09',
                'rfc'              => 'OEGS870403I19',
                'telefono'         => '8711300004',
                'correo'           => 'verif1.trc_nte@prestamofacil.test',
            ],
            [
                'nombre_usuario'   => 'verif2.trc_nte',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Brenda',
                'apellido_paterno' => 'Reyes',
                'apellido_materno' => 'Jimenez',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1993-08-21',
                'curp'             => 'REJB930821MCLYMR10',
                'rfc'              => 'REJB930821J30',
                'telefono'         => '8711300005',
                'correo'           => 'verif2.trc_nte@prestamofacil.test',
            ],
            [
                'nombre_usuario'   => 'verif3.trc_nte',
                'rol'              => 'VERIFICADOR',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Raul',
                'apellido_paterno' => 'Delgado',
                'apellido_materno' => 'Escobedo',
                'sexo'             => 'M',
                'fecha_nacimiento' => '1989-12-02',
                'curp'             => 'DEER891202HCLLSC17',
                'rfc'              => 'DEER891202R17',
                'telefono'         => '8711300006',
                'correo'           => 'verif3.trc_nte@prestamofacil.test',
            ],
            // ---------- CAJERA ----------
            [
                'nombre_usuario'   => 'cajera.trc_nte',
                'rol'              => 'CAJERA',
                'sucursal'         => 'SUC-TRC-NTE',
                'primer_nombre'    => 'Veronica',
                'apellido_paterno' => 'Cortes',
                'apellido_materno' => 'Romero',
                'sexo'             => 'F',
                'fecha_nacimiento' => '1991-03-19',
                'curp'             => 'CORV910319MCLRMR14',
                'rfc'              => 'CORV910319N14',
                'telefono'         => '8711400002',
                'correo'           => 'cajera.trc_nte@prestamofacil.test',
            ],
        ];
    }
}
