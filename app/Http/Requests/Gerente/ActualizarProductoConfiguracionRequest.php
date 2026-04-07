<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarProductoConfiguracionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        return $usuario->roles()->where('codigo', 'GERENTE')->exists();
    }

    public function rules(): array
    {
        return [
            'porcentaje_comision_empresa' => ['required', 'numeric', 'min:0', 'max:100'],
            'porcentaje_interes_quincenal' => ['required', 'numeric', 'min:0', 'max:100'],
            'numero_quincenas' => ['required', 'integer', 'between:1,72'],
        ];
    }
}
