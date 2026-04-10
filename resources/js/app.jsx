import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister();
            });
        })
        .catch((error) => {
            console.warn('No se pudieron limpiar service workers existentes:', error);
        });
}

function RealtimeNotificationsBridge({ auth }) {

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId || !window.Echo) {
            return;
        }

        const channelNames = [
            `App.Models.Usuario.${userId}`,
            `App.Models.User.${userId}`,
        ];

        const attachedChannels = [];
        const handleNotification = (notification) => {
            window.dispatchEvent(new CustomEvent('app-notification', { detail: notification }));
            console.log('Notificacion en tiempo real:', notification);
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
