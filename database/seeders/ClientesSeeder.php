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
     * Crea 2–3 clientes ACTIVO por cada distribuidora ACTIVA (total ~10).
     * El número de clientes por distribuidora es variable (alterna 3/2/3/2) para
     * dar variedad en los seeders.
     *
     * Las distribuidoras CANDIDATA no reciben clientes (aún no operan).
     */
    public function run(): void
    {
        $distribuidorasActivas = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
            ->orderBy('id')
            ->get();

        if ($distribuidorasActivas->isEmpty()) {
            $this->command?->warn('No hay distribuidoras ACTIVA. Corre DistribuidorasSeeder primero.');
            return;
        }

        // Pool de nombres para clientes. Alcanza para ~12 (4 distribuidoras × 3 máx).
        $nombresClientes = [
            ['Sofia', 'Jimenez', 'Cruz', 'F'],
            ['Luis', 'Hernandez', 'Peralta', 'M'],
            ['Maria Elena', 'Rodriguez', 'Sanchez', 'F'],
            ['Carlos', 'Ramirez', 'Lopez', 'M'],
            ['Laura Patricia', 'Gomez', 'Torres', 'F'],
            ['Jose', 'Villarreal', 'Nava', 'M'],
            ['Ana', 'Cortez', 'Robles', 'F'],
            ['Pedro', 'Aguilar', 'Soto', 'M'],
            ['Gabriela', 'Moreno', 'Serna', 'F'],
            ['Rafael', 'Castro', 'Aguirre', 'M'],
            ['Claudia', 'Tapia', 'Villegas', 'F'],
            ['Miguel', 'Herrera', 'Benitez', 'M'],
        ];

        $codigo = 1;
        $idx = 0;
        // Patrón variable 3 / 2 / 3 / 2 para dar variedad
        $cantidadPorDist = [3, 2, 3, 2];

        foreach ($distribuidorasActivas as $d => $distribuidora) {
            $cantidad = $cantidadPorDist[$d % count($cantidadPorDist)];

            for ($j = 0; $j < $cantidad && $idx < count($nombresClientes); $j++, $idx++) {
                $n = $nombresClientes[$idx];
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
                        'prevale_aprobado'         => true,
                        'bloqueado_por_parentesco' => false,
                        'observaciones_parentesco' => null,
                        'vinculado_en'             => now()->subDays(60),
                        'desvinculado_en'          => null,
                    ]
                );
            }
        }

        $total = $codigo - 1;
        $this->command?->info("{$total} clientes ACTIVO creados (2–3 por distribuidora ACTIVA).");
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
