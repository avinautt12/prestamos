<?php

namespace App\Http\Controllers\Distribuidora;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\SolicitudTraspasoCliente;
use App\Models\Usuario;
use App\Models\Vale;
use App\Notifications\TraspasoClienteNotification;
use App\Services\Distribuidora\DistribuidoraContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TraspasoClienteController extends Controller
{
    public function __construct(private readonly DistribuidoraContextService $contextService) {}

    public function index(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/Traspasos', [
                'distribuidora' => null,
                'filtros' => [
                    'estado' => 'TODOS',
                ],
                'solicitudes' => [],
            ]);
        }

        $filtros = [
            'estado' => (string) $request->string('estado', 'TODOS'),
        ];

        $query = SolicitudTraspasoCliente::query()
            ->with([
                'cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'distribuidoraOrigen.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'distribuidoraDestino.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
            ])
            ->where(function ($sub) use ($distribuidora) {
                $sub->where('distribuidora_origen_id', $distribuidora->id)
                    ->orWhere('distribuidora_destino_id', $distribuidora->id);
            });

        if ($filtros['estado'] !== 'TODOS') {
            $query->where('estado', $filtros['estado']);
        }

        $solicitudes = $query
            ->orderByDesc('creado_en')
            ->limit(100)
            ->get()
            ->map(function (SolicitudTraspasoCliente $solicitud) use ($distribuidora) {
                $esOrigen = (int) $solicitud->distribuidora_origen_id === (int) $distribuidora->id;
                $expirada = $solicitud->codigo_expira_en && now()->greaterThan($solicitud->codigo_expira_en);

                return [
                    'id' => $solicitud->id,
                    'estado' => $solicitud->estado,
                    'cliente' => [
                        'id' => $solicitud->cliente?->id,
                        'codigo' => $solicitud->cliente?->codigo_cliente,
                        'nombre' => $this->nombrePersona($solicitud->cliente?->persona),
                    ],
                    'origen' => [
                        'id' => $solicitud->distribuidora_origen_id,
                        'numero' => $solicitud->distribuidoraOrigen?->numero_distribuidora,
                        'nombre' => $this->nombrePersona($solicitud->distribuidoraOrigen?->persona),
                    ],
                    'destino' => [
                        'id' => $solicitud->distribuidora_destino_id,
                        'numero' => $solicitud->distribuidoraDestino?->numero_distribuidora,
                        'nombre' => $this->nombrePersona($solicitud->distribuidoraDestino?->persona),
                    ],
                    'es_origen' => $esOrigen,
                    'es_destino' => !$esOrigen,
                    'codigo_confirmacion' => $esOrigen ? $solicitud->codigo_confirmacion : null,
                    'codigo_expira_en' => $solicitud->codigo_expira_en,
                    'expirada' => $expirada,
                    'motivo_solicitud' => $solicitud->motivo_solicitud,
                    'motivo_rechazo' => $solicitud->motivo_rechazo,
                    'creado_en' => $solicitud->creado_en,
                    'ejecutada_en' => $solicitud->ejecutada_en,
                    'puede_confirmar' => $esOrigen
                        && $solicitud->estado === SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO
                        && !$expirada,
                ];
            })
            ->values();

        return Inertia::render('Distribuidora/Traspasos', [
            'distribuidora' => [
                'id' => $distribuidora->id,
                'numero' => $distribuidora->numero_distribuidora,
                'estado' => $distribuidora->estado,
                'puede_emitir_vales' => (bool) $distribuidora->puede_emitir_vales,
            ],
            'filtros' => $filtros,
            'solicitudes' => $solicitudes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $distribuidoraDestino = $this->obtenerDistribuidoraActual();
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$distribuidoraDestino) {
            return back()->withErrors(['general' => 'Tu usuario no tiene una distribuidora asignada.']);
        }

        $data = $request->validate([
            'codigo_cliente' => ['required', 'string', 'max:30'],
            'motivo_solicitud' => ['nullable', 'string', 'max:1000'],
        ]);

        $cliente = Cliente::query()
            ->where('codigo_cliente', strtoupper(trim((string) $data['codigo_cliente'])))
            ->orWhere('codigo_cliente', trim((string) $data['codigo_cliente']))
            ->first();

        if (!$cliente) {
            return back()->withErrors(['codigo_cliente' => 'No existe un cliente con ese código.']);
        }

        $relacionOrigen = DB::table('clientes_distribuidora')
            ->where('cliente_id', $cliente->id)
            ->where('estado_relacion', 'ACTIVA')
            ->where('distribuidora_id', '!=', $distribuidoraDestino->id)
            ->orderByDesc('vinculado_en')
            ->first();

        if (!$relacionOrigen) {
            return back()->withErrors(['codigo_cliente' => 'El cliente no tiene una distribuidora origen activa para traspaso.']);
        }

        if ((int) $relacionOrigen->distribuidora_id === (int) $distribuidoraDestino->id) {
            return back()->withErrors(['codigo_cliente' => 'El cliente ya pertenece a tu distribuidora.']);
        }

        $deudaAbierta = Vale::query()
            ->where('distribuidora_id', (int) $relacionOrigen->distribuidora_id)
            ->where('cliente_id', $cliente->id)
            ->whereNotIn('estado', [
                Vale::ESTADO_LIQUIDADO,
                Vale::ESTADO_CANCELADO,
                Vale::ESTADO_REVERSADO,
            ])
            ->exists();

        if ($deudaAbierta) {
            return back()->withErrors(['codigo_cliente' => 'El cliente tiene deuda abierta con su distribuidora actual.']);
        }

        $duplicada = SolicitudTraspasoCliente::query()
            ->where('cliente_id', $cliente->id)
            ->whereIn('estado', [
                SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR,
                SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO,
            ])
            ->exists();

        if ($duplicada) {
            return back()->withErrors(['codigo_cliente' => 'Ya existe una solicitud activa para este cliente.']);
        }

        $solicitud = SolicitudTraspasoCliente::query()->create([
            'cliente_id' => $cliente->id,
            'distribuidora_origen_id' => (int) $relacionOrigen->distribuidora_id,
            'distribuidora_destino_id' => $distribuidoraDestino->id,
            'solicitada_por_usuario_id' => $usuario->id,
            'motivo_solicitud' => $data['motivo_solicitud'] ?? null,
            'estado' => SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR,
        ]);

        $this->notificarPartesSolicitudCreada($solicitud);

        return redirect()
            ->route('distribuidora.traspasos.index')
            ->with('success', 'Solicitud de traspaso enviada al coordinador para aprobación.');
    }

    public function confirmar(Request $request, SolicitudTraspasoCliente $traspaso): RedirectResponse
    {
        $distribuidoraActual = $this->obtenerDistribuidoraActual();
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$distribuidoraActual) {
            abort(404);
        }

        if ((int) $traspaso->distribuidora_origen_id !== (int) $distribuidoraActual->id) {
            abort(403);
        }

        $data = $request->validate([
            'codigo_confirmacion' => ['required', 'string', 'max:32'],
            'comentarios' => ['nullable', 'string', 'max:1000'],
        ]);

        $codigo = strtoupper(trim($data['codigo_confirmacion']));

        try {
            DB::transaction(function () use ($traspaso, $distribuidoraActual, $usuario, $codigo, $data) {
                $solicitud = SolicitudTraspasoCliente::query()
                    ->where('id', $traspaso->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($solicitud->estado !== SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO) {
                    throw new \RuntimeException('La solicitud ya no está disponible para confirmación.');
                }

                if (!$solicitud->codigo_expira_en || now()->greaterThan($solicitud->codigo_expira_en)) {
                    $solicitud->estado = SolicitudTraspasoCliente::ESTADO_EXPIRADA;
                    $solicitud->save();
                    $this->notificarPartesCodigoExpirado($solicitud);
                    throw new \RuntimeException('El código de confirmación expiró.');
                }

                if (strtoupper((string) $solicitud->codigo_confirmacion) !== $codigo) {
                    throw new \RuntimeException('El código de confirmación no coincide.');
                }

                $deudaAbierta = Vale::query()
                    ->where('distribuidora_id', $solicitud->distribuidora_origen_id)
                    ->where('cliente_id', $solicitud->cliente_id)
                    ->whereNotIn('estado', [
                        Vale::ESTADO_LIQUIDADO,
                        Vale::ESTADO_CANCELADO,
                        Vale::ESTADO_REVERSADO,
                    ])
                    ->exists();

                if ($deudaAbierta) {
                    throw new \RuntimeException('No se puede traspasar: el cliente mantiene deuda activa con origen.');
                }

                $afectadasOrigen = DB::table('clientes_distribuidora')
                    ->where('distribuidora_id', $solicitud->distribuidora_origen_id)
                    ->where('cliente_id', $solicitud->cliente_id)
                    ->where('estado_relacion', 'ACTIVA')
                    ->update([
                        'estado_relacion' => 'TERMINADA',
                        'desvinculado_en' => now(),
                    ]);

                if ($afectadasOrigen === 0) {
                    throw new \RuntimeException('No existe relación activa con la distribuidora origen.');
                }

                DB::table('clientes_distribuidora')->updateOrInsert(
                    [
                        'distribuidora_id' => $solicitud->distribuidora_destino_id,
                        'cliente_id' => $solicitud->cliente_id,
                    ],
                    [
                        'estado_relacion' => 'ACTIVA',
                        'bloqueado_por_parentesco' => false,
                        'observaciones_parentesco' => null,
                        'vinculado_en' => now(),
                        'desvinculado_en' => null,
                    ]
                );

                $solicitud->estado = SolicitudTraspasoCliente::ESTADO_EJECUTADA;
                $solicitud->confirmada_por_usuario_id = $usuario->id;
                $solicitud->confirmada_en = now();
                $solicitud->ejecutada_en = now();
                $solicitud->comentarios = $data['comentarios'] ?? null;
                $solicitud->codigo_confirmacion = null;
                $solicitud->save();

                $this->notificarPartesTraspasoEjecutado($solicitud);
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors(['codigo_confirmacion' => $e->getMessage()]);
        }

        return redirect()
            ->route('distribuidora.traspasos.index')
            ->with('success', 'Traspaso ejecutado correctamente.');
    }

    public function cancelar(SolicitudTraspasoCliente $traspaso): RedirectResponse
    {
        $distribuidoraActual = $this->obtenerDistribuidoraActual();

        if (!$distribuidoraActual) {
            abort(404);
        }

        if ((int) $traspaso->distribuidora_destino_id !== (int) $distribuidoraActual->id) {
            abort(403);
        }

        if ($traspaso->estado !== SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR) {
            return back()->withErrors(['general' => 'Solo se pueden cancelar solicitudes pendientes de coordinador.']);
        }

        $traspaso->estado = SolicitudTraspasoCliente::ESTADO_CANCELADA;
        $traspaso->save();

        $this->notificarPartesSolicitudCancelada($traspaso);

        return redirect()
            ->route('distribuidora.traspasos.index')
            ->with('success', 'Solicitud cancelada.');
    }

    private function obtenerDistribuidoraActual(): ?Distribuidora
    {
        /** @var Usuario|null $usuario */
        $usuario = Auth::user();

        return $this->contextService->resolveForUser($usuario);
    }

    private function notificarPartesSolicitudCreada(SolicitudTraspasoCliente $solicitud): void
    {
        $origen = Distribuidora::query()->find($solicitud->distribuidora_origen_id);
        $destino = Distribuidora::query()->find($solicitud->distribuidora_destino_id);

        $usuarioOrigen = $origen ? Usuario::query()->where('persona_id', $origen->persona_id)->first() : null;
        $usuarioCoordinadorOrigen = $origen?->coordinador_usuario_id ? Usuario::query()->find($origen->coordinador_usuario_id) : null;
        $usuarioCoordinadorDestino = $destino?->coordinador_usuario_id ? Usuario::query()->find($destino->coordinador_usuario_id) : null;

        if ($usuarioOrigen) {
            $usuarioOrigen->notify(new TraspasoClienteNotification(
                'TRASPASO_SOLICITADO',
                'Solicitud de traspaso recibida',
                'Se solicitó transferir un cliente de tu cartera. Queda pendiente de aprobación del coordinador.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }

        if ($usuarioCoordinadorDestino) {
            $usuarioCoordinadorDestino->notify(new TraspasoClienteNotification(
                'TRASPASO_PENDIENTE_COORDINADOR',
                'Tienes un traspaso por revisar',
                'Una distribuidora solicitó transferir cliente entre carteras.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }

        if ($usuarioCoordinadorOrigen && (!$usuarioCoordinadorDestino || $usuarioCoordinadorOrigen->id !== $usuarioCoordinadorDestino->id)) {
            $usuarioCoordinadorOrigen->notify(new TraspasoClienteNotification(
                'TRASPASO_SOLICITADO',
                'Solicitud de traspaso registrada',
                'Se registró una solicitud para transferir un cliente de una cartera de tu red.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }
    }

    private function notificarPartesSolicitudCancelada(SolicitudTraspasoCliente $solicitud): void
    {
        $origen = Distribuidora::query()->find($solicitud->distribuidora_origen_id);
        $destino = Distribuidora::query()->find($solicitud->distribuidora_destino_id);

        $usuarioOrigen = $origen ? Usuario::query()->where('persona_id', $origen->persona_id)->first() : null;
        $usuarioCoordinadorDestino = $destino?->coordinador_usuario_id ? Usuario::query()->find($destino->coordinador_usuario_id) : null;

        if ($usuarioOrigen) {
            $usuarioOrigen->notify(new TraspasoClienteNotification(
                'TRASPASO_CANCELADO',
                'Solicitud de traspaso cancelada',
                'La distribuidora destino canceló la solicitud antes del dictamen.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }

        if ($usuarioCoordinadorDestino) {
            $usuarioCoordinadorDestino->notify(new TraspasoClienteNotification(
                'TRASPASO_CANCELADO',
                'Solicitud cancelada por distribuidora',
                'Una solicitud de traspaso fue cancelada antes de revisión.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }
    }

    private function notificarPartesTraspasoEjecutado(SolicitudTraspasoCliente $solicitud): void
    {
        $usuarioDestino = Usuario::query()
            ->whereHas('persona.distribuidora', function ($q) use ($solicitud) {
                $q->where('id', $solicitud->distribuidora_destino_id);
            })
            ->first();

        $usuarioCoordinador = $solicitud->coordinador_usuario_id
            ? Usuario::query()->find($solicitud->coordinador_usuario_id)
            : null;

        if ($usuarioDestino) {
            $usuarioDestino->notify(new TraspasoClienteNotification(
                'TRASPASO_EJECUTADO',
                'Cliente traspasado exitosamente',
                'El cliente ya fue liberado por la distribuidora origen y se agregó a tu cartera.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }

        if ($usuarioCoordinador) {
            $usuarioCoordinador->notify(new TraspasoClienteNotification(
                'TRASPASO_EJECUTADO',
                'Traspaso completado',
                'La distribuidora origen confirmó el código y el traspaso quedó ejecutado.',
                ['solicitud_traspaso_id' => $solicitud->id]
            ));
        }
    }

    private function notificarPartesCodigoExpirado(SolicitudTraspasoCliente $solicitud): void
    {
        $origen = Distribuidora::query()->find($solicitud->distribuidora_origen_id);
        $destino = Distribuidora::query()->find($solicitud->distribuidora_destino_id);

        $usuarioOrigen = $origen ? Usuario::query()->where('persona_id', $origen->persona_id)->first() : null;
        $usuarioDestino = $destino ? Usuario::query()->where('persona_id', $destino->persona_id)->first() : null;
        $usuarioCoordinador = $solicitud->coordinador_usuario_id ? Usuario::query()->find($solicitud->coordinador_usuario_id) : null;

        $payload = [
            'solicitud_traspaso_id' => $solicitud->id,
            'cliente_id' => $solicitud->cliente_id,
        ];

        if ($usuarioOrigen) {
            $usuarioOrigen->notify(new TraspasoClienteNotification(
                'TRASPASO_CODIGO_EXPIRADO',
                'Código de traspaso expirado',
                'El código de confirmación venció y la solicitud quedó expirada.',
                $payload
            ));
        }

        if ($usuarioDestino) {
            $usuarioDestino->notify(new TraspasoClienteNotification(
                'TRASPASO_CODIGO_EXPIRADO',
                'Código de traspaso expirado',
                'El código de confirmación venció y la solicitud quedó expirada.',
                $payload
            ));
        }

        if ($usuarioCoordinador) {
            $usuarioCoordinador->notify(new TraspasoClienteNotification(
                'TRASPASO_CODIGO_EXPIRADO',
                'Código de traspaso expirado',
                'El código de confirmación venció y la solicitud quedó expirada.',
                $payload
            ));
        }
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
