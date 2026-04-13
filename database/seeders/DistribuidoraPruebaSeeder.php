<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Models\Solicitud;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class DistribuidoraPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = CategoriaDistribuidora::query()->pluck('id', 'codigo');
        $sucursales = Sucursal::query()->orderBy('codigo')->get();

        foreach ($sucursales as $index => $sucursal) {
            $solicitud = Solicitud::query()
                ->where('sucursal_id', $sucursal->id)
                ->where('estado', Solicitud::ESTADO_APROBADA)
                ->first();

            if (!$solicitud) {
                continue;
            }

            $categoriaCodigo = ['COBRE', 'PLATA', 'ORO', 'DIAMANTE', 'PLATA'][$index] ?? 'PLATA';

            Distribuidora::updateOrCreate(
                ['persona_id' => $solicitud->persona_solicitante_id],
                [
                    'persona_id' => $solicitud->persona_solicitante_id,
                    'solicitud_id' => $solicitud->id,
                    'sucursal_id' => $sucursal->id,
                    'coordinador_usuario_id' => $solicitud->coordinador_usuario_id,
                    'categoria_id' => $categorias[$categoriaCodigo] ?? null,
                    'numero_distribuidora' => 'DIST-PRI-' . strtoupper(substr($sucursal->codigo, 4, 3)) . '-' . ($index + 1),
                    'estado' => Distribuidora::ESTADO_ACTIVA,
                    'limite_credito' => 120000 + ($index * 15000),
                    'credito_disponible' => 70000 + ($index * 8000),
                    'sin_limite' => false,
                    'puntos_actuales' => 80 + ($index * 25),
                    'puede_emitir_vales' => true,
                    'es_externa' => false,
                    'activada_en' => now()->subDays(40 + ($index * 3)),
                ]
            );
        }

        $this->command?->info('Distribuidoras primarias creadas o actualizadas por sucursal.');
    }
}
