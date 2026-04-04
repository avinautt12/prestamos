<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class RechazarDistribuidoraRequest extends FormRequest
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
            'motivo_rechazo' => ['required', 'string', 'min:20', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo_rechazo.required' => 'Debes capturar el motivo del rechazo.',
            'motivo_rechazo.min' => 'El motivo del rechazo debe tener al menos 20 caracteres.',
            'motivo_rechazo.max' => 'El motivo del rechazo no debe exceder 500 caracteres.',
        ];
    }
}
