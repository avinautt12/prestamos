import React, { useEffect, useMemo, useRef, useState } from 'react';

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
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [liveToasts, setLiveToasts] = useState([]);
    const audioContextRef = useRef(null);

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

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await window.axios.get(route('notificaciones.index'), {
                params: { limit: 20 },
            });

            setNotifications(response.data.notifications || []);
            setUnreadCount(Number(response.data.unread_count || 0));
        } catch (error) {
            console.error('No se pudieron cargar notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();

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

            setLiveToasts((prev) => {
                const next = [...prev, normalized].slice(-3);
                return next;
            });

            playNotificationBeep();

            window.setTimeout(() => {
                setLiveToasts((prev) => prev.filter((item) => item.id !== normalized.id));
            }, 4500);
        };

        window.addEventListener('app-notification', onRealtimeNotification);

        return () => {
            window.removeEventListener('app-notification', onRealtimeNotification);
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            const response = await window.axios.patch(route('notificaciones.marcar-leida', id));
            const updated = response.data.notification;

            setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
            setUnreadCount(Number(response.data.unread_count || 0));
        } catch (error) {
            console.error('No se pudo marcar notificacion como leida:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await window.axios.patch(route('notificaciones.marcar-todas-leidas'));
            setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
            setUnreadCount(Number(response.data.unread_count || 0));
        } catch (error) {
            console.error('No se pudieron marcar todas como leidas:', error);
        }
    };

    return (
        <div className="fixed z-[70] top-16 right-4">
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
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            disabled={unreadCount === 0}
                        >
                            Marcar todas
                        </button>
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
                                    onClick={() => {
                                        if (isUnread) {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                    className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 ${isUnread ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
                                        {isUnread && <span className="inline-flex w-2.5 h-2.5 mt-1 bg-blue-600 rounded-full" />}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                                    <p className="mt-1 text-xs text-gray-400">{formatWhen(notification.created_at)}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {liveToasts.length > 0 && (
                <div className="mt-2 space-y-2">
                    {liveToasts.map((toast) => (
                        <div key={toast.id} className="w-[360px] p-3 bg-white border border-gray-200 rounded-xl shadow-xl">
                            <p className="text-sm font-semibold text-gray-800">{toast.title}</p>
                            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
