<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActualizacionCredito implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $usuarioId,
        public int $distribuidoraId,
        public string $numeroDistribuidora,
        public float $nuevoLimite
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->usuarioId)];
    }

    public function broadcastAs(): string
    {
        return 'ActualizacionCredito';
    }

    public function broadcastWith(): array
    {
        return [
            'distribuidora_id' => $this->distribuidoraId,
            'numero_distribuidora' => $this->numeroDistribuidora,
            'nuevo_limite' => $this->nuevoLimite,
            'tipo_alerta' => 'ACTUALIZACION_CREDITO',
        ];
    }
}
