<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SolicitudTomadaVerificadorNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly int $solicitudId,
        private readonly string $clienteNombre,
        private readonly string $verificadorNombre
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo' => 'SOLICITUD_TOMADA_VERIFICADOR',
            'titulo' => 'Solicitud tomada por verificador',
            'mensaje' => $this->verificadorNombre . ' tomo la solicitud de ' . $this->clienteNombre . '.',
            'solicitud_id' => $this->solicitudId,
            'cliente_nombre' => $this->clienteNombre,
            'verificador_nombre' => $this->verificadorNombre,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
