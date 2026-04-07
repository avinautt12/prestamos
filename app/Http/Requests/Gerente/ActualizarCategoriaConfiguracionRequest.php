<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarCategoriaConfiguracionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        return $usuario->roles()->where('codigo', 'GERENTE')->exists();
    }

    public function rules(): array
    {
        $categoria = $this->route('categoria');
        $categoriaId = is_object($categoria) ? $categoria->id : $categoria;

        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categorias_distribuidora', 'nombre')->ignore($categoriaId),
            ],
            'porcentaje_comision' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
