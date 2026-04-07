<?php

namespace App\Http\Requests\Gerente;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarSucursalConfiguracionRequest extends FormRequest
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
            'dia_corte' => ['nullable', 'integer', 'between:1,31'],
            'hora_corte' => ['nullable', 'date_format:H:i'],
            'frecuencia_pago_dias' => ['required', 'integer', 'between:1,90'],
            'plazo_pago_dias' => ['required', 'integer', 'between:1,180'],
            'linea_credito_default' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'seguro_tabuladores_json' => ['nullable'],
            'porcentaje_comision_apertura' => ['required', 'numeric', 'min:0', 'max:100'],
            'porcentaje_interes_quincenal' => ['required', 'numeric', 'min:0', 'max:100'],
            'multa_incumplimiento_monto' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'factor_divisor_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'multiplicador_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'valor_punto_mxn' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }
}
