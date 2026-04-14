<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DistribuidoraOperacionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $tipo,
        private readonly string $titulo,
        private readonly string $mensaje,
        private readonly array $meta = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        return array_merge([
            'tipo' => $this->tipo,
            'titulo' => $this->titulo,
            'mensaje' => $this->mensaje,
            'timestamp' => now()->toIso8601String(),
        ], $this->meta);
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
