<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BienvenidaCorporativaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $nombre,
        public readonly string $nombreUsuario,
        public readonly string $passwordPlano,
        public readonly string $rolNombre,
        public readonly string $loginUrl
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Bienvenido al equipo de Prestamo Facil')
            ->view('emails.bienvenida_corporativa');
    }
}
