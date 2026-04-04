<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SolicitudListaParaAprobacion implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sucursalId,
        public int $solicitudId,
        public string $clienteNombre
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('sucursal.' . $this->sucursalId)];
    }

    public function broadcastAs(): string
    {
        return 'SolicitudListaParaAprobacion';
    }

    public function broadcastWith(): array
    {
        return [
            'solicitud_id' => $this->solicitudId,
            'cliente_nombre' => $this->clienteNombre,
            'tipo_alerta' => 'SOLICITUD_LISTA_PARA_APROBACION',
        ];
    }
}
