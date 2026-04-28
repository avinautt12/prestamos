<?php

namespace App\Services;

use App\Models\PartidaRelacionCorte;
use App\Models\RelacionCorte;
use Illuminate\Support\Facades\DB;

class AbonoPartidasService
{
    public function aplicarAbono(RelacionCorte $relacion, float $montoConciliado): void
    {
        if ($montoConciliado <= 0) {
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

                $restante = round($restante - $abono, 2);
            }
        });
    }

    public function marcarPartidasComoPagadas(RelacionCorte $relacion): void
    {
        DB::transaction(function () use ($relacion) {
            PartidaRelacionCorte::query()
                ->where('relacion_corte_id', $relacion->id)
                ->update([
                    'monto_pagado_previo' => DB::raw('monto_total_linea'),
                ]);
        });
    }
}
