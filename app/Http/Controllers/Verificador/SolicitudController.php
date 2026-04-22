<?php

namespace App\Http\Controllers\Verificador;

use App\Events\DictamenSolicitud;
use App\Events\SolicitudListaParaAprobacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verificador\VerificacionRequest;
use App\Models\Solicitud;
use App\Models\VerificacionesSolicitud;
use App\Models\Usuario;
use App\Notifications\SolicitudTomadaVerificadorNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SolicitudController extends Controller
{
    /**
     * Listado de solicitudes pendientes de verificación
     */
    public function index(Request $request)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();
        $sucursal = $usuario->sucursales()->first();

        $latitudActual = $request->latitud ?? session('verificador_latitud');
        $longitudActual = $request->longitud ?? session('verificador_longitud');

        $solicitudes = Solicitud::with(['persona', 'sucursal', 'coordinador.persona'])
            ->where('sucursal_id', $sucursal?->id)
            ->where('estado', 'EN_REVISION')
            ->whereNull('verificador_asignado_id')
            ->when($request->search, function ($query, $search) {
                $query->whereHas('persona', function ($q) use ($search) {
                    $q->where('primer_nombre', 'LIKE', "%{$search}%")
                        ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                        ->orWhere('curp', 'LIKE', "%{$search}%");
                });
            })
            ->get();

        if ($latitudActual && $longitudActual) {
            $solicitudes = $solicitudes->map(function ($solicitud) use ($latitudActual, $longitudActual) {
                if ($solicitud->persona->latitud && $solicitud->persona->longitud) {
                    $solicitud->distancia = $this->calcularDistancia(
                        $latitudActual,
                        $longitudActual,
                        $solicitud->persona->latitud,
                        $solicitud->persona->longitud
                    );
                } else {
                    $solicitud->distancia = null;
                }
                return $solicitud;
            })->sortBy('distancia');
        }

        $solicitudes = $this->paginateCollection($solicitudes, 10);

        return Inertia::render('Verificador/Solicitudes/Index', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search']),
            'ubicacionActual' => $latitudActual && $longitudActual ? [$latitudActual, $longitudActual] : null,
            'modo' => 'pendientes',
            'titulo' => 'Solicitudes Pendientes',
            'descripcion' => 'Solicitudes que requieren verificación en campo',
        ]);
    }

    /**
     * Listado de solicitudes que el verificador ya aceptó pero aún no ha revisado
     */
    public function porRevisar(Request $request)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();
        $sucursal = $usuario->sucursales()->first();

        $solicitudes = Solicitud::with(['persona', 'sucursal', 'coordinador.persona'])
            ->where('sucursal_id', $sucursal?->id)
            ->where('estado', 'EN_REVISION')
            ->where('verificador_asignado_id', $usuario->id)
            ->when($request->search, function ($query, $search) {
                $query->whereHas('persona', function ($q) use ($search) {
                    $q->where('primer_nombre', 'LIKE', "%{$search}%")
                        ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                        ->orWhere('curp', 'LIKE', "%{$search}%");
                });
            })
            ->orderBy('creado_en', 'asc')
            ->paginate(10)
            ->appends($request->query());

        return Inertia::render('Verificador/Solicitudes/Index', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search']),
            'modo' => 'por-revision',
            'titulo' => 'Solicitudes por revisión',
            'descripcion' => 'Solicitudes que ya aceptaste y aún no has revisado',
        ]);
    }

    private function paginateCollection($items, $perPage)
    {
        $page = request()->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $items->slice($offset, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
        return $paginated;
    }
    /**
     * Mostrar detalle de la solicitud para verificar
     */
    public function show($id)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        $solicitud = Solicitud::with([
            'persona',
            'sucursal',
            'coordinador.persona',
            'verificacion'
        ])
            ->whereIn('estado', ['EN_REVISION', 'VERIFICADA', 'RECHAZADA'])
            ->findOrFail($id);

        $sucursal = $usuario->sucursales()->first();
        if ($solicitud->sucursal_id !== $sucursal?->id) {
            abort(403, 'No tienes permiso para verificar esta solicitud');
        }

        if ($solicitud->estado === 'EN_REVISION' && $solicitud->verificador_asignado_id && $solicitud->verificador_asignado_id !== $usuario->id) {
            abort(403, 'Esta solicitud ya fue asignada a otro verificador');
        }

        $solicitud->datos_familiares = $solicitud->getAttribute('datos_familiares_json') ? json_decode($solicitud->getAttribute('datos_familiares_json'), true) : null;
        $solicitud->afiliaciones = $solicitud->getAttribute('afiliaciones_externas_json') ? json_decode($solicitud->getAttribute('afiliaciones_externas_json'), true) : null;
        $solicitud->vehiculos = $solicitud->getAttribute('vehiculos_json') ? json_decode($solicitud->getAttribute('vehiculos_json'), true) : null;

        if ($solicitud->verificacion && $solicitud->verificacion->checklist_json) {
            $solicitud->verificacion->checklist = json_decode($solicitud->verificacion->checklist_json, true);
        }

        if ($solicitud->verificacion && $solicitud->verificacion->justificaciones_json) {
            $solicitud->verificacion->justificaciones = json_decode($solicitud->verificacion->justificaciones_json, true);
        }

        if ($solicitud->verificacion) {
            $solicitud->verificacion->foto_fachada_url = $this->generarUrlEvidencia($solicitud->verificacion->foto_fachada);
            $solicitud->verificacion->foto_ine_con_persona_url = $this->generarUrlEvidencia($solicitud->verificacion->foto_ine_con_persona);
            $solicitud->verificacion->foto_comprobante_url = $this->generarUrlEvidencia($solicitud->verificacion->foto_comprobante);

            if ($solicitud->verificacion->evidencias_extras_json) {
                $evidenciasExtras = json_decode($solicitud->verificacion->evidencias_extras_json, true);
                $solicitud->verificacion->evidencias_extras = array_map(function ($ev) {
                    return [
                        'ruta' => $ev['ruta'],
                        'descripcion' => $ev['descripcion'] ?? '',
                        'url' => $this->generarUrlEvidencia($ev['ruta']),
                    ];
                }, $evidenciasExtras ?? []);
            }
        }

        return Inertia::render('Verificador/Solicitudes/Show', [
            'solicitud' => $solicitud
        ]);
    }

    /**
     * Procesar la verificación (aprobar o rechazar)
     */
    public function verificar(VerificacionRequest $request, $id)
    {
        try {
            DB::beginTransaction();

            /** @var \App\Models\Usuario $usuario */
            $usuario = auth()->user();
            $sucursal = $usuario->sucursales()->first();

            $solicitud = Solicitud::where('estado', 'EN_REVISION')
                ->where('sucursal_id', $sucursal?->id)
                ->where('verificador_asignado_id', $usuario->id)
                ->findOrFail($id);

            $distancia = null;
            $distanciaPermitida = 100;
            if ($request->latitud_verificacion && $solicitud->persona->latitud) {
                $distancia = $this->calcularDistancia(
                    $solicitud->persona->latitud,
                    $solicitud->persona->longitud,
                    $request->latitud_verificacion,
                    $request->longitud_verificacion
                );
            }
            if ($request->resultado === 'VERIFICADA' && $distancia !== null && $distancia > $distanciaPermitida) {
                DB::rollBack();
                return back()->withErrors([
                    'error' => "No puedes verificar esta solicitud. Estás a " . round($distancia) . " metros del domicilio registrado. La distancia máxima permitida es de {$distanciaPermitida} metros."
                ]);
            }

            $checklist = (array) $request->input('checklist', []);
            $justificaciones = (array) $request->input('justificaciones', []);

            $normalizar = function ($val) {
                if ($val === 'false' || $val === '0' || $val === false || $val === 0) return false;
                if ($val === 'true' || $val === '1' || $val === true || $val === 1) return true;
                return null;
            };

            $checklistNormalizado = [];
            $itemsMarcadosNo = [];
            foreach ($checklist as $key => $val) {
                $valor = $normalizar($val);
                $checklistNormalizado[$key] = $valor;
                if ($valor === false) {
                    $itemsMarcadosNo[$key] = $key;
                    $justificacion = $justificaciones[$key] ?? null;
                    if (empty(trim($justificacion ?? ''))) {
                        DB::rollBack();
                        return back()->withErrors([
                            "justificacion_{$key}" => "Indica por qué marcaste 'No' en: {$key}"
                        ]);
                    }
                }
            }

            $verificacionExistente = $solicitud->verificacion;

            $fotoFachadaPath = $request->hasFile('foto_fachada')
                ? $request->file('foto_fachada')->store('verificaciones/fachada', 'spaces')
                : $verificacionExistente?->foto_fachada;

            $fotoIneConPersonaPath = $request->hasFile('foto_ine_con_persona')
                ? $request->file('foto_ine_con_persona')->store('verificaciones/ine_persona', 'spaces')
                : $verificacionExistente?->foto_ine_con_persona;

            $fotoComprobantePath = $request->hasFile('foto_comprobante')
                ? $request->file('foto_comprobante')->store('verificaciones/comprobante', 'spaces')
                : $verificacionExistente?->foto_comprobante;

            $evidenciasExtras = [];
            foreach (range(1, 10) as $i) {
                $campoArchivo = "evidencia_extra_{$i}";
                $campoDesc = "evidencia_extra_{$i}_descripcion";
                if ($request->hasFile($campoArchivo)) {
                    $path = $request->file($campoArchivo)->store('verificaciones/extras', 'spaces');
                    $evidenciasExtras[] = [
                        'ruta' => $path,
                        'descripcion' => $request->input($campoDesc, ''),
                    ];
                }
            }

            VerificacionesSolicitud::updateOrCreate(
                ['solicitud_id' => $solicitud->id],
                [
                    'verificador_usuario_id' => $usuario->id,
                    'resultado' => $request->resultado,
                    'observaciones' => $request->observaciones,
                    'latitud_verificacion' => $request->latitud_verificacion,
                    'longitud_verificacion' => $request->longitud_verificacion,
                    'fecha_visita' => now(),
                    'checklist_json' => json_encode($checklistNormalizado),
                    'justificaciones_json' => json_encode($request->justificaciones ?? []),
                    'foto_fachada' => $fotoFachadaPath,
                    'foto_ine_con_persona' => $fotoIneConPersonaPath,
                    'foto_comprobante' => $fotoComprobantePath,
                    'distancia_metros' => $distancia,
                    'evidencias_extras_json' => !empty($evidenciasExtras) ? json_encode($evidenciasExtras) : null,
                ]
            );

            $nuevoEstado = $request->resultado === 'VERIFICADA' ? 'VERIFICADA' : 'RECHAZADA';
            $solicitud->update([
                'estado' => $nuevoEstado,
                'revisada_en' => now(),
            ]);

            $clienteNombre = trim(implode(' ', array_filter([
                $solicitud->persona?->primer_nombre,
                $solicitud->persona?->apellido_paterno,
                $solicitud->persona?->apellido_materno,
            ])));

            if ($solicitud->coordinador_usuario_id) {
                DB::afterCommit(function () use ($solicitud, $nuevoEstado, $clienteNombre) {
                    event(new DictamenSolicitud(
                        (int) $solicitud->coordinador_usuario_id,
                        (int) $solicitud->id,
                        $nuevoEstado,
                        $clienteNombre !== '' ? $clienteNombre : 'Cliente'
                    ));
                });
            }

            if ($nuevoEstado === Solicitud::ESTADO_VERIFICADA && $solicitud->sucursal_id) {
                DB::afterCommit(function () use ($solicitud, $clienteNombre) {
                    event(new SolicitudListaParaAprobacion(
                        (int) $solicitud->sucursal_id,
                        (int) $solicitud->id,
                        $clienteNombre !== '' ? $clienteNombre : 'Cliente'
                    ));
                });
            }

            DB::commit();

            return redirect()->route('verificador.solicitudes.index')
                ->with('success', 'Solicitud ' . ($nuevoEstado === 'VERIFICADA' ? 'verificada' : 'rechazada') . ' correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al verificar: ' . $e->getMessage()]);
        }
    }

    /**
     * Calcula la distancia entre dos puntos geográficos en metros (fórmula de Haversine)
     */
    private function calcularDistancia($lat1, $lon1, $lat2, $lon2)
    {
        $radioTierra = 6371000; // metros

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radioTierra * $c;
    }

    public function tomar($id)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();
        $sucursal = $usuario->sucursales()->first();

        $solicitud = Solicitud::where('estado', 'EN_REVISION')
            ->where('sucursal_id', $sucursal?->id)
            ->whereNull('verificador_asignado_id')
            ->findOrFail($id);

        $solicitud->update([
            'verificador_asignado_id' => $usuario->id,
            'tomada_en' => now(),
        ]);

        if ($solicitud->coordinador_usuario_id) {
            $coordinador = Usuario::query()->find($solicitud->coordinador_usuario_id);

            if ($coordinador) {
                $clienteNombre = trim(implode(' ', array_filter([
                    $solicitud->persona?->primer_nombre,
                    $solicitud->persona?->apellido_paterno,
                    $solicitud->persona?->apellido_materno,
                ])));

                $verificadorNombre = trim(implode(' ', array_filter([
                    $usuario->persona?->primer_nombre,
                    $usuario->persona?->apellido_paterno,
                    $usuario->persona?->apellido_materno,
                ])));

                DB::afterCommit(function () use ($coordinador, $solicitud, $clienteNombre, $verificadorNombre) {
                    $coordinador->notify(new SolicitudTomadaVerificadorNotification(
                        (int) $solicitud->id,
                        $clienteNombre !== '' ? $clienteNombre : 'Cliente',
                        $verificadorNombre !== '' ? $verificadorNombre : 'Verificador'
                    ));
                });
            }
        }

        return redirect()->route('verificador.solicitudes.show', $solicitud->id)
            ->with('success', 'Solicitud asignada correctamente. Ahora puedes proceder con la verificación en campo.');
    }
    public function mapaRuta()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();
        $sucursal = $usuario->sucursales()->first();

        $solicitudes = Solicitud::with(['persona'])
            ->where('sucursal_id', $sucursal?->id)
            ->where('estado', 'EN_REVISION')
            ->whereNull('verificador_asignado_id')
            ->get();

        return Inertia::render('Verificador/MapaRuta', [
            'solicitudes' => $solicitudes,
        ]);
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
