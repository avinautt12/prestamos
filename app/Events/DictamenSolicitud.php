<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DictamenSolicitud implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $usuarioId,
        public int $solicitudId,
        public string $resultado,
        public string $clienteNombre
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->usuarioId)];
    }

    public function broadcastAs(): string
    {
        return 'DictamenSolicitud';
    }

    public function broadcastWith(): array
    {
        return [
            'solicitud_id' => $this->solicitudId,
            'resultado' => $this->resultado,
            'cliente_nombre' => $this->clienteNombre,
            'tipo_alerta' => 'DICTAMEN_SOLICITUD',
        ];
    }
}
