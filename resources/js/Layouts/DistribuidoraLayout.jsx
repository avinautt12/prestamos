import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
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
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [currentUrl]);

    const abrirNotificaciones = () => {
        window.dispatchEvent(new CustomEvent('notifications:toggle', {
            detail: { open: true },
        }));
    };

    const toggleFriendlyMode = () => {
        setFriendlyMode((prev) => !prev);
    };

    return (
        <div data-fin-a11y={friendlyMode ? 'on' : 'off'} className="fin-mobile-shell">
            <div className="fin-mobile-device">
                <header className="fin-mobile-header border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            onClick={toggleFriendlyMode}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${friendlyMode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
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

                <main className="p-4 fin-mobile-main">
                    <div className="fin-mobile-page">
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

                <nav className="fin-mobile-nav bg-white border-t" style={{ borderColor: '#E5E7EB' }}>
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
            </div>

            <NotificationCenter />

            <div className="fin-mobile-toasts">
                {toasts.map((toast) => (
                    <div key={toast.id} className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <p className="font-semibold text-gray-800">{toast.titulo}</p>
                        <p className="mt-1 text-sm text-gray-600">{toast.mensaje}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
