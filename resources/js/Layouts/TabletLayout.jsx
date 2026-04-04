import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faRightFromBracket,
    faXmark,
    faHouse,
    faFileLines,
    faUsers,
    faPeopleGroup,
    faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';

export default function TabletLayout({ children, title = 'Prestamo Fácil', showTitle = false }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    const agregarToast = (titulo, mensaje) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, titulo, mensaje }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 6000);
    };

    useEffect(() => {
        const userId = auth?.user?.id;
        const sucursalId = auth?.sucursal_id;
        const rol = auth?.user?.rol_nombre;

        if (!userId || !window.Echo) {
            return;
        }

        let sucursalChannel = null;
        const userChannel = window.Echo.private(`user.${userId}`);

        if (sucursalId) {
            sucursalChannel = window.Echo.private(`sucursal.${sucursalId}`);

            if (rol === 'verificador') {
                sucursalChannel.listen('.SolicitudPendienteVerificacion', (payload) => {
                    agregarToast('Nueva solicitud por verificar', `${payload.cliente_nombre} (folio #${payload.solicitud_id})`);
                });
            }

            if (rol === 'coordinador') {
                sucursalChannel.listen('.AlertaMorosidad', (payload) => {
                    agregarToast('Alerta de morosidad', payload.cliente_nombre || 'Se detectó una cuenta morosa');
                });
            }
        }

        if (rol === 'coordinador') {
            userChannel.listen('.DictamenSolicitud', (payload) => {
                const estatus = payload.resultado === 'VERIFICADA' ? 'verificada' : 'rechazada';
                agregarToast('Dictamen recibido', `${payload.cliente_nombre} fue ${estatus}`);
            });
        }

        return () => {
            window.Echo.leave(`user.${userId}`);
            if (sucursalId) {
                window.Echo.leave(`sucursal.${sucursalId}`);
            }
        };
    }, [auth?.user?.id, auth?.user?.rol_nombre, auth?.sucursal_id]);

    const navigation = auth.user?.rol_nombre === 'coordinador' ? [
        { name: 'Dashboard', href: route('coordinador.dashboard'), icon: faHouse },
        { name: 'Solicitudes', href: route('coordinador.solicitudes'), icon: faFileLines },
        { name: 'Clientes', href: route('coordinador.clientes'), icon: faUsers },
        { name: 'Mis Distribuidoras', href: route('coordinador.mis-distribuidoras'), icon: faPeopleGroup }
    ] : [
        { name: 'Dashboard', href: route('verificador.dashboard'), icon: faHouse },
        { name: 'Solicitudes Pendientes', href: route('verificador.solicitudes.pendientes'), icon: faFileLines },
        { name: 'Validaciones', href: route('verificador.validaciones'), icon: faClipboardCheck }
    ];

    return (
        <div className="relative flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r transition-all duration-300 overflow-hidden`} style={{ borderColor: '#E5E7EB' }}>
                <div className="w-64 h-full">
                    <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-center justify-between">
                            <Link href={route('dashboard')} onClick={() => setSidebarOpen(false)}>
                                <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                            </Link>
                            <button onClick={() => setSidebarOpen(false)} className="p-2">
                                <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>
                        <div className="mt-3">
                            <div className="font-semibold">
                                {auth.user.persona?.primer_nombre} {auth.user.persona?.apellido_paterno}
                            </div>
                            <div className="mt-1 text-sm text-gray-500 capitalize">
                                {auth.user.rol_nombre}
                            </div>
                        </div>
                    </div>
                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-3 py-3 rounded-lg hover:bg-gray-50"
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3 fin-icon" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md hover:bg-gray-100"
                            style={{ color: '#6B7280' }}
                        >
                            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
                        </button>
                        <Link href={route('dashboard')} className="flex items-center">
                            <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                            <span className="ml-2 text-lg font-bold" style={{ color: '#1F2937' }}>Prestamo Fácil</span>
                        </Link>
                        <Link href={route('logout')} method="post" as="button" className="p-2">
                            <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5 text-red-600" />
                        </Link>
                    </div>
                </header>

                <main className="p-4 pb-20">
                    {showTitle && title && <h1 className="mb-4 text-xl font-bold">{title}</h1>}
                    {children}
                </main>
            </div>

            <div className="fixed z-50 space-y-2 top-4 right-4">
                {toasts.map((toast) => (
                    <div key={toast.id} className="p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-lg w-72">
                        <p className="font-semibold text-gray-800">{toast.titulo}</p>
                        <p className="mt-1 text-gray-600">{toast.mensaje}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}