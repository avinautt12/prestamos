<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarCategoriaConfiguracionRequest extends FormRequest
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
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'porcentaje_comision' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
