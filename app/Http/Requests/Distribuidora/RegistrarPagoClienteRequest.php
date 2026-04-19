<?php

namespace App\Http\Requests\Distribuidora;

use App\Models\Vale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RegistrarPagoClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario|null $usuario */
        $usuario = auth()->user();

        if (!$usuario) {
            return false;
        }

        return $usuario->roles()->where('codigo', 'DISTRIBUIDORA')->exists();
    }

    public function rules(): array
    {
        return [
            'monto'      => ['required', 'numeric', 'min:0.01', 'regex:/^\d+(\.\d{1,2})?$/'],
            'fecha_pago' => ['required', 'date', 'before_or_equal:now'],
            'notas'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'monto.required'         => 'Debes indicar el monto del pago.',
            'monto.numeric'          => 'El monto debe ser un número.',
            'monto.min'              => 'El monto debe ser mayor a cero.',
            'monto.regex'            => 'El monto sólo admite hasta 2 decimales.',
            'fecha_pago.required'    => 'Debes indicar la fecha del pago.',
            'fecha_pago.date'        => 'La fecha del pago no es válida.',
            'fecha_pago.before_or_equal' => 'La fecha del pago no puede ser futura.',
            'notas.max'              => 'Las notas no deben exceder 500 caracteres.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $valeId = (int) $this->route('vale');
            if ($valeId <= 0) {
                $validator->errors()->add('general', 'Vale no especificado.');
                return;
            }

            $vale = Vale::find($valeId);
            if (!$vale) {
                $validator->errors()->add('general', 'El vale no fue encontrado.');
                return;
            }

            $estadosPermitidos = [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
                Vale::ESTADO_PAGADO,
                Vale::ESTADO_MOROSO,
            ];

            if (!in_array($vale->estado, $estadosPermitidos, true)) {
                $validator->errors()->add('general', 'No se pueden registrar pagos en el estado actual del vale (' . $vale->estado . ').');
                return;
            }

            $monto = round((float) $this->input('monto'), 2);
            $saldoActual = round((float) $vale->saldo_actual, 2);

            if ($monto > $saldoActual + 0.009) {
                $validator->errors()->add(
                    'monto',
                    'El monto excede el saldo pendiente del vale ($' . number_format($saldoActual, 2) . ').'
                );
            }

            if ($vale->fecha_emision) {
                $fechaEmision = $vale->fecha_emision->startOfDay();
                $fechaPago = \Carbon\Carbon::parse($this->input('fecha_pago'))->startOfDay();

                if ($fechaPago->lt($fechaEmision)) {
                    $validator->errors()->add('fecha_pago', 'La fecha del pago no puede ser anterior a la emisión del vale.');
                }
            }
        });
    }
}
