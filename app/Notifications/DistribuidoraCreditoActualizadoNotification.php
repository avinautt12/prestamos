<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class DistribuidoraCreditoActualizadoNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $incremento;
    protected $score;

    public function __construct($incremento, $score)
    {
        $this->incremento = $incremento;
        $this->score = $score;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('¡Tu límite de crédito ha sido incrementado!')
            ->greeting('¡Felicidades!')
            ->line('Tu límite de crédito ha sido incrementado automáticamente este mes.')
            ->line('Incremento aplicado: $' . number_format($this->incremento, 2))
            ->line('Score obtenido: ' . $this->score)
            ->line('Sigue manteniendo un buen historial para obtener más beneficios.')
            ->salutation('Saludos, el equipo de Crédito');
    }
}
