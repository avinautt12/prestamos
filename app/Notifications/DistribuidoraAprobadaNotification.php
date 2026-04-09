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
        private readonly string $numeroDistribuidora
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo' => 'LIMITE_AUTORIZADO',
            'titulo' => 'Tu limite de credito fue autorizado',
            'mensaje' => 'Tu solicitud fue aprobada con un limite de $' . number_format($this->limiteCredito, 2) . '.',
            'numero_distribuidora' => $this->numeroDistribuidora,
            'limite_credito' => $this->limiteCredito,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
