<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AprobarDistribuidoraRequest extends FormRequest
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
            'limite_credito' => ['required', 'numeric', 'min:1'],
            'categoria_id' => [
                'nullable',
                Rule::exists('categorias_distribuidora', 'id')->where(fn($query) => $query->where('activo', true)),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'limite_credito.required' => 'Debes asignar el límite de crédito inicial.',
            'limite_credito.numeric' => 'El límite de crédito debe ser numérico.',
            'limite_credito.min' => 'El límite de crédito debe ser mayor a 0.',
            'categoria_id.exists' => 'La categoría seleccionada no es válida.',
        ];
    }
}
