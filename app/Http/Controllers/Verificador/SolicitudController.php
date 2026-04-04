<?php

namespace App\Http\Controllers\Verificador;

use App\Events\DictamenSolicitud;
use App\Events\SolicitudListaParaAprobacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Verificador\VerificacionRequest;
use App\Models\Solicitud;
use App\Models\VerificacionesSolicitud;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        // Obtener ubicación actual del verificador (desde el request o desde sesión)
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
            ->get(); // Traemos todas para calcular distancia

        // Calcular distancia para cada solicitud y ordenar
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
            })->sortBy('distancia'); // Ordenar por cercanía
        }

        // Paginar después de ordenar
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

    // Helper para paginar colecciones
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
            'verificacion'  // Cargar la verificación si existe
        ])
            ->where('estado', 'EN_REVISION')
            ->findOrFail($id);

        // Verificar que pertenece a su sucursal
        $sucursal = $usuario->sucursales()->first();
        if ($solicitud->sucursal_id !== $sucursal?->id) {
            abort(403, 'No tienes permiso para verificar esta solicitud');
        }

        // Si ya fue tomada por otro verificador, no debe poder verse/abrirse
        if ($solicitud->verificador_asignado_id && $solicitud->verificador_asignado_id !== $usuario->id) {
            abort(403, 'Esta solicitud ya fue asignada a otro verificador');
        }

        // Decodificar JSONs
        $solicitud->datos_familiares = $solicitud->datos_familiares_json ? json_decode($solicitud->datos_familiares_json, true) : null;
        $solicitud->afiliaciones = $solicitud->afiliaciones_externas_json ? json_decode($solicitud->afiliaciones_externas_json, true) : null;
        $solicitud->vehiculos = $solicitud->vehiculos_json ? json_decode($solicitud->vehiculos_json, true) : null;

        // Decodificar checklist si existe
        if ($solicitud->verificacion && $solicitud->verificacion->checklist_json) {
            $solicitud->verificacion->checklist = json_decode($solicitud->verificacion->checklist_json, true);
        }

        if ($solicitud->verificacion) {
            $spacesUrl = rtrim((string) config('filesystems.disks.spaces.url'), '/');

            $solicitud->verificacion->foto_fachada_url = $solicitud->verificacion->foto_fachada
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_fachada, '/')
                : null;
            $solicitud->verificacion->foto_ine_con_persona_url = $solicitud->verificacion->foto_ine_con_persona
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_ine_con_persona, '/')
                : null;
            $solicitud->verificacion->foto_comprobante_url = $solicitud->verificacion->foto_comprobante
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_comprobante, '/')
                : null;
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

            // Calcular distancia

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

            // Guardar en verificaciones_solicitud
            $verificacion = VerificacionesSolicitud::updateOrCreate(
                ['solicitud_id' => $solicitud->id],
                [
                    'verificador_usuario_id' => $usuario->id,
                    'resultado' => $request->resultado,
                    'observaciones' => $request->observaciones,
                    'latitud_verificacion' => $request->latitud_verificacion,
                    'longitud_verificacion' => $request->longitud_verificacion,
                    'fecha_visita' => now(),
                    'checklist_json' => json_encode($request->checklist),
                    'foto_fachada' => $fotoFachadaPath,
                    'foto_ine_con_persona' => $fotoIneConPersonaPath,
                    'foto_comprobante' => $fotoComprobantePath,
                    'distancia_metros' => $distancia,
                ]
            );

            // Cambiar estado de la solicitud
            $nuevoEstado = $request->resultado === 'VERIFICADA' ? 'VERIFICADA' : 'RECHAZADA';
            $solicitud->update([
                'estado' => $nuevoEstado,
                'revisada_en' => now(),
                'observaciones_validacion' => $request->observaciones,
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
            ->whereNull('verificador_asignado_id')  // Que no esté ya tomada
            ->findOrFail($id);

        $solicitud->update([
            'verificador_asignado_id' => $usuario->id,
            'tomada_en' => now(),
        ]);

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
}
