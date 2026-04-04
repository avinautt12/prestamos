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
        return ['broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'tipo' => 'LIMITE_AUTORIZADO',
            'titulo' => 'Tu límite de crédito fue autorizado',
            'mensaje' => 'Tu solicitud fue aprobada con un límite de $' . number_format($this->limiteCredito, 2) . '.',
            'numero_distribuidora' => $this->numeroDistribuidora,
            'limite_credito' => $this->limiteCredito,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
