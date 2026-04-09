import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faChartPie,
    faFileInvoiceDollar,
    faHouse,
    faRightFromBracket,
    faStar,
    faUsers,
    faWallet,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';

export default function DistribuidoraLayout({ children, title = 'Mi Panel', subtitle = null }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    const navigation = useMemo(() => ([
        { name: 'Dashboard', short: 'Inicio', href: route('distribuidora.dashboard'), icon: faHouse, current: 'distribuidora.dashboard' },
        { name: 'Mis Clientes', short: 'Clientes', href: route('distribuidora.clientes'), icon: faUsers, current: 'distribuidora.clientes' },
        { name: 'Vales', short: 'Vales', href: route('distribuidora.vales'), icon: faFileInvoiceDollar, current: 'distribuidora.vales' },
        { name: 'Estado de Cuenta', short: 'Cuenta', href: route('distribuidora.estado-cuenta'), icon: faWallet, current: 'distribuidora.estado-cuenta' },
        { name: 'Puntos', short: 'Puntos', href: route('distribuidora.puntos'), icon: faStar, current: 'distribuidora.puntos' },
        { name: 'Pre vale', short: 'Pre vale', href: route('distribuidora.vales.create'), icon: faChartPie, current: 'distribuidora.vales.create' },
    ]), []);

    const agregarToast = (titulo, mensaje) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, titulo, mensaje }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 6000);
    };

    useEffect(() => {
        const handleNotification = (event) => {
            const detail = event.detail || {};
            if (!detail?.titulo && !detail?.mensaje) {
                return;
            }
            agregarToast(detail.titulo || 'Notificación', detail.mensaje || 'Tienes una actualización nueva.');
        };

        window.addEventListener('app-notification', handleNotification);

        return () => {
            window.removeEventListener('app-notification', handleNotification);
        };
    }, []);

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId || !window.Echo) {
            return;
        }

        const channelName = `user.${userId}`;
        const channel = window.Echo.private(channelName);

        channel.listen('.ActualizacionCredito', (payload) => {
            agregarToast(
                'Límite actualizado',
                `Tu distribuidora ${payload.numero_distribuidora} ahora tiene un límite autorizado de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(payload.nuevo_limite || 0))}.`
            );
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [auth?.user?.id]);

    return (
        <div className="relative flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
            <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r transition-all duration-300 overflow-hidden`} style={{ borderColor: '#E5E7EB' }}>
                <div className="w-72 h-full">
                    <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-center justify-between">
                            <Link href={route('distribuidora.dashboard')} onClick={() => setSidebarOpen(false)}>
                                <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                            </Link>
                            <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 text-gray-700">
                                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-4">
                            <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Distribuidora</div>
                            <div className="mt-1 font-semibold text-gray-900">
                                {auth?.user?.persona?.primer_nombre} {auth?.user?.persona?.apellido_paterno}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">App móvil operativa</div>
                        </div>
                    </div>

                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => {
                            const isActive = route().current(item.current);

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${isActive ? 'bg-green-50 border-green-200 text-green-700' : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <div className="flex-1 min-w-0 pb-20 md:pb-0">
                <header className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md hover:bg-gray-100"
                            style={{ color: '#6B7280' }}
                        >
                            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
                        </button>

                        <Link href={route('distribuidora.dashboard')} className="flex items-center">
                            <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                            <span className="ml-2 text-base font-bold text-gray-900">Prestamo Fácil</span>
                        </Link>

                        <Link href={route('logout')} method="post" as="button" className="p-2 text-red-600">
                            <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                <main className="p-4 pb-24 md:pb-20">
                    <div className="max-w-5xl mx-auto fin-page">
                        <div className="mb-4 fin-card">
                            <div className="flex items-start gap-3">
                                <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-green-50 text-green-700">
                                    <FontAwesomeIcon icon={faChartPie} />
                                </div>
                                <div>
                                    <h1 className="fin-title">{title}</h1>
                                    {subtitle && <p className="mt-1 fin-subtitle">{subtitle}</p>}
                                </div>
                            </div>
                        </div>

                        {children}
                    </div>
                </main>
            </div>

            <NotificationCenter />

            <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t md:hidden" style={{ borderColor: '#E5E7EB' }}>
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    {navigation.slice(0, 5).map((item) => {
                        const isActive = route().current(item.current);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-500'}`}
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-4 h-4 mb-1" />
                                <span>{item.short}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="fixed z-50 space-y-2 top-16 right-4">
                {toasts.map((toast) => (
                    <div key={toast.id} className="w-72 p-3 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <p className="font-semibold text-gray-800">{toast.titulo}</p>
                        <p className="mt-1 text-sm text-gray-600">{toast.mensaje}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
