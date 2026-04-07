# Modulo Gerente - Prestamo Facil

## 1. Objetivo del modulo
El rol Gerente es la autoridad de riesgo de una sucursal. Su objetivo es:
- Decidir si una solicitud verificada se aprueba o se rechaza.
- Definir parametros operativos de su sucursal (cortes, plazos, comisiones por override).
- Monitorear salud financiera de su sucursal (capital colocado, morosidad, cortes, pendientes).

No administra estructura global del sistema (eso queda para Admin).

## 2. Que puede hacer el Gerente hoy
### 2.1 Dashboard gerencial
Ruta: `/gerente/dashboard`

Muestra:
- Pendientes por decidir: solicitudes en estado `VERIFICADA`.
- Distribuidoras activas: distribuidoras activas de su sucursal.
- Vales activos: vales en estado activo o pago parcial.
- Capital colocado: suma de `monto_principal` en vales activos.
- Aprobadas/Rechazadas del mes: volumen de decisiones del gerente.
- Foco inmediato:
  - pendientes,
  - distribuidoras morosas,
  - capital en riesgo (saldo de vales morosos),
  - proximo corte.
- Actividad reciente: decisiones del gerente tomadas desde bitacora.

### 2.2 Bandeja de aprobacion
Ruta: `/gerente/distribuidoras`

Muestra solo solicitudes:
- de su sucursal activa,
- en estado `VERIFICADA`.

Incluye filtros por:
- prospecto (nombre/apellido/CURP),
- verificador,
- rango de fechas.

### 2.3 Expediente de solicitud (decision)
Ruta: `/gerente/distribuidoras/{id}`

Permite:
- Revisar expediente completo (persona, domicilio, checklist, evidencias).
- Aprobar con:
  - limite inicial,
  - categoria,
  - resultado buro.
- Rechazar con:
  - motivo obligatorio.

### 2.4 Rechazadas
Ruta: `/gerente/distribuidoras/rechazadas`

Muestra solicitudes rechazadas de su sucursal con:
- motivo de rechazo,
- fecha,
- filtros por prospecto/motivo/fecha.

### 2.5 Configuraciones variables por sucursal
Ruta: `/gerente/configuraciones`

Permite editar:
- Dia de corte.
- Hora de corte.
- Frecuencia de pago en dias.
- Plazo de pago en dias.
- Linea de credito default.
- Overrides por sucursal de:
  - categorias (porcentaje comision),
  - productos (comision empresa, interes quincenal, numero quincenas).

Incluye historial de cambios legible (antes/despues) con usuario y fecha.

### 2.6 Reportes
Ruta: `/gerente/reportes`

Muestra resumen de riesgo:
- vales morosos,
- capital en riesgo,
- distribuidoras morosas,
- proximo corte,
- lista de distribuidoras morosas.

### 2.7 Mi sucursal
Ruta: `/gerente/sucursales`

Vista informativa (no administrativa) de:
- datos de sucursal,
- distribuidoras activas,
- vales activos,
- capital colocado.

## 3. Conceptos de negocio explicados simple
### 3.1 Solicitud
Expediente inicial de una prospecta.
Estados relevantes para gerente:
- `VERIFICADA`: lista para decision.
- `APROBADA`: ya promovida a distribuidora.
- `RECHAZADA`: descartada con motivo.

### 3.2 Distribuidora
Persona aprobada para operar vales. Tiene:
- categoria,
- limite de credito,
- credito disponible,
- relacion con sucursal y coordinador.

### 3.3 Vale
Credito individual emitido a cliente final.
Indicadores clave:
- `monto_principal`: capital colocado.
- `saldo_actual`: capital en riesgo cuando cae en mora.

### 3.4 Corte
Evento programado de control financiero/operativo por sucursal.
Campos clave:
- `fecha_programada`: cuando debe ejecutarse.
- `estado`: `PROGRAMADO`, `EJECUTADO`, etc.
- `tipo_corte`: `PAGOS`, `PUNTOS`, `MIXTO`.

### 3.5 Frecuencia y plazo
- Frecuencia de pago (dias): cada cuantos dias se espera pago.
- Plazo de pago (dias): ventana total para cumplir pago.

### 3.6 Capital colocado
Suma de dinero actualmente prestado en vales activos.

### 3.7 Capital en riesgo
Suma de saldos de vales morosos.

## 4. Reglas importantes implementadas
### 4.1 Scope por sucursal
Todo el modulo gerente opera en su sucursal activa (`usuario_rol`).
No mezcla informacion de otras sucursales.

### 4.2 Seguridad para decisiones criticas
Aprobar/Rechazar estan en rutas con middleware `gerente.secure-action`.
El comportamiento depende de politica VPN (`config/security.php`).

### 4.3 Motivo de rechazo persistente
Se guarda en `solicitudes.motivo_rechazo`.

### 4.4 Categoria efectiva por sucursal
En expediente de aprobacion, el porcentaje mostrado de categoria puede venir de override por sucursal (`sucursal_configuraciones.categorias_config_json`).

### 4.5 Historial de configuraciones
Se registra en `bitacora_configuracion_sucursal`:
- tipo de evento (`SUCURSAL`, `CATEGORIA`, `PRODUCTO`),
- antes/despues,
- usuario,
- fecha.

### 4.6 Sincronizacion automatica de corte
Al guardar configuracion de sucursal:
- se calcula siguiente fecha de corte (dia/hora),
- se crea/actualiza un corte `PROGRAMADO` con marca `observaciones = AUTO_CONFIG_SUCURSAL`.

## 5. Flujo de aprobacion/rechazo
### 5.1 Aprobacion
1. Gerente abre expediente verificado.
2. Captura limite, categoria, resultado buro.
3. Sistema:
   - actualiza solicitud a `APROBADA`,
   - crea/actualiza distribuidora,
   - asegura cuenta bancaria de referencia,
   - crea/activa usuario distribuidora y rol,
   - registra bitacora de decision,
   - emite evento realtime de actualizacion de credito,
   - dispara notificacion de aprobacion.

### 5.2 Rechazo
1. Gerente captura motivo (obligatorio).
2. Sistema:
   - marca solicitud `RECHAZADA`,
   - guarda `motivo_rechazo`,
   - redirige a bandeja de rechazadas.

## 6. Tablas clave (vista rapida)
- `solicitudes`: estado, resultado_buro, motivo_rechazo, timestamps de flujo.
- `distribuidoras`: estado operativo, limite, categoria, credito.
- `vales`: monto_principal, saldo_actual, estado.
- `cortes`: fecha programada/ejecucion, estado, tipo.
- `sucursal_configuraciones`: parametros operativos y overrides por sucursal.
- `bitacora_decisiones_gerente`: eventos de aprobacion e incrementos.
- `bitacora_configuracion_sucursal`: auditoria de configuracion por sucursal.

## 7. Pantallas y archivos principales
Backend:
- `app/Http/Controllers/Gerente/DashboardController.php`
- `app/Http/Controllers/Gerente/AprobacionController.php`
- `app/Http/Controllers/Gerente/ConfiguracionController.php`

Frontend:
- `resources/js/Pages/Gerente/GerenteDashboard.jsx`
- `resources/js/Pages/Gerente/Distribuidoras/Index.jsx`
- `resources/js/Pages/Gerente/Distribuidoras/Show.jsx`
- `resources/js/Pages/Gerente/Distribuidoras/Rechazadas.jsx`
- `resources/js/Pages/Gerente/Configuraciones.jsx`
- `resources/js/Pages/Gerente/Reportes.jsx`
- `resources/js/Pages/Gerente/Sucursales.jsx`

Rutas:
- `routes/web.php` (grupo `gerente.*`).

## 8. Limitaciones actuales
- El dashboard/reportes usan lecturas operativas; no hay analitica historica avanzada por periodos custom.
- Los cortes se sincronizan por configuracion, pero no existe aun un motor batch completo aqui documentado para ejecucion automatica de corte (cron/queue) dentro de este modulo.

## 9. Resumen ejecutivo para compartir con Gemini
El modulo Gerente ya tiene:
- decision completa de solicitudes verificadas,
- rechazo con motivo persistente,
- bandeja de rechazadas,
- dashboard operativo con KPIs de riesgo,
- configuraciones por sucursal con auditoria,
- sincronizacion automatica de proximo corte al guardar configuracion,
- scope estricto por sucursal y proteccion de acciones criticas.

Con esto, el flujo gerencial esta funcional para operacion diaria y analisis basico de riesgo en sucursal.
