<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Cajera/CajeraDashboard', [
            'stats' => [
                'cobros_hoy' => 0,
                'pendientes_conciliar' => 0,
                'total_cobrado' => 0,
            ]
        ]);
    }

    public function cobros()
    {
        return Inertia::render('Cajera/Cobros');
    }

    public function conciliaciones()
    {
        return Inertia::render('Cajera/Conciliaciones');
    }

    public function pagosDistribuidora()
    {
        return Inertia::render('Cajera/PagosDistribuidora');
    }
}
