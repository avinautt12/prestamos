import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NotificationCenter from '@/Components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faBell,
    faHome,
    faUsers,
    faFileAlt,
    faWallet,
    faStar,
    faExchangeAlt,
    faXmark,
    faRightFromBracket,
    faCashRegister,
    faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

export default function DistribuidoraLayout({ children, title = 'Mi Panel', subtitle = null }) {
    const { auth, flash } = usePage().props;
    const currentUrl = usePage().url;
    const [toasts, setToasts] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const navigation = useMemo(() => [
        { name: 'Dashboard', short: 'Inicio', href: route('distribuidora.dashboard'), icon: faHome, current: 'distribuidora.dashboard' },
        { name: 'Clientes', short: 'Clientes', href: route('distribuidora.clientes'), icon: faUsers, current: 'distribuidora.clientes' },
        { name: 'Vales', short: 'Vales', href: route('distribuidora.vales'), icon: faFileAlt, current: 'distribuidora.vales' },
        { name: 'Crear vale', short: 'Crear', href: route('distribuidora.vales.create'), icon: faFileAlt, current: 'distribuidora.vales.create' },
        { name: 'Reportar pagos', short: 'Pagar', href: route('distribuidora.partidas-pendientes'), icon: faCashRegister, current: 'distribuidora.partidas-pendientes' },
        { name: 'Estado cuenta', short: 'Cuenta', href: route('distribuidora.estado-cuenta'), icon: faWallet, current: 'distribuidora.estado-cuenta' },
        { name: 'Puntos', short: 'Puntos', href: route('distribuidora.puntos'), icon: faStar, current: 'distribuidora.puntos' },
        { name: 'Traspasos', short: 'Traspasos', href: route('distribuidora.traspasos.index'), icon: faExchangeAlt, current: 'distribuidora.traspasos.index' },
    ], []);

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

        const msg = flash?.success || flash?.message;
        const err = flash?.error;
        if (msg) agregarToast('✓ Listo', msg);
        if (err) agregarToast('⚠ Atención', err);
    }, [currentUrl]);

    const abrirNotificaciones = () => {
        window.dispatchEvent(new CustomEvent('notifications:toggle', {
            detail: { open: true },
        }));
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
                    sidebarCollapsed ? 'w-16' : 'w-64'
                }`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                    {!sidebarCollapsed && (
                        <Link href={route('distribuidora.dashboard')} className="flex items-center gap-2">
                            <ApplicationLogo className="w-8 h-8 text-green-700 fill-current" />
                            <span className="text-base font-bold text-gray-900">Préstamo Fácil</span>
                        </Link>
                    )}
                    {sidebarCollapsed && (
                        <ApplicationLogo className="w-8 h-8 text-green-700 fill-current mx-auto" />
                    )}
                </div>

                <nav className="flex-1 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = route().current(item.current);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 mx-2 my-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-green-700 text-white'
                                        : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                                title={sidebarCollapsed ? item.name : undefined}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-white/20' : 'bg-green-50 text-green-700'}`}>
                                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                                </div>
                                {!sidebarCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={abrirNotificaciones}
                        className={`flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-green-50 transition-colors ${
                            sidebarCollapsed ? 'justify-center' : ''
                        }`}
                        title={sidebarCollapsed ? 'Notificaciones' : undefined}
                    >
                        <div className="relative">
                            <span className="inline-flex items-center justify-center w-8 h-8 text-green-700 bg-green-50 rounded-lg">
                                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
                            </span>
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-5 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </div>
                        {!sidebarCollapsed && <span>Notificaciones</span>}
                    </button>
                </div>

                <div className="p-3 border-t border-gray-100">
                    <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm`}>
                            {auth.user?.persona?.primer_nombre?.[0] || '?'}{auth.user?.persona?.apellido_paterno?.[0] || ''}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                    {auth.user?.persona?.primer_nombre} {auth.user?.persona?.apellido_paterno}
                                </p>
                            </div>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <Link
                            href={route('logout', {}, false)}
                            method="post"
                            as="button"
                            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            Cerrar sesión
                        </Link>
                    )}
                </div>
            </aside>

            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-3">
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                        >
                            <FontAwesomeIcon icon={sidebarCollapsed ? faBars : faChevronLeft} className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                            {subtitle && <span className="text-sm text-gray-500">| {subtitle}</span>}
                        </div>

                        <button
                            type="button"
                            onClick={abrirNotificaciones}
                            className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                            aria-label="Notificaciones"
                        >
                            <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <main className="p-6">
                    {children}
                </main>
            </div>

            <NotificationCenter />

            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div key={toast.id} className="w-80 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <p className="font-semibold text-gray-800">{toast.titulo}</p>
                        <p className="mt-1 text-sm text-gray-600">{toast.mensaje}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}