<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Gerente/GerenteDashboard', [
        'stats' => [
            'total_sucursales' => \App\Models\Sucursal::where('activo', true)->count(),
            'total_distribuidoras' => \App\Models\Distribuidora::where('estado', 'ACTIVA')->count(),
            'total_vales_activos' => \App\Models\Vale::whereIn('estado', ['ACTIVO', 'PAGO_PARCIAL'])->count(),
            'monto_prestado' => \App\Models\Vale::where('estado', '!=', 'CANCELADO')->sum('monto_principal'),
        ]
    ]);
    }

    public function reportes()
    {
        return Inertia::render('Gerente/Reportes');
    }

    public function sucursales()
    {
        return Inertia::render('Gerente/Sucursales');
    }

    public function distribuidoras()
    {
        return Inertia::render('Gerente/Distribuidoras');
    }
}
