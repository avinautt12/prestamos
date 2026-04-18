import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

function normalizeIncomingNotification(payload) {
    if (!payload) {
        return null;
    }

    const rawData = payload.data && typeof payload.data === 'object' ? payload.data : payload;

    return {
        id: payload.id || `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: payload.type || rawData.tipo || 'RealtimeNotification',
        title: rawData.titulo || payload.titulo || 'Notificacion',
        message: rawData.mensaje || payload.mensaje || 'Tienes una actualizacion.',
        data: rawData,
        read_at: payload.read_at || null,
        created_at: rawData.timestamp || payload.created_at || new Date().toISOString(),
    };
}

function formatWhen(isoDate) {
    if (!isoDate) {
        return 'Ahora';
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Ahora';
    }

    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

export default function NotificationCenter() {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [liveToasts, setLiveToasts] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [friendlyMode, setFriendlyMode] = useState(false);
    const audioContextRef = useRef(null);
    const announcedNotificationsRef = useRef(new Set());

    const persistAnnouncedNotifications = (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            return;
        }

        ids.forEach((id) => {
            if (id) {
                announcedNotificationsRef.current.add(String(id));
            }
        });

        try {
            window.sessionStorage.setItem(
                'notifications.announced.ids',
                JSON.stringify(Array.from(announcedNotificationsRef.current).slice(-100))
            );
        } catch (error) {
            console.error('No se pudieron persistir notificaciones anunciadas:', error);
        }
    };

    const enqueueLiveToast = (notification) => {
        if (!notification?.id) {
            return;
        }

        persistAnnouncedNotifications([notification.id]);

        setLiveToasts((prev) => {
            const withoutDup = prev.filter((item) => item.id !== notification.id);
            return [...withoutDup, notification].slice(-3);
        });

        window.setTimeout(() => {
            setLiveToasts((prev) => prev.filter((item) => item.id !== notification.id));
        }, 8000);
    };

    useEffect(() => {
        const saved = window.localStorage.getItem('notifications.sound.enabled');
        if (saved === 'false') {
            setSoundEnabled(false);
        }

        const savedFriendly = window.localStorage.getItem('ui.friendly_mode');
        if (savedFriendly === 'true') {
            setFriendlyMode(true);
        }

        try {
            const savedAnnounced = JSON.parse(window.sessionStorage.getItem('notifications.announced.ids') || '[]');
            if (Array.isArray(savedAnnounced)) {
                announcedNotificationsRef.current = new Set(savedAnnounced.map((item) => String(item)));
            }
        } catch (error) {
            announcedNotificationsRef.current = new Set();
        }

        const onFriendlyModeChange = (event) => {
            setFriendlyMode(Boolean(event.detail?.enabled));
        };

        window.addEventListener('ui:friendly-mode-change', onFriendlyModeChange);

        return () => {
            window.removeEventListener('ui:friendly-mode-change', onFriendlyModeChange);
        };
    }, []);

    const toggleSound = () => {
        setSoundEnabled((prev) => {
            const next = !prev;
            window.localStorage.setItem('notifications.sound.enabled', next ? 'true' : 'false');
            return next;
        });
    };

    useEffect(() => {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
            return undefined;
        }

        const ensureAudioReady = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContextCtor();
                }

                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
            } catch (error) {
                console.error('No se pudo preparar el audio de notificaciones:', error);
            }
        };

        window.addEventListener('pointerdown', ensureAudioReady, { passive: true });
        window.addEventListener('keydown', ensureAudioReady);

        return () => {
            window.removeEventListener('pointerdown', ensureAudioReady);
            window.removeEventListener('keydown', ensureAudioReady);
        };
    }, []);

    const playNotificationBeep = () => {
        try {
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) {
                return;
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextCtor();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                return;
            }

            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.value = 0.0001;

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

            oscillator.start();
            oscillator.stop(now + 0.14);
        } catch (error) {
            // Algunos navegadores bloquean audio sin interacción previa.
            console.error('No se pudo reproducir el sonido de notificación:', error);
        }
    };

    const unreadLabel = useMemo(() => {
        if (unreadCount > 99) {
            return '99+';
        }
        return `${unreadCount}`;
    }, [unreadCount]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('notifications:unread-count', {
            detail: { count: unreadCount },
        }));
    }, [unreadCount]);

    useEffect(() => {
        const handleToggle = (event) => {
            const nextOpen = event.detail && typeof event.detail.open === 'boolean'
                ? event.detail.open
                : undefined;

            setOpen((prev) => (typeof nextOpen === 'boolean' ? nextOpen : !prev));
        };

        window.addEventListener('notifications:toggle', handleToggle);

        return () => {
            window.removeEventListener('notifications:toggle', handleToggle);
        };
    }, []);

    const loadNotifications = async (force = false) => {
        // No recargar si ya tenemos datos y no es forzado
        if (!force && notifications.length > 0) return;
        setLoading(true);
        try {
            const response = await window.axios.get(route('notificaciones.index'), {
                params: { limit: 20 },
            });

            const incomingNotifications = response.data.notifications || [];

            setNotifications(incomingNotifications);
            setUnreadCount(Number(response.data.unread_count || 0));

            incomingNotifications
                .filter((notification) => !notification.read_at)
                .filter((notification) => !announcedNotificationsRef.current.has(String(notification.id)))
                .slice(0, 3)
                .forEach((notification) => enqueueLiveToast(notification));
        } catch (error) {
            console.error('No se pudieron cargar notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!auth?.user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            return undefined;
        }

        loadNotifications(true);

        const onRealtimeNotification = (event) => {
            const normalized = normalizeIncomingNotification(event.detail);
            if (!normalized) {
                return;
            }

            setNotifications((prev) => {
                const withoutDup = prev.filter((item) => item.id !== normalized.id);
                return [normalized, ...withoutDup].slice(0, 20);
            });
            setUnreadCount((prev) => prev + 1);

            // Mostrar toast efímero por 8 segundos (era 4.5)
            enqueueLiveToast(normalized);

            if (soundEnabled) {
                playNotificationBeep();
            }

        };

        window.addEventListener('app-notification', onRealtimeNotification);

        return () => {
            window.removeEventListener('app-notification', onRealtimeNotification);
        };
    }, [auth?.user?.id, soundEnabled]);

    const markAsRead = async (id) => {
        try {
            const response = await window.axios.patch(route('notificaciones.marcar-leida', id));
            const updated = response.data.notification;

            setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
            setUnreadCount(Number(response.data.unread_count || 0));
            window.dispatchEvent(new CustomEvent('notifications:unread-count', {
                detail: { count: Number(response.data.unread_count || 0) },
            }));
            return true;
        } catch (error) {
            console.error('No se pudo marcar notificacion como leida:', error);
            return false;
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await window.axios.patch(route('notificaciones.marcar-todas-leidas'));
            setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
            setUnreadCount(Number(response.data.unread_count || 0));
            window.dispatchEvent(new CustomEvent('notifications:unread-count', {
                detail: { count: Number(response.data.unread_count || 0) },
            }));
        } catch (error) {
            console.error('No se pudieron marcar todas como leidas:', error);
        }
    };

    const buildRouteIfExists = (name, params = []) => {
        try {
            return route(name, params);
        } catch (error) {
            return null;
        }
    };

    const resolveNotificationUrl = (notification) => {
        const rol = String(auth?.user?.rol_nombre || '').toLowerCase();
        const data = notification?.data || {};
        const tipo = String(data.tipo || notification?.type || '').toUpperCase();
        const solicitudId = data.solicitud_id;

        if (tipo === 'RECHAZO_GERENTE' && solicitudId && rol === 'coordinador') {
            return buildRouteIfExists('coordinador.solicitudes.show', solicitudId);
        }

        if (tipo === 'SOLICITUD_TOMADA_VERIFICADOR' && solicitudId && rol === 'coordinador') {
            return buildRouteIfExists('coordinador.solicitudes.show', solicitudId);
        }

        if (tipo === 'CONCILIACION_PROCESADA') {
            if (rol === 'gerente') {
                return buildRouteIfExists('gerente.reportes');
            }

            if (rol === 'cajera') {
                return buildRouteIfExists('cajera.conciliaciones');
            }

            if (rol === 'distribuidora') {
                return buildRouteIfExists('distribuidora.estado-cuenta');
            }
        }

        if (tipo === 'LIMITE_AUTORIZADO' || tipo === 'ACTUALIZACION_CREDITO') {
            if (rol === 'distribuidora') {
                return buildRouteIfExists('distribuidora.estado-cuenta');
            }
        }

        if (tipo === 'LIMITE_INCREMENTADO' && rol === 'distribuidora') {
            return buildRouteIfExists('distribuidora.estado-cuenta');
        }

        if (tipo === 'VALE_FERIADO' && rol === 'distribuidora') {
            return buildRouteIfExists('distribuidora.vales');
        }

        if (tipo === 'CORTE_LISTO' && rol === 'distribuidora') {
            return buildRouteIfExists('distribuidora.estado-cuenta');
        }

        if (tipo === 'CORTE_PUNTOS_LISTO' && rol === 'distribuidora') {
            return buildRouteIfExists('distribuidora.puntos');
        }

        if (tipo === 'PUNTOS_CANJE_APLICADO' && rol === 'distribuidora') {
            return buildRouteIfExists('distribuidora.puntos');
        }

        if (tipo.startsWith('TRASPASO_')) {
            if (rol === 'coordinador') {
                return buildRouteIfExists('coordinador.traspasos.index');
            }

            if (rol === 'distribuidora') {
                return buildRouteIfExists('distribuidora.traspasos.index');
            }
        }

        return null;
    };

    const handleNotificationClick = async (notification) => {
        if (!notification) {
            return;
        }

        if (!notification.read_at) {
            await markAsRead(notification.id);
        }

        const targetUrl = resolveNotificationUrl(notification);
        if (targetUrl) {
            window.location.href = targetUrl;
        }
    };

    return (
        <>
            <div className="fixed z-[70] hidden md:block top-16 right-4">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="relative inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full shadow"
                    aria-label="Abrir bandeja de notificaciones"
                >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 text-xs font-semibold leading-5 text-center text-white bg-red-600 rounded-full">
                            {unreadLabel}
                        </span>
                    )}
                </button>

                {open && (
                    <div className="w-[360px] max-h-[70vh] mt-2 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-2xl">
                        <div className="flex items-center justify-between p-3 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={toggleSound}
                                    className={`text-xs font-medium ${soundEnabled ? 'text-emerald-700' : 'text-gray-500'} hover:text-emerald-800`}
                                >
                                    Sonido: {soundEnabled ? 'on' : 'off'}
                                </button>
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-green-700 hover:text-green-800"
                                    disabled={unreadCount === 0}
                                >
                                    Marcar todas
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[55vh]">
                            {loading && (
                                <div className="p-4 text-sm text-gray-500">Cargando...</div>
                            )}

                            {!loading && notifications.length === 0 && (
                                <div className="p-4 text-sm text-gray-500">No hay notificaciones.</div>
                            )}

                            {!loading && notifications.map((notification) => {
                                const isUnread = !notification.read_at;
                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left border-b border-gray-100 hover:bg-gray-50 ${friendlyMode ? 'p-4' : 'p-3'} ${isUnread ? 'bg-green-50/40' : 'bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`${friendlyMode ? 'text-base' : 'text-sm'} font-semibold text-gray-800`}>{notification.title}</p>
                                            {isUnread && <span className="inline-flex w-2.5 h-2.5 mt-1 bg-green-600 rounded-full" />}
                                        </div>
                                        <p className={`${friendlyMode ? 'text-base' : 'text-sm'} mt-1 text-gray-600`}>{notification.message}</p>
                                        <p className="mt-1 text-xs text-gray-400">{formatWhen(notification.created_at)}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>

            <div className="fixed inset-x-0 bottom-20 z-[70] px-4 pointer-events-none md:hidden">
                {open && (
                    <div className="pointer-events-auto overflow-hidden bg-white border border-gray-200 rounded-3xl shadow-2xl max-h-[62vh]">
                        <div className="flex items-start justify-between gap-3 p-4 border-b border-green-100 bg-gradient-to-br from-slate-50 to-green-50/70">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Notificaciones</h3>
                                <p className="mt-1 text-xs text-gray-500">Alertas y mensajes recientes</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleSound}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${soundEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    Sonido {soundEnabled ? 'on' : 'off'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-full bg-gray-100"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[52vh]">
                            {loading && <div className="p-4 text-sm text-gray-500">Cargando...</div>}

                            {!loading && notifications.length === 0 && (
                                <div className="p-4 text-sm text-gray-500">No hay notificaciones.</div>
                            )}

                            {!loading && notifications.map((notification) => {
                                const isUnread = !notification.read_at;
                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left border-b border-gray-100 ${friendlyMode ? 'p-5' : 'p-4'} ${isUnread ? 'bg-green-50/45' : 'bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`${friendlyMode ? 'text-base' : 'text-sm'} font-semibold text-gray-800`}>{notification.title}</p>
                                            {isUnread && <span className="inline-flex w-2.5 h-2.5 mt-1 bg-green-600 rounded-full" />}
                                        </div>
                                        <p className={`${friendlyMode ? 'text-base' : 'text-sm'} mt-1 text-gray-600`}>{notification.message}</p>
                                        <p className="mt-1 text-xs text-gray-400">{formatWhen(notification.created_at)}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between gap-3 p-3 border-t border-gray-100 bg-white">
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-green-700"
                                disabled={unreadCount === 0}
                            >
                                Marcar todas
                            </button>
                            <span className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadLabel} sin leer` : 'Todo leído'}</span>
                        </div>
                    </div>
                )}
            </div>

            {liveToasts.length > 0 && (
                <div className="fixed inset-x-0 top-3 z-[85] flex flex-col items-center gap-2 px-4 pointer-events-none md:top-4 md:right-4 md:left-auto md:w-[380px] md:items-end">
                    {liveToasts.map((toast) => (
                        <button
                            key={toast.id}
                            type="button"
                            onClick={() => handleNotificationClick(toast)}
                            className="pointer-events-auto w-full max-w-[360px] p-3 text-left bg-white border border-gray-200 rounded-xl shadow-xl hover:bg-gray-50"
                        >
                            <p className="text-sm font-semibold text-gray-800">{toast.title}</p>
                            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
                            <p className="mt-1 text-xs text-gray-400">{formatWhen(toast.created_at)}</p>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
