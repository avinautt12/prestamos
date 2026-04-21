<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReportePeriodicoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $titulo,
        public string $alcance,
        public string $periodoEtiqueta,
        public string $excelContents,
        public string $nombreArchivo,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->titulo . ' — ' . $this->periodoEtiqueta,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reporte_periodico',
            with: [
                'titulo' => $this->titulo,
                'alcance' => $this->alcance,
                'periodoEtiqueta' => $this->periodoEtiqueta,
                'nombreArchivo' => $this->nombreArchivo,
            ],
        );
    }

    /**
     * @return Attachment[]
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->excelContents, $this->nombreArchivo)
                ->withMime('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ];
    }
}
