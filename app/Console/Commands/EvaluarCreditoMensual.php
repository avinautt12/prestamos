<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Distribuidora;
use App\Models\CategoriaDistribuidora;
use App\Notifications\DistribuidoraCreditoActualizadoNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EvaluarCreditoMensual extends Command
{
    protected $signature = 'credito:evaluar-mensual';
    protected $description = 'Evalúa y aplica aumentos automáticos de crédito a distribuidoras según score mensual';

    public function handle()
    {
        $umbral = config('credito.umbral_incremento_auto', 10000); // Puedes ajustar el umbral
        $distribuidoras = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)->get();
        $resultados = [];

        foreach ($distribuidoras as $dist) {
            $score = $this->calcularScore($dist);
            $incremento = $this->calcularIncremento($score, $dist);
            $aplicar = $incremento <= $umbral;

            if ($aplicar && $incremento > 0) {
                $this->aplicarIncremento($dist, $incremento, $score);
                $resultados[] = [
                    'distribuidora' => $dist->id,
                    'score' => $score,
                    'incremento' => $incremento,
                    'accion' => 'aplicado',
                ];
            } elseif ($incremento > 0) {
                // Aquí podrías registrar sugerencia
                $resultados[] = [
                    'distribuidora' => $dist->id,
                    'score' => $score,
                    'incremento' => $incremento,
                    'accion' => 'sugerido',
                ];
            }
        }

        $this->info('Evaluación mensual de crédito completada.');
        $this->table(['Distribuidora', 'Score', 'Incremento', 'Acción'], $resultados);
        return 0;
    }

    protected function calcularScore(Distribuidora $dist)
    {
        // Penalizaciones
        $penalizacion = 0;
        $penalizacion += $dist->vales_morosos_count * 5;
        $penalizacion += $dist->pagos_rechazados_count * 3;
        $penalizacion += $dist->vales_cancelados_count * 2;
        $penalizacion += min($dist->atraso_promedio_dias, 30) * 1; // 1 punto por día de atraso promedio

        // Bonificaciones
        $bonificacion = 0;
        $bonificacion += $dist->vales_buenos_recientes_count * 2;
        $bonificacion += $dist->pagos_conciliados_count * 1;
        $bonificacion += $dist->sin_morosidad_reciente ? 10 : 0;

        // Score base
        $score = 100 - $penalizacion + $bonificacion;
        return max(0, min(100, $score));
    }

    protected function calcularIncremento($score, Distribuidora $dist)
    {
        if ($score >= 90) {
            return $dist->limite_credito * 0.20;
        } elseif ($score >= 80) {
            return $dist->limite_credito * 0.15;
        } elseif ($score >= 70) {
            return $dist->limite_credito * 0.10;
        }
        return 0;
    }

    protected function aplicarIncremento(Distribuidora $dist, $incremento, $score)
    {
        DB::transaction(function () use ($dist, $incremento, $score) {
            $dist->limite_credito += $incremento;
            $dist->credito_disponible += $incremento;
            $dist->save();

            // Registrar en historial (ejemplo, ajusta según tu modelo real)
            $dist->historialCredito()->create([
                'tipo' => 'INCREMENTO_AUTOMATICO',
                'monto' => $incremento,
                'score' => $score,
                'fecha' => Carbon::now(),
            ]);

            // Notificar
            $dist->notify(new DistribuidoraCreditoActualizadoNotification($incremento, $score));
        });
    }
}
