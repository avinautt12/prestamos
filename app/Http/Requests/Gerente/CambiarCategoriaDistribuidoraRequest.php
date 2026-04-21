<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class CambiarCategoriaDistribuidoraRequest extends FormRequest
{
    public function authorize(): bool
    {
        $usuario = auth()->user();

        return $usuario && $usuario->roles()->where('codigo', 'GERENTE')->exists();
    }

    public function rules(): array
    {
        return [
            'categoria_id' => ['required', 'integer', 'exists:categorias_distribuidora,id'],
            'motivo' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'categoria_id.required' => 'Debes seleccionar una categoria.',
            'categoria_id.integer' => 'La categoria seleccionada no es valida.',
            'categoria_id.exists' => 'La categoria seleccionada no existe.',
            'motivo.required' => 'El motivo del cambio es obligatorio.',
            'motivo.min' => 'El motivo debe tener al menos 10 caracteres.',
            'motivo.max' => 'El motivo no puede exceder 500 caracteres.',
        ];
    }
}
