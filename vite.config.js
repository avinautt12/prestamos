import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const devHost = process.env.VITE_DEV_HOST || 'localhost';
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
        VitePWA({
            manifest: false,
            registerType: 'autoUpdate',
            injectRegister: false,
            // Generar el SW en /public (servido como /sw.js, no /build/sw.js)
            // para que el navegador le dé scope sobre toda la app.
            outDir: 'public',
            filename: 'sw.js',
            workbox: {
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                navigateFallback: null,
                // No cacheamos HTML para evitar tokens CSRF obsoletos en navegación.
                globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff2}'],
                globDirectory: 'public/build',
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkOnly',
                    },
                    {
                        urlPattern: ({ request, url }) => request.destination === 'image' && url.origin === self.location.origin,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 80,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        urlPattern: ({ request, url }) =>
                            ['style', 'script', 'font'].includes(request.destination) && url.origin === self.location.origin,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'assets-cache',
                        },
                    },
                ],
            },
        }),
    ],
});
