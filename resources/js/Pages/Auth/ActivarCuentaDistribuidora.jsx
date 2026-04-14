import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ActivarCuentaDistribuidora({ token, valido, expirado }) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('distribuidora.activacion.store', { token }));
    };

    return (
        <GuestLayout>
            <Head title="Activar cuenta distribuidora" />

            <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">Activacion de cuenta</h2>
            <p className="mb-6 text-center text-gray-600">Define una contrasena para entrar a la app.</p>

            {!valido && (
                <div className="p-3 mb-4 text-sm text-red-700 border rounded-lg border-red-200 bg-red-50">
                    Este enlace no es valido.
                </div>
            )}

            {valido && expirado && (
                <div className="p-3 mb-4 text-sm text-amber-800 border rounded-lg border-amber-200 bg-amber-50">
                    Este enlace ya expiro. Solicita uno nuevo al gerente.
                </div>
            )}

            {valido && !expirado && (
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="password" value="Contrasena" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full mt-1"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirmar contrasena" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full mt-1"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <PrimaryButton className="bg-green-500 ms-4 hover:bg-green-700" disabled={processing}>
                            Activar cuenta
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </GuestLayout>
    );
}
