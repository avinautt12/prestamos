# Plan de Pruebas Total — PrestamoFacil

## Changelog del plan

- **2026-04-29:** ampliado con cambios commiteados del usuario:
  - Fase 2 ampliada con sub-paso 2.7 (re-validar pantallas modificadas en commits `6819cd2` y `10933a3`).
  - Fase 10 ampliada referenciando `PRUEBAS_CORTES_ARRASTRE.md` (5 sub-fases T1-T5 para validar arrastre BS-3).
  - Fase 11 ampliada con sub-paso 11.5 (validar `/cajera/mis-vales` — nuevo módulo).

## Context

Acabamos de hacer merge de `origin/Charly` → `Jona` (10 commits, +3,865 líneas) que incorporó: módulo de auditoría (`bitacora_auditorias`), flujo de reset de password con autorización (`solicitudes_password`), sesiones en BD, comprobante de domicilio en clientes, evidencias extras y justificaciones del verificador. Las migraciones aún no se han corrido y el seeder todavía no se ha ejecutado.

El sistema cuenta con **6 roles** (ADMIN, GERENTE, COORDINADOR, VERIFICADOR, CAJERA, DISTRIBUIDORA) y **~100 endpoints** distribuidos en 9 flujos de negocio que cruzan varios roles. Antes de seguir desarrollando o desplegando, queremos un **barrido completo** que descubra dónde está roto el sistema usando los datos que produce el seeder + datos que crearemos durante las pruebas.

**Resultado esperado:** un bug log priorizado de fallas reales (no humo), con repro paso-a-paso, evidencia de BD, y rol implicado. Queremos detectar regresiones del merge de Charly y errores estructurales preexistentes.

---

## Reglas de operación

1. **Una fase a la vez.** Al terminar una fase, paro y espero que pruebes/confirmes antes de avanzar a la siguiente.
2. **Antes de cada fase explico qué se va a probar y qué se espera ver en BD.**
3. **Verificación de BD obligatoria** después de cada acción que crea/actualiza/borra: queries SQL listos en cada fase.
4. **No tocar archivos de cajera** salvo lectura. Si hay bugs en cajera, se reportan al log para que los corrija el otro compañero.
5. **Tres niveles de severidad** para los bugs: 🔴 Crítico (bloquea flujo), 🟡 Funcional (degrada UX), ⚪ Cosmético/menor.

---

## Preflight — Setup del entorno (Fase 0)

### 0.1 Verificación de `.env`
- [ ] `SESSION_DRIVER=database` (o `file` — la migración crea la tabla pero el driver actual define si se usa)
- [ ] `MAIL_*` configurado (driver = log o mailpit/smtp real para probar reset password)
- [ ] `FILESYSTEM_DISK` y credenciales DoSpaces (para subida de documentos en solicitudes)
- [ ] `RECAPTCHA_*` keys (login real las usa, sino fallback)
- [ ] `BROADCAST_DRIVER` (`null` o `pusher` — afecta notificaciones en tiempo real)
- [ ] `APP_URL` correcto (afecta links de email de reset password y activación)

### 0.2 Dependencias
```bash
composer install
npm install
npm run build   # o npm run dev en otra terminal
```

### 0.3 Migraciones + Seeder
```bash
php artisan migrate:fresh --seed
```
Ojo con `migrate:fresh` — borra la BD entera. Si hay datos importantes, hacer backup antes (`mysqldump` o equivalente).

### 0.4 Verificación de BD post-seed
Confirmar conteos esperados (queries para correr):
```sql
SELECT 'sucursales' AS tabla, COUNT(*) FROM sucursales
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'categorias_distribuidora', COUNT(*) FROM categorias_distribuidora
UNION ALL SELECT 'productos_financieros', COUNT(*) FROM productos_financieros
UNION ALL SELECT 'sucursal_configuraciones', COUNT(*) FROM sucursal_configuraciones
UNION ALL SELECT 'puntos_conf', COUNT(*) FROM puntos_conf
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'usuario_rol', COUNT(*) FROM usuario_rol
UNION ALL SELECT 'personas', COUNT(*) FROM personas
UNION ALL SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL SELECT 'verificaciones_solicitud', COUNT(*) FROM verificaciones_solicitud
UNION ALL SELECT 'distribuidoras', COUNT(*) FROM distribuidoras
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'clientes_distribuidora', COUNT(*) FROM clientes_distribuidora
UNION ALL SELECT 'vales', COUNT(*) FROM vales
UNION ALL SELECT 'pagos_cliente', COUNT(*) FROM pagos_cliente
UNION ALL SELECT 'cortes', COUNT(*) FROM cortes
UNION ALL SELECT 'relaciones_corte', COUNT(*) FROM relaciones_corte
UNION ALL SELECT 'pagos_distribuidora', COUNT(*) FROM pagos_distribuidora
UNION ALL SELECT 'conciliaciones', COUNT(*) FROM conciliaciones
UNION ALL SELECT 'movimientos_punto', COUNT(*) FROM movimientos_punto
UNION ALL SELECT 'bitacora_auditorias', COUNT(*) FROM bitacora_auditorias;
```

Conteos esperados: 2 sucursales, 6 roles, 4 categorías, 6 productos, 2 configs, 1 puntos_conf, 18 usuarios (13 op + 5 distribuidoras), ~30 personas, 6 solicitudes, 6 verificaciones, 5 distribuidoras, 10 clientes, 10 clientes_distribuidora, 10 vales, 48 pagos_cliente, 2 cortes, 2 relaciones, 1 pago_distribuidora, 1 conciliacion, 5 movimientos_punto, 12 bitacora_auditorias.

### 0.5 Limpiar artefactos antes de probar
```bash
php artisan optimize:clear
php artisan storage:link
```

---

## Fase 1 — Smoke Tests de Autenticación

**Qué se prueba:** que cada uno de los 13 usuarios operativos + las 4 distribuidoras ACTIVAS puede hacer login con `password123` y aterriza en el dashboard correcto.

| Usuario | Password | Ruta esperada tras login |
|---|---|---|
| admin | password123 | /admin/dashboard |
| gerente | password123 | /gerente/dashboard |
| gerente.trc_nte | password123 | /gerente/dashboard |
| coordinador | password123 | /coordinador/dashboard |
| coord.trc_nte | password123 | /coordinador/dashboard |
| verificador | password123 | /verificador/dashboard |
| verif2.trc_centro | password123 | /verificador/dashboard |
| verif3.trc_centro | password123 | /verificador/dashboard |
| verif1.trc_nte | password123 | /verificador/dashboard |
| verif2.trc_nte | password123 | /verificador/dashboard |
| verif3.trc_nte | password123 | /verificador/dashboard |
| cajera | password123 | /cajera/dashboard |
| cajera.trc_nte | password123 | /cajera/dashboard |
| distribuidora | password123 | /distribuidora/dashboard |
| dist2.trc_centro | password123 | /distribuidora/dashboard |
| dist1.trc_nte | password123 | /distribuidora/dashboard |
| dist2.trc_nte | password123 | /distribuidora/dashboard |

**Negativos a probar:**
- [ ] Login con `dist.candidata` (estado CANDIDATA): debe ser **bloqueado** porque la distribuidora no está activada (revisar `AuthenticatedSessionController.php:78-82`).
- [ ] Login con password incorrecto: debe rechazar y registrar fallo.
- [ ] Login con usuario inactivo (cambiar `usuarios.activo=0` para uno y probar).
- [ ] Logout cierra sesión y redirige a /login.

**Verificación BD:**
```sql
SELECT id, nombre_usuario, ultimo_acceso_en FROM usuarios ORDER BY ultimo_acceso_en DESC LIMIT 20;
SELECT * FROM sessions ORDER BY last_activity DESC LIMIT 10;  -- si SESSION_DRIVER=database
SELECT * FROM bitacora_auditorias WHERE tipo_evento='LOGIN' ORDER BY creado_en DESC LIMIT 10;
```

**Bug-check específico:** la migración `2026_04_23_000000_create_sessions_table.php` crea la tabla pero `SESSION_DRIVER` puede seguir en `file` — confirmar consistencia.

---

## Fase 2 — Visualización (GET-only) por rol

**Qué se prueba:** cada usuario abre cada pantalla a la que tiene acceso y la página renderiza sin error 500. Ninguna acción modifica datos.

### 2.1 ADMIN (usuario `admin`)
- /admin/dashboard, /admin/calendario, /admin/reportes
- /admin/auditorias (filtros por tipo, nivel, módulo, búsqueda, rango fechas)
- /admin/solicitudes-password (vacío inicialmente — OK)
- /admin/configuraciones, /admin/usuarios

### 2.2 GERENTE (usuario `gerente` y `gerente.trc_nte`)
- /gerente/dashboard, /gerente/reportes, /gerente/cortes
- /gerente/distribuidoras (lista solicitudes VERIFICADAS — debería mostrar la solicitud de Diana Salazar Centro)
- /gerente/distribuidoras/rechazadas (vacío)
- /gerente/distribuidoras/credito, /sugerencias (vacío)
- /gerente/configuraciones, /gerente/productos
- /gerente/solicitudes-password

### 2.3 COORDINADOR (usuario `coordinador` y `coord.trc_nte`)
- /coordinador/dashboard, /coordinador/reportes
- /coordinador/clientes, /coordinador/mis-distribuidoras, /coordinador/traspasos
- /coordinador/solicitudes (lista las que capturó él)
- /coordinador/solicitudes/create

### 2.4 VERIFICADOR (5 usuarios)
- /verificador/dashboard, /verificador/validaciones
- /verificador/solicitudes (sin asignar — vacío inicialmente)
- /verificador/solicitudes-por-revisar (las que tomó él)
- /verificador/mapa-ruta

### 2.5 CAJERA (usuario `cajera` y `cajera.trc_nte`)
- /cajera/dashboard
- /cajera/conciliaciones (3 secciones: pendientes, relaciones, historial)
- /cajera/prevale (vacío inicialmente)
- /cajera/cobranza
- /cajera/pagos-distribuidora

### 2.6 DISTRIBUIDORA (4 usuarios ACTIVAS)
- /distribuidora/dashboard
- /distribuidora/vales (debe mostrar 1 ACTIVO + N LIQUIDADOS según patrón 3/2/3/2)
- /distribuidora/clientes (2 o 3 según distribuidora)
- /distribuidora/puntos (saldo seedeado)
- /distribuidora/estado-cuenta (debe mostrar relación CERRADA + relación GENERADA pendiente)
- /distribuidora/traspasos (vacío)

**Verificación BD:** ningún cambio. Si algún `creado_en` o `actualizado_en` cambió, hay un side-effect indeseado en algún GET.

### 2.7 Re-validación tras commits `6819cd2` y `10933a3` (post-Fase 2 inicial)

**Cuándo aplicar:** sí o sí antes de cualquier prueba que dependa de los siguientes módulos.

Re-correr el test de smoke backend para validar las **rutas modificadas + ruta nueva**:
- `/cajera/dashboard` — dashboard modificado (`CajeraDashboard.jsx`)
- `/cajera/conciliaciones` — controller modificado (`ConciliacionController.php`)
- `/cajera/mis-vales` — **NUEVO** (`MisValesController.php` + `MisVales/Index.jsx`)
- `/distribuidora/estado-cuenta` — JSX modificado (+79 líneas con UI de arrastre)
- `/distribuidora/dashboard` — controller modificado (`DashboardController.php`)
- `/gerente/cortes` — JSX modificado (con UI de arrastre)
- Sidebar lateral — `TabletLayout.jsx` modificado (afecta a TODOS los roles)

**Validación visual mínima (login con cada rol y abrir pantalla):**
1. Login `cajera` → `/cajera/mis-vales` (nuevo) — debe listar vales donde la cajera intervino o estar vacío con mensaje
2. Login `cajera` → `/cajera/dashboard` — verificar que sidebar muestra link "Mis Vales" si aplica
3. Login `distribuidora` → `/distribuidora/estado-cuenta` — verificar que indicadores nuevos de arrastre (banner, badges PAGADA·ANTICIPADO / CERRADA·ARRASTRADA) renderean sin error
4. Login `gerente` → `/gerente/cortes` — verificar que UI de cierre de corte sigue funcional

---

## Fase 3 — Operaciones simples (CRUD aislado por módulo)

Una acción a la vez, con verificación de BD inmediata.

### 3.1 ADMIN: crear usuario
**POST /admin/usuarios** → crear un VERIFICADOR de prueba. Esperado: registro nuevo en `personas`, `usuarios`, `usuario_rol`. Si email válido + rol ≠ DISTRIBUIDORA, se envía correo de bienvenida (verificar log de mail si MAIL_DRIVER=log).

### 3.2 ADMIN: cambiar rol
**PUT /admin/usuarios/{id}/rol** → cambiar el VERIFICADOR recién creado a COORDINADOR. Esperado: en `usuario_rol`, el rol viejo queda con `revocado_en` lleno y se inserta uno nuevo con `es_principal=true`.

### 3.3 ADMIN: activar/desactivar usuario
**PATCH /admin/usuarios/{id}/estado** → toggle `usuarios.activo`.

### 3.4 GERENTE: editar config sucursal
**PUT /gerente/configuraciones/sucursal** (con `gerente`) → cambiar `dia_corte` de 14 a 15 en SUC-TRC-CENTRO. Esperado:
- `sucursal_configuraciones` se actualiza.
- `bitacora_configuracion_sucursal` recibe registro nuevo con `cambios_antes_json` y `cambios_despues_json`.
- `cortes` con estado PROGRAMADO se reprograman (revisar `CorteService::sincronizarProximoCorteProgramado`).

### 3.5 GERENTE: CRUD categoría
- Crear categoría "ESMERALDA" → INSERT en `categorias_distribuidora`, código auto-generado.
- Actualizar % comisión → UPDATE.
- Inactivar → `activo=0`.
- Reactivar → `activo=1`.
- Eliminar → debe **fallar** si hay distribuidora asignada; hacerla con la categoría nueva sin uso → DELETE.

### 3.6 GERENTE: CRUD producto financiero
- Crear "PRESTAMO-3/5" $5000 / 3 quincenas → INSERT.
- Actualizar interés → UPDATE.
- Soft-delete → `deleted_at` lleno.
- Restaurar → `deleted_at` null.

### 3.7 ADMIN: crear/actualizar usuario distribuidora con reenvío de activación
**POST /admin/usuarios** con rol DISTRIBUIDORA → debe crear usuario sin activar, generar token en `activaciones_distribuidora`, intentar enviar correo. Verificar que login antes de activación está bloqueado.

**Verificación BD para esta fase:**
```sql
SELECT * FROM usuario_rol WHERE usuario_id=<id> ORDER BY asignado_en DESC;
SELECT * FROM bitacora_configuracion_sucursal ORDER BY id DESC LIMIT 5;
SELECT * FROM activaciones_distribuidora ORDER BY id DESC LIMIT 5;
SELECT * FROM categorias_distribuidora WHERE codigo='ESMERALDA';
SELECT * FROM productos_financieros ORDER BY id DESC LIMIT 3;
```

---

## Fase 4 — Flujo E2E: Captura de solicitud (Coordinador)

**Qué se prueba:** el coordinador `coordinador` (Centro) captura una solicitud nueva de cero, sube los 4 documentos, y la envía a verificación.

**Pasos:**
1. /coordinador/solicitudes/create → llenar formulario con persona NUEVA (CURP/RFC inéditos).
2. Adjuntar 4 archivos: ine_frente, ine_reverso, comprobante_domicilio, reporte_buro.
3. Llenar familiares, afiliaciones, vehículos.
4. POST → solicitud creada en estado `EN_REVISION`.

**Variantes a probar:**
- ✅ Caso normal: persona nueva, todos los campos.
- ❌ Persona ya distribuidora ACTIVA → debe rechazar (línea 58-66 SolicitudController).
- ❌ Persona con solicitud activa → debe rechazar.
- ❌ Sin documentos → validación de Form Request.
- ❌ Geolocalización inválida (lat/lon fuera de rango) → comportamiento esperado.

**Verificación BD:**
```sql
SELECT * FROM personas ORDER BY id DESC LIMIT 1;
SELECT * FROM solicitudes WHERE estado='EN_REVISION' ORDER BY id DESC LIMIT 1;
-- Verificar paths a DoSpaces:
SELECT id, ine_frente_path, ine_reverso_path, comprobante_domicilio_path, reporte_buro_path FROM solicitudes ORDER BY id DESC LIMIT 1;
-- Verificar evento se disparó (revisa notifications de verificadores Centro):
SELECT * FROM notifications WHERE notifiable_type LIKE '%Usuario%' ORDER BY created_at DESC LIMIT 5;
```

**Bug-check:** tras subida, `ine_frente_path` puede estar `null` si DoSpaces falla silenciosamente. Validar que un upload fallido bloquee la solicitud o al menos log.

---

## Fase 5 — Flujo E2E: Verificación en campo (Verificador)

**Qué se prueba:** un verificador de Centro toma la solicitud creada en Fase 4 y la verifica.

**Pasos:**
1. Login como `verificador` → /verificador/solicitudes (debe aparecer la nueva).
2. POST /verificador/solicitudes/{id}/tomar → `verificador_asignado_id` y `tomada_en` se llenan.
3. /verificador/solicitudes/{id} → ver detalle con documentos firmados.
4. POST /verificador/solicitudes/{id}/verificar con:
   - `resultado=VERIFICADA`
   - lat/lon dentro de 100m del domicilio
   - 3 fotos requeridas + 2 evidencias extras (probar campo `evidencias_extras_json`)
   - checklist con 1 item en `false` y justificación → probar campo nuevo `justificaciones_json`
   - observaciones

**Variantes:**
- ❌ Distancia > 100m con resultado=VERIFICADA → debe rechazar.
- ❌ Item de checklist en false sin justificación → validación.
- ✅ resultado=RECHAZADA con motivo → solicitud a estado `RECHAZADA`.

**Verificación BD:**
```sql
SELECT estado, verificador_asignado_id, tomada_en, revisada_en FROM solicitudes WHERE id=<id>;
SELECT id, resultado, distancia_metros, checklist_json, justificaciones_json, evidencias_extras_json
FROM verificaciones_solicitud WHERE solicitud_id=<id>;
```

---

## Fase 6 — Flujo E2E: Aprobación gerente + creación de distribuidora

**Qué se prueba:** el gerente Centro aprueba la solicitud verificada (la nueva, o la existente de Diana Salazar) y se crea distribuidora completa.

**Pasos:**
1. Login `gerente` → /gerente/distribuidoras (lista VERIFICADAS).
2. Click en la solicitud → /gerente/distribuidoras/{id}.
3. POST /gerente/distribuidoras/{id}/aprobar con: producto, categoría, límite, observaciones.
4. Verificar que se creó:
   - `distribuidoras` (estado ACTIVA, persona_id, sucursal_id, categoría)
   - `usuarios` con rol DISTRIBUIDORA
   - `usuario_rol`
   - `cuenta_bancaria` (CLABE generada)
   - `activaciones_distribuidora` (token 24h)
   - `bitacora_decision_gerente` (tipo NUEVA_DISTRIBUIDORA)
   - Email de activación enviado (revisar log)

**Variante negativa:**
- POST /gerente/distribuidoras/{id}/rechazar → estado `RECHAZADA`, registro en bitácora con `tipo_evento=RECHAZO`.

**Verificación BD completa:**
```sql
SELECT * FROM distribuidoras ORDER BY id DESC LIMIT 1;
SELECT * FROM usuarios u JOIN usuario_rol ur ON u.id=ur.usuario_id WHERE ur.rol_id=(SELECT id FROM roles WHERE codigo='DISTRIBUIDORA') ORDER BY u.id DESC LIMIT 1;
SELECT * FROM cuentas_bancarias ORDER BY id DESC LIMIT 1;
SELECT * FROM activaciones_distribuidora ORDER BY id DESC LIMIT 1;
SELECT * FROM bitacora_decision_gerente ORDER BY id DESC LIMIT 3;
```

---

## Fase 7 — Activación distribuidora + login

**Qué se prueba:** la distribuidora recién aprobada activa su cuenta con el token y hace login.

**Pasos:**
1. Tomar el token de `activaciones_distribuidora` (la versión plana solo se ve en el email; en local revisar logs/mailpit).
2. Acceder a `/distribuidora/activar/{token}` → formulario.
3. POST con nueva password → `usado_en` se llena, password se hashea en `usuarios.clave_hash`.
4. Login con la nueva distribuidora → /distribuidora/dashboard.

**Variantes:**
- ❌ Token expirado (manualmente cambiar `expira_en` < now) → debe rechazar.
- ❌ Token reutilizado → segundo intento debe fallar.

---

## Fase 8 — Flujo E2E: Emisión de prevale → vale activo

**Qué se prueba:** una distribuidora ACTIVA crea un vale (prevale) para un cliente nuevo, y la cajera lo aprueba.

**Pasos como DISTRIBUIDORA (`distribuidora`):**
1. /distribuidora/clientes/crear → registrar cliente nuevo (no existente).
2. /distribuidora/vales/crear → escoger cliente, producto PRESTAMO-4/8 ($8,000), monto.
3. POST → vale en estado `BORRADOR`.

**Pasos como CAJERA (`cajera`):**
4. /cajera/prevale → debe aparecer el prevale.
5. /cajera/prevale/{id} → ver checklist (identidad, domicilio, parentesco, biometría, PLD).
6. POST /cajera/prevale/{id}/aprobar con todos los checks → vale a `ACTIVO`.
7. Verificar:
   - `vales.estado=ACTIVO`
   - `distribuidoras.credito_disponible` decrementado en monto del producto
   - `clientes.estado=ACTIVO`
   - `clientes_distribuidora.prevale_aprobado=1`

**Variantes:**
- ❌ Distribuidora MOROSA (cambiar manualmente) intenta crear vale → bloqueo.
- ❌ Crédito insuficiente → bloqueo.
- ❌ Cliente con vale activo del mismo producto → comportamiento esperado.
- ❌ POST /cajera/prevale/{id}/rechazar → vale a CANCELADO, cliente y relación bloqueados.

**Verificación BD:**
```sql
SELECT id, estado, monto, saldo_actual, distribuidora_id, cliente_id FROM vales ORDER BY id DESC LIMIT 1;
SELECT id, estado, credito_disponible FROM distribuidoras WHERE id=<id>;
SELECT id, estado FROM clientes WHERE id=<cliente_id>;
SELECT * FROM clientes_distribuidora WHERE cliente_id=<cliente_id> AND distribuidora_id=<dist_id>;
```

---

## Fase 9 — Flujo E2E: Pago de cliente

**Qué se prueba:** distribuidora registra pago del cliente al vale activo.

**Pasos:**
1. /distribuidora/vales/{vale}/pagos → POST con monto = cuota quincenal.
2. Verificar:
   - `pagos_cliente` tiene registro nuevo
   - `vales.pagos_realizados` incrementa
   - `vales.saldo_actual` decrementa
   - Si saldo llega a 0 → estado pasa a `LIQUIDADO`
   - `movimientos_punto` puede recibir entradas si afecta puntos

**Variantes:**
- Pago parcial (monto < cuota) → `es_parcial=1`, vale sigue ACTIVO.
- Pago tardío (después de fecha límite) → comportamiento de mora.

---

## Fase 10 — Flujo E2E: Cierre manual de corte

**Qué se prueba:** el gerente Centro cierra un corte manualmente para generar relaciones de cobranza para sus distribuidoras.

**Pasos:**
1. /gerente/cortes → ver corte EJECUTADO actual.
2. POST /gerente/cortes/{id}/cerrar-manual → corte pasa a CERRADO. Para corte nuevo:
   - Iterar todas distribuidoras de Centro.
   - Crear `relaciones_corte` con estado `GENERADA`, referencia única, total a pagar = comisión + cuotas vencidas.
   - Crear `partidas_relacion_corte` por cada vale en cobranza.
   - Enviar email con reporte a admins+gerente.

**Verificación BD:**
```sql
SELECT id, estado, fecha_ejecucion FROM cortes ORDER BY id DESC LIMIT 5;
SELECT id, corte_id, distribuidora_id, numero_relacion, referencia_pago, total_a_pagar, estado FROM relaciones_corte ORDER BY id DESC LIMIT 10;
SELECT * FROM partidas_relacion_corte ORDER BY id DESC LIMIT 10;
```

**Bug-check (BS-3 fixed en commit `6819cd2`):** la implementación de arrastre ya está aplicada. Validar comportamiento usando el doc dedicado.

### 10.X — Validación exhaustiva de arrastre (referenciar `PRUEBAS_CORTES_ARRASTRE.md`)

El usuario implementó el arrastre con un plan propio de 5 sub-fases (T1-T5, total 22 sub-pruebas). En vez de duplicar acá, **se ejecutan tal cual del doc**:

| Sub-fase | Cubre |
|---|---|
| **T1.1-T1.4** | Setup: migrate fresh, login, crear vale, estado de cuenta carga |
| **T2.1-T2.3** | Filtro de fecha de emisión (vale recién emitido NO entra al corte inmediato) |
| **T3.1-T3.7** | Atrasos y arrastre: 1 quincena atrasada, dos cortes seguidos, pago puntual, vale liquidado, vale 4q con muchos cortes, distribuidora con relación VENCIDA, idempotencia |
| **T4.1-T4.4** | Pagos parciales y distribución: parcial entre partidas, siguiente corte refleja saldo, sobrepago se ignora |
| **T5.1-T5.5** | UI distribuidora: banner de arrastre, badges ATRASO / NORMAL / PAGADA·ANTICIPADO / CERRADA·ARRASTRADA |

**Tablas/columnas nuevas a verificar en BD:**

`partidas_relacion_corte` (6 columnas + 2 índices + 2 FKs):
- `es_atraso` (bool), `numero_quincena`, `quincenas_atrasadas_acumuladas`, `monto_pagado_previo`
- `corte_origen_id` → FK `cortes`, `relacion_origen_id` → FK `relaciones_corte`

`relaciones_corte` (2 columnas):
- `total_arrastre_recibido`, `cerrada_por_arrastre_en`

**Servicios nuevos:**
- `app/Services/AbonoPartidasService.php` — distribución de pagos parciales entre partidas
- `app/Services/CorteService.php` (+202 líneas) — generación de partidas de arrastre

---

## Fase 11 — Flujo E2E: Distribuidora reporta pago + Conciliación bancaria

### 11.1 Distribuidora reporta pago
1. /distribuidora/estado-cuenta → ver relación GENERADA.
2. POST /distribuidora/relaciones/{id}/reportar-pago con monto + referencia + fecha.
3. Verificar `pagos_distribuidora` (estado REPORTADO) y `relaciones_corte.estado` puede pasar a PARCIAL.

### 11.2 Cajera importa archivo bancario
1. /cajera/conciliaciones/simular-archivo → descargar Excel demo.
2. (Opcional) Modificar Excel para simular casos: pago exacto, monto mayor, monto menor, sin referencia, doble pago.
3. POST /cajera/conciliaciones/importar → subir archivo.
4. Verificar:
   - `movimientos_bancarios` insertados.
   - Match automático con `relaciones_corte.referencia_pago + monto exacto` → `pagos_distribuidora.estado=CONCILIADO` y `conciliaciones` insertada.
   - Mismatches quedan en pendientes.

### 11.3 Conciliación manual
1. Para movimientos sin match → /cajera/conciliaciones POST manual.
2. Verificar conciliación con diferencia de monto.

### 11.4 Comando demo (alternativa rápida)
```bash
php artisan app:cajera-demo --test-cases
```
Crea 10 escenarios y permite probar el matcheo con datos diversos.

**Verificación BD:**
```sql
SELECT * FROM movimientos_bancarios ORDER BY id DESC LIMIT 20;
SELECT * FROM pagos_distribuidora ORDER BY id DESC LIMIT 10;
SELECT * FROM conciliaciones ORDER BY id DESC LIMIT 10;
SELECT id, estado, total_a_pagar FROM relaciones_corte ORDER BY id DESC LIMIT 10;
```

⚠️ **Cajera no se toca en código.** Solo se prueba; bugs se reportan al log.

### 11.5 Cajera/MisVales (NUEVO en commit `10933a3`)

**Qué se prueba:** la cajera puede consultar el historial de vales en los que intervino (aprobó prevale, cobró pago, conciló pago).

**Pasos como `cajera`:**
1. Ir a `/cajera/mis-vales` (link en sidebar).
2. Verificar columnas: vale, cliente, distribuidora, fecha aprobación, fecha cobro, fecha conciliación, estado.
3. Filtros que ofrece la UI: rango fechas, estado, búsqueda por cliente/distribuidora.
4. Paginación funcional.

**Bug-check:** [`MisValesController.php:43-46`](app/Http/Controllers/Cajera/MisValesController.php#L43) limita por `cajeraId` — confirmar que la cajera Centro NO ve vales de Norte y viceversa.

---

## Fase 12 — Sistema de puntos

**Qué se prueba:** cómo se ganan/pierden/canjean puntos.

### 12.1 Ganancia por pago puntual/anticipado
- Cuando se cierra un corte y la distribuidora pagó a tiempo, se crea `movimientos_punto` con tipo `GANADO_PUNTUAL` o `GANADO_ANTICIPADO`.
- Verificar fórmula: `floor(total/1200) × 3` (regla de negocio #15).

### 12.2 Penalización por morosidad
```bash
php artisan app:detectar-distribuidoras-morosas
```
- Para distribuidoras con `relaciones_corte.fecha_limite_pago < today` y estado GENERADA/PARCIAL:
  - Estado pasa a `MOROSA`, `puede_emitir_vales=0`.
  - Si no era morosa antes, se aplica castigo 20% sobre puntos actuales.
  - Se crea `movimientos_punto` tipo `PENALIZACION_ATRASO`.
  - Notificación a coordinador y cajera.

### 12.3 Canje de puntos
- /distribuidora/puntos/canjear con monto válido.
- Verificar `puntos_actuales` decrementa y `movimientos_punto` registra `CANJE`.

**Variantes:**
- ❌ Canje con puntos insuficientes → debe rechazar.
- ❌ Doble ejecución de DetectarMorosas el mismo día → no debe duplicar penalización.

**Verificación BD:**
```sql
SELECT distribuidora_id, SUM(puntos) FROM movimientos_punto GROUP BY distribuidora_id;
SELECT id, estado, puntos_actuales, puede_emitir_vales FROM distribuidoras;
```

---

## Fase 13 — Traspaso de cliente entre distribuidoras

**Qué se prueba:** distribuidora A solicita traspasar un cliente a distribuidora B, coordinador aprueba con código, distribuidora origen confirma con código.

**Pasos:**
1. Como `distribuidora` (Centro): POST /distribuidora/traspasos con cliente_id + distribuidora_destino_id.
2. Como `coordinador`: /coordinador/traspasos → aprobar (genera código 24h).
3. Como `distribuidora` origen: /distribuidora/traspasos/{id}/confirmar con código → estado EJECUTADA, relación cliente actualizada.

**Variantes:**
- ❌ Cliente con vale activo → bloqueo (no traspasable con deuda).
- ❌ Coordinador rechaza → estado RECHAZADA.
- ❌ Código expirado (cambiar manualmente) → confirmación falla.
- ❌ Distribuidora destino cancela antes de aprobación coordinador → estado CANCELADA.

**Verificación BD:**
```sql
SELECT * FROM traspasos_cliente ORDER BY id DESC LIMIT 5;
SELECT distribuidora_id, cliente_id, estado_relacion, vinculado_en, desvinculado_en FROM clientes_distribuidora WHERE cliente_id=<id> ORDER BY id;
```

---

## Fase 14 — Sugerencias de crédito automáticas

**Qué se prueba:** cuando una distribuidora cumple criterios (umbral_incremento_auto + score), se le sugiere incremento de crédito al gerente.

**Pasos:**
1. Ejecutar el job/comando que detecta incrementos (revisar `app/Console/Commands/EvaluarCreditoMensual` o similar).
2. /gerente/distribuidoras/credito/sugerencias → debe aparecer la sugerencia.
3. POST aprobar → límite se incrementa, `bitacora_decision_gerente` registra `INCREMENTO_LIMITE`.
4. POST rechazar (con otra) → estado RECHAZADA, motivo registrado.

**Verificación BD:**
```sql
SELECT * FROM sugerencias_credito ORDER BY id DESC LIMIT 5;
SELECT id, limite_credito, credito_disponible FROM distribuidoras;
SELECT * FROM bitacora_decision_gerente WHERE tipo_evento='INCREMENTO_LIMITE' ORDER BY id DESC LIMIT 5;
```

---

## Fase 15 — Cobranza y bloqueo de morosos (Cajera)

**Pasos:**
1. /cajera/cobranza → ver lista de distribuidoras con deuda.
2. POST /cajera/cobranza/{id}/bloquear → estado a MOROSA, `puede_emitir_vales=0`, relaciones vencidas marcadas VENCIDA.
3. Intentar crear vale como esa distribuidora → debe rechazarse.
4. POST /cajera/cobranza/{id}/desbloquear → si no tiene relaciones VENCIDA, vuelve a ACTIVA.

⚠️ **No tocar código de cajera.** Solo probar y reportar.

---

## Fase 16 — Reset de password (NUEVO Charly)

**Qué se prueba:** flujo completo de reset con autorización.

**Pasos:**
1. /forgot-password (sin login) → ingresar `coordinador` → POST.
2. Verificar `solicitudes_password` con estado PENDIENTE.
3. Como ADMIN: /admin/solicitudes-password → debe aparecer.
4. POST aprobar individual → token se genera, `expira_en` = +10min, email enviado a coordinador.
5. Coordinador hace click en link → /reset-password?token=X.
6. POST con nueva password → password actualizado, solicitud marcada EXPIRADA (la nueva expiración inmediata previene reuso).

**Variantes:**
- ❌ Solicitar reset 2 veces sin aprobación → segunda debe rechazar (1 PENDIENTE max).
- ❌ Aprobar todas masivamente (botón "Aprobar todas") → todas pasan a APROBADA.
- ❌ Token expirado (>10 min) → reset falla.
- ❌ Token reutilizado → segundo intento falla.
- ❌ Como GERENTE aprobar (ruta /gerente/solicitudes-password) → middleware secure-action.

**Verificación BD:**
```sql
SELECT * FROM solicitudes_password ORDER BY id DESC LIMIT 5;
SELECT id, nombre_usuario, clave_hash, updated_at FROM usuarios WHERE id=<id>;
```

**Bug-check:** confirmar que email se envía con link correcto (revisar `app/Mail/PasswordResetMail.php` y `resources/views/emails/password-reset.blade.php`).

---

## Fase 17 — Auditoría (NUEVO Charly)

**Qué se prueba:** cuántas acciones del sistema realmente registran en `bitacora_auditorias`.

**Pasos:**
1. Como `admin`: /admin/auditorias → ver los 12 registros del seeder + cualquiera generado en fases 1-16.
2. Filtrar por tipo (LOGIN, CAMBIO_CONFIG, APROBAR, etc.), módulo, nivel, fecha.
3. Hacer una acción "auditable" en otro tab (ej. login otro usuario, cambiar config) y refrescar — debe aparecer.

**Bug-check importante:** la auditoría es **manual** — requiere que el código llame `BitacoraAuditoria::registrar()`. Verificar **dónde se llama actualmente** y dónde NO. Acciones críticas que DEBERÍAN auditar:
- LOGIN/LOGOUT (verificar)
- Cambios de configuración (verificar)
- Aprobación/rechazo de solicitudes (verificar)
- Cierre de corte manual (verificar)
- Cambio de límite de crédito (verificar)
- Reset de password (verificar)

Por cada acción ejecutada en fases 1-16, query:
```sql
SELECT tipo_evento, modulo, descripcion, usuario_nombre, creado_en
FROM bitacora_auditorias
WHERE creado_en > '<inicio_pruebas>'
ORDER BY creado_en DESC;
```
Si una acción NO aparece, es 🟡 funcional (auditoría incompleta).

---

## Fase 18 — Reportes (descargar y enviar por email)

### 18.1 Admin
- GET /admin/reportes → ver reporte ejecutivo.
- GET /admin/reportes/descargar?periodo=mensual&alcance=global → Excel.
- POST /admin/reportes/enviar → email al usuario actual.

### 18.2 Gerente
- GET /gerente/reportes → reporte por sucursal.
- GET /gerente/reportes/descargar → Excel.
- POST /gerente/reportes/enviar → email.

### 18.3 PDF de relación de corte
- Como `distribuidora`: GET /distribuidora/relaciones/{id}/pdf → ver PDF de `relacion_corte.blade.php`.

**Verificación:**
- Email enviado (log/mailpit).
- Excel descargado tiene datos válidos (no headers vacíos).
- PDF tiene total correcto, partidas, referencia, fechas.

---

## Fase 19 — Comandos de consola

```bash
php artisan app:detectar-distribuidoras-morosas
php artisan app:cajera-demo --test-cases
php artisan app:cajera-demo --generar-excel
# Otros si existen:
php artisan list | grep app:
```

Por cada comando: ejecutar, verificar BD, ver que no truene, ver que sea idempotente (correrlo 2 veces no duplica datos).

---

## Fase 20 — Notificaciones (in-app, broadcast, email)

**Qué se prueba:** cada acción que dispara notificación las entrega correctamente.

### 20.1 In-app (tabla `notifications`)
- /notificaciones → ver pendientes.
- PATCH /notificaciones/{id}/marcar-leida → `read_at` se llena.
- PATCH /notificaciones/marcar-todas-leidas → todas.

### 20.2 Bug conocido (exploración)
El modelo Usuario tiene `getMorphClass()` que retorna `App\Models\User` mientras el código carga `App\Models\Usuario` en algunos lados — puede causar que `notifiable_type` quede inconsistente. **Verificar:**
```sql
SELECT DISTINCT notifiable_type FROM notifications;
-- Debería ser un solo valor coherente. Si hay 2, hay bug.
```

### 20.3 Email
- Reset password (Fase 16) → email recibido.
- Activación distribuidora (Fase 7) → email recibido.
- Reportes enviados (Fase 18) → email recibido.
- Aprobación distribuidora (Fase 6) → email a distribuidora.

### 20.4 Broadcast (si BROADCAST_DRIVER=pusher)
- Notificación en tiempo real con WebSocket abierto.

---

## Fase 21 — Edge cases y negative tests dirigidos

Lista de pruebas adversariales a hacer en cualquier orden:

| # | Caso | Esperado |
|---|---|---|
| 1 | POST sin CSRF token | 419 |
| 2 | GET /admin/dashboard como CAJERA | 403 |
| 3 | Acceder a /gerente/distribuidoras/{id} de otra sucursal | 403 o 404 |
| 4 | Subir archivo > MAX_FILE_SIZE en solicitud | validación |
| 5 | SQL injection en búsqueda (search="'; DROP TABLE--") | sanitizado |
| 6 | XSS en campo `notas` o `observaciones` | escapado en render |
| 7 | Rate limit /login (>5 intentos en 1 min) | bloqueado |
| 8 | Concurrencia: 2 verificadores toman misma solicitud al mismo tiempo | uno gana |
| 9 | Concurrencia: misma cajera aprueba prevale 2 veces | uno gana |
| 10 | Eliminar categoría con distribuidoras → error claro | sí |
| 11 | Eliminar producto con vales activos → debería ser soft-delete | sí |
| 12 | Distribuidora intenta crear vale para cliente de OTRA distribuidora | bloqueo |
| 13 | Cliente bloqueado → no puede recibir vale nuevo | bloqueo |
| 14 | Distribuidora MOROSA → no puede crear vale | bloqueo |
| 15 | Login con SESSION_DRIVER=database — verificar `sessions` table | sí |
| 16 | Logout invalida sesión en todas las ventanas | sí |
| 17 | Cambio de rol mientras logged → próxima request usa nuevo rol o sesión se invalida | a verificar |

---

## Bugs sospechosos detectados en exploración (verificar primero)

🔴 **BS-1** [`SucursalConfiguracionesSeeder.php:30-37`] define config para `SUC-TRC-SUR` que no existe → seeder lanza warn pero no se inserta. Decidir si remover o crear sucursal Sur.

🟡 **BS-2** [`RolesSeeder.php:62-69`] hay 2 entradas con código 'ADMIN' (la segunda se sobrescribe vía updateOrCreate). Define solo 6 roles únicos pero el seeder tiene 7 entradas — confusión.

🔴 **BS-3** CorteService NO está arrastrando el faltante al siguiente corte. Validar en Fase 10.

🟡 **BS-4** [Auditoría manual] muchas acciones críticas pueden NO estar registrando en `bitacora_auditorias`. Validar exhaustivo en Fase 17.

🟡 **BS-5** [Notificaciones — getMorphClass] inconsistencia entre `App\Models\User` y `App\Models\Usuario` puede provocar que algunos usuarios no vean sus propias notificaciones. Validar en Fase 20.2.

🟡 **BS-6** [Reset password] `expira_en` = 10 minutos puede ser muy corto si SMTP es lento. Si MAIL_DRIVER=log, el usuario lo encuentra pero en prod tiene riesgo.

⚪ **BS-7** [Documentos] uploads a DoSpaces pueden fallar silenciosamente y dejar paths null en `solicitudes` — validar comportamiento en Fase 4.

⚪ **BS-8** [SESSION_DRIVER] migración crea tabla `sessions` pero `.env` puede seguir en `file`. Confirmar driver vivo.

---

## Archivos críticos a revisar durante las pruebas

| Archivo | Razón |
|---|---|
| [routes/web.php](routes/web.php) | Mapa de rutas y middlewares |
| [app/Http/Middleware/RoleMiddleware.php](app/Http/Middleware/RoleMiddleware.php) | Filtrado por rol |
| [app/Http/Middleware/EnsureGerenteSecureAction.php](app/Http/Middleware/EnsureGerenteSecureAction.php) | Acciones sensibles del gerente |
| [app/Services/CorteService.php](app/Services/CorteService.php) | Lógica de cortes y arrastre — BS-3 |
| [app/Services/ServicioReglasNegocio.php](app/Services/ServicioReglasNegocio.php) | Cálculo de puntos y deuda |
| [app/Models/BitacoraAuditoria.php](app/Models/BitacoraAuditoria.php) | Constantes de tipos/módulos — BS-4 |
| [app/Models/Usuario.php](app/Models/Usuario.php) | Bug `getMorphClass` — BS-5 |
| [app/Http/Controllers/Cajera/ConciliacionController.php](app/Http/Controllers/Cajera/ConciliacionController.php) | Lógica de matcheo bancario |
| [app/Http/Controllers/Auth/AuthenticatedSessionController.php](app/Http/Controllers/Auth/AuthenticatedSessionController.php) | Login y validaciones |
| [app/Http/Controllers/PasswordAuthorizationController.php](app/Http/Controllers/PasswordAuthorizationController.php) | Reset password (NUEVO) |

---

## Entregables

1. **Bug log** (formato: `[severidad] [fase] [archivo:línea] descripción + repro`).
2. **Resumen ejecutivo** al final: cuántos bugs por severidad, áreas más rotas, recomendaciones de fix.
3. **Patches** para los bugs 🔴 críticos del módulo de **distribuidora** (no cajera, no auth — esos solo se reportan).

---

## Cómo arrancamos

Sugerencia de orden — **paramos entre fases** y tú pruebas:

1. **Fase 0** (preflight) — yo verifico .env y corro migrate:fresh+seed.
2. **Fase 1** (auth) — tú haces login con cada rol y reportas si alguno falla.
3. Continúo con Fase 2 (visualización) — yo navego cada pantalla, tú verificas en pantalla mientras hago las requests.
4. Y así sucesivamente.

Si en cualquier fase aparece un bug 🔴 que bloquea, paramos esa fase, lo discutimos, y tú decides si fix o continuar.
