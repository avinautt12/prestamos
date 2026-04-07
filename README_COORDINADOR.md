# Modulo Coordinador - Prestamo Facil

## 1. Objetivo del rol
El Coordinador se encarga de captar prospectas, armar el expediente completo y mover la solicitud al flujo de verificacion.

## 2. Funcionalidades actuales
### 2.1 Dashboard
Ruta: `/coordinador/dashboard`

Indicadores actuales:
- solicitudes pendientes (PRE + EN_REVISION),
- distribuidoras activas,
- clientes activos vinculados,
- vales activos,
- conteo por estado de solicitudes.

Alcance:
- datos del propio coordinador y/o sucursal activa asignada.

### 2.2 Gestion de solicitudes
Rutas:
- `GET /coordinador/solicitudes`
- `GET /coordinador/solicitudes/create`
- `POST /coordinador/solicitudes`
- `GET /coordinador/solicitudes/{id}`
- `PUT /coordinador/solicitudes/{id}`
- `GET /coordinador/solicitudes/{id}/edit`
- `POST /coordinador/solicitudes/{id}/enviar-verificacion`

Que hace:
- Crea expediente de prospecta con datos personales, domicilio, familiares, afiliaciones, vehiculos y documentos.
- Sube documentos a almacenamiento `spaces` (INE frente/reverso, comprobante, buro).
- Previene duplicados por CURP/RFC y bloquea alta si ya existe distribuidora activa.
- Evita editar solicitudes en estados no permitidos.
- Reenvia solicitudes a verificacion con validacion de campos obligatorios.

Estados usados en este rol:
- `PRE`
- `EN_REVISION`
- `RECHAZADA` (editable para correccion y reenvio)

### 2.3 Clientes y mis distribuidoras
Rutas:
- `/coordinador/clientes`
- `/coordinador/mis-distribuidoras`

Que incluyen:
- filtros por busqueda y estado,
- paginacion,
- estadisticas por estatus.

## 3. Eventos en tiempo real
Cuando una solicitud se envia/reenvia a verificacion:
- se emite `SolicitudPendienteVerificacion` para notificar a verificador.

Cuando verificador dictamina:
- coordinador recibe resultado por evento `DictamenSolicitud` (consumido en UI general por canal de sucursal/usuario segun configuracion Echo).

## 4. Seguridad y scope de datos
- Todas las consultas se restringen a sucursal activa del coordinador (pivot `usuario_rol`) o al coordinador propietario.
- Si falta sucursal en pivote, existe fallback a sucursal activa por orden.

## 5. Archivos principales
Backend:
- `app/Http/Controllers/Coordinador/DashboardController.php`
- `app/Http/Controllers/Coordinador/SolicitudController.php`

Frontend:
- `resources/js/Pages/Coordinador/CoordinadorDashboard.jsx`
- `resources/js/Pages/Coordinador/Clientes.jsx`
- `resources/js/Pages/Coordinador/MisDistribuidoras.jsx`
- `resources/js/Pages/Coordinador/Solicitudes/Index.jsx`
- `resources/js/Pages/Coordinador/Solicitudes/Create.jsx`
- `resources/js/Pages/Coordinador/Solicitudes/Show.jsx`

## 6. Estado real del modulo
El modulo Coordinador esta operativo para:
- alta y seguimiento de solicitudes,
- correccion y reenvio,
- consulta de cartera base (clientes/distribuidoras).
