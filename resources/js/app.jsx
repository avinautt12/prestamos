import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect } from 'react';

// Limpieza de PWA antiguo: desregistra cualquier service worker previamente
// instalado (cuando la app sí era PWA) y vacía sus cachés. Se deja para que
// dispositivos que ya tenían la app instalada queden limpios.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
    });
    if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function RealtimeNotificationsBridge({ auth }) {

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId || !window.Echo) {
            return;
        }

        const channelNames = [
            `App.Models.Usuario.${userId}`,
        ];

        const attachedChannels = [];
        const handleNotification = (notification) => {
            window.dispatchEvent(new CustomEvent('app-notification', { detail: notification }));
        };

        channelNames.forEach((channelName) => {
            const channel = window.Echo.private(channelName);
            attachedChannels.push(channelName);

            if (typeof channel.error === 'function') {
                channel.error((error) => {
                    console.error(`Subscription error on ${channelName}:`, error);
                });
            }

            channel.notification(handleNotification);
        });

        return () => {
            attachedChannels.forEach((channelName) => {
                window.Echo.leave(channelName);
            });
        };
    }, [auth?.user?.id]);

    return null;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <RealtimeNotificationsBridge auth={props.initialPage?.props?.auth} />
            </>
        );
    },
    progress: {
        // color: '#4B5563',
        color: '#1FA62D',
        showSpinner: false

    },
});
