<?php

namespace App\Services\Distribuidora;

use App\Models\Distribuidora;
use App\Models\Usuario;

class DistribuidoraContextService
{
    public function resolveForUser(?Usuario $usuario): ?Distribuidora
    {
        if (!$usuario?->persona_id) {
            return null;
        }

        return Distribuidora::query()
            ->with([
                'persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno,telefono_celular,correo_electronico',
                'categoria:id,codigo,nombre,porcentaje_comision',
                'sucursal:id,codigo,nombre',
                'sucursal.configuracion:id,sucursal_id',
                'cuentaBancaria:id,banco,nombre_titular,numero_cuenta_mascarado,clabe,convenio,referencia_base',
            ])
            ->where('persona_id', $usuario->persona_id)
            ->first();
    }
}
