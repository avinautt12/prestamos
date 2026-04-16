import { useEffect, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Head, Link, useForm } from '@inertiajs/react';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Login({ status, canResetPassword }) {
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        nombre_usuario: '',
        password: '',
        remember: false,
        recaptcha_token: '',
    });

    useEffect(() => {
        if (RECAPTCHA_SITE_KEY) {
            const scriptId = 'recaptcha-v3-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }

            // Ocultar el badge flotante de reCAPTCHA globalmente
            const styleId = 'recaptcha-hide-badge';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = '.grecaptcha-badge { visibility: hidden !important; }';
                document.head.appendChild(style);
            }
        }

        return () => {
            reset('password');
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();

        let token = '';

        if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
            try {
                await new Promise((resolve) => window.grecaptcha.ready(resolve));
                token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
            } catch (err) {
                console.error('reCAPTCHA error:', err);
            }
        }

        // transform inyecta el token al payload justo antes del POST,
        // evitando el race condition de setData async + post inmediato.
        transform((current) => ({ ...current, recaptcha_token: token }));
        post(route('login', {}, false));
    };

    return (
        <GuestLayout>
            <Head title="Inicio de sesión" />

            <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">
                Prestamo Fácil
            </h2>
            <p className="mb-6 text-center text-gray-600">
                Sistema de Gestión de Préstamos
            </p>

            {status && (
                <div className="mb-4 text-sm text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="nombre_usuario" value="Nombre de usuario" />

                    <TextInput
                        id="nombre_usuario"
                        type="text"
                        name="nombre_usuario"
                        value={data.nombre_usuario}
                        className="block w-full mt-1"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('nombre_usuario', e.target.value)}
                    />

                    <InputError message={errors.nombre_usuario} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Contraseña" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type={mostrarPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pr-10"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => setMostrarPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-gray-500 hover:text-gray-700"
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <FontAwesomeIcon icon={mostrarPassword ? faEyeSlash : faEye} />
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-gray-600 underline rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            ¿Perdiste tu contraseña?
                        </Link>
                    )}

                    <PrimaryButton
                        className="bg-green-500 ms-4 hover:bg-green-700 focus:bg-green-600 active:bg-green-700"
                        disabled={processing}
                    >
                        {processing ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Iniciando sesión...
                            </span>
                        ) : 'Iniciar Sesión'}
                    </PrimaryButton>
                </div>
            </form>

            {RECAPTCHA_SITE_KEY && (
                <p className="mt-4 text-xs text-center text-gray-400">
                    Este sitio está protegido por reCAPTCHA y aplican la{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Política de Privacidad</a>{' '}y los{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Términos de Servicio</a> de Google.
                </p>
            )}
        </GuestLayout>
    );
}
