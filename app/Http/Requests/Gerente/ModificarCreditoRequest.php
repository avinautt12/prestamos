<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModificarCreditoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $usuario = auth()->user();

        return $usuario->roles()->where('codigo', 'GERENTE')->exists();
    }

    public function rules(): array
    {
        return [
            'limite_credito' => ['required', 'numeric', 'min:1'],
            'justificacion' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'limite_credito.required' => 'El límite de crédito es obligatorio.',
            'limite_credito.numeric' => 'El límite de crédito debe ser numérico.',
            'limite_credito.min' => 'El límite de crédito debe ser mayor a 0.',
            'justificacion.required' => 'La justificación es obligatoria.',
            'justificacion.min' => 'La justificación debe tener al menos 10 caracteres.',
            'justificacion.max' => 'La justificación no puede exceder 500 caracteres.',
        ];
    }
}