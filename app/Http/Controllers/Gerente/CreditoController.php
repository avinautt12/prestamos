<?php

namespace App\Http\Controllers\Gerente;

use App\Events\ActualizacionCredito;
use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\ModificarCreditoRequest;
use App\Models\BitacoraDecisionGerente;
use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Models\HistorialCreditoScore;
use App\Models\SugerenciaIncrementoCredito;
use App\Models\SucursalConfiguracion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CreditoController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function index(Request $request)
    {
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $categorias = CategoriaDistribuidora::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'porcentaje_comision']);

        if (!$sucursalId) {
            return Inertia::render('Gerente/Distribuidoras/GestionCredito', [
                'distribuidoras' => ['data' => [], 'total' => 0],
                'filters' => $request->only(['search', 'estado']),
                'categorias' => $categorias,
            ]);
        }

        $query = Distribuidora::with(['persona', 'categoria', 'sucursal'])
            ->where('sucursal_id', $sucursalId)
            ->whereIn('estado', [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->whereHas('persona', fn($pq) => $pq
                    ->where('primer_nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_paterno', 'like', "%{$search}%")
                    ->orWhere('apellido_materno', 'like', "%{$search}%")
                    ->orWhere('curp', 'like', "%{$search}%"))
                ->orWhere('numero_distribuidora', 'like', "%{$search}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado')->toString());
        }

        $distribuidoras = $query
            ->orderBy('numero_distribuidora')
            ->paginate(15)
            ->appends($request->query());

        $configuracion = SucursalConfiguracion::query()
            ->where('sucursal_id', $sucursalId)
            ->first(['umbral_incremento_auto', 'porcentaje_incremento_min_score']);

        return Inertia::render('Gerente/Distribuidoras/GestionCredito', [
            'distribuidoras' => $distribuidoras,
            'filters' => $request->only(['search', 'estado']),
            'configuracion' => $configuracion,
            'categorias' => $categorias,
            'securityPolicy' => [
                'requires_vpn' => (bool) config('security.gerente.require_vpn', false),
            ],
        ]);
    }

    public function show(int $id)
    {
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $distribuidora = Distribuidora::with(['persona', 'categoria', 'sucursal'])
            ->where('sucursal_id', $sucursalId)
            ->whereIn('estado', [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA])
            ->findOrFail($id);

        $historial = HistorialCreditoScore::where('distribuidora_id', $id)
            ->orderByDesc('mes_evalucion')
            ->limit(12)
            ->get();

        $ultimoScore = HistorialCreditoScore::where('distribuidora_id', $id)
            ->orderByDesc('mes_evalucion')
            ->first();

        return Inertia::render('Gerente/Distribuidoras/EditarCredito', [
            'distribuidora' => $distribuidora,
            'historial' => $historial,
            'ultimoScore' => $ultimoScore,
        ]);
    }

    public function update(ModificarCreditoRequest $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $gerente = Auth::user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $distribuidora = Distribuidora::query()
                ->where('sucursal_id', $sucursalId)
                ->whereIn('estado', [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA])
                ->findOrFail($id);

            $limiteAnterior = (float) $distribuidora->limite_credito;
            $limiteNuevo = (float) $request->limite_credito;
            $diferencia = $limiteNuevo - $limiteAnterior;

            $distribuidora->update([
                'limite_credito' => $limiteNuevo,
                'credito_disponible' => $distribuidora->credito_disponible + $diferencia,
            ]);

            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerente->id,
                'solicitud_id' => $distribuidora->solicitud_id,
                'distribuidora_id' => $distribuidora->id,
                'tipo_evento' => 'INCREMENTO_MANUAL',
                'monto_anterior' => $limiteAnterior,
                'monto_nuevo' => $limiteNuevo,
            ]);

            DB::afterCommit(function () use ($distribuidora, $limiteNuevo) {
                $usuario = $distribuidora->persona?->usuario;

                if ($usuario) {
                    event(new ActualizacionCredito(
                        (int) $usuario->id,
                        (int) $distribuidora->id,
                        (string) $distribuidora->numero_distribuidora,
                        (float) $limiteNuevo
                    ));
                }
            });

            return redirect()
                ->route('gerente.credito.index')
                ->with('success', 'Límite de crédito actualizado correctamente.');
        });
    }

    public function historial(Request $request, int $id)
    {
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $distribuidora = Distribuidora::query()
            ->where('sucursal_id', $sucursalId)
            ->findOrFail($id);

        $bitacora = BitacoraDecisionGerente::where('distribuidora_id', $id)
            ->whereIn('tipo_evento', ['NUEVA_DISTRIBUIDORA', 'INCREMENTO_LIMITE', 'INCREMENTO_MANUAL', 'APROBACION'])
            ->orderByDesc('creado_en')
            ->paginate(20);

        return response()->json(['historial' => $bitacora]);
    }

    public function sugerencias(Request $request)
    {
        $gerente = Auth::user();
        $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

        $query = SugerenciaIncrementoCredito::with(['distribuidora.persona', 'aprobadaPor.persona', 'rechazadaPor.persona'])
            ->whereHas('distribuidora', fn($q) => $q->where('sucursal_id', $sucursalId));

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado')->toString());
        }

        $sugerencias = $query
            ->orderByDesc('creado_en')
            ->paginate(15)
            ->appends($request->query());

        return Inertia::render('Gerente/Distribuidoras/SugerenciasCredito', [
            'sugerencias' => $sugerencias,
            'filters' => $request->only(['estado']),
            'securityPolicy' => [
                'requires_vpn' => (bool) config('security.gerente.require_vpn', false),
            ],
        ]);
    }

    public function aprobarSugerencia(int $id)
    {
        return DB::transaction(function () use ($id) {
            $gerente = Auth::user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $sugerencia = SugerenciaIncrementoCredito::where('estado', SugerenciaIncrementoCredito::ESTADO_PENDIENTE)
                ->whereHas('distribuidora', fn($q) => $q->where('sucursal_id', $sucursalId))
                ->findOrFail($id);

            $distribuidora = $sugerencia->distribuidora;
            $limiteAnterior = (float) $distribuidora->limite_credito;
            $incremento = (float) $sugerencia->incremento_sugerido;
            $limiteNuevo = $limiteAnterior + $incremento;

            $distribuidora->update([
                'limite_credito' => $limiteNuevo,
                'credito_disponible' => $distribuidora->credito_disponible + $incremento,
            ]);

            $sugerencia->update([
                'estado' => SugerenciaIncrementoCredito::ESTADO_APROBADA,
                'aprobada_por_usuario_id' => $gerente->id,
                'decidido_en' => now(),
            ]);

            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerente->id,
                'solicitud_id' => $distribuidora->solicitud_id,
                'distribuidora_id' => $distribuidora->id,
                'tipo_evento' => 'INCREMENTO_SUGERIDO_APROBADO',
                'monto_anterior' => $limiteAnterior,
                'monto_nuevo' => $limiteNuevo,
            ]);

            DB::afterCommit(function () use ($distribuidora, $limiteNuevo) {
                $usuario = $distribuidora->persona?->usuario;

                if ($usuario) {
                    event(new ActualizacionCredito(
                        (int) $usuario->id,
                        (int) $distribuidora->id,
                        (string) $distribuidora->numero_distribuidora,
                        (float) $limiteNuevo
                    ));
                }
            });

            return redirect()
                ->route('gerente.credito.sugerencias')
                ->with('success', 'Incremento aplicado correctamente.');
        });
    }

    public function rechazarSugerencia(Request $request, int $id)
    {
        $request->validate([
            'motivo' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        return DB::transaction(function () use ($request, $id) {
            $gerente = Auth::user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $sugerencia = SugerenciaIncrementoCredito::where('estado', SugerenciaIncrementoCredito::ESTADO_PENDIENTE)
                ->whereHas('distribuidora', fn($q) => $q->where('sucursal_id', $sucursalId))
                ->findOrFail($id);

            $sugerencia->update([
                'estado' => SugerenciaIncrementoCredito::ESTADO_RECHAZADA,
                'rechazada_por_usuario_id' => $gerente->id,
                'decidido_en' => now(),
            ]);

            return redirect()
                ->route('gerente.credito.sugerencias')
                ->with('success', 'Sugerencia rechazada.');
        });
    }
}