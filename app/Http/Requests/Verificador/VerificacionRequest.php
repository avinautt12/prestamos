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
        $rules = [
            'resultado' => 'required|in:VERIFICADA,RECHAZADA',
            'observaciones' => 'nullable|string|min:0|max:500',
            'latitud_verificacion' => 'nullable|numeric|between:-90,90',
            'longitud_verificacion' => 'nullable|numeric|between:-180,180',
            'fecha_visita' => 'nullable|date',
            'checklist' => 'required|array',
            'checklist.domicilio_correcto' => 'required|boolean',
            'checklist.persona_identificada' => 'required|boolean',
            'checklist.vehiculos_visibles' => 'required|boolean',
            'checklist.documentos_validos' => 'required|boolean',
            'justificaciones' => 'nullable|array',
            'justificaciones.domicilio_correcto' => 'nullable|string|max:500',
            'justificaciones.persona_identificada' => 'nullable|string|max:500',
            'justificaciones.vehiculos_visibles' => 'nullable|string|max:500',
            'justificaciones.documentos_validos' => 'nullable|string|max:500',
            'foto_fachada' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'foto_ine_con_persona' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'foto_comprobante' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ];

        foreach (range(1, 10) as $i) {
            $rules["evidencia_extra_{$i}"] = 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096';
            $rules["evidencia_extra_{$i}_descripcion"] = 'nullable|string|max:255';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'resultado.required' => 'Debes seleccionar un resultado para la verificación',
            'resultado.in' => 'El resultado debe ser VERIFICADA o RECHAZADA',
            'latitud_verificacion.between' => 'La latitud debe estar entre -90 y 90',
            'longitud_verificacion.between' => 'La longitud debe estar entre -180 y 180',
            'checklist.required' => 'Debes completar el checklist de verificación',
            'checklist.domicilio_correcto.required' => 'Debes indicar si el domicilio es correcto',
            'checklist.persona_identificada.required' => 'Debes indicar si la persona fue identificada',
            'checklist.vehiculos_visibles.required' => 'Debes indicar la revisión de vehículos visibles',
            'checklist.documentos_validos.required' => 'Debes indicar si los documentos son válidos',
            'checklist.domicilio_correcto.boolean' => 'El valor de domicilio correcto no es válido',
            'checklist.persona_identificada.boolean' => 'El valor de persona identificada no es válido',
            'checklist.vehiculos_visibles.boolean' => 'El valor de vehículos visibles no es válido',
            'checklist.documentos_validos.boolean' => 'El valor de documentos válidos no es válido',
            'foto_fachada.image' => 'La foto de fachada debe ser una imagen válida',
            'foto_ine_con_persona.image' => 'La foto de INE con persona debe ser una imagen válida',
            'foto_comprobante.image' => 'La foto de comprobante debe ser una imagen válida',
            'foto_fachada.max' => 'La foto de fachada no debe exceder 4 MB',
            'foto_ine_con_persona.max' => 'La foto de INE con persona no debe exceder 4 MB',
            'foto_comprobante.max' => 'La foto de comprobante no debe exceder 4 MB',
        ];
    }
}
