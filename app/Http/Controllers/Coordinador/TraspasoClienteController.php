<?php

namespace App\Http\Controllers\Coordinador;

use App\Http\Controllers\Controller;
use App\Models\SolicitudTraspasoCliente;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Notifications\TraspasoClienteNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TraspasoClienteController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

        $filtros = [
            'estado' => (string) $request->string('estado', 'PENDIENTE_COORDINADOR'),
        ];

        $query = SolicitudTraspasoCliente::query()
            ->with([
                'cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'distribuidoraOrigen.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'distribuidoraDestino.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'solicitadaPor.persona:id,primer_nombre,apellido_paterno,apellido_materno',
            ])
            ->whereHas('distribuidoraDestino', function ($q) use ($usuario, $sucursal) {
                $q->where(function ($sub) use ($usuario, $sucursal) {
                    $sub->where('coordinador_usuario_id', $usuario->id);

                    if ($sucursal?->id) {
                        $sub->orWhere('sucursal_id', $sucursal->id);
                    }
                });
            });

        if ($filtros['estado'] !== 'TODOS') {
            $query->where('estado', $filtros['estado']);
        }

        $solicitudes = $query
            ->orderByRaw("CASE WHEN estado = 'PENDIENTE_COORDINADOR' THEN 0 ELSE 1 END")
            ->orderByDesc('creado_en')
            ->limit(150)
            ->get()
            ->map(function (SolicitudTraspasoCliente $solicitud) {
                return [
                    'id' => $solicitud->id,
                    'estado' => $solicitud->estado,
                    'cliente' => [
                        'codigo' => $solicitud->cliente?->codigo_cliente,
                        'nombre' => $this->nombrePersona($solicitud->cliente?->persona),
                    ],
                    'origen' => [
                        'numero' => $solicitud->distribuidoraOrigen?->numero_distribuidora,
                        'nombre' => $this->nombrePersona($solicitud->distribuidoraOrigen?->persona),
                    ],
                    'destino' => [
                        'numero' => $solicitud->distribuidoraDestino?->numero_distribuidora,
                        'nombre' => $this->nombrePersona($solicitud->distribuidoraDestino?->persona),
                    ],
                    'codigo_confirmacion' => $solicitud->codigo_confirmacion,
                    'codigo_expira_en' => $solicitud->codigo_expira_en,
                    'motivo_solicitud' => $solicitud->motivo_solicitud,
                    'motivo_rechazo' => $solicitud->motivo_rechazo,
                    'creado_en' => $solicitud->creado_en,
                    'puede_dictaminar' => $solicitud->estado === SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR,
                ];
            })
            ->values();

        return Inertia::render('Coordinador/Traspasos', [
            'filtros' => $filtros,
            'solicitudes' => $solicitudes,
            'sucursal' => $sucursal ? [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ] : null,
        ]);
    }

    public function aprobar(SolicitudTraspasoCliente $traspaso): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->coordinadorPuedeGestionar($usuario, $traspaso)) {
            abort(404);
        }

        if ($traspaso->estado !== SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR) {
            return back()->withErrors(['general' => 'La solicitud ya no está pendiente de aprobación.']);
        }

        $codigo = $this->generarCodigoConfirmacion();

        $traspaso->estado = SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO;
        $traspaso->coordinador_usuario_id = $usuario->id;
        $traspaso->codigo_confirmacion = $codigo;
        $traspaso->codigo_generado_en = now();
        $traspaso->codigo_expira_en = now()->addHours(24);
        $traspaso->motivo_rechazo = null;
        $traspaso->save();

        $this->notificarAprobacion($traspaso, $codigo);

        return redirect()
            ->route('coordinador.traspasos.index')
            ->with('success', 'Solicitud aprobada. El código de confirmación fue emitido.');
    }

    public function rechazar(Request $request, SolicitudTraspasoCliente $traspaso): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->coordinadorPuedeGestionar($usuario, $traspaso)) {
            abort(404);
        }

        if ($traspaso->estado !== SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR) {
            return back()->withErrors(['general' => 'La solicitud ya no está pendiente para rechazo.']);
        }

        $data = $request->validate([
            'motivo_rechazo' => ['required', 'string', 'max:1000'],
        ]);

        $traspaso->estado = SolicitudTraspasoCliente::ESTADO_RECHAZADA;
        $traspaso->coordinador_usuario_id = $usuario->id;
        $traspaso->motivo_rechazo = $data['motivo_rechazo'];
        $traspaso->save();

        $this->notificarRechazo($traspaso, $data['motivo_rechazo']);

        return redirect()
            ->route('coordinador.traspasos.index')
            ->with('success', 'Solicitud rechazada.');
    }

    private function coordinadorPuedeGestionar(Usuario $usuario, SolicitudTraspasoCliente $traspaso): bool
    {
        if ((int) $traspaso->distribuidoraDestino?->coordinador_usuario_id === (int) $usuario->id) {
            return true;
        }

        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

        return $sucursal
            && (int) $traspaso->distribuidoraDestino?->sucursal_id === (int) $sucursal->id;
    }

    private function generarCodigoConfirmacion(): string
    {
        return strtoupper(Str::random(8));
    }

    private function notificarAprobacion(SolicitudTraspasoCliente $traspaso, string $codigo): void
    {
        $origenUsuario = $traspaso->distribuidoraOrigen
            ? Usuario::query()->where('persona_id', $traspaso->distribuidoraOrigen->persona_id)->first()
            : null;

        $destinoUsuario = $traspaso->distribuidoraDestino
            ? Usuario::query()->where('persona_id', $traspaso->distribuidoraDestino->persona_id)->first()
            : null;

        if ($origenUsuario) {
            $origenUsuario->notify(new TraspasoClienteNotification(
                'TRASPASO_APROBADO',
                'Traspaso aprobado',
                "Recibiste un traspaso aprobado. Código de confirmación: {$codigo}.",
                [
                    'solicitud_traspaso_id' => $traspaso->id,
                    'codigo_confirmacion' => $codigo,
                    'expira_en' => optional($traspaso->codigo_expira_en)->toIso8601String(),
                ]
            ));
        }

        if ($destinoUsuario) {
            $destinoUsuario->notify(new TraspasoClienteNotification(
                'TRASPASO_APROBADO',
                'Solicitud aprobada',
                'Tu solicitud fue aprobada. Espera confirmación de la distribuidora origen para finalizar el traspaso.',
                ['solicitud_traspaso_id' => $traspaso->id]
            ));
        }
    }

    private function notificarRechazo(SolicitudTraspasoCliente $traspaso, string $motivo): void
    {
        $destinoUsuario = $traspaso->distribuidoraDestino
            ? Usuario::query()->where('persona_id', $traspaso->distribuidoraDestino->persona_id)->first()
            : null;

        $origenUsuario = $traspaso->distribuidoraOrigen
            ? Usuario::query()->where('persona_id', $traspaso->distribuidoraOrigen->persona_id)->first()
            : null;

        if ($destinoUsuario) {
            $destinoUsuario->notify(new TraspasoClienteNotification(
                'TRASPASO_RECHAZADO',
                'Solicitud de traspaso rechazada',
                'El coordinador rechazó la solicitud de traspaso.',
                [
                    'solicitud_traspaso_id' => $traspaso->id,
                    'motivo_rechazo' => $motivo,
                ]
            ));
        }

        if ($origenUsuario) {
            $origenUsuario->notify(new TraspasoClienteNotification(
                'TRASPASO_RECHAZADO',
                'Solicitud de traspaso rechazada',
                'El coordinador rechazó el traspaso solicitado para un cliente de tu cartera.',
                [
                    'solicitud_traspaso_id' => $traspaso->id,
                    'motivo_rechazo' => $motivo,
                ]
            ));
        }
    }

    private function obtenerSucursalActivaCoordinador(Usuario $usuario): ?Sucursal
    {
        $rolCoordinador = $usuario->roles()
            ->where('roles.codigo', 'COORDINADOR')
            ->wherePivotNull('revocado_en')
            ->whereNotNull('usuario_rol.sucursal_id')
            ->orderByDesc('usuario_rol.es_principal')
            ->orderByDesc('usuario_rol.asignado_en')
            ->first();

        if ($rolCoordinador && $rolCoordinador->pivot?->sucursal_id) {
            return Sucursal::find($rolCoordinador->pivot->sucursal_id);
        }

        return Sucursal::where('activo', true)->orderBy('id')->first();
    }

    private function nombrePersona($persona): string
    {
        if (!$persona) {
            return 'Sin nombre';
        }

        $nombre = trim(implode(' ', array_filter([
            $persona->primer_nombre,
            $persona->segundo_nombre,
            $persona->apellido_paterno,
            $persona->apellido_materno,
        ])));

        return $nombre !== '' ? $nombre : 'Sin nombre';
    }
}
