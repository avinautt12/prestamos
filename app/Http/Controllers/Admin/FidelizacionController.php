<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Models\PuntosConf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class FidelizacionController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = [
            'q' => $request->query('q', ''),
            'sucursal_id' => $request->query('sucursal_id', ''),
        ];

        $distribuidoras = Distribuidora::query()
            ->with(['persona', 'sucursal'])
            ->when($filtros['q'], function ($query, $q) {
                $query->whereHas('persona', function ($sub) use ($q) {
                    $sub->where('primer_nombre', 'like', "%{$q}%")
                        ->orWhere('apellido_paterno', 'like', "%{$q}%");
                });
            })
            ->when($filtros['sucursal_id'], function ($query, $sid) {
                $query->where('sucursal_id', $sid);
            })
            ->orderBy('puntos_actuales', 'desc')
            ->paginate(15)
            ->withQueryString();

        $sucursales = DB::table('sucursales')->select('id', 'nombre')->get();
        $configPuntos = PuntosConf::actual();

        return Inertia::render('Admin/Fidelizacion/Puntos', [
            'distribuidoras' => $distribuidoras,
            'filtros' => $filtros,
            'sucursales' => $sucursales,
            'configPuntos' => $configPuntos,
        ]);
    }

    public function movimientos(int $distribuidoraId): Response
    {
        $distribuidora = Distribuidora::with('persona')->findOrFail($distribuidoraId);
        
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
        ]);
    }

    public function ajustar(Request $request, int $distribuidoraId)
    {
        $request->validate([
            'puntos' => 'required|numeric',
            'motivo' => 'required|string|max:255',
            'tipo' => 'required|in:AJUSTE_MANUAL,REVERSO',
        ]);

        $distribuidora = Distribuidora::findOrFail($distribuidoraId);

        DB::transaction(function () use ($distribuidora, $request) {
            MovimientoPunto::create([
                'distribuidora_id' => $distribuidora->id,
                'tipo_movimiento' => $request->tipo,
                'puntos' => $request->puntos,
                'valor_punto_snapshot' => PuntosConf::actual()->valor_punto_mxn,
                'motivo' => "[Admin: " . auth()->user()->nombre_usuario . "] " . $request->motivo,
            ]);

            $distribuidora->increment('puntos_actuales', $request->puntos);
        });

        return back()->with('success', 'Puntos ajustados correctamente.');
    }
}
