<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Cajera/CajeraDashboard', [
            'stats' => [
                'cobros_hoy' => 0,
                'pendientes_conciliar' => 0,
                'prevales_pendientes' => 0,
                'total_cobrado' => 0,
            ],
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

    public function prevaleIndex()
    {
        return Inertia::render('Cajera/Prevale/Index');
    }

    public function cobranzaIndex()
    {
        return Inertia::render('Cajera/Cobranza/Index');
    }
}
