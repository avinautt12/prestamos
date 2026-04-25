<?php

namespace App\Http\Controllers\Gerente;

use App\Mail\ActivacionDistribuidoraMail;
use App\Events\ActualizacionCredito;
use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\AprobarDistribuidoraRequest;
use App\Http\Requests\Gerente\RechazarDistribuidoraRequest;
use App\Models\BitacoraDecisionGerente;
use App\Models\CategoriaDistribuidora;
use App\Models\CuentaBancaria;
use App\Models\Distribuidora;
use App\Models\Rol;
use App\Models\SucursalConfiguracion;
use App\Notifications\RechazoSolicitudGerenteNotification;
use App\Notifications\DistribuidoraAprobadaNotification;
use App\Models\Solicitud;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AprobacionController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function index(Request $request)
    {
        /** @var \App\Models\Usuario $gerente */
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $solicitudes = Solicitud::with(['persona', 'sucursal', 'coordinador.persona', 'verificacion.verificador.persona'])
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->where('sucursal_id', $sucursalId)
            ->when($request->search, function ($query, $search) {
                $query->whereHas('persona', function ($personaQuery) use ($search) {
                    $personaQuery->where('primer_nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('curp', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('verificador'), function ($query) use ($request) {
                $search = $request->string('verificador')->toString();

                $query->whereHas('verificacion.verificador.persona', function ($personaQuery) use ($search) {
                    $personaQuery->where('primer_nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('fecha_desde'), function ($query) use ($request) {
                $query->whereDate('revisada_en', '>=', $request->string('fecha_desde')->toString());
            })
            ->when($request->filled('fecha_hasta'), function ($query) use ($request) {
                $query->whereDate('revisada_en', '<=', $request->string('fecha_hasta')->toString());
            })
            ->orderByDesc('revisada_en')
            ->orderByDesc('id')
            ->paginate(12)
            ->appends($request->query());

        return Inertia::render('Gerente/Distribuidoras/Index', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search', 'verificador', 'fecha_desde', 'fecha_hasta']),
            'securityPolicy' => [
                'requires_vpn' => (bool) config('security.gerente.require_vpn', false),
            ],
        ]);
    }

    public function rechazadas(Request $request)
    {
        /** @var \App\Models\Usuario $gerente */
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $solicitudes = Solicitud::with(['persona', 'sucursal', 'coordinador.persona'])
            ->where('estado', Solicitud::ESTADO_RECHAZADA)
            ->where('sucursal_id', $sucursalId)
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();

                $query->whereHas('persona', function ($personaQuery) use ($search) {
                    $personaQuery->where('primer_nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('curp', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('motivo'), function ($query) use ($request) {
                $query->where('motivo_rechazo', 'like', '%' . $request->string('motivo')->toString() . '%');
            })
            ->when($request->filled('fecha_desde'), function ($query) use ($request) {
                $query->whereDate('decidida_en', '>=', $request->string('fecha_desde')->toString());
            })
            ->when($request->filled('fecha_hasta'), function ($query) use ($request) {
                $query->whereDate('decidida_en', '<=', $request->string('fecha_hasta')->toString());
            })
            ->orderByDesc('decidida_en')
            ->orderByDesc('id')
            ->paginate(12)
            ->appends($request->query());

        return Inertia::render('Gerente/Distribuidoras/Rechazadas', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search', 'motivo', 'fecha_desde', 'fecha_hasta']),
        ]);
    }

    public function show(int $id)
    {
        /** @var \App\Models\Usuario $gerente */
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $solicitud = Solicitud::with([
            'persona',
            'sucursal',
            'coordinador.persona',
            'verificacion.verificador.persona',
        ])
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->where('sucursal_id', $sucursalId)
            ->findOrFail($id);

        $datosFamiliaresJson = $solicitud->datos_familiares_json;
        $solicitud->datos_familiares = $datosFamiliaresJson ? json_decode($datosFamiliaresJson, true) : [];

        $afiliacionesJson = $solicitud->afiliaciones_externas_json;
        $solicitud->afiliaciones = $afiliacionesJson ? json_decode($afiliacionesJson, true) : [];

        $vehiculosJson = $solicitud->vehiculos_json;
        $solicitud->vehiculos = $vehiculosJson ? json_decode($vehiculosJson, true) : [];

        $solicitud->ine_frente_url = $solicitud->ine_frente_path 
            ? $this->generarUrlEvidencia($solicitud->ine_frente_path) 
            : null;
        $solicitud->ine_reverso_url = $solicitud->ine_reverso_path 
            ? $this->generarUrlEvidencia($solicitud->ine_reverso_path) 
            : null;
        $solicitud->comprobante_domicilio_url = $solicitud->comprobante_domicilio_path 
            ? $this->generarUrlEvidencia($solicitud->comprobante_domicilio_path) 
            : null;
        $solicitud->reporte_buro_url = $solicitud->reporte_buro_path 
            ? $this->generarUrlEvidencia($solicitud->reporte_buro_path) 
            : null;

        if ($solicitud->verificacion) {
            $verificacion = $solicitud->verificacion;

            $checklistJson = $verificacion->getAttribute('checklist_json');
            $verificacion->checklist = $checklistJson ? json_decode($checklistJson, true) : null;

            $justificacionesJson = $verificacion->getAttribute('justificaciones_json');
            $verificacion->justificaciones = $justificacionesJson ? json_decode($justificacionesJson, true) : null;

            $evidenciasExtrasJson = $verificacion->getAttribute('evidencias_extras_json');
            $evidenciasExtras = $evidenciasExtrasJson ? json_decode($evidenciasExtrasJson, true) : [];

            $verificacion->foto_fachada_url = $verificacion->foto_fachada 
                ? $this->generarUrlEvidencia($verificacion->foto_fachada) 
                : null;
            $verificacion->foto_ine_con_persona_url = $verificacion->foto_ine_con_persona 
                ? $this->generarUrlEvidencia($verificacion->foto_ine_con_persona) 
                : null;
            $verificacion->foto_comprobante_url = $verificacion->foto_comprobante 
                ? $this->generarUrlEvidencia($verificacion->foto_comprobante) 
                : null;

            if (is_array($evidenciasExtras)) {
                $verificacion->evidencias_extras_urls = array_map(function ($evidencia) {
                    return [
                        'descripcion' => $evidencia['descripcion'] ?? '',
                        'url' => $this->generarUrlEvidencia($evidencia['ruta'] ?? null),
                    ];
                }, $evidenciasExtras);
            } else {
                $verificacion->evidencias_extras_urls = [];
            }
        }

        $configuracionSucursal = SucursalConfiguracion::query()
            ->where('sucursal_id', $sucursalId)
            ->first(['linea_credito_default', 'categorias_config_json']);

        $categoriasConfig = (array) ($configuracionSucursal?->categorias_config_json ?? []);

        $categorias = CategoriaDistribuidora::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'porcentaje_comision'])
            ->map(function (CategoriaDistribuidora $categoria) use ($categoriasConfig) {
                $override = $categoriasConfig[(string) $categoria->id] ?? null;

                if (is_array($override) && array_key_exists('porcentaje_comision', $override)) {
                    $categoria->porcentaje_comision = $override['porcentaje_comision'];
                }

                return $categoria;
            })
            ->values();

        return Inertia::render('Gerente/Distribuidoras/Show', [
            'solicitud' => $solicitud,
            'categorias' => $categorias,
            'configuracionSucursal' => $configuracionSucursal,
            'securityPolicy' => [
                'requires_vpn' => (bool) config('security.gerente.require_vpn', false),
            ],
        ]);
    }

    public function aprobar(AprobarDistribuidoraRequest $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            /** @var \App\Models\Usuario $gerente */
            $gerente = auth()->user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $solicitud = Solicitud::query()
                ->where('estado', Solicitud::ESTADO_VERIFICADA)
                ->where('sucursal_id', $sucursalId)
                ->findOrFail($id);

            $distribuidoraExistente = Distribuidora::query()
                ->where('persona_id', $solicitud->persona_solicitante_id)
                ->where('solicitud_id', '!=', $solicitud->id)
                ->exists();

            if ($distribuidoraExistente) {
                return back()->withErrors([
                    'general' => 'La persona ya está registrada como distribuidora en otra solicitud.',
                ]);
            }

            $numeroDistribuidora = $this->generarNumeroDistribuidora();
            $distribuidoraActual = Distribuidora::query()
                ->where('solicitud_id', $solicitud->id)
                ->first();

            $categoriaId = (int) $request->categoria_id;

            $montoAnterior = (float) ($distribuidoraActual?->limite_credito ?? 0);
            $montoNuevo = (float) $request->limite_credito;

            $distribuidora = Distribuidora::updateOrCreate(
                ['solicitud_id' => $solicitud->id],
                [
                    'persona_id' => $solicitud->persona_solicitante_id,
                    'sucursal_id' => $solicitud->sucursal_id,
                    'coordinador_usuario_id' => $solicitud->coordinador_usuario_id,
                    'categoria_id' => $categoriaId,
                    'numero_distribuidora' => $distribuidoraActual?->numero_distribuidora ?? $numeroDistribuidora,
                    'estado' => Distribuidora::ESTADO_ACTIVA,
                    'limite_credito' => $request->limite_credito,
                    'credito_disponible' => $request->limite_credito,
                    'sin_limite' => false,
                    'puntos_actuales' => 0,
                    'puede_emitir_vales' => true,
                    'activada_en' => now(),
                ]
            );

            $referenciaVisual = $this->generarReferenciaPagoVisual((string) $distribuidora->numero_distribuidora);
            $nombreTitular = $this->obtenerNombreTitularDistribuidora($solicitud);

            $cuentaDistribuidora = CuentaBancaria::query()->updateOrCreate(
                [
                    'tipo_propietario' => CuentaBancaria::TIPO_DISTRIBUIDORA,
                    'propietario_id' => $distribuidora->id,
                    'es_principal' => true,
                ],
                [
                    'banco' => 'PRACTICA_UNIVERSITARIA',
                    'nombre_titular' => $nombreTitular,
                    'referencia_base' => $referenciaVisual,
                ]
            );

            $distribuidora->update([
                'cuenta_bancaria_id' => $cuentaDistribuidora->id,
            ]);

            $rolDistribuidora = Rol::query()
                ->where('codigo', 'DISTRIBUIDORA')
                ->where('activo', true)
                ->first();

            if (!$rolDistribuidora) {
                return back()->withErrors([
                    'general' => 'No existe un rol DISTRIBUIDORA activo configurado en el sistema.',
                ]);
            }

            $solicitud->update([
                'estado' => Solicitud::ESTADO_APROBADA,
                'decidida_en' => now(),
                'resultado_buro' => $request->resultado_buro,
                'motivo_rechazo' => null,
            ]);

            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerente->id,
                'solicitud_id' => $solicitud->id,
                'distribuidora_id' => $distribuidora->id,
                'tipo_evento' => $distribuidoraActual
                    ? ($montoNuevo > $montoAnterior ? 'INCREMENTO_LIMITE' : 'APROBACION')
                    : 'NUEVA_DISTRIBUIDORA',
                'monto_anterior' => $montoAnterior,
                'monto_nuevo' => $montoNuevo,
            ]);

            $usuarioCreado = false;
            $rolAsignado = false;

            $usuarioDistribuidora = $this->obtenerOCrearUsuarioDistribuidora(
                $solicitud,
                $distribuidora,
                $rolDistribuidora,
                $usuarioCreado,
                $rolAsignado
            );

            $activationLink = null;
            if (($usuarioCreado ?? false) || ($rolAsignado ?? false)) {
                $activationLink = $this->generarEnlaceActivacionDistribuidora($usuarioDistribuidora);
            }

            $correoDistribuidora = (string) ($solicitud->persona?->correo_electronico ?? '');
            $correoDistribuidora = trim($correoDistribuidora);

            if ($activationLink && $correoDistribuidora !== '') {
                $nombre = $this->obtenerNombreTitularDistribuidora($solicitud);
                $numeroDistribuidora = (string) $distribuidora->numero_distribuidora;

                DB::afterCommit(function () use ($correoDistribuidora, $nombre, $activationLink, $numeroDistribuidora) {
                    try {
                        Mail::to($correoDistribuidora)->send(new ActivacionDistribuidoraMail(
                            $nombre,
                            $activationLink,
                            $numeroDistribuidora
                        ));
                    } catch (\Throwable $e) {
                        logger()->warning('No se pudo enviar correo de activacion de distribuidora', [
                            'correo' => $correoDistribuidora,
                            'numero_distribuidora' => $numeroDistribuidora,
                            'error' => $e->getMessage(),
                        ]);
                    }
                });
            }

            DB::afterCommit(function () use ($usuarioDistribuidora, $distribuidora, $montoNuevo) {
                event(new ActualizacionCredito(
                    (int) $usuarioDistribuidora->id,
                    (int) $distribuidora->id,
                    (string) $distribuidora->numero_distribuidora,
                    (float) $montoNuevo
                ));
            });

            $usuarioDistribuidora->notify(
                new DistribuidoraAprobadaNotification(
                    $montoNuevo,
                    $distribuidora->numero_distribuidora,
                    $distribuidoraActual && $montoNuevo > $montoAnterior
                )
            );

            return redirect()
                ->route('gerente.distribuidoras')
                ->with('success', 'Solicitud aprobada y promovida a distribuidora correctamente.')
                ->with('activation_link', $activationLink)
                ->with('message', $activationLink
                    ? ($correoDistribuidora !== ''
                        ? 'Se genero enlace de activacion y se envio al correo registrado de la distribuidora. Tambien puedes compartir el enlace manualmente.'
                        : 'Se genero enlace de activacion. Como no hay correo registrado, compartelo manualmente con la distribuidora.')
                    : 'La distribuidora ya contaba con acceso activo, no se genero un nuevo enlace.');
        });
    }

    public function rechazar(RechazarDistribuidoraRequest $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            /** @var \App\Models\Usuario $gerente */
            $gerente = auth()->user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $solicitud = Solicitud::query()
                ->where('estado', Solicitud::ESTADO_VERIFICADA)
                ->where('sucursal_id', $sucursalId)
                ->findOrFail($id);

            $solicitud->update([
                'estado' => Solicitud::ESTADO_RECHAZADA,
                'decidida_en' => now(),
                'motivo_rechazo' => $request->string('motivo_rechazo')->toString(),
            ]);

            $motivoRechazo = $request->string('motivo_rechazo')->toString();

            BitacoraDecisionGerente::query()->create([
                'gerente_usuario_id' => $gerente->id,
                'solicitud_id' => $solicitud->id,
                'distribuidora_id' => null,
                'tipo_evento' => 'RECHAZO',
                'monto_anterior' => 0,
                'monto_nuevo' => 0,
            ]);

            if ($solicitud->coordinador_usuario_id) {
                $coordinador = Usuario::query()->find($solicitud->coordinador_usuario_id);

                if ($coordinador) {
                    $clienteNombre = trim(implode(' ', array_filter([
                        $solicitud->persona?->primer_nombre,
                        $solicitud->persona?->apellido_paterno,
                        $solicitud->persona?->apellido_materno,
                    ])));

                    DB::afterCommit(function () use ($coordinador, $solicitud, $clienteNombre, $motivoRechazo) {
                        $coordinador->notify(new RechazoSolicitudGerenteNotification(
                            (int) $solicitud->id,
                            $clienteNombre !== '' ? $clienteNombre : 'Cliente',
                            $motivoRechazo
                        ));
                    });
                }
            }

            return redirect()
                ->route('gerente.distribuidoras.rechazadas')
                ->with('success', 'Solicitud rechazada correctamente.');
        });
    }

    private function generarNumeroDistribuidora(): string
    {
        do {
            $numero = 'DIST-' . now()->format('ymdHis') . '-' . random_int(100, 999);
        } while (Distribuidora::query()->where('numero_distribuidora', $numero)->exists());

        return $numero;
    }

    private function generarReferenciaPagoVisual(string $numeroDistribuidora): string
    {
        $normalizado = strtoupper(preg_replace('/[^A-Z0-9-]/i', '', $numeroDistribuidora) ?? '');

        if ($normalizado === '') {
            $normalizado = 'DIST-' . now()->format('ymdHis');
        }

        return 'PF-' . $normalizado;
    }

    private function obtenerNombreTitularDistribuidora(Solicitud $solicitud): string
    {
        $persona = $solicitud->persona;

        $nombre = trim(implode(' ', array_filter([
            $persona?->primer_nombre,
            $persona?->segundo_nombre,
            $persona?->apellido_paterno,
            $persona?->apellido_materno,
        ])));

        return $nombre !== '' ? $nombre : 'DISTRIBUIDORA SIN NOMBRE';
    }

    private function obtenerOCrearUsuarioDistribuidora(
        Solicitud $solicitud,
        Distribuidora $distribuidora,
        Rol $rolDistribuidora,
        bool &$usuarioCreado = false,
        bool &$rolAsignado = false
    ): Usuario {
        $usuario = Usuario::query()
            ->where('persona_id', $solicitud->persona_solicitante_id)
            ->first();

        if (!$usuario) {
            $usuarioCreado = true;
            $usuario = Usuario::query()->create([
                'persona_id' => $solicitud->persona_solicitante_id,
                'nombre_usuario' => $this->generarNombreUsuarioDistribuidora($solicitud, $distribuidora),
                'clave_hash' => Hash::make(Str::random(24)),
                'activo' => true,
                'requiere_vpn' => false,
                'canal_login' => Usuario::CANAL_MOVIL,
            ]);
        } elseif (!$usuario->activo) {
            $usuario->update(['activo' => true]);
        }

        $rolActivo = DB::table('usuario_rol')
            ->where('usuario_id', $usuario->id)
            ->where('rol_id', $rolDistribuidora->id)
            ->whereNull('revocado_en')
            ->exists();

        if (!$rolActivo) {
            $rolAsignado = true;
            DB::table('usuario_rol')->insert([
                'usuario_id' => $usuario->id,
                'rol_id' => $rolDistribuidora->id,
                'sucursal_id' => $solicitud->sucursal_id,
                'asignado_en' => now(),
                'revocado_en' => null,
                'es_principal' => true,
            ]);
        }

        return $usuario;
    }

    private function generarEnlaceActivacionDistribuidora(Usuario $usuario): string
    {
        $tokenPlano = Str::random(64);

        DB::table('activaciones_distribuidora')->updateOrInsert(
            ['usuario_id' => $usuario->id],
            [
                'token_hash' => hash('sha256', $tokenPlano),
                'expira_en' => now()->addDay(),
                'usado_en' => null,
                'actualizado_en' => now(),
                'creado_en' => now(),
            ]
        );

        return route('distribuidora.activacion.show', ['token' => $tokenPlano]);
    }

    private function generarNombreUsuarioDistribuidora(Solicitud $solicitud, Distribuidora $distribuidora): string
    {
        $persona = $solicitud->persona;

        $candidatos = [];

        if (!empty($persona?->curp)) {
            $candidatos[] = strtolower((string) $persona->curp);
        }

        if (!empty($persona?->telefono_celular)) {
            $digitos = preg_replace('/\D+/', '', (string) $persona->telefono_celular);
            if (!empty($digitos)) {
                $candidatos[] = 'dist' . substr($digitos, -8);
            }
        }

        $numero = strtolower((string) $distribuidora->numero_distribuidora);
        $candidatos[] = preg_replace('/[^a-z0-9]/', '', $numero);

        foreach ($candidatos as $base) {
            $base = substr((string) $base, 0, 80);
            if ($base === '') {
                continue;
            }

            $existe = Usuario::query()
                ->where('nombre_usuario', $base)
                ->exists();

            if (!$existe) {
                return $base;
            }
        }

        do {
            $alterno = 'dist' . now()->format('ymdHis') . random_int(10, 99);
            $existe = Usuario::query()
                ->where('nombre_usuario', $alterno)
                ->exists();
        } while ($existe);

        return $alterno;
    }

    private function generarUrlEvidencia(?string $ruta): ?string
    {
        if (!$ruta) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('spaces');
        $expiraEnMinutos = (int) config('filesystems.disks.spaces.signed_url_ttl', 15);

        try {
            return $disk->temporaryUrl($ruta, now()->addMinutes($expiraEnMinutos));
        } catch (\Throwable $e) {
            return $disk->url($ruta);
        }
    }
}
