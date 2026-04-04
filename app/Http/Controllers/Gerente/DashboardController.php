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
                'total_sucursales' => 0,
                'total_distribuidoras' => 0,
                'total_vales_activos' => 0,
                'monto_prestado' => 0,
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
