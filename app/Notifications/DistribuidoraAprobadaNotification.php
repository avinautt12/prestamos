<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DistribuidoraAprobadaNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly float $limiteCredito,
        private readonly string $numeroDistribuidora,
        private readonly bool $esIncremento = false
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        $tipo = $this->esIncremento ? 'LIMITE_INCREMENTADO' : 'LIMITE_AUTORIZADO';
        $titulo = $this->esIncremento
            ? 'Tu limite de credito fue incrementado'
            : 'Tu limite de credito fue autorizado';
        $mensaje = $this->esIncremento
            ? 'Tu limite fue incrementado a $' . number_format($this->limiteCredito, 2) . '.'
            : 'Tu solicitud fue aprobada con un limite de $' . number_format($this->limiteCredito, 2) . '.';

        return [
            'tipo' => $tipo,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'numero_distribuidora' => $this->numeroDistribuidora,
            'limite_credito' => $this->limiteCredito,
            'es_incremento' => $this->esIncremento,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
