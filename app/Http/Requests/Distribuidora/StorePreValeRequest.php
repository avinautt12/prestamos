<?php

namespace App\Http\Requests\Distribuidora;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePreValeRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();

        return $usuario->roles()->where('codigo', 'DISTRIBUIDORA')->exists();
    }

    public function rules(): array
    {
        $reglas = [
            'producto_id' => [
                'required',
                'integer',
                Rule::exists('productos_financieros', 'id')->where(fn ($query) => $query->where('activo', true)),
            ],
            'cliente_id' => ['nullable', 'integer', Rule::exists('clientes', 'id')],
        ];

        // Si no viene cliente_id, se requieren datos de persona nueva
        if (!$this->filled('cliente_id')) {
            $reglas += [
                'primer_nombre'      => ['required', 'string', 'max:100'],
                'segundo_nombre'     => ['nullable', 'string', 'max:100'],
                'apellido_paterno'   => ['required', 'string', 'max:100'],
                'apellido_materno'   => ['nullable', 'string', 'max:100'],
                'sexo'               => ['nullable', Rule::in(['M', 'F', 'OTRO'])],
                'fecha_nacimiento'   => ['nullable', 'date'],
                'curp'               => ['nullable', 'string', 'size:18', 'unique:personas,curp', 'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/'],
                'telefono_celular'   => ['nullable', 'string', 'max:30'],
                'correo_electronico' => ['nullable', 'email', 'max:150'],
                'calle'              => ['nullable', 'string', 'max:150'],
                'numero_exterior'    => ['nullable', 'string', 'max:30'],
                'colonia'            => ['nullable', 'string', 'max:120'],
                'ciudad'             => ['nullable', 'string', 'max:120'],
                'estado_direccion'   => ['nullable', 'string', 'max:120'],
                'codigo_postal'      => ['nullable', 'string', 'max:10'],

                // Fotos INE y selfie
                'foto_ine_frente'    => ['required', 'image', 'max:5120'],
                'foto_ine_reverso'   => ['required', 'image', 'max:5120'],
                'foto_selfie_ine'    => ['required', 'image', 'max:5120'],

                // Cuenta bancaria
                'cuenta_banco'       => ['required', 'string', 'max:100'],
                'cuenta_clabe'       => ['required', 'string', 'size:18'],
                'cuenta_titular'     => ['required', 'string', 'max:150'],
            ];
        }

        return $reglas;
    }

    public function messages(): array
    {
        return [
            'producto_id.required'      => 'Debes seleccionar un producto financiero.',
            'producto_id.exists'        => 'El producto seleccionado no es válido o no está activo.',
            'cliente_id.exists'         => 'El cliente seleccionado no es válido.',
            'primer_nombre.required'    => 'El primer nombre del cliente es obligatorio.',
            'primer_nombre.max'         => 'El primer nombre no debe exceder 100 caracteres.',
            'apellido_paterno.required' => 'El apellido paterno del cliente es obligatorio.',
            'apellido_paterno.max'      => 'El apellido paterno no debe exceder 100 caracteres.',
            'curp.size'                 => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.unique'               => 'Ya existe una persona registrada con esta CURP.',
            'curp.regex'                => 'El formato de la CURP no es válido.',
            'correo_electronico.email'  => 'El correo electrónico no tiene un formato válido.',
            'foto_ine_frente.required'  => 'La foto del INE (frente) es obligatoria.',
            'foto_ine_frente.image'     => 'El archivo debe ser una imagen.',
            'foto_ine_frente.max'       => 'La imagen no debe superar 5 MB.',
            'foto_ine_reverso.required' => 'La foto del INE (reverso) es obligatoria.',
            'foto_ine_reverso.image'    => 'El archivo debe ser una imagen.',
            'foto_ine_reverso.max'      => 'La imagen no debe superar 5 MB.',
            'foto_selfie_ine.required'  => 'La selfie con INE es obligatoria.',
            'foto_selfie_ine.image'     => 'El archivo debe ser una imagen.',
            'foto_selfie_ine.max'       => 'La imagen no debe superar 5 MB.',
            'cuenta_banco.required'     => 'El nombre del banco es obligatorio.',
            'cuenta_clabe.required'     => 'La CLABE interbancaria es obligatoria.',
            'cuenta_clabe.size'         => 'La CLABE debe tener exactamente 18 dígitos.',
            'cuenta_titular.required'   => 'El nombre del titular de la cuenta es obligatorio.',
        ];
    }
}
