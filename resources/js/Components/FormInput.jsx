import { useState } from 'react';

/**
 * FormInput — Componente de input reactivo compartido.
 *
 * Props:
 * - label:    Etiqueta del campo (opcional)
 * - required: Muestra asterisco rojo si true
 * - error:    Error de servidor (Inertia/backend) — se muestra inmediatamente
 * - validate: (value: string) => string | null  — validador inline client-side
 * - className: Clase extra para el wrapper <div>
 * - Resto de props se pasan directo al <input>
 *
 * Comportamiento:
 * - Antes de tocar el campo → borde gris neutro, sin ícono
 * - Al salir del campo (blur) → corre validate(), muestra rojo ❌ o verde ✅
 * - Mientras escribe (después del primer blur) → actualiza en tiempo real
 * - Error de servidor → rojo inmediato, sin importar touched
 */
export default function FormInput({
    label,
    required,
    error: serverError,
    className = '',
    validate: validateFn,
    onBlur: onBlurProp,
    onChange: onChangeProp,
    ...props
}) {
    const [touched, setTouched] = useState(false);
    const [localError, setLocalError] = useState(null);

    const displayError = serverError || (touched ? localError : null);
    const hasValue =
        props.value !== undefined &&
        props.value !== null &&
        String(props.value).trim().length > 0;
    const isInvalid = !!displayError;
    const isValid = touched && hasValue && !displayError;

    const handleBlur = (e) => {
        setTouched(true);
        if (validateFn) {
            setLocalError(validateFn(String(props.value ?? '')) || null);
        }
        if (onBlurProp) onBlurProp(e);
    };

    const handleChange = (e) => {
        if (touched && validateFn) {
            setLocalError(validateFn(e.target.value) || null);
        }
        if (onChangeProp) onChangeProp(e);
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}{' '}
                    {required && <span className="text-red-600">*</span>}
                </label>
            )}
            <div className="relative mt-1">
                <input
                    className={`w-full px-3 py-2 pr-9 border rounded-md transition-all duration-150 ${
                        isInvalid
                            ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-600'
                            : isValid
                            ? 'border-green-500 bg-green-50/30 focus:border-green-600 focus:ring-green-600'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />

                {/* Ícono ❌ rojo */}
                {isInvalid && (
                    <span
                        className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-red-500"
                        aria-hidden="true"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                )}

                {/* Ícono ✅ verde */}
                {isValid && !isInvalid && (
                    <span
                        className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-green-500"
                        aria-hidden="true"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                )}
            </div>

            {displayError && (
                <p className="mt-1 text-xs font-medium text-red-600">{displayError}</p>
            )}
        </div>
    );
}
