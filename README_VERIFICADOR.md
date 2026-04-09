# Modulo Verificador - Prestamo Facil

## 1. Objetivo del rol
El Verificador valida en campo que la informacion del expediente sea real antes de que Gerencia tome la decision final.

## 2. Funcionalidades actuales
### 2.1 Dashboard
Ruta: `/verificador/dashboard`

Muestra:
- solicitudes pendientes sin asignar,
- solicitudes asignadas al verificador,
- verificadas,
- validaciones del dia,
- rechazadas,
- listados rapidos (disponibles y en proceso).

### 2.2 Bandejas de trabajo
Rutas:
- `/verificador/solicitudes` (pendientes sin verificador)
- `/verificador/solicitudes-por-revisar` (tomadas por el usuario)

Incluye:
- filtros por busqueda,
- orden por distancia cuando hay geolocalizacion,
- paginacion.

### 2.3 Toma de solicitud
Ruta: `POST /verificador/solicitudes/{id}/tomar`

Efecto:
- asigna `verificador_asignado_id`,
- marca `tomada_en`,
- evita que otro verificador la tome.

### 2.4 Verificacion de solicitud
Rutas:
- `GET /verificador/solicitudes/{id}`
- `POST /verificador/solicitudes/{id}/verificar`

Que valida el sistema:
- misma sucursal del verificador,
- solicitud en `EN_REVISION`,
- asignada al usuario que verifica,
- distancia maxima permitida para aprobar (`100m`),
- checklist completo para resultado `VERIFICADA`.

Resultados posibles:
- `VERIFICADA`
- `RECHAZADA`

Persistencia de verificacion:
- observaciones,
- geolocalizacion,
- checklist,
- fotos de evidencia.

### 2.5 Mapa de ruta
Ruta: `/verificador/mapa-ruta`

Muestra solicitudes pendientes para planear recorrido (Google Maps en frontend).

### 2.6 Historial de validaciones
Ruta: `/verificador/validaciones`

Lista verificaciones realizadas por el usuario.

## 3. Eventos en tiempo real
Al verificar:
- emite `DictamenSolicitud` hacia coordinador.

Si resultado es `VERIFICADA`:
- emite `SolicitudListaParaAprobacion` para que Gerencia vea la solicitud en su bandeja.

## 4. Archivos principales
Backend:
- `app/Http/Controllers/Verificador/DashboardController.php`
- `app/Http/Controllers/Verificador/SolicitudController.php`

Frontend:
- `resources/js/Pages/Verificador/VerificadorDashboard.jsx`
- `resources/js/Pages/Verificador/Solicitudes/Index.jsx`
- `resources/js/Pages/Verificador/Solicitudes/Show.jsx`
- `resources/js/Pages/Verificador/MapaRuta.jsx`
- `resources/js/Pages/Verificador/Validaciones.jsx`

## 5. Estado real del modulo
El modulo Verificador esta operativo para:
- toma de solicitudes,
- verificacion con evidencias,
- dictamen y notificacion a Coordinador/Gerente.
