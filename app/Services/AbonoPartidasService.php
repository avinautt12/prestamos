<?php

namespace App\Services;

use App\Models\PartidaRelacionCorte;
use App\Models\RelacionCorte;
use Illuminate\Support\Facades\DB;

class AbonoPartidasService
{
    public function aplicarAbono(RelacionCorte $relacion, float $montoConciliado): void
    {
        // LOG TEMPORAL: Inicio de aplicar abono
        \Log::info('[ABONO] Inicio aplicarAbono', [
            'relacion_id' => $relacion->id,
            'relacion_estado' => $relacion->estado,
            'monto_conciliado' => $montoConciliado,
            'total_a_pagar' => $relacion->total_a_pagar,
        ]);

        if ($montoConciliado <= 0) {
            \Log::info('[ABONO] Abono cero o negativo, no aplica', ['monto' => $montoConciliado]);
            return;
        }

        DB::transaction(function () use ($relacion, $montoConciliado) {
            $relacion->load('partidas');

            $partidas = $relacion->partidas
                ->sortBy([
                    ['es_atraso', 'desc'],
                    ['numero_quincena', 'asc'],
                    ['id', 'asc'],
                ])
                ->values();

            // LOG TEMPORAL: Partidas encontradas
            \Log::info('[ABONO] Partidas a procesar', [
                'relacion_id' => $relacion->id,
                'partidas_count' => $partidas->count(),
                'partidas_ids' => $partidas->pluck('id')->toArray(),
            ]);

            $restante = $montoConciliado;

            foreach ($partidas as $partida) {
                if ($restante <= 0) {
                    break;
                }

                $falta = max(0.0, round((float) $partida->monto_total_linea - (float) $partida->monto_pagado_previo, 2));
                if ($falta <= 0) {
                    continue;
                }

                $abono = min($restante, $falta);
                $partida->monto_pagado_previo = round((float) $partida->monto_pagado_previo + $abono, 2);
                $partida->save();

                // LOG TEMPORAL: Partida actualizada
                \Log::info('[ABONO] Partida actualizada', [
                    'partida_id' => $partida->id,
                    'monto_total_linea' => $partida->monto_total_linea,
                    'monto_pagado_previo' => $partida->monto_pagado_previo,
                    'abono_aplicado' => $abono,
                    'restante' => $restante,
                ]);

                $restante = round($restante - $abono, 2);
            }

            // LOG TEMPORAL: Fin de aplicacion
            \Log::info('[ABONO] Fin aplicarAbono', [
                'relacion_id' => $relacion->id,
                'monto_original' => $montoConciliado,
                'monto_restante' => $restante,
            ]);
        });
    }

    public function marcarPartidasComoPagadas(RelacionCorte $relacion): void
    {
        // LOG TEMPORAL: Marcar partidas como pagadas
        \Log::info('[ABONO] MarcarPartidasComoPagadas inicio', [
            'relacion_id' => $relacion->id,
        ]);

        DB::transaction(function () use ($relacion) {
            PartidaRelacionCorte::query()
                ->where('relacion_corte_id', $relacion->id)
                ->update([
                    'monto_pagado_previo' => DB::raw('monto_total_linea'),
                ]);

            // LOG TEMPORAL: Verificar actualizacion
            $partidas = PartidaRelacionCorte::where('relacion_corte_id', $relacion->id)->get();
            \Log::info('[ABONO] Partidas marcadas como pagadas', [
                'relacion_id' => $relacion->id,
                'partidas_count' => $partidas->count(),
                'suman_total' => $partidas->sum('monto_pagado_previo'),
            ]);
        });
    }
}
