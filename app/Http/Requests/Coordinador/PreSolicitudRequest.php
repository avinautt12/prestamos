<?php

namespace App\Http\Requests\Coordinador;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Usuario;
use App\Models\Solicitud;
use Illuminate\Validation\Rule;

class PreSolicitudRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Usuario $usuario */
        $usuario = auth()->user();
        return $usuario->roles()->where('codigo', 'COORDINADOR')->exists();
    }

    public function rules(): array
    {
        $solicitudId = $this->route('id');
        $personaId = null;

        if ($solicitudId) {
            $personaId = Solicitud::query()
                ->whereKey($solicitudId)
                ->value('persona_solicitante_id');
        }

        $esEdicion = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            // Datos Personales
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'required|string|max:100',
            'sexo' => 'required|in:M,F,OTRO',
            'fecha_nacimiento' => 'required|date|before:today',
            'curp' => [
                'required',
                'string',
                'size:18',
                'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/',
                Rule::unique('personas', 'curp')->ignore($personaId),
            ],
            'rfc' => [
                'required',
                'string',
                'size:13',
                'regex:/^[A-Z]{4}\d{6}[A-Z0-9]{3}$/',
                Rule::unique('personas', 'rfc')->ignore($personaId),
            ],
            'telefono_personal' => 'required|string|max:30',
            'telefono_celular' => 'required|string|max:30',
            'correo_electronico' => 'nullable|email|max:150',

            // Límite de crédito solicitado
            'limite_credito_solicitado' => 'nullable|numeric|min:0|max:99999999.99',

            // Domicilio
            'calle' => 'required|string|max:150',
            'numero_exterior' => 'required|string|max:30',
            'numero_interior' => 'nullable|string|max:30',
            'colonia' => 'required|string|max:120',
            'ciudad' => 'required|string|max:120',
            'estado' => 'required|string|max:120',
            'codigo_postal' => 'required|string|max:10',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',

            // Datos Familiares (JSON)
            'familiares' => 'required|array',
            'familiares.conyuge' => 'nullable|array',
            'familiares.conyuge.nombre' => 'nullable|string|max:150',
            'familiares.conyuge.telefono' => 'nullable|string|max:30',
            'familiares.hijos' => 'nullable|array',
            'familiares.hijos.*.nombre' => 'required_with:familiares.hijos|string|max:150',
            'familiares.hijos.*.edad' => 'required_with:familiares.hijos|integer|min:0|max:120',
            'familiares.padres' => 'required|array',
            'familiares.padres.madre.nombre' => 'required|string|max:150',
            'familiares.padres.padre.nombre' => 'required|string|max:150',

            // Afiliaciones Laborales (JSON)
            'afiliaciones' => 'nullable|array',
            'afiliaciones.*.empresa' => 'required_with:afiliaciones|string',
            'afiliaciones.*.antiguedad' => 'required_with:afiliaciones|integer',
            'afiliaciones.*.limite_credito' => 'required_with:afiliaciones|numeric|min:0',

            // Vehículos (JSON)
            'vehiculos' => 'nullable|array',
            'vehiculos.*.marca' => 'required_with:vehiculos|string',
            'vehiculos.*.modelo' => 'required_with:vehiculos|string',
            'vehiculos.*.placas' => 'required_with:vehiculos|string',
            'vehiculos.*.anio' => 'nullable|integer|between:1900,' . date('Y'),

            // Documentos
            'ine_frente' => [($esEdicion ? 'nullable' : 'required'), 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'ine_reverso' => [($esEdicion ? 'nullable' : 'required'), 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'comprobante_domicilio' => [($esEdicion ? 'nullable' : 'required'), 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:6144'],
            'reporte_buro' => [($esEdicion ? 'nullable' : 'required'), 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
        ];
    }

    public function messages(): array
    {
        return [
            'curp.regex' => 'El formato del CURP no es válido',
            'curp.unique' => 'El CURP ya existe en el sistema',
            'rfc.regex' => 'El formato del RFC no es válido',
            'rfc.unique' => 'El RFC ya existe en el sistema',
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy',
            'familiares.required' => 'Debes capturar los datos familiares para continuar',
            'familiares.hijos.*.nombre.required_with' => 'Cada hijo debe tener nombre',
            'familiares.hijos.*.edad.required_with' => 'Cada hijo debe tener edad',
            'familiares.padres.madre.nombre.required' => 'Debes capturar el nombre de la madre',
            'familiares.padres.padre.nombre.required' => 'Debes capturar el nombre del padre',
            'ine_frente.required' => 'Debes cargar INE frente',
            'ine_reverso.required' => 'Debes cargar INE reverso',
            'comprobante_domicilio.required' => 'Debes cargar comprobante de domicilio',
            'reporte_buro.required' => 'Debes cargar reporte de buró de crédito',
        ];
    }
}
