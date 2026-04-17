import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRightArrowLeft,
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
    const { auth, flash } = usePage().props;
    const currentUrl = usePage().url;
    const [toasts, setToasts] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [friendlyMode, setFriendlyMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = useMemo(() => ([
        { name: 'Dashboard', short: 'Inicio', href: route('distribuidora.dashboard'), icon: faHouse, current: 'distribuidora.dashboard' },
        { name: 'Clientes', short: 'Clientes', href: route('distribuidora.clientes'), icon: faUsers, current: 'distribuidora.clientes' },
        { name: 'Traspasos', short: 'Traspasos', href: route('distribuidora.traspasos.index'), icon: faArrowRightArrowLeft, current: 'distribuidora.traspasos.index' },
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

        // Mostrar toast de flash del servidor (success / message / error)
        const msg = flash?.success || flash?.message;
        const err = flash?.error;
        if (msg) agregarToast('✅ Listo', msg);
        if (err) agregarToast('⚠️ Atención', err);
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
        <div data-fin-a11y={friendlyMode ? 'on' : 'off'} className="fin-mobile-shell bg-[radial-gradient(circle_at_top_right,_#d1fae5_0%,_#f8fafc_40%,_#eef2ff_100%)]">
            <div className="fin-mobile-device bg-white/90 backdrop-blur">
                <header className="fin-mobile-header border-b" style={{ borderColor: '#D1FAE5' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 transition-colors"
                            aria-label="Abrir menú"
                        >
                            <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
                        </button>

                        <Link href={route('distribuidora.dashboard')} className="flex items-center">
                            <ApplicationLogo className="block w-auto h-8 text-green-700 fill-current" />
                            <span className="ml-2 text-base font-bold text-gray-900">Préstamo Fácil</span>
                        </Link>

                        <button
                            type="button"
                            onClick={toggleFriendlyMode}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${friendlyMode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            aria-label="Activar o desactivar modo amigable"
                        >
                            <FontAwesomeIcon icon={faTextHeight} className="w-4 h-4" />
                        </button>
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

                {/* El Sidebar (Drawer) */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-[60] flex overflow-hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
                            onClick={() => setSidebarOpen(false)}
                        />

                        {/* Contenido del Sidebar */}
                        <div className="relative flex flex-col w-full max-w-[280px] h-full bg-white shadow-2xl fin-enter-left">
                            <div className="flex items-center justify-between px-5 py-6 border-b border-green-50 bg-gradient-to-br from-green-50 to-white">
                                <div>
                                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Mi Menú</p>
                                    <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                                        {auth.user?.persona?.primer_nombre} {auth.user?.persona?.apellido_paterno}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto bg-white/50">
                                {navigation.map((item) => {
                                    const isActive = route().current(item.current);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${isActive
                                                ? 'bg-green-700 text-white shadow-lg shadow-green-200'
                                                : 'text-gray-600 hover:bg-green-50 hover:text-green-700'}`}
                                        >
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${isActive ? 'bg-white/20' : 'bg-green-50 text-green-700'}`}>
                                                <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                                            </div>
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}

                                <div className="pt-6 mt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            abrirNotificaciones();
                                        }}
                                        className="flex items-center justify-between w-full px-4 py-4 text-left border border-emerald-100 rounded-2xl bg-white shadow-sm hover:bg-green-50 transition-colors"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 text-green-700 bg-green-50 rounded-xl">
                                                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">Notificaciones</span>
                                        </span>
                                        {unreadNotifications > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-[11px] font-bold text-white bg-red-600 rounded-full">
                                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </nav>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Link
                                    href={route('logout', {}, false)}
                                    method="post"
                                    as="button"
                                    className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faRightFromBracket} />
                                    Cerrar sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
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
