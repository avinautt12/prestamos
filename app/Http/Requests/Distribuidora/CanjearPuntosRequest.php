<?php

namespace App\Http\Requests\Distribuidora;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CanjearPuntosRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        return $usuario->roles()->where('codigo', 'DISTRIBUIDORA')->exists();
    }

    public function rules(): array
    {
        return [
            'relacion_corte_id' => ['required', 'integer', Rule::exists('relaciones_corte', 'id')],
            'puntos_a_canjear'  => ['required', 'integer', 'min:2'],
        ];
    }

    public function messages(): array
    {
        return [
            'relacion_corte_id.required' => 'Debes seleccionar una relación de corte.',
            'relacion_corte_id.exists'   => 'La relación seleccionada no es válida.',
            'puntos_a_canjear.required'  => 'Debes indicar cuántos puntos canjear.',
            'puntos_a_canjear.integer'   => 'Los puntos deben ser un número entero.',
            'puntos_a_canjear.min'       => 'Debes canjear al menos 2 puntos ($1 peso).',
        ];
    }
}
