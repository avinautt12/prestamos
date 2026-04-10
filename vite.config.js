import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const devHost = process.env.VITE_DEV_HOST || '192.168.1.7';
const devPort = Number(process.env.VITE_DEV_PORT || 5177);

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: devPort,
        hmr: {
            protocol: 'ws',
            host: devHost,
        },
    },
    preview: {
        host: '0.0.0.0',
        port: devPort,
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
