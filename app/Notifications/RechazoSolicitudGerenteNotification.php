<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class RechazoSolicitudGerenteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly int $solicitudId,
        private readonly string $clienteNombre,
        private readonly string $motivo
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo' => 'RECHAZO_GERENTE',
            'titulo' => 'Solicitud rechazada por gerencia',
            'mensaje' => $this->clienteNombre . ' fue rechazada. Motivo: ' . $this->motivo,
            'solicitud_id' => $this->solicitudId,
            'cliente_nombre' => $this->clienteNombre,
            'motivo_rechazo' => $this->motivo,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
