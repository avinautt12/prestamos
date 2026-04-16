<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use App\Models\Conciliacion;
use App\Models\MovimientoBancario;
use App\Models\Vale;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $hoy = now()->toDateString();
        $sucursal_id = auth()->user()->sucursales->first()->id ?? null;

        $stats = [
            'cobros_hoy' => Conciliacion::query()->whereDate('conciliado_en', $hoy)->count(),
            'pendientes_conciliar' => MovimientoBancario::query()->whereDoesntHave('conciliacion')->count(),
            'prevales_pendientes' => Vale::query()
                ->where('estado', Vale::ESTADO_BORRADOR)
                ->when($sucursal_id, fn($q) => $q->where('sucursal_id', $sucursal_id))
                ->count(),
            'total_cobrado' => (float) Conciliacion::query()->whereDate('conciliado_en', $hoy)->sum('monto_conciliado'),
            'cortes_vencidos' => \App\Models\RelacionCorte::query()
                ->where('estado', \App\Models\RelacionCorte::ESTADO_VENCIDA)
                ->when($sucursal_id, fn($q) => $q->whereHas('distribuidora', fn($sub) => $sub->where('sucursal_id', $sucursal_id)))
                ->count(),
            'distribuidoras_morosas_bloqueadas' => \App\Models\Distribuidora::query()
                ->whereIn('estado', [\App\Models\Distribuidora::ESTADO_MOROSA, \App\Models\Distribuidora::ESTADO_BLOQUEADA])
                ->when($sucursal_id, fn($q) => $q->where('sucursal_id', $sucursal_id))
                ->count(),
        ];

        // Listas de pendientes
        $vales_por_verificar = Vale::query()
            ->with(['cliente.persona', 'distribuidora.persona'])
            ->where('estado', Vale::ESTADO_BORRADOR)
            ->when($sucursal_id, fn($q) => $q->where('sucursal_id', $sucursal_id))
            ->orderBy('creado_en', 'desc')
            ->take(5)
            ->get();

        $movimientos_pendientes = MovimientoBancario::query()
            ->whereDoesntHave('conciliacion')
            ->orderBy('fecha_movimiento', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('Cajera/CajeraDashboard', [
            'stats' => $stats,
            'vales_por_verificar' => $vales_por_verificar,
            'movimientos_pendientes' => $movimientos_pendientes,
            'usuario' => auth()->user()->load('persona'),
        ]);
    }

    public function pagosDistribuidora()
    {
        return Inertia::render('Cajera/PagosDistribuidora');
    }

    public function prevaleIndex()
    {
        return Inertia::render('Cajera/Prevale/Index');
    }

}
