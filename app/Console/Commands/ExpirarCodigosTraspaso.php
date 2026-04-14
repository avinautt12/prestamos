<?php

namespace App\Console\Commands;

use App\Models\SolicitudTraspasoCliente;
use App\Models\Usuario;
use App\Notifications\TraspasoClienteNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirarCodigosTraspaso extends Command
{
    protected $signature = 'traspasos:expirar-codigos';

    protected $description = 'Expira solicitudes de traspaso con codigo vencido y notifica a las partes involucradas';

    public function handle(): int
    {
        $totalExpiradas = 0;

        $candidatas = SolicitudTraspasoCliente::query()
            ->where('estado', SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO)
            ->whereNotNull('codigo_expira_en')
            ->where('codigo_expira_en', '<', now())
            ->pluck('id');

        foreach ($candidatas as $solicitudId) {
            $expirada = DB::transaction(function () use ($solicitudId) {
                $solicitud = SolicitudTraspasoCliente::query()
                    ->whereKey($solicitudId)
                    ->lockForUpdate()
                    ->first();

                if (!$solicitud) {
                    return null;
                }

                if ($solicitud->estado !== SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO) {
                    return null;
                }

                if (!$solicitud->codigo_expira_en || now()->lessThanOrEqualTo($solicitud->codigo_expira_en)) {
                    return null;
                }

                $solicitud->estado = SolicitudTraspasoCliente::ESTADO_EXPIRADA;
                $solicitud->codigo_confirmacion = null;
                $solicitud->save();

                return $solicitud;
            }, 3);

            if (!$expirada) {
                continue;
            }

            $expirada->loadMissing('cliente', 'distribuidoraOrigen', 'distribuidoraDestino');
            $this->notificarExpiracion($expirada);
            $totalExpiradas++;
        }

        $this->info("Solicitudes expiradas: {$totalExpiradas}");

        return self::SUCCESS;
    }

    private function notificarExpiracion(SolicitudTraspasoCliente $solicitud): void
    {
        $meta = [
            'solicitud_traspaso_id' => (int) $solicitud->id,
            'solicitud_id' => (int) $solicitud->id,
            'cliente_id' => (int) $solicitud->cliente_id,
            'cliente_codigo' => (string) ($solicitud->cliente?->codigo_cliente ?? ''),
            'estado' => (string) $solicitud->estado,
        ];

        $mensaje = 'El codigo de confirmacion vencio antes de completar el traspaso.';

        $usuarioOrigen = $this->resolveUsuarioDistribuidora((int) $solicitud->distribuidora_origen_id);
        if ($usuarioOrigen) {
            $usuarioOrigen->notify(new TraspasoClienteNotification(
                'TRASPASO_CODIGO_EXPIRADO',
                'Traspaso expirado',
                $mensaje,
                $meta
            ));
        }

        $usuarioDestino = $this->resolveUsuarioDistribuidora((int) $solicitud->distribuidora_destino_id);
        if ($usuarioDestino) {
            $usuarioDestino->notify(new TraspasoClienteNotification(
                'TRASPASO_CODIGO_EXPIRADO',
                'Traspaso expirado',
                $mensaje,
                $meta
            ));
        }

        if ($solicitud->coordinador_usuario_id) {
            $coordinador = Usuario::query()->find($solicitud->coordinador_usuario_id);
            if ($coordinador) {
                $coordinador->notify(new TraspasoClienteNotification(
                    'TRASPASO_CODIGO_EXPIRADO',
                    'Traspaso expirado',
                    $mensaje,
                    $meta
                ));
            }
        }
    }

    private function resolveUsuarioDistribuidora(int $distribuidoraId): ?Usuario
    {
        $personaId = DB::table('distribuidoras')
            ->where('id', $distribuidoraId)
            ->value('persona_id');

        if (!$personaId) {
            return null;
        }

        return Usuario::query()
            ->where('persona_id', $personaId)
            ->where('activo', true)
            ->whereHas('roles', function ($query) {
                $query->where('codigo', 'DISTRIBUIDORA');
            })
            ->latest('id')
            ->first();
    }
}
