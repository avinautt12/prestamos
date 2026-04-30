<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Models\PuntosConf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FidelizacionController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = Auth::user();
        $sucursalId = $usuario->sucursal_actual_id;

        $filtros = [
            'q' => $request->query('q', ''),
        ];

        $distribuidoras = Distribuidora::query()
            ->where('sucursal_id', $sucursalId) // Restricción obligatoria para Gerente
            ->with(['persona', 'sucursal'])
            ->when($filtros['q'], function ($query, $q) {
                $query->whereHas('persona', function ($sub) use ($q) {
                    $sub->where('primer_nombre', 'like', "%{$q}%")
                        ->orWhere('apellido_paterno', 'like', "%{$q}%");
                });
            })
            ->orderBy('puntos_actuales', 'desc')
            ->paginate(15)
            ->withQueryString();

        $configPuntos = PuntosConf::actual();

        return Inertia::render('Admin/Fidelizacion/Puntos', [
            'distribuidoras' => $distribuidoras,
            'filtros' => $filtros,
            'sucursales' => [], // Gerente no elige sucursal
            'configPuntos' => $configPuntos,
            'routePrefix' => 'gerente',
        ]);
    }

    public function movimientos(int $distribuidoraId): Response
    {
        $usuario = Auth::user();
        $sucursalId = $usuario->sucursal_actual_id;

        $distribuidora = Distribuidora::where('sucursal_id', $sucursalId)
            ->with('persona')
            ->findOrFail($distribuidoraId);
        
        $movimientos = MovimientoPunto::where('distribuidora_id', $distribuidoraId)
            ->with(['vale:id,numero_vale', 'corte:id,fecha_ejecucion'])
            ->orderByDesc('fecha_movimiento')
            ->orderByDesc('id')
            ->paginate(30);

        return Inertia::render('Admin/Fidelizacion/Historial', [
            'distribuidora' => [
                'id' => $distribuidora->id,
                'nombre' => $distribuidora->persona->nombre_completo,
                'puntos_actuales' => (float) $distribuidora->puntos_actuales,
            ],
            'movimientos' => $movimientos,
            'backRoute' => 'gerente.fidelizacion.index',
        ]);
    }

    public function ajustar(Request $request, int $distribuidoraId)
    {
        $usuario = Auth::user();
        $sucursalId = $usuario->sucursal_actual_id;

        $request->validate([
            'puntos' => 'required|numeric',
            'motivo' => 'required|string|max:255',
            'tipo' => 'required|in:AJUSTE_MANUAL,REVERSO',
        ]);

        $distribuidora = Distribuidora::where('sucursal_id', $sucursalId)->findOrFail($distribuidoraId);

        DB::transaction(function () use ($distribuidora, $request, $usuario) {
            MovimientoPunto::create([
                'distribuidora_id' => $distribuidora->id,
                'tipo_movimiento' => $request->tipo,
                'puntos' => $request->puntos,
                'valor_punto_snapshot' => PuntosConf::actual()->valor_punto_mxn,
                'motivo' => "[Gerente: " . $usuario->nombre_usuario . "] " . $request->motivo,
            ]);

            $distribuidora->increment('puntos_actuales', $request->puntos);
        });

        return back()->with('success', 'Puntos ajustados correctamente.');
    }
}
