import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faBell,
    faChartPie,
    faFileInvoiceDollar,
    faHouse,
    faRightFromBracket,
    faStar,
    faTextHeight,
    faUsers,
    faWallet,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';

export default function DistribuidoraLayout({ children, title = 'Mi Panel', subtitle = null }) {
    const { auth } = usePage().props;
    const currentUrl = usePage().url;
    const [toasts, setToasts] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [friendlyMode, setFriendlyMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = useMemo(() => ([
        { name: 'Dashboard', short: 'Inicio', href: route('distribuidora.dashboard'), icon: faHouse, current: 'distribuidora.dashboard' },
        { name: 'Clientes', short: 'Clientes', href: route('distribuidora.clientes'), icon: faUsers, current: 'distribuidora.clientes' },
        { name: 'Pre vale', short: 'Pre vale', href: route('distribuidora.vales.create'), icon: faChartPie, current: 'distribuidora.vales.create' },
        { name: 'Vales', short: 'Vales', href: route('distribuidora.vales'), icon: faFileInvoiceDollar, current: 'distribuidora.vales' },
        { name: 'Estado de Cuenta', short: 'Cuenta', href: route('distribuidora.estado-cuenta'), icon: faWallet, current: 'distribuidora.estado-cuenta' },
        { name: 'Puntos', short: 'Puntos', href: route('distribuidora.puntos'), icon: faStar, current: 'distribuidora.puntos' },
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

    useEffect(() => {
        const saved = window.localStorage.getItem('ui.friendly_mode');
        if (saved === 'true') {
            setFriendlyMode(true);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('ui.friendly_mode', friendlyMode ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('ui:friendly-mode-change', {
            detail: { enabled: friendlyMode },
        }));
    }, [friendlyMode]);

    useEffect(() => {
        const handleUnreadCount = (event) => {
            const count = Number(event.detail?.count || 0);
            setUnreadNotifications(count);
        };

        window.addEventListener('notifications:unread-count', handleUnreadCount);

        return () => {
            window.removeEventListener('notifications:unread-count', handleUnreadCount);
        };
    }, []);

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

    const abrirNotificaciones = () => {
        window.dispatchEvent(new CustomEvent('notifications:toggle', {
            detail: { open: true },
        }));
    };

    const toggleFriendlyMode = () => {
        setFriendlyMode((prev) => !prev);
    };

    return (
        <div data-fin-a11y={friendlyMode ? 'on' : 'off'} className="relative flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="fixed inset-0 z-20 hidden md:block bg-black/20"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 z-30 hidden h-full w-72 bg-white border-r transition-transform duration-300 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderColor: '#E5E7EB' }}>
                <div className="h-full overflow-y-auto">
                    <div className="p-4 border-b bg-gradient-to-br from-green-50 to-green-50/80" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-center justify-between">
                            <Link href={route('distribuidora.dashboard')} onClick={() => setSidebarOpen(false)}>
                                <ApplicationLogo className="block w-auto h-8 text-green-700 fill-current" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                className="p-2"
                                aria-label="Cerrar menú"
                            >
                                <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>
                        <div className="mt-3 p-3 rounded-2xl border border-white/80 bg-white/90 shadow-sm">
                            <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Distribuidora</div>
                            <div className="mt-1 font-semibold text-gray-900">
                                {auth?.user?.persona?.primer_nombre} {auth?.user?.persona?.apellido_paterno}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">App móvil operativa</div>
                        </div>
                    </div>

                    <nav className="p-4 space-y-2">
                        <button
                            type="button"
                            onClick={toggleFriendlyMode}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-colors ${friendlyMode ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faTextHeight} className="w-4 h-4" />
                                Modo amigable
                            </span>
                            <span>{friendlyMode ? 'ON' : 'OFF'}</span>
                        </button>

                        {navigation.map((item) => {
                            const isActive = route().current(item.current);

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${isActive ? 'bg-green-50 border-green-200 text-green-700' : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'}`}
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
                <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="items-center justify-center hidden w-10 h-10 text-gray-600 bg-white border border-gray-200 rounded-xl md:inline-flex"
                            aria-label={sidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
                        >
                            <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={toggleFriendlyMode}
                            className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border ${friendlyMode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            aria-label="Activar o desactivar modo amigable"
                        >
                            <FontAwesomeIcon icon={faTextHeight} className="w-4 h-4" />
                        </button>

                        <Link href={route('distribuidora.dashboard')} className="flex items-center">
                            <ApplicationLogo className="block w-auto h-8 text-green-700 fill-current" />
                            <span className="ml-2 text-base font-bold text-gray-900">Préstamo Fácil</span>
                        </Link>

                        <Link href={route('logout')} method="post" as="button" className="p-2 text-red-600">
                            <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                <main className="p-4 pb-24 md:pb-20">
                    <div className="max-w-5xl mx-auto fin-page">
                        <div className="mb-4 fin-card bg-white/95 backdrop-blur">
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
                <div className="px-3 py-2 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={abrirNotificaciones}
                        className="flex items-center justify-between w-full px-4 py-3 text-left rounded-2xl bg-slate-50"
                    >
                        <span className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 text-green-700 bg-white rounded-2xl border border-green-100 shadow-sm">
                                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-gray-900">Notificaciones</span>
                                <span className="block text-xs text-gray-500">Abre alertas y mensajes recientes</span>
                            </span>
                        </span>
                        {unreadNotifications > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-semibold text-white bg-red-600 rounded-full">
                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                            </span>
                        )}
                    </button>
                </div>

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
