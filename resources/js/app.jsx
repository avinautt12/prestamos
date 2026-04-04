import './bootstrap';
import '../css/app.css';

// Importar estilos de Leaflet
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

// Importar iconos de Leaflet (solución para que funcionen los marcadores)
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function RealtimeNotificationsBridge({ auth }) {

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId || !window.Echo) {
            return;
        }

        const channelName = `App.Models.Usuario.${userId}`;
        const channel = window.Echo.private(channelName);

        channel.notification((notification) => {
            window.dispatchEvent(new CustomEvent('app-notification', { detail: notification }));
            console.log('Notificacion en tiempo real:', notification);
        });

        return () => {
            window.Echo.leave(channelName);
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
