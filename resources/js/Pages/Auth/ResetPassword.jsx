import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function ResetPassword({ token, email }) {
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarContrasenaConf, setMostrarContrasenaConf] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'));
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Nombre de Usuario" />

                    <TextInput
                        id="email"
                        type="text"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full bg-slate-50"
                        autoComplete="username"
                        readOnly
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Contraseña" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type={mostrarContrasena ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pr-10"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarContrasena(!mostrarContrasena)}
                            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-gray-500 hover:text-gray-700"
                        >
                            <FontAwesomeIcon icon={mostrarContrasena ? faEye : faEyeSlash} />
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirmar Nueva Contraseña" />

                    <div className="relative mt-1">
                        <TextInput
                            type={mostrarContrasenaConf ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pr-10"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarContrasenaConf(!mostrarContrasenaConf)}
                            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-gray-500 hover:text-gray-700"
                        >
                            <FontAwesomeIcon icon={mostrarContrasenaConf ? faEye : faEyeSlash} />
                        </button>
                    </div>

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex flex-col items-center justify-between mt-6 space-y-4 sm:flex-row sm:space-y-0">
                    <Link
                        href={route('password.request')}
                        className="text-sm font-medium transition duration-150 ease-in-out text-slate-600 hover:text-slate-900 focus:outline-none hover:underline"
                    >
                        ¿El enlace caducó? Solicitar otro
                    </Link>

                    <PrimaryButton 
                        className="w-full sm:w-auto flex justify-center py-2.5 text-sm font-semibold tracking-wide bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 text-white rounded-lg"
                        disabled={processing}
                    >
                        {processing ? 'Guardando...' : 'GUARDAR CONTRASEÑA'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
