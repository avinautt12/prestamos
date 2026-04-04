<?php

namespace App\Http\Controllers\Distribuidora;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $usuario = Auth::user();

        return Inertia::render('Distribuidora/DistribuidoraDashboard', [
            'stats' => [
                'puntos_actuales' => 0,
                'vales_activos' => 0,
                'credito_disponible' => 0,
                'clientes_activos' => 0,
            ],
            'usuario' => $usuario
        ]);
    }

    public function vales()
    {
        return Inertia::render('Distribuidora/Vales/Index');
    }

    public function crearVale()
    {
        return Inertia::render('Distribuidora/Vales/Create');
    }

    public function puntos()
    {
        return Inertia::render('Distribuidora/Puntos');
    }

    public function misClientes()
    {
        return Inertia::render('Distribuidora/MisClientes');
    }

    public function estadoCuenta()
    {
        return Inertia::render('Distribuidora/EstadoCuenta');
    }
}
