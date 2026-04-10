# Despliegue Produccion PWA (Prestamos)

Este documento describe como desplegar los cambios de la app movil (PWA) y como validar que se pueda instalar en Android/iOS.

## 1. Requisitos

- Dominio con HTTPS activo.
- Certificado valido (Cloudflare/Origen).
- Servidor con Node y PHP operativos.

## 2. Archivos clave incluidos en este release

- public/manifest.webmanifest
- public/pwa-192.png
- public/pwa-512.png
- resources/js/app.jsx
- resources/views/app.blade.php
- vite.config.js
- resources/js/Layouts/DistribuidoraLayout.jsx
- resources/js/Pages/Distribuidora/*
- resources/css/app.css

## 3. Pasos de despliegue

1. Actualizar codigo en el servidor.
2. Instalar dependencias JS:
   - npm ci
3. Generar build de frontend:
   - npm run build
4. Limpiar cache de Laravel:
   - php artisan optimize:clear
5. (Opcional) recargar php-fpm/nginx segun el stack.

## 4. Verificaciones tecnicas minimas

Verificar que respondan en produccion:

- /manifest.webmanifest
- /pwa-192.png
- /pwa-512.png
- /build/sw.js
- /build/workbox-*.js

Tambien revisar en navegador movil (DevTools o telefono):

- El sitio abre bajo HTTPS.
- Existe registro de Service Worker.
- El manifest es valido y contiene iconos 192 y 512.

## 5. Prueba funcional en Android

1. Abrir el dominio en Chrome.
2. Navegar 1-2 pantallas.
3. Menu de Chrome -> Agregar a pantalla principal.
4. Abrir desde el icono instalado y verificar modo standalone.

## 6. Prueba funcional en iPhone

1. Abrir el dominio en Safari.
2. Compartir -> Anadir a pantalla de inicio.
3. Abrir desde el icono y verificar pantalla completa.

## 7. Si no aparece opcion de instalar

- Limpiar cache del navegador movil.
- Verificar que no haya redireccion temporal insegura (http).
- Confirmar que el build actual se subio completo (incluyendo sw.js/workbox).
- Revisar que Cloudflare no este sirviendo cache viejo de manifest/sw.

## 8. Alcance del release

Este cambio adapta la experiencia movil solo para el modulo Distribuidora y habilita PWA instalable.
