<?php

namespace App\Http\Controllers\Gerente;

use App\Events\ActualizacionCredito;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\AprobarDistribuidoraRequest;
use App\Http\Requests\Gerente\RechazarDistribuidoraRequest;
use App\Models\BitacoraDecisionGerente;
use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Notifications\DistribuidoraAprobadaNotification;
use App\Models\Solicitud;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AprobacionController extends Controller
{
    public function index(Request $request)
    {
        $solicitudes = Solicitud::with(['persona', 'sucursal', 'coordinador.persona', 'verificacion'])
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->when($request->search, function ($query, $search) {
                $query->whereHas('persona', function ($personaQuery) use ($search) {
                    $personaQuery->where('primer_nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('curp', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('revisada_en')
            ->orderByDesc('id')
            ->paginate(12)
            ->appends($request->query());

        return Inertia::render('Gerente/Distribuidoras/Index', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(int $id)
    {
        $solicitud = Solicitud::with([
            'persona',
            'sucursal',
            'coordinador.persona',
            'verificacion.verificador.persona',
        ])
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->findOrFail($id);

        $solicitud->datos_familiares = $solicitud->datos_familiares_json ? json_decode($solicitud->datos_familiares_json, true) : null;
        $solicitud->afiliaciones = $solicitud->afiliaciones_externas_json ? json_decode($solicitud->afiliaciones_externas_json, true) : null;
        $solicitud->vehiculos = $solicitud->vehiculos_json ? json_decode($solicitud->vehiculos_json, true) : null;

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

        $categorias = CategoriaDistribuidora::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'porcentaje_comision']);

        return Inertia::render('Gerente/Distribuidoras/Show', [
            'solicitud' => $solicitud,
            'categorias' => $categorias,
        ]);
    }

    public function aprobar(AprobarDistribuidoraRequest $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            /** @var \App\Models\Usuario $gerente */
            $gerente = auth()->user();

            $solicitud = Solicitud::query()
                ->where('estado', Solicitud::ESTADO_VERIFICADA)
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

            $montoAnterior = (float) ($distribuidoraActual?->limite_credito ?? 0);
            $montoNuevo = (float) $request->limite_credito;

            $distribuidora = Distribuidora::updateOrCreate(
                ['solicitud_id' => $solicitud->id],
                [
                    'persona_id' => $solicitud->persona_solicitante_id,
                    'sucursal_id' => $solicitud->sucursal_id,
                    'coordinador_usuario_id' => $solicitud->coordinador_usuario_id,
                    'categoria_id' => $request->categoria_id,
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

            $solicitud->update([
                'estado' => Solicitud::ESTADO_APROBADA,
                'decidida_en' => now(),
                'resultado_buro' => $request->resultado_buro,
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

            $usuarioDistribuidora = Usuario::query()
                ->where('persona_id', $solicitud->persona_solicitante_id)
                ->where('activo', true)
                ->first();

            if ($usuarioDistribuidora) {
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
                        $distribuidora->numero_distribuidora
                    )
                );
            }

            return redirect()
                ->route('gerente.distribuidoras')
                ->with('success', 'Solicitud aprobada y promovida a distribuidora correctamente.');
        });
    }

    public function rechazar(RechazarDistribuidoraRequest $request, int $id)
    {
        $solicitud = Solicitud::query()
            ->where('estado', Solicitud::ESTADO_VERIFICADA)
            ->findOrFail($id);

        $solicitud->update([
            'estado' => Solicitud::ESTADO_RECHAZADA,
            'decidida_en' => now(),
            'observaciones_validacion' => $request->motivo_rechazo,
        ]);

        return redirect()
            ->route('gerente.distribuidoras')
            ->with('success', 'Solicitud rechazada correctamente.');
    }

    private function generarNumeroDistribuidora(): string
    {
        do {
            $numero = 'DIST-' . now()->format('ymdHis') . '-' . random_int(100, 999);
        } while (Distribuidora::query()->where('numero_distribuidora', $numero)->exists());

        return $numero;
    }
}
