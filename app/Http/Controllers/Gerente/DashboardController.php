<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Controller;
use App\Models\Distribuidora;
use App\Models\Sucursal;
use App\Models\Vale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalSucursales = Sucursal::query()
            ->where('activo', true)
            ->count();

        $totalDistribuidoras = Distribuidora::query()
            ->where('estado', Distribuidora::ESTADO_ACTIVA)
            ->count();

        $valesActivosQuery = Vale::query()
            ->whereIn('estado', [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
            ]);

        $totalValesActivos = (clone $valesActivosQuery)->count();

        $montoPrestado = (float) ((clone $valesActivosQuery)->sum('monto_principal') ?? 0);

        return Inertia::render('Gerente/GerenteDashboard', [
            'stats' => [
                'total_sucursales' => $totalSucursales,
                'total_distribuidoras' => $totalDistribuidoras,
                'total_vales_activos' => $totalValesActivos,
                'monto_prestado' => $montoPrestado,
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
