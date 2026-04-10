<?php

namespace App\Services\Distribuidora;

use App\Models\Distribuidora;
use App\Models\Usuario;
use App\Notifications\DistribuidoraOperacionNotification;

class DistribuidoraNotificationService
{
    public function notificar(
        Distribuidora $distribuidora,
        string $tipo,
        string $titulo,
        string $mensaje,
        array $meta = []
    ): void {
        $usuario = Usuario::query()
            ->where('persona_id', $distribuidora->persona_id)
            ->where('activo', true)
            ->whereHas('roles', function ($query) {
                $query->where('codigo', 'DISTRIBUIDORA');
            })
            ->latest('id')
            ->first();

        if (!$usuario) {
            return;
        }

        $usuario->notify(new DistribuidoraOperacionNotification(
            $tipo,
            $titulo,
            $mensaje,
            array_merge([
                'distribuidora_id' => (int) $distribuidora->id,
                'numero_distribuidora' => (string) $distribuidora->numero_distribuidora,
            ], $meta)
        ));
    }
}
