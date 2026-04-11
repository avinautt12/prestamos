<?php

namespace App\Http\Requests\Distribuidora;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportarPagoRequest extends FormRequest
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
            'monto'                => ['required', 'numeric', 'min:0.01'],
            'metodo_pago'          => ['required', Rule::in(['TRANSFERENCIA', 'DEPOSITO', 'OTRO'])],
            'referencia_reportada' => ['required', 'string', 'max:100'],
            'fecha_pago'           => ['nullable', 'date'],
            'observaciones'        => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'monto.required'                => 'Debes indicar el monto pagado.',
            'monto.numeric'                 => 'El monto debe ser un número.',
            'monto.min'                     => 'El monto debe ser mayor a cero.',
            'metodo_pago.required'          => 'Debes seleccionar un método de pago.',
            'metodo_pago.in'                => 'El método de pago no es válido.',
            'referencia_reportada.required' => 'Debes indicar la referencia del pago.',
            'referencia_reportada.max'      => 'La referencia no debe exceder 100 caracteres.',
        ];
    }
}
