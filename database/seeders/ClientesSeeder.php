<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClientesSeeder extends Seeder
{
    /**
     * Crea ~22 clientes cubriendo todos los estados:
     *   - 2 ACTIVO por distribuidora ACTIVA (18 total)
     *   - 1 EN_VERIFICACION (prospecto recien creado sin cajera aun)
     *   - 1 BLOQUEADO (rechazado por parentesco)
     *   - 1 MOROSO (con deuda vencida)
     *   - 1 INACTIVO (ya no opera)
     *
     * Vincula pivot clientes_distribuidora con los 3 estado_relacion posibles
     * (ACTIVA, BLOQUEADA, TERMINADA).
     */
    public function run(): void
    {
        $distribuidorasActivas = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)->get();

        if ($distribuidorasActivas->isEmpty()) {
            $this->command?->warn('No hay distribuidoras ACTIVA. Corre DistribuidorasSeeder primero.');
            return;
        }

        $codigo = 1;

        // 1. Clientes ACTIVO: 2 por distribuidora ACTIVA
        $nombresActivos = [
            ['Sofia', 'Jimenez', 'Cruz', 'F'],
            ['Luis', 'Hernandez', 'Peralta', 'M'],
            ['Maria Elena', 'Rodriguez', 'Sanchez', 'F'],
            ['Carlos', 'Hernandez', 'Lopez', 'M'],
            ['Laura Patricia', 'Gomez', 'Torres', 'F'],
            ['Jose', 'Villarreal', 'Nava', 'M'],
            ['Ana', 'Cortez', 'Robles', 'F'],
            ['Pedro', 'Ramirez', 'Soto', 'M'],
            ['Gabriela', 'Moreno', 'Serna', 'F'],
            ['Rafael', 'Castro', 'Aguirre', 'M'],
            ['Claudia', 'Tapia', 'Villegas', 'F'],
            ['Miguel', 'Herrera', 'Benitez', 'M'],
            ['Angelica', 'Robledo', 'Espinoza', 'F'],
            ['Rodrigo', 'Sauceda', 'Alvarez', 'M'],
            ['Yolanda', 'Ibarra', 'Montemayor', 'F'],
            ['Eduardo', 'Nava', 'Zepeda', 'M'],
            ['Dora', 'Maldonado', 'Contreras', 'F'],
            ['Jesus', 'Villegas', 'Ruelas', 'M'],
        ];

        $idx = 0;
        foreach ($distribuidorasActivas as $distribuidora) {
            for ($j = 0; $j < 2 && $idx < count($nombresActivos); $j++, $idx++) {
                $n = $nombresActivos[$idx];
                $cliente = $this->crearClienteConPersona(
                    codigo: 'CLI-COMP-' . str_pad((string) $codigo++, 3, '0', STR_PAD_LEFT),
                    nombre: $n[0],
                    paterno: $n[1],
                    materno: $n[2],
                    sexo: $n[3],
                    estado: Cliente::ESTADO_ACTIVO
                );

                DB::table('clientes_distribuidora')->updateOrInsert(
                    [
                        'distribuidora_id' => $distribuidora->id,
                        'cliente_id'       => $cliente->id,
                    ],
                    [
                        'estado_relacion'          => 'ACTIVA',
                        'bloqueado_por_parentesco' => false,
                        'observaciones_parentesco' => null,
                        'vinculado_en'             => now()->subDays(60),
                        'desvinculado_en'          => null,
                    ]
                );
            }
        }

        $primerDistActiva = $distribuidorasActivas->first();

        // 2. Cliente EN_VERIFICACION (prospecto nuevo que la cajera todavía no aprobó)
        $clienteVerif = $this->crearClienteConPersona(
            codigo: 'CLI-COMP-' . str_pad((string) $codigo++, 3, '0', STR_PAD_LEFT),
            nombre: 'Veronica',
            paterno: 'Prospecto',
            materno: 'Nueva',
            sexo: 'F',
            estado: Cliente::ESTADO_EN_VERIFICACION
        );
        DB::table('clientes_distribuidora')->updateOrInsert(
            ['distribuidora_id' => $primerDistActiva->id, 'cliente_id' => $clienteVerif->id],
            [
                'estado_relacion' => 'ACTIVA',
                'bloqueado_por_parentesco' => false,
                'observaciones_parentesco' => null,
                'vinculado_en' => now()->subHours(2),
                'desvinculado_en' => null,
            ]
        );

        // 3. Cliente BLOQUEADO (por parentesco - rechazado por cajera)
        $clienteBloq = $this->crearClienteConPersona(
            codigo: 'CLI-COMP-' . str_pad((string) $codigo++, 3, '0', STR_PAD_LEFT),
            nombre: 'Ernesto',
            paterno: 'Martinez',
            materno: 'Bloqueado',
            sexo: 'M',
            estado: Cliente::ESTADO_BLOQUEADO,
            notas: 'Rechazado en prevale: parentesco con distribuidora.'
        );
        DB::table('clientes_distribuidora')->updateOrInsert(
            ['distribuidora_id' => $primerDistActiva->id, 'cliente_id' => $clienteBloq->id],
            [
                'estado_relacion' => 'BLOQUEADA',
                'bloqueado_por_parentesco' => true,
                'observaciones_parentesco' => 'Apellido materno coincide con distribuidora. Rechazo inmediato.',
                'vinculado_en' => now()->subDays(15),
                'desvinculado_en' => now()->subDays(14),
            ]
        );

        // 4. Cliente MOROSO (con vale vencido sin pagar)
        $clienteMoroso = $this->crearClienteConPersona(
            codigo: 'CLI-COMP-' . str_pad((string) $codigo++, 3, '0', STR_PAD_LEFT),
            nombre: 'Roberto',
            paterno: 'Atrasado',
            materno: 'Vencido',
            sexo: 'M',
            estado: Cliente::ESTADO_MOROSO,
            notas: 'Vale con 45 dias de atraso.'
        );
        DB::table('clientes_distribuidora')->updateOrInsert(
            ['distribuidora_id' => $primerDistActiva->id, 'cliente_id' => $clienteMoroso->id],
            [
                'estado_relacion' => 'ACTIVA',
                'bloqueado_por_parentesco' => false,
                'observaciones_parentesco' => null,
                'vinculado_en' => now()->subDays(90),
                'desvinculado_en' => null,
            ]
        );

        // 5. Cliente INACTIVO (terminó su relación pero conserva histórico)
        $clienteInact = $this->crearClienteConPersona(
            codigo: 'CLI-COMP-' . str_pad((string) $codigo++, 3, '0', STR_PAD_LEFT),
            nombre: 'Felipe',
            paterno: 'Terminado',
            materno: 'Cerrado',
            sexo: 'M',
            estado: Cliente::ESTADO_INACTIVO,
            notas: 'Cliente dio de baja su relacion voluntariamente.'
        );
        DB::table('clientes_distribuidora')->updateOrInsert(
            ['distribuidora_id' => $primerDistActiva->id, 'cliente_id' => $clienteInact->id],
            [
                'estado_relacion' => 'TERMINADA',
                'bloqueado_por_parentesco' => false,
                'observaciones_parentesco' => null,
                'vinculado_en' => now()->subDays(365),
                'desvinculado_en' => now()->subDays(30),
            ]
        );

        $total = $codigo - 1;
        $this->command?->info("{$total} clientes creados: 18 ACTIVO (2 por distribuidora) + 4 estados especiales.");
    }

    private function crearClienteConPersona(
        string $codigo,
        string $nombre,
        string $paterno,
        string $materno,
        string $sexo,
        string $estado,
        ?string $notas = null
    ): Cliente {
        $curp = strtoupper(substr($paterno, 0, 2) . substr($materno, 0, 1) . substr($nombre, 0, 1))
            . '920101' . $sexo . 'CLCLIE' . str_pad(substr($codigo, -3), 2, '0', STR_PAD_LEFT);
        $curp = substr(str_pad($curp, 18, 'X'), 0, 18);

        $rfc = strtoupper(substr($paterno, 0, 2) . substr($materno, 0, 1) . substr($nombre, 0, 1))
            . '920101' . substr(md5($codigo), 0, 3);
        $rfc = strtoupper(substr($rfc, 0, 13));

        $persona = Persona::updateOrCreate(
            ['curp' => $curp],
            [
                'primer_nombre'      => $nombre,
                'apellido_paterno'   => $paterno,
                'apellido_materno'   => $materno,
                'sexo'               => $sexo,
                'fecha_nacimiento'   => '1992-01-01',
                'rfc'                => $rfc,
                'telefono_celular'   => '87170' . str_pad(substr($codigo, -3), 5, '0', STR_PAD_LEFT),
                'correo_electronico' => strtolower(str_replace(' ', '', $nombre)) . '.' . strtolower($paterno) . '@clientes.test',
                'calle'              => 'Calle ' . $nombre,
                'numero_exterior'    => (string) rand(100, 9999),
                'colonia'            => 'Centro',
                'ciudad'             => 'Torreon',
                'estado'             => 'Coahuila',
                'codigo_postal'      => '27000',
                'latitud'            => 25.5428,
                'longitud'           => -103.4068,
                'creado_en'          => now(),
                'actualizado_en'     => now(),
            ]
        );

        return Cliente::updateOrCreate(
            ['persona_id' => $persona->id],
            [
                'codigo_cliente' => $codigo,
                'estado'         => $estado,
                'notas'          => $notas,
                'foto_ine_frente'  => 'clientes/demo/ine_frente.jpg',
                'foto_ine_reverso' => 'clientes/demo/ine_reverso.jpg',
                'foto_selfie_ine'  => 'clientes/demo/selfie.jpg',
                'cuenta_banco'     => 'BBVA',
                'cuenta_clabe'     => '012180' . str_pad(substr($codigo, -3), 12, '0', STR_PAD_LEFT),
                'cuenta_titular'   => "{$nombre} {$paterno} {$materno}",
                'creado_en'        => now(),
                'actualizado_en'   => now(),
            ]
        );
    }
}
