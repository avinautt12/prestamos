<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarProductoConfiguracionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        return $usuario->roles()->whereIn('codigo', ['ADMIN', 'GERENTE'])->exists();
    }

    public function rules(): array
    {
        return [
            'monto_principal' => ['required', 'numeric', 'min:1', 'max:99999999.99'],
            'monto_seguro' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'porcentaje_comision_empresa' => ['required', 'numeric', 'min:0', 'max:100'],
            'porcentaje_interes_quincenal' => ['required', 'numeric', 'min:0', 'max:100'],
            'numero_quincenas' => ['required', 'integer', 'between:1,72'],
        ];
    }
}
