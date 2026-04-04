<?php

namespace App\Http\Requests\Verificador;

use Illuminate\Foundation\Http\FormRequest;

class VerificacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = auth()->user();
        return $usuario->roles()->where('codigo', 'VERIFICADOR')->exists();
    }

    public function rules(): array
    {
        return [
            'resultado' => 'required|in:VERIFICADA,RECHAZADA',
            'observaciones' => 'required_if:resultado,RECHAZADA|nullable|string|min:20|max:500',
            'latitud_verificacion' => 'nullable|numeric|between:-90,90',
            'longitud_verificacion' => 'nullable|numeric|between:-180,180',
            'fecha_visita' => 'nullable|date',
            'checklist' => 'nullable|array',
            'checklist.domicilio_correcto' => 'boolean',
            'checklist.persona_identificada' => 'boolean',
            'checklist.vehiculos_visibles' => 'boolean',
            'checklist.documentos_validos' => 'boolean',
            'foto_fachada' => 'required_if:resultado,VERIFICADA|nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'foto_ine_con_persona' => 'required_if:resultado,VERIFICADA|nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'foto_comprobante' => 'required_if:resultado,VERIFICADA|nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ];
    }

    public function messages(): array
    {
        return [
            'resultado.required' => 'Debes seleccionar un resultado para la verificación',
            'resultado.in' => 'El resultado debe ser VERIFICADA o RECHAZADA',
            'observaciones.required_if' => 'Debes proporcionar un motivo de rechazo',
            'observaciones.min' => 'El motivo de rechazo debe tener al menos 20 caracteres',
            'latitud_verificacion.between' => 'La latitud debe estar entre -90 y 90',
            'longitud_verificacion.between' => 'La longitud debe estar entre -180 y 180',
            'foto_fachada.required_if' => 'La foto de fachada es obligatoria para verificar la solicitud',
            'foto_ine_con_persona.required_if' => 'La foto de INE con persona es obligatoria para verificar la solicitud',
            'foto_comprobante.required_if' => 'La foto de comprobante es obligatoria para verificar la solicitud',
            'foto_fachada.image' => 'La foto de fachada debe ser una imagen válida',
            'foto_ine_con_persona.image' => 'La foto de INE con persona debe ser una imagen válida',
            'foto_comprobante.image' => 'La foto de comprobante debe ser una imagen válida',
            'foto_fachada.max' => 'La foto de fachada no debe exceder 4 MB',
            'foto_ine_con_persona.max' => 'La foto de INE con persona no debe exceder 4 MB',
            'foto_comprobante.max' => 'La foto de comprobante no debe exceder 4 MB',
        ];
    }
}
