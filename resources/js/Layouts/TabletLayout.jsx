import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRightArrowLeft,
    faBars,
    faRightFromBracket,
    faXmark,
    faHouse,
    faChartLine,
    faFileLines,
    faFileCirclePlus,
    faUsers,
    faPeopleGroup,
    faClipboardCheck,
    faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons';

export default function TabletLayout({ children, title = 'Prestamo Fácil', showTitle = false }) {
    const { auth, ziggy } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    const currentUrl = ziggy?.location || '';

    // Ruta base dependiendo del rol
    let homeRoute = '/';
    if (auth.user?.rol_nombre === 'coordinador') homeRoute = route('coordinador.dashboard');
    else if (auth.user?.rol_nombre === 'cajera') homeRoute = route('cajera.dashboard');
    else if (auth.user?.rol_nombre === 'verificador') homeRoute = route('verificador.dashboard');

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

    useEffect(() => {
        setSidebarOpen(false);
    }, [currentUrl]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // MENÚS DINÁMICOS POR ROL
    let navigation = [];
    let shortcuts = [];

    if (auth.user?.rol_nombre === 'coordinador') {
        navigation = [
            { name: 'Dashboard', href: route('coordinador.dashboard'), icon: faHouse, active: route().current('coordinador.dashboard') },
            { name: 'Nueva Solicitud', href: route('coordinador.solicitudes.create'), icon: faFileCirclePlus, active: route().current('coordinador.solicitudes.create') },
            { name: 'Reportes', href: route('coordinador.reportes'), icon: faChartLine, active: route().current('coordinador.reportes') },
            { name: 'Solicitudes', href: route('coordinador.solicitudes.index'), icon: faFileLines, active: route().current('coordinador.solicitudes.*') },
            { name: 'Traspasos', href: route('coordinador.traspasos.index'), icon: faArrowRightArrowLeft, active: route().current('coordinador.traspasos.*') },
            { name: 'Clientes', href: route('coordinador.clientes'), icon: faUsers, active: route().current('coordinador.clientes') },
            { name: 'Mis Distribuidoras', href: route('coordinador.mis-distribuidoras'), icon: faPeopleGroup, active: route().current('coordinador.mis-distribuidoras') }
        ];
        shortcuts = [
            { name: 'Captura Rápida', href: route('coordinador.solicitudes.create') },
            { name: 'Reportes', href: route('coordinador.reportes') },
            { name: 'Traspasos', href: route('coordinador.traspasos.index') },
            { name: 'Ver Cartera', href: route('coordinador.clientes') },
        ];
    } else if (auth.user?.rol_nombre === 'cajera') {
        navigation = [
            { name: 'Dashboard', href: route('cajera.dashboard'), icon: faHouse, active: route().current('cajera.dashboard') },
            { name: 'Prevales', href: route('cajera.prevale.index'), icon: faFileLines, active: route().current('cajera.prevale.*') },
            { name: 'Conciliaciones', href: route('cajera.conciliaciones'), icon: faScaleBalanced, active: route().current('cajera.conciliaciones*') },
            { name: 'Cobranza', href: route('cajera.cobranza.index'), icon: faUsers, active: route().current('cajera.cobranza.*') }
        ];
        shortcuts = [
            { name: 'Validar Prevale', href: route('cajera.prevale.index') },
            { name: 'Conciliar archivo', href: route('cajera.conciliaciones') },
        ];
    } else {
        navigation = [
            { name: 'Dashboard', href: route('verificador.dashboard'), icon: faHouse, active: route().current('verificador.dashboard') },
            { name: 'Solicitudes Pendientes', href: route('verificador.solicitudes.pendientes'), icon: faFileLines, active: route().current('verificador.solicitudes.pendientes') },
            { name: 'Mapa de Ruta', href: route('verificador.mapa-ruta'), icon: faPeopleGroup, active: route().current('verificador.mapa-ruta') },
            { name: 'Validaciones', href: route('verificador.validaciones'), icon: faClipboardCheck, active: route().current('verificador.validaciones') }
        ];
        shortcuts = [
            { name: 'Por Revisar', href: route('verificador.solicitudes.pendientes') },
            { name: 'Mapa de Ruta', href: route('verificador.mapa-ruta') },
        ];
    }

    return (
        <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5_0%,_#f8fafc_40%,_#eef2ff_100%)]">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="fixed inset-0 z-20 bg-emerald-950/10 backdrop-blur-[1px]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 z-30 h-full w-72 bg-white/92 border-r transition-transform duration-300 backdrop-blur ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderColor: '#D1FAE5' }}>
                <div className="h-full overflow-y-auto">
                    <div className="p-4 border-b" style={{ borderColor: '#D1FAE5' }}>
                        <div className="flex items-center justify-between">
                            <Link href={homeRoute} onClick={() => setSidebarOpen(false)}>
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
                            <div className="mt-2 text-xs text-gray-500">
                                {title}
                            </div>
                        </div>
                    </div>
                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-3 py-3 rounded-lg border transition-colors ${item.active
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'border-transparent hover:bg-gray-50 text-gray-800'
                                    }`}
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3 fin-icon" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="px-4 pb-4">
                        <div className="p-3 border rounded-lg border-emerald-100 bg-emerald-50/60">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Atajos</p>
                            <div className="space-y-1">
                                {shortcuts.map((shortcut) => (
                                    <Link
                                        key={shortcut.name}
                                        href={shortcut.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className="block px-2 py-2 text-sm text-gray-700 rounded hover:bg-white"
                                    >
                                        {shortcut.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur" style={{ borderColor: '#D1FAE5' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md hover:bg-gray-100"
                            style={{ color: '#6B7280' }}
                        >
                            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
                        </button>
                        <Link href={homeRoute} className="flex items-center">
                            <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                            <span className="ml-2 text-base font-bold md:text-lg" style={{ color: '#1F2937' }}>Prestamo Fácil</span>
                        </Link>
                        <Link href={route('logout', {}, false)} method="post" as="button" className="p-2">
                            <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5 text-red-600" />
                        </Link>
                    </div>
                </header>

                <main className="p-4 pb-20">
                    {showTitle && title && <h1 className="mb-4 text-xl font-bold">{title}</h1>}
                    {children}
                </main>
            </div>

            <NotificationCenter />

            <div className="fixed z-50 space-y-2 top-16 right-4">
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