<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarSucursalConfiguracionRequest extends FormRequest
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
            'dia_corte' => ['nullable', 'integer', 'between:1,31'],
            'hora_corte' => ['prohibited'],
            // Campos globales (se guardan en puntos_conf, no en sucursal_configuraciones).
            'factor_divisor_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'multiplicador_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'valor_punto_mxn' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'dia_corte' => $this->input('dia_corte') === '' ? null : $this->input('dia_corte'),
        ]);
    }
}
