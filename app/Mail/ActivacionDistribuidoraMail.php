<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActivacionDistribuidoraMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $nombre,
        public readonly string $activationLink,
        public readonly string $numeroDistribuidora
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Activa tu cuenta de Prestamo Facil')
            ->view('emails.activacion_distribuidora');
    }
}
