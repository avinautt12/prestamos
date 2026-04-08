<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class DistribuidoraPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $persona = Persona::where('curp', 'DISTRI123456789ABC')->first();

        if (!$persona) {
            $this->command?->warn('No se encontró la persona de prueba DISTRIBUIDORA. Ejecuta UsuarioTestSeeder primero.');
            return;
        }

        $sucursal = Sucursal::where('codigo', 'SUC-MATRIZ')->first();
        $categoria = CategoriaDistribuidora::where('codigo', 'PLATA')->first();

        Distribuidora::updateOrCreate(
            ['persona_id' => $persona->id],
            [
                'sucursal_id'            => $sucursal->id,
                'coordinador_usuario_id' => 2,
                'categoria_id'           => $categoria->id,
                'numero_distribuidora'   => 'DIST-PRUEBA-001',
                'estado'                 => 'ACTIVA',
                'limite_credito'         => 100000.00,
                'credito_disponible'     => 100000.00,
                'sin_limite'             => false,
                'puntos_actuales'        => 0,
                'puede_emitir_vales'     => true,
                'es_externa'             => false,
                'activada_en'            => now(),
            ]
        );

        $this->command?->info('Distribuidora de prueba creada/actualizada (PLATA, crédito $100,000)');
    }
}
