<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Sucursal;
use App\Models\Usuario;

trait ResuelveSucursalActivaGerente
{
    protected function obtenerSucursalActivaGerente(Usuario $usuario): ?Sucursal
    {
        return $usuario->sucursales()
            ->wherePivotNull('revocado_en')
            ->orderByDesc('usuario_rol.es_principal')
            ->orderByDesc('usuario_rol.asignado_en')
            ->first();
    }
}
