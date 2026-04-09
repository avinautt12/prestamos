<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlertaMorosidad implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sucursalId,
        public string $clienteNombre,
        public ?int $relacionCorteId = null,
        public ?string $detalle = null
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('sucursal.' . $this->sucursalId)];
    }

    public function broadcastAs(): string
    {
        return 'AlertaMorosidad';
    }

    public function broadcastWith(): array
    {
        return [
            'cliente_nombre' => $this->clienteNombre,
            'relacion_corte_id' => $this->relacionCorteId,
            'detalle' => $this->detalle,
            'tipo_alerta' => 'ALERTA_MOROSIDAD',
        ];
    }
}
