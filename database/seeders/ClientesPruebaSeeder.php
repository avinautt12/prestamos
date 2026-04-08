<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClientesPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $distribuidora = Distribuidora::where('numero_distribuidora', 'DIST-PRUEBA-001')->first();

        if (!$distribuidora) {
            $this->command?->warn('No se encontró la distribuidora de prueba. Ejecuta DistribuidoraPruebaSeeder primero.');
            return;
        }

        $clientes = [
            [
                'persona' => [
                    'primer_nombre' => 'María',
                    'segundo_nombre' => 'Elena',
                    'apellido_paterno' => 'Rodríguez',
                    'apellido_materno' => 'Sánchez',
                    'sexo' => 'F',
                    'curp' => 'ROSM900315MDFDNR08',
                    'telefono_celular' => '5523456789',
                    'correo_electronico' => 'maria.rodriguez@correo.com',
                    'calle' => 'Av. Juárez',
                    'numero_exterior' => '45',
                    'colonia' => 'Centro',
                    'ciudad' => 'Puebla',
                    'estado' => 'Puebla',
                    'codigo_postal' => '72000',
                ],
                'codigo_cliente' => 'CLI-PRUEBA-002',
            ],
            [
                'persona' => [
                    'primer_nombre' => 'Carlos',
                    'segundo_nombre' => null,
                    'apellido_paterno' => 'Hernández',
                    'apellido_materno' => 'López',
                    'sexo' => 'M',
                    'curp' => 'HELC850720HDFRPS05',
                    'telefono_celular' => '5534567890',
                    'correo_electronico' => 'carlos.hernandez@correo.com',
                    'calle' => 'Calle 5 de Mayo',
                    'numero_exterior' => '120',
                    'colonia' => 'La Paz',
                    'ciudad' => 'Puebla',
                    'estado' => 'Puebla',
                    'codigo_postal' => '72160',
                ],
                'codigo_cliente' => 'CLI-PRUEBA-003',
            ],
            [
                'persona' => [
                    'primer_nombre' => 'Laura',
                    'segundo_nombre' => 'Patricia',
                    'apellido_paterno' => 'Gómez',
                    'apellido_materno' => 'Torres',
                    'sexo' => 'F',
                    'curp' => 'GOTL920108MDFMRR07',
                    'telefono_celular' => '5545678901',
                    'correo_electronico' => 'laura.gomez@correo.com',
                    'calle' => 'Blvd. Atlixco',
                    'numero_exterior' => '78',
                    'colonia' => 'Las Ánimas',
                    'ciudad' => 'Puebla',
                    'estado' => 'Puebla',
                    'codigo_postal' => '72400',
                ],
                'codigo_cliente' => 'CLI-PRUEBA-004',
            ],
        ];

        foreach ($clientes as $data) {
            $persona = Persona::updateOrCreate(
                ['curp' => $data['persona']['curp']],
                $data['persona']
            );

            $cliente = Cliente::updateOrCreate(
                ['persona_id' => $persona->id],
                [
                    'codigo_cliente' => $data['codigo_cliente'],
                    'estado' => Cliente::ESTADO_ACTIVO,
                ]
            );

            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id' => $cliente->id,
                ],
                [
                    'estado_relacion' => 'ACTIVA',
                    'vinculado_en' => now(),
                ]
            );
        }

        $this->command?->info('3 clientes de prueba creados y ligados a la distribuidora.');
    }
}
