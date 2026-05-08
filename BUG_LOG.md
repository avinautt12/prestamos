# Bug Log — PrestamoFacil

Bugs detectados durante el plan de pruebas (`PLAN_PRUEBAS_TOTAL.md`). Se actualiza al cierre de cada fase.

## Leyenda

**Severidad:**
- 🔴 Crítico — bloquea un flujo principal
- 🟡 Funcional — degrada UX o funcionalidad secundaria
- ⚪ Menor — cosmético, edge case, o no llegó a usuario

**Estado:**
- `sospecha` — detectado en exploración estática, no verificado en runtime
- `confirmado` — reproducido durante pruebas
- `fixed` — corregido en código
- `descartado` — al investigar resultó no ser bug
- `out-of-scope` — bug confirmado pero pertenece a módulo del compañero (cajera/auth)

**Módulo:** `distribuidora` / `cajera` / `auth` / `gerente` / `admin` / `verificador` / `coordinador` / `seeder` / `config` / `infra`

---

## Tabla resumen

| ID | Sev | Estado | Fase | Módulo | Archivo | Descripción corta |
|----|-----|--------|------|--------|---------|-------------------|
| BS-1 | 🟡 | confirmado | 0 | seeder | `database/seeders/SucursalConfiguracionesSeeder.php:30-37` | Define config para `SUC-TRC-SUR` que no existe en `SucursalesSeeder` |
| BS-2 | 🟡 | confirmado | 3.2 | seeder | `database/seeders/RolesSeeder.php:62-69` | Dos entradas con código `ADMIN`. La 2ª (alias) sobrescribe a la 1ª via `updateOrCreate`. Resultado en BD: rol id=6 con `nombre='Administrador (Alias)'` en vez de `'Administrador'`. UI puede mostrar "(Alias)" en listas. Eliminar la entrada duplicada de la línea 62-69 |
| BS-3 | 🔴 | fixed | — | distribuidora | `app/Services/CorteService.php` + `app/Services/AbonoPartidasService.php` (nuevo) | Implementado en commit `6819cd2` "Conciliaciones con arrastre y validados". Migraciones agregaron `es_atraso`, `numero_quincena`, `quincenas_atrasadas_acumuladas`, `monto_pagado_previo`, `corte_origen_id`, `relacion_origen_id` a `partidas_relacion_corte` y `total_arrastre_recibido`, `cerrada_por_arrastre_en` a `relaciones_corte`. Ver `PRUEBAS_CORTES_ARRASTRE.md` para detalles del flow |
| BS-4 | 🟡 | confirmado-parcial | 1, 3.1, 3.2, 3.3 | auth + admin + infra | `AuthenticatedSessionController.php` + `Admin/UsuarioController.php` + otros | LOGIN no se audita (Fase 1). Crear usuario tampoco audita (Fase 3.1). Cambiar rol tampoco (Fase 3.2). Activar/desactivar usuario tampoco (Fase 3.3). Patrón: la auditoría es manual por código y casi ningún flujo crítico la llama. Verificar resto en fases siguientes |
| BS-5 | 🟡 | confirmado | 2 | auth | `app/Models/Usuario.php` + `routes/channels.php` | `getMorphClass()` o nombres de canal causan AuthError en Pusher subscription. Visto en consola en las 5 pantallas probadas: "Subscription error on App.Models.Usuario.X: AuthError, JSON returned from channel-authorization endpoint was invalid, yet status code was 200" |
| BS-6 | 🟡 | sospecha | 16 | auth | `NewPasswordController.php:60-65` | `solicitudes_password.expira_en` = 10 min puede ser corto si SMTP es lento |
| BS-7 | ⚪ | sospecha | 4 | coordinador | `Coordinador/SolicitudController.php` | Uploads a DoSpaces pueden fallar silenciosamente y dejar paths null en `solicitudes` |
| BS-8 | ⚪ | sospecha | 1 | config | `.env` + `config/session.php` | Migración crea tabla `sessions` pero `SESSION_DRIVER=file` — tabla queda inerte |
| HF0-1 | ⚪ | confirmado | 0 | seeder | `database/seeders/CortesSeeder.php:52-69` | Solo Centro recibe cuenta de empresa; Norte queda sin `cuentas_bancarias` con `tipo_propietario=EMPRESA` |
| BC-4 | 🟡 | sospecha | 20 | infra | múltiples | Cliente espera 5 grupos de notificaciones por rol — verificar que cada notificación existe (ver detalles abajo) |
| BC-5 | 🟡 | sospecha | 18 | reportes | `Admin/ReporteController`, `Gerente/ReporteController` | Cliente espera 4 reportes específicos — verificar que existen y traen datos correctos |
| BC-6 | 🟡 | sospecha | 18 | distribuidora | `resources/views/pdfs/relacion_corte.blade.php` | Comparar columnas y formato del PDF actual contra ejemplo del cliente |
| BC-7 | ⚪ | sospecha | 11 | seeder/cajera | `CortesSeeder.php` + módulo conciliación | Cliente espera dos cuentas empresa (BBVA + Banorte). Seeder solo tiene BBVA. Verificar si la app permite agregar más cuentas o si está hardcodeado |
| BC-8 | ⚪ | informativo | — | docs | — | Rol ADMIN no aparece en doc del cliente; es interno del equipo. No es bug, solo a tener en cuenta para reportes/demos |
| BF1-1 | ⚪ | confirmado | 1 | infra | `public/sw.js` (generado por Vite PWA) | Service Worker intenta precargar asset con hash viejo después de un rebuild → error `bad-precaching-response` en consola del navegador. Cosmético, se auto-resuelve al recargar |
| BF3-1 | 🟡 | confirmado | 3 | admin | [`UsuarioController.php:99`](app/Http/Controllers/Admin/UsuarioController.php#L99) | La validación `alpha_dash` en `nombre_usuario` rechaza usernames con punto, pero los usernames del seeder los usan (`coord.trc_nte`, `verif1.trc_nte`). UI no puede replicar el patrón. Reemplazar `alpha_dash` por regex que permita punto, o documentar que en producción los usernames usan `_`/`-` |
| HF3-1 | 🟡 | confirmado | 3.1 | admin | `resources/js/Pages/Admin/Usuarios.jsx` + `UsuarioController.php` | Form de "alta rápida" solo captura `primer_nombre`, `apellido_paterno` (etiquetado "Apellido"), `correo_electronico`. **Ninguna rama** del repo (Jona, Charly, charly, main, Beto, Juntos, avina, experimental, pruebas) tiene `apellido_materno`, CURP, RFC, fecha_nacimiento, sexo ni teléfono en este form (verificado vía `git show <rama>:archivo \| grep`). Faltante real, no regresión |
| BF3-2 | 🟡 | confirmado | 3.5 | admin | `resources/js/Pages/Gerente/Configuraciones.jsx:521-531` | Al intentar eliminar una categoría con distribuidoras asignadas, el backend rechaza correctamente con `withErrors(['general' => 'No se puede eliminar...'])`, pero el frontend NO renderiza `props.errors.general` ni define `onError` en el handler `router.delete`. Usuario queda sin feedback visible. Mismo patrón probable en `eliminarProducto`, `inactivarCategoria`, etc. (todos los handlers solo tienen `onStart`/`onFinish`) |
| BF3-3 | ⚪ | confirmado | 3.5 | admin | `Configuraciones.jsx:522` (y similares) | Uso de `window.confirm()` nativo del browser → muestra "localhost:8000 dice..." que se ve fuera de marca y poco profesional. Reemplazar por modal customizado consistente con el resto de la UI |
| HF3-2 | 🟡 | confirmado | 3.6 | admin | `resources/js/Pages/Gerente/ConfiguracionesTabs/TabProductos.jsx` (form crear producto) | Form de creación de producto NO captura `descripcion` ni `monto_multa_tardia`. Resultado: producto se crea con `descripcion=NULL` y `multa=0`. `modo_desembolso=TRANSFERENCIA` por default (intencional, requisito del cliente). Agregar al menos `monto_multa_tardia` (es importante operacionalmente) y opcionalmente `descripcion` |
| BF3-4 | 🟡 | confirmado | 3.6 | admin | `TabProductos.jsx:389-400` (mismo patrón en TabCategorias.jsx probablemente) | Bug visual: cuando se hace toggle Activar/Inactivar, **dos botones del producto muestran simultáneamente "Activando..."** (los botones "Guardar" y "Activar/Inactivar" leen ambos la misma variable `accionesProducto[id]`). Estado de carga es global por producto, no por acción. Solución: separar por acción ej. `acciones[id] = {tipo, label}` y mostrar solo donde corresponda |
| HF3-3 | ⚪ | confirmado | 3.6 | admin | controller de creación de productos | El código auto-generado al crear "Prestamo 3/5" quedó como `P35`, mientras los productos del seeder usan formato `PRESTAMO-N/M` (ej. `PRESTAMO-4/8`). Función generadora trunca mal — debería normalizar a formato consistente o pedirlo en el form |
| BF3-5 | 🔴 | confirmado | 3.7 | infra/config | `config/app.php:73` (Laravel UTC) vs MySQL session time_zone=SYSTEM (UTC-6 MX) | **Timezone mismatch global**. Laravel guarda timestamps en UTC, MySQL los devuelve interpretándolos como hora local. Resultado: `expira_en` de tokens aparece "ya expirado" o desplazado un día (visto en `activaciones_distribuidora`: `creado_en=10:15:19` UTC, `expira_en=04:18:12` MX-1d). Afecta: tokens de activación, tokens de reset password (TTL 10 min puede ser fatal), cortes programados, filtros de auditoría por fecha, cualquier `now()->subDays/Hours()`. **Fix recomendado:** cambiar `config/app.php` a `'America/Mexico_City'` (MySQL ya está en SYSTEM=MX, ambos coincidirán). Alternativa: forzar MySQL a UTC (más complejo) |
| HF3-4 | ⚪ | informativo | 3.6 | docs/admin | `ConfiguracionController::actualizarProducto/actualizarCategoria` | Patrón "catálogo global + override por sucursal": las ediciones de productos/categorías desde `/admin/configuraciones` NO modifican las tablas base (`productos_financieros`, `categorias_distribuidora`). En vez de eso, escriben overrides en `sucursal_configuraciones.productos_config_json` y `categorias_config_json` por cada sucursal. La tabla base mantiene los valores originales del catálogo. Documentar esto en el README/wiki para que devs futuros no se confundan |
| HF4-1 | ⚪ | informativo | 4.1 | coordinador | `resources/js/Pages/Coordinador/Solicitudes/Create.jsx:148` | Form de cónyuge captura `nombre/telefono/ocupacion` pero NO `edad`. Inconsistente con el form de hijos que sí tiene `edad`. Padres tampoco tienen edad. Decidir si agregar edad al cónyuge (y opcionalmente a padres) o documentar que la edad solo aplica a hijos |
| HF4-2 | ⚪ | decision-pendiente | 4.1 | docs | `personas.latitud/longitud` + `verificaciones_solicitud.latitud_verificacion/longitud_verificacion` | Cliente sugiere quitar lat/lon de personas. Antes de eliminar evaluar impacto: (1) algoritmo de distancia Haversine en `Verificador/SolicitudController.php:~331-345` que rechaza verificación si >100m del domicilio; (2) mapa de ruta del verificador (`/verificador/mapa-ruta`); (3) reportes con geolocalización. Si se quita, eliminar las 4 columnas + código asociado |
| HF4-3 | 🟡 | decision-pendiente | 4.2 | coordinador | `Coordinador/Solicitudes/Create.jsx` (validación async CURP/RFC) vs `Coordinador/SolicitudController.php:55-86` | Inconsistencia front/back: frontend bloquea cualquier reintento de captura cuando CURP/RFC existe ("EL CURP YA EXISTE EN EL SISTEMA"). Pero el backend permite re-captura si la persona existe sin solicitud activa (caso "reintento tras rechazo"). Decidir: (a) si NO se permite reintento → quitar lógica del backend (líneas 76-86); (b) si SÍ se permite → ajustar frontend para diferenciar mensaje y permitir continuar cuando solo es persona existente sin solicitud activa |
| HF4-4 | 🟡 | confirmado | 4.3 | seeder | `database/seeders/SolicitudesSeeder.php`, `DistribuidorasSeeder.php`, `ClientesSeeder.php`, `UsuariosSeeder.php` | Los CURPs y RFCs generados por los seeders son **malformados** (ej. `MAOA850101FCLDIST2`, `MAOA850101C01`) — no pasan el regex oficial de CURP/RFC mexicano. Consecuencia: cualquier flujo en UI que valide formato (ej. captura de solicitud del coordinador) rechaza estos datos antes de llegar a las validaciones de duplicidad. Hace imposible probar flujos como "persona ya distribuidora" desde la UI con datos seedeados. Fix: ajustar las funciones de generación de CURP/RFC en los seeders para producir strings que cumplan formato oficial |
| HF5-1 | 🟡 | parcial | 5.2 | verificador | `resources/js/Layouts/TabletLayout.jsx:142-148` | Sidebar lateral principal sigue sin link a "Por Revisar" (Dashboard, Solicitudes Pendientes, Mapa de Ruta, Validaciones). Sin embargo el array `shortcuts[]` línea 148 sí incluye "Por Revisar" como acceso rápido (probable bottom nav o card del dashboard). El usuario puede llegar via shortcut, pero el sidebar lateral sigue sin la opción consistente. Decisión pendiente: agregar al sidebar también, o aceptar que basta con el shortcut |
| BF5-1 | 🔴 | fixed-pushed | 5.3 | coordinador + verificador + seeder | `Coordinador/SolicitudController.php:146-148,352-354` + `Verificador/SolicitudController.php:275` + `database/seeders/SolicitudesSeeder.php:133,136,139,166` | Pusheado en commit `6eb142c` "Expediente funcional". **Doble JSON encoding:** los controllers y el seeder hacían `json_encode($array)` antes de pasarlo al modelo, pero el modelo (`Solicitud`/`VerificacionesSolicitud`) ya tiene `casts['array']` para esos campos. Resultado en BD: `"[{\"empresa\":\"X\"}]"` (string JSON escapado) en vez de `[{"empresa":"X"}]`. Al leer, Laravel devolvía string (no array), y el JSX `Coordinador/Solicitudes/Show.jsx` crashea con `TypeError: s.afiliaciones.map is not a function` → pantalla en blanco. **Fix aplicado:** quitado `json_encode()` donde el modelo ya tiene cast (datos_familiares, afiliaciones, vehiculos, checklist). Mantenido en `justificaciones_json` y `evidencias_extras_json` que NO tienen cast en `VerificacionesSolicitud` |
| HF5-2 | 🟡 | confirmado | 5.3 | infra/UX | `Coordinador/Solicitudes/Show.jsx` (y similares en otros roles) | Si un documento (foto/PDF) referenciado en `*_path` no existe en el bucket DoSpaces, el sistema genera la URL firmada pero al hacer request DoSpaces devuelve XML `<Error><Code>NoSuchKey>...`. El browser lo muestra crudo cuando se abre PDF inline. UX malo. **Fix sugerido:** validar existencia del archivo en backend antes de generar URL firmada (con `$disk->exists()`), o capturar el 404 en frontend y mostrar "Documento no disponible". Aplica también a las imágenes que muestran `alt` text en blanco |
| HF1-1 | ⚪ | informativo | 1 | distribuidora | dashboard distribuidora | Usuario `dist.candidata` (cuya distribuidora está en estado CANDIDATA) SÍ puede hacer login y entrar al dashboard. Muestra estado CANDIDATA, crédito $0 y alerta "Cuenta no activa / Vales bloqueados". Comportamiento aparentemente intencional (ver detalles abajo) |

---

## Detalles

### BS-1 🟡 confirmado — Seeder referencia sucursal inexistente

**Repro:**
```bash
php artisan migrate:fresh --seed
# El log del seeder muestra:
# > Sucursal SUC-TRC-SUR no encontrada. Corre SucursalesSeeder primero.
# > Configuraciones por sucursal creadas (3).   <-- ojo, dice 3 pero solo se insertan 2
```
Verificación: `SELECT COUNT(*) FROM sucursal_configuraciones;` → **2** (no 3).

**Causa raíz:** `SucursalConfiguracionesSeeder.php:30` define una entrada para `SUC-TRC-SUR`, pero `SucursalesSeeder.php` solo crea Centro y Norte. El seeder hace `Sucursal::where('codigo', $codigo)->first()` y si retorna null, hace `continue` con un warn.

**Fix sugerido (escoger uno):**
- A) Eliminar la entrada `SUC-TRC-SUR` del array de `SucursalConfiguracionesSeeder.php:30-37`. ✅ recomendado.
- B) Agregar `SUC-TRC-SUR` a `SucursalesSeeder` si la sucursal Sur es necesaria para futuras pruebas.
- C) Ajustar el mensaje "Configuraciones por sucursal creadas (3)" a un conteo dinámico (`count($insertados)`).

**Impacto:** ninguno funcional, solo confunde a quien lee los logs del seeder. Mensaje del seeder es engañoso.

---

### HF0-1 ⚪ confirmado — Norte sin cuenta empresa

**Repro:**
```sql
SELECT s.codigo, COUNT(cb.id) AS cuentas_empresa
FROM sucursales s
LEFT JOIN cuentas_bancarias cb
  ON cb.tipo_propietario='EMPRESA' AND cb.propietario_id=s.id
GROUP BY s.id;
-- Centro → 1, Norte → 0
```

**Causa raíz:** [`CortesSeeder.php:52-69`](database/seeders/CortesSeeder.php#L52) solo crea cuenta empresa para Centro (`$centro = Sucursal::where('codigo', 'SUC-TRC-CENTRO')->first()`). Si en runtime el código asume que toda sucursal con cortes tiene su cuenta empresa, Norte fallará al cerrar corte.

**Pendiente verificar en Fase 10:** ¿se crea la cuenta empresa al vuelo cuando el gerente Norte cierra un corte por primera vez? Si sí, este hallazgo es solo cosmético del seeder. Si no, escalaría a 🟡 o 🔴.

**Fix sugerido:** agregar bloque equivalente en `CortesSeeder` para Norte, o crear las cuentas empresa en un seeder dedicado (`SucursalesSeeder` o nuevo `CuentasEmpresaSeeder`) ejecutado antes de `CortesSeeder`.

---

### Bugs sospechosos (sin verificar aún)

Los siguientes bugs están en estado `sospecha` — fueron detectados durante la exploración estática inicial pero no se han reproducido todavía. Cada uno se valida en la fase indicada de la tabla resumen.

- **BS-2 — Dos entradas ADMIN en RolesSeeder.** Verificar en Fase 0 (post-seed): `SELECT codigo, COUNT(*) FROM roles GROUP BY codigo` → debe haber 6 únicos. Confirmado por conteo (roles=6), pero la entrada duplicada en el código sigue siendo confusa.
- **BS-3 — CorteService no arrastra faltante.** Plan: en Fase 10, cliente paga monto < total quincenal, cierre de corte, validar que la diferencia se acumula al siguiente corte.
- **BS-4 — Auditoría incompleta.** Plan: durante fases 1-16, ejecutar acciones que deberían auditar y verificar `bitacora_auditorias` al final (Fase 17).
- **BS-5 — getMorphClass inconsistente.** Plan: en Fase 20.2, `SELECT DISTINCT notifiable_type FROM notifications` — debe ser un solo valor.
- **BS-6 — Token reset 10 min.** Plan: en Fase 16, simular SMTP lento o verificar que el TTL es razonable.
- **BS-7 — DoSpaces silent fail.** Plan: en Fase 4, simular fallo de upload (cortar credenciales DoSpaces temporalmente) y verificar comportamiento.
- **BS-8 — SESSION_DRIVER inerte.** Confirmado en Fase 0: `SESSION_DRIVER=file`, tabla `sessions` quedó vacía. Decisión: lo dejamos así por la opción A elegida; si en producción se quiere usar BD, cambiar `.env`.

### HF3-1 🟡 confirmado — Form de alta rápida con campos faltantes

**Repro (Fase 3.1):**
1. Login `admin` → `/admin/usuarios` → "Crear usuario".
2. El formulario solo expone: Nombre, Apellido (un campo), Correo, Rol, Sucursal, Username, Password.
3. Tras crear "Diego Alberto Vargas Mendoza", verificar `personas` en BD:
   ```sql
   SELECT primer_nombre, apellido_paterno, apellido_materno, curp, rfc,
          sexo, fecha_nacimiento, telefono_celular FROM personas WHERE id = 34;
   ```
4. Resultado: solo `primer_nombre` y `apellido_paterno` tienen valor (con "Vargas Mendoza" pegado en `apellido_paterno`). Los demás están NULL.

**Verificación cross-rama (Fase 3.1):**
```bash
for rama in main Jona Charly charly Beto Juntos avina experimental pruebas; do
  git show "origin/$rama:resources/js/Pages/Admin/Usuarios.jsx" | grep -c "apellido_materno\|curp\|rfc"
done
```
Resultado: **0 en todas las ramas** para los archivos `Usuarios.jsx` y `UsuarioController.php`. El commit más reciente que tocó estos archivos (`a3a7043` "Agregar atributos de sucursal actual y mejorar validaciones") tampoco los agregó.

**Análisis:**
- Para roles operativos (gerente, coordinador, verificador, cajera) no es crítico — el sistema funciona sin esos datos porque NO son distribuidoras ni clientes.
- Pero rompe la consistencia con los seeders (que sí los tienen) y con la cultura mexicana de apellido paterno + materno.
- **Crítico** si el ADMIN crea con esta UI un usuario que después necesite ser distribuidora/cliente — esos flujos asumen CURP/RFC capturados al alta.

**Fix sugerido (módulo admin):**
- Agregar al form (`Usuarios.jsx:164-165`): `apellido_materno`, `curp` (opcional), `rfc` (opcional), `telefono_celular` (opcional), `sexo` y `fecha_nacimiento` (opcionales).
- Agregar al validator (`UsuarioController.php:98-107`): reglas correspondientes (todos nullable salvo `apellido_materno` que podría ser nullable también).
- Agregar al `Persona::create()` (`UsuarioController.php:113-119`): los campos nuevos.

---

### BS-4 🟡 confirmado-parcial — LOGIN no se audita

**Repro (Fase 1):**
1. Login con `admin`, `gerente`, `coordinador`, `verificador`, `cajera`, `distribuidora` (6 logins exitosos).
2. Query: `SELECT * FROM bitacora_auditorias WHERE tipo_evento='LOGIN' AND creado_en > NOW() - INTERVAL 1 HOUR;`
3. Resultado: **0 filas**. Los 12 registros del seeder de hace 9-10 días siguen siendo los únicos.

**Causa raíz probable:** [`AuthenticatedSessionController.php`](app/Http/Controllers/Auth/AuthenticatedSessionController.php) actualiza `usuarios.ultimo_acceso_en` pero no llama a `BitacoraAuditoria::registrar(BitacoraAuditoria::TIPO_LOGIN, ...)`. La auditoría es completamente manual — si el dev no la incluye en el flujo, no se registra.

**Fix sugerido (módulo auth, **out-of-scope para mi**):**
- Hook en `AuthenticatedSessionController::store()` después de `Auth::attempt()` exitoso para registrar LOGIN.
- Hook en `destroy()` para registrar LOGOUT.
- Considerar también: usar listener de events `Illuminate\Auth\Events\Login` y `Logout` para no acoplar al controller específico.

**Pendiente verificar (otras fases):** ya con esta evidencia, sospechamos que muchas otras acciones críticas no auditan. La verificación exhaustiva sigue siendo Fase 17. Mientras tanto, en cada fase del plan iremos checando si la acción ejecutada generó entrada en `bitacora_auditorias`.

---

### HF1-1 ⚪ informativo — `dist.candidata` puede entrar al dashboard

**Repro:** login con `dist.candidata` / `password123` → entra a `/distribuidora/dashboard` con estado CANDIDATA, crédito $0/$0, 0 clientes, y alerta visual "Atención — Cuenta no activa, Vales bloqueados".

**Análisis:**
- El plan esperaba `AuthenticatedSessionController.php:78-82` rechazara este login.
- En realidad esa validación aplica a usuarios DISTRIBUIDORA con `activaciones_distribuidora` pendiente (token de activación sin usar). `dist.candidata` no tiene token pendiente — fue creado activado por el seeder.
- La distinción es semántica: "pendiente de activación" (usuario nuevo sin password) vs "distribuidora candidata" (solicitud aún en proceso de aprobación).
- El sistema deja entrar al dashboard pero limita acciones. UX aceptable — el usuario ve que su trámite sigue pendiente.

**Nada que arreglar de entrada.** Solo confirmar con el cliente que este es el comportamiento deseado:
- ¿Una distribuidora CANDIDATA debe poder ver su propio dashboard (aunque vacío) para enterarse del estado de su solicitud?
- ¿O preferiría que el login le rechace con mensaje "tu solicitud está en revisión"?

Pendiente para reuniones de validación, no bloquea pruebas.

---

### BF1-1 ⚪ — Service Worker `bad-precaching-response`

**Repro:**
1. Usuario tiene la app cargada con un SW viejo (de un build anterior).
2. Hacemos `npm run build` → genera nuevos hashes de assets (ej. `VerificadorDashboard-NUEVO_HASH.js`).
3. Usuario hace login/refresh → el SW viejo intenta precargar el asset viejo (`VerificadorDashboard-DiUpS1cK.js`) que ya no existe → 404 → `bad-precaching-response` en consola.
4. El SW se auto-actualiza al detectar la nueva versión y al siguiente refresh ya no aparece.

**Impacto:** ninguno funcional. Solo genera ruido en consola para usuarios que tenían sesión activa al momento del deploy.

**Fix opcional:** configurar `vite-plugin-pwa` con estrategia `cleanupOutdatedCaches: true` (probablemente ya está) y/o `skipWaiting: true` para forzar actualización inmediata del SW.

---

### BC-4 🟡 — Notificaciones esperadas por rol (referencia)

El doc del cliente lista exactamente qué notificaciones espera cada rol. Validar en Fase 20 que cada una existe y dispara en su evento.

| Rol | Notificación esperada |
|---|---|
| Distribuidora | Vale feriado (vencido sin pago); corte de pagos listo; corte de puntos listo; límite de crédito autorizado/incrementado |
| Verificador | Presolicitud terminada (lista para verificar) |
| Coordinador | Verificador evaluó una de sus solicitudes; cliente final cambia a moroso; autorización de solicitud |
| Gerente | Solicitud verificada (lista para aprobar); fin de corte de pagos; fin de corte de puntos |
| Cajera | Distribuidora deshabilitada o en cuenta morosa; cliente final cambia a moroso |

### BC-5 🟡 — Reportes esperados (referencia)

El cliente lista 4 reportes específicos. Validar en Fase 18 que existen, traen datos correctos, y son descargables/enviables.

1. **Distribuidoras Morosas y saldos**
2. **Saldo de cortes**
3. **Saldo de puntos x distribuidora al corte**
4. **Presolicitudes pendientes y validadas**

### BC-6 🟡 — Formato del PDF de relación (referencia)

El doc del cliente trae un ejemplo concreto. Validar que `resources/views/pdfs/relacion_corte.blade.php` lo respeta:

**Encabezado:**
- Logo (placeholder OK)
- Número Distribuidora, Nombre, Domicilio, Límite de crédito, Crédito disponible, Puntos
- Referencia de Pago

**Cuerpo:**
- Fecha límite de pago, Pago anticipado (3 días previos al límite, formato "13,14,15 de febrero 2026")
- Total a PAGAR

**Tabla de partidas (columnas exactas):**
| # | Producto | Cliente | Pagos Realizados (formato `5/10`) | Comisión | Pago | Recargos | Total |

**Footer:**
- "Nombre: Prestamo Fácil SA"
- Logo BBVA + Convenio + CLABE
- Logo Banorte + Convenio + CLABE

---

---

## Cierres de Fase

### ✅ Fase 0 — Preflight + migrate:fresh+seed
- Backup BD OK, `.env` MAIL_MAILER → log, composer/npm/build OK, migrate+seed sin errores.
- Conteos en BD coinciden con lo predicho.
- **Hallazgos:** BS-1 (sucursal SUR fantasma), HF0-1 (Norte sin cuenta empresa), BS-8 (sessions table inerte por driver=file, decisión nuestra).
- **Bloqueantes:** ninguno.

### ✅ Fase 2 — Visualización (GET) por rol
- **Backend (test SmokeRoutesTest):** 40/40 rutas devuelven 200. Ningún 500, ni 403/404 inesperado.
- **Visual (5 pantallas críticas):** todas renderizan correctamente con los datos esperados.
- **Hallazgo nuevo:** BS-5 escaló de sospecha → confirmado (Pusher AuthError visible en consola en todas las pantallas con un usuario autenticado).
- **Bloqueantes:** ninguno. Las pantallas se ven bien aunque haya ruido en consola.
- **Cleanup:** archivo `tests/Feature/SmokeRoutesTest.php` removido al cierre.

### ✅ Fase 1 — Auth
- 16 usuarios hicieron login exitoso (de 17 posibles operativos+distribuidoras; faltó solo `dist1.trc_nte` que se puede saltar).
- 4 negativos validados: `dist.candidata` entra al dashboard con limitaciones (HF1-1, comportamiento intencional), password incorrecto rechazado, usuario inactivo bloqueado con mensaje correcto, logout limpia sesión y bloquea acceso a rutas protegidas.
- **Hallazgos confirmados:** BS-4 parcial (LOGIN no audita), BF1-1 (SW edge case rebuild), HF1-1 (dist.candidata UX informativa).
- **Bloqueantes:** ninguno. Auth funciona.

---

## Convenciones para añadir bugs

Al cierre de cada fase, agregar:

1. **Una fila en la tabla resumen** con id incremental:
   - `BS-N` para sospechas previas a pruebas
   - `BF<fase>-N` para bugs nuevos detectados durante pruebas (ej. `BF8-1` = primer bug de Fase 8)
   - `HF<fase>-N` para hallazgos no-bug que vale la pena anotar (ej. inconsistencias menores)

2. **Una sección "Detalles"** con repro, causa raíz, fix sugerido, e impacto.

3. **Marcar `confirmado`/`descartado`** cuando se verifica una sospecha.

4. **Marcar `fixed`** cuando se aplica el fix en código (con commit hash si aplica).
