import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre_usuario: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-4 text-sm text-gray-600">
                ¿Olvidaste tu contraseña? Ingresa tu nombre de usuario para enviar una solicitud de recuperación a la gerencia de tu sucursal. Una vez aprobada, recibirás las instrucciones por correo.
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <TextInput
                    id="nombre_usuario"
                    type="text"
                    name="nombre_usuario"
                    value={data.nombre_usuario}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('nombre_usuario', e.target.value)}
                />

                <InputError message={errors.nombre_usuario} className="mt-2" />

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Enviar Solicitud a Gerencia
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
