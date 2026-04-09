# Préstamo Fácil - Sistema de Gestión de Vales y Distribución

## Documentacion de modulo Gerente

- Ver detalle funcional y tecnico en [README_GERENTE.md](README_GERENTE.md)

## Documentacion por rol

- Gerente: [README_GERENTE.md](README_GERENTE.md)
- Coordinador: [README_COORDINADOR.md](README_COORDINADOR.md)
- Verificador: [README_VERIFICADOR.md](README_VERIFICADOR.md)
- Cajera: [README_CAJERA.md](README_CAJERA.md)
- Distribuidora: [README_DISTRIBUIDORA.md](README_DISTRIBUIDORA.md)

## 🚀 Visión General

Préstamo Fácil no es un sistema de préstamos directos. Es un ecosistema financiero de confianza delegada.

La empresa otorga líneas de crédito a Distribuidoras (comisionistas), quienes a su vez colocan "Vales" a clientes finales.

La Distribuidora actúa como aval y gestora de cobranza, ganando comisiones y puntos por desempeño.

## 🛠️ Stack Tecnológico e Infraestructura

- Core: Laravel 10 + Breeze (Auth) + Inertia.js + React [User Prompt].
- Base de Datos: MariaDB (Arquitectura de 3 Droplets: 2 Maestros + 1 Esclavo) [User Prompt].
- Servidores (DigitalOcean):
	- S1 & S2: Nodos de producción tras un Balanceador de Carga [User Prompt].
- S3 (Respaldo & Seguridad): Nodo de acceso exclusivo para el Gerente vía VPN WireGuard para operaciones críticas (Aprobaciones) [User Prompt].
- Almacenamiento: DigitalOcean Spaces (Región NYC3, Endpoint Interno) para evidencias y documentos [User Prompt].
- Real-time: Pusher + Laravel Echo para notificaciones entre roles.

## 🏗️ Roles y Módulos del Sistema

### 1. Coordinador (Tablet 10")

- Función: Onboarding y prospección de Distribuidoras.
- Responsabilidad: Captura de expediente (Datos personales, Familiares, Geolocalización, Vehículos, Referencias Laborales y Documentación).
- Lógica: No asigna límites ni categorías; solo rellena el expediente.

### 2. Verificador (Tablet 10")

- Función: Auditoría de campo.
- Responsabilidad: Valida físicamente la información del Coordinador. Sube fotos de fachada y valida identidad con INE en mano.
- Restricción: Solo puede validar o rechazar; no tiene permisos de edición de datos.

### 3. Gerente de Sucursal (Desktop + VPN)

- Función: Autoridad máxima y control de riesgo.
- Responsabilidad: Aprueba solicitudes verificadas desde el nodo S3.
- Acciones: Asigna el Límite de Crédito Inicial y define la Categoría (Cobre, Plata, Oro).

### 4. Distribuidora (Web Mobile)

- Función: Operación comercial.
- Responsabilidad: Emisión de Vales a clientes finales, consulta de saldos y acumulación de puntos.

## 📈 Reglas de Negocio y Motor Financiero

### Cálculo del Vale (Préstamo)

- Comisión por Apertura: 10% fijo.
- Interés: 5% quincenal.
- Seguro: Monto variable según el capital (Ej. $100).

### Sistema de Fidelización (Puntos)

- Fórmula de Acumulación:

$$
\lfloor \frac{Total\,Productos}{1200} \rfloor \times 3
$$

- Valor del Punto: $2.00 MXN.
- Penalización por Mora: Pago fuera de tiempo elimina automáticamente el 20% de los puntos totales acumulados.

### Comisiones por Categoría (Sobre costo de producto)

- Cobre: 3%.
- Plata: 6%.
- Oro: 10%.

## 🔄 Flujo de Estados de la Solicitud

- PRE-SOLICITUD (PROSPECTO): Creada por el Coordinador.
- EN_VERIFICACION: Lista para que el Verificador realice la visita.
- VERIFICADA: Dictamen positivo del Verificador.
- ACTIVA: Aprobada por el Gerente (Nace la Distribuidora y se asigna crédito).
- RECHAZADA: Fin del flujo por inconsistencias.

## 🔔 Matriz de Notificaciones (Pusher)

- Coordinador ➔ Verificador: Solicitud pendiente de visita.
- Verificador ➔ Gerente: Solicitud lista para aprobación final.
- Verificador ➔ Coordinador: Resultado del dictamen (Aprobado/Rechazado).
- Sistema ➔ Distribuidora: Límite de crédito autorizado / actualización de crédito.

## 📂 Gestión de Archivos (DO Spaces)

- Bucket: prestamos-facil (Región NYC3).
- Acceso: Privado. Se deben usar Signed URLs (temporales) para la visualización de documentos sensibles (INE, Buró).
- Estructura: sucursal_{id}/distribuidoras/prospecto_{id}/.