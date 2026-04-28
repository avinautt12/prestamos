# Plan de pruebas — Arrastre de quincenas atrasadas en cortes

Documento de QA para validar la implementación de arrastre de quincenas atrasadas en cortes (Fases 1-6). Cada escenario tiene **setup**, **acción**, **resultado esperado** y **dónde verificar**.

---

## 0. Setup base (correr una vez)

```bash
php artisan migrate:fresh --seed
npm run dev   # en otra terminal
```

Credenciales (de `database/seeders/UsuariosSeeder.php`):
- **admin** / `password123` — global
- **gerente** / `password123` — sucursal
- **cajera** / `password123` — sucursal
- **distribuidora** / `password123` — distribuidora

`.env` debe tener:
```
RECAPTCHA_ENABLED=false
GERENTE_REQUIRE_VPN=false
```

**Cómo cerrar un corte manualmente:** entra como `gerente` → sidebar → "Cortes" → botón verde **"Cerrar corte ahora"** en el panel "Próximo corte".

**Cómo crear un vale:** entra como `distribuidora` → sidebar → "Vales" → "Nuevo vale" → seleccionar producto → cliente existente con prevale aprobado (ej. Luis Hernandez Peralta) → guardar.

**Cómo conciliar un pago:** entra como `cajera` → sidebar → "Conciliaciones" → upload de CSV o conciliación manual de un MovimientoBancario contra una RelacionCorte.

---

## 1. Suite básica (humo)

### T1.1 — `migrate:fresh --seed` corre limpio
- **Acción:** correr el comando
- **Esperado:** sin errores, sin warnings de SQL. Sale "Database seeding completed successfully."
- **Verificar:** `SHOW COLUMNS FROM partidas_relacion_corte` debe incluir `es_atraso`, `numero_quincena`, `quincenas_atrasadas_acumuladas`, `monto_pagado_previo`, `corte_origen_id`, `relacion_origen_id`. `SHOW COLUMNS FROM relaciones_corte` debe incluir `relacion_anterior_id`, `cerrada_por_arrastre_en`, `total_arrastre_recibido`.

### T1.2 — Login y navegación funcionan
- **Acción:** login con cada uno de los 4 roles
- **Esperado:** cada uno cae en su dashboard sin error. Ningún error de Service Worker en consola (DevTools).

### T1.3 — Crear vale para cliente existente con prevale aprobado
- **Acción:** entra como `distribuidora`, crea vale para Luis Hernandez Peralta con producto $15,000
- **Esperado:** mensaje "Vale VALE-XXX emitido exitosamente." Crédito disponible baja $15,000.
- **Verificar:** `SELECT estado, fecha_emision FROM vales WHERE numero_vale = 'VALE-XXX'` → estado = ACTIVO, fecha_emision = hoy.

### T1.4 — Estado de cuenta carga sin error
- **Acción:** entra como `distribuidora` → "Estado de cuenta"
- **Esperado:** se ve la lista de relaciones (puede estar vacía si nunca se ha cerrado un corte). No hay error 500.

---

## 2. Filtro de fecha de emisión (Fase 2)

### T2.1 — Vale recién emitido NO entra al corte inmediato
- **Setup:** sucursal con configuración de cortes activa. Necesitas ejecutar al menos un cierre previo para tener "corte anterior" (T2.0).
- **T2.0 (precondición):** entra como gerente → "Cortes" → cierra el próximo corte programado.
- **Acción:** crea un vale HOY como distribuidora. Vuelve como gerente y cierra el SIGUIENTE corte (debe aparecer otro programado automáticamente; espera unos segundos y refresca la página).
- **Esperado:** la nueva relación de corte para esta distribuidora **NO** incluye el vale recién creado.
- **Verificar:** SQL:
  ```sql
  SELECT v.numero_vale, p.es_atraso, p.numero_quincena
  FROM partidas_relacion_corte p
  JOIN vales v ON v.id = p.vale_id
  JOIN relaciones_corte r ON r.id = p.relacion_corte_id
  WHERE r.corte_id = (SELECT MAX(id) FROM cortes WHERE estado = 'EJECUTADO')
    AND v.numero_vale = 'VALE-XXX';
  ```
  No debe regresar filas.

### T2.2 — Vale antiguo SÍ entra al corte (regresión)
- **Setup:** un vale activo creado antes del corte anterior (los seedeados sirven)
- **Acción:** cierra un corte
- **Esperado:** el vale antiguo aparece como partida normal con `es_atraso = false`, `numero_quincena = vale.pagos_realizados + 1`.

### T2.3 — Primer corte de la sucursal incluye TODO
- **Setup:** `migrate:fresh --seed`. Sin cierres previos en la sucursal.
- **Acción:** entra como gerente y cierra el primer corte programado disponible.
- **Esperado:** se incluyen TODOS los vales activos, incluso los emitidos justo antes del corte. No aplica filtro de fecha.
- **Razón:** `obtenerCorteAnterior()` regresa null → el filtro `fecha_emision <` se omite.

---

## 3. Atrasos y arrastre (Fase 3)

### T3.1 — No pago = 1 quincena de atraso en el siguiente corte
- **Setup:** vale en ciclo con quincenas restantes ≥ 2 (para que tenga sentido el atraso). Cierra un corte que genere su primera partida normal Q1.
- **Acción:** NO pagas. Cierra el siguiente corte.
- **Esperado:**
  - La RelacionCorte anterior (Q1) ahora tiene `estado = CERRADA` y `cerrada_por_arrastre_en` con timestamp.
  - La nueva RelacionCorte tiene `relacion_anterior_id` apuntando a la cerrada.
  - La nueva RelacionCorte tiene `total_arrastre_recibido > 0`.
  - En la lista de partidas hay 2 entradas para el mismo vale: una `es_atraso = true` con `numero_quincena = 1` y `monto_recargo = 300` y otra `es_atraso = false` con `numero_quincena = 2`.
- **Verificar UI:** entra como distribuidora → estado de cuenta → abrir la relación → debe verse:
  - Banner amarillo: "⚠ Esta relación incluye saldo de cortes anteriores"
  - Una partida con badge rojo "ATRASO Q1"
  - Una partida con badge gris "Quincena 2/N"
- **Verificar SQL:**
  ```sql
  SELECT es_atraso, numero_quincena, quincenas_atrasadas_acumuladas, monto_recargo, monto_pago, monto_total_linea
  FROM partidas_relacion_corte
  WHERE relacion_corte_id = (SELECT id FROM relaciones_corte ORDER BY id DESC LIMIT 1);
  ```

### T3.2 — Dos cortes seguidos sin pagar
- **Setup:** vale en ciclo. Genera Q1, no pagas; Q2 con ATRASO Q1, no pagas; Q3 con ATRASO Q1, ATRASO Q2 + Q3.
- **Acción:** cierra 3 cortes seguidos sin pagar nada.
- **Esperado en el tercer corte:**
  - 3 partidas para el vale: ATRASO Q1 con `quincenas_atrasadas_acumuladas = 2` y recargo `$600`, ATRASO Q2 con acumuladas=1 y recargo $300, normal Q3.
  - Las 2 relaciones anteriores están CERRADA con `cerrada_por_arrastre_en`.

### T3.3 — Pago puntual del corte (regresión)
- **Setup:** relación nueva con saldo + ATRASO previo si aplica.
- **Acción:** pagas el monto exacto, conciliación queda PAGADA.
- **Esperado:**
  - `RelacionCorte.estado = PAGADA`
  - Todas las partidas tienen `monto_pagado_previo = monto_total_linea`
  - Crédito de la distribuidora se restaura en lo que corresponde
- **Verificar:** próximo cierre de corte NO genera partidas ATRASO para ese vale.

### T3.4 — Vale liquidado deja de aparecer en cortes
- **Setup:** vale con `pagos_realizados = quincenas_totales - 1`, paga la última quincena.
- **Acción:** se concilia la última, vale pasa a LIQUIDADO.
- **Esperado:** próximo corte NO genera partidas para ese vale (filtro `whereColumn pagos_realizados < quincenas_totales` lo excluye).

### T3.5 — Vale 4q con muchos cortes vencidos (tope `cuposDisponibles`)
- **Setup:** crea un vale con `quincenas_totales = 4`. Cierra 5 cortes seguidos sin pagar.
- **Acción:** cerrar el 6° corte.
- **Esperado:** la nueva relación tiene **máximo 4 partidas** (no 5 ni 6). Las primeras 4 partidas son ATRASO con `quincenas_atrasadas_acumuladas` creciente. La última partida ATRASO existente acumula recargo en cada cierre (sin generar partidas para Q5, Q6 que no existen en el vale).
- **Verificar:** `SELECT COUNT(*) FROM partidas_relacion_corte WHERE vale_id = X AND es_atraso = true` debe ser ≤ 4.

### T3.6 — Distribuidora sin vales pero con relación VENCIDA pendiente
- **Setup:** todos los vales de la distribuidora se liquidan independientemente, pero queda una RelacionCorte VENCIDA antigua sin pagar.
- **Acción:** cerrar nuevo corte.
- **Esperado:** la RelacionCorte VENCIDA se cierra (CERRADA + `cerrada_por_arrastre_en`). NO se crea nueva RelacionCorte porque no hay partidas que migrar (los vales ya están liquidados de otra forma).

### T3.7 — Idempotencia: cerrar corte 2 veces no duplica
- **Setup:** ya cerraste un corte y se generaron N relaciones.
- **Acción:** invocar manualmente `CorteService::generarRelacionesParaCorte($corte)` por segunda vez via tinker.
- **Esperado:** retorna 0 nuevas relaciones (todas las distribuidoras ya tienen relación para ese corte). NO se duplican partidas.
- **Verificar:** `SELECT corte_id, distribuidora_id, COUNT(*) FROM relaciones_corte GROUP BY 1,2 HAVING COUNT(*) > 1` debe estar vacío.

---

## 4. Pagos parciales y distribución de abonos (Fase 4)

### T4.1 — Pago parcial distribuye correctamente entre partidas
- **Setup:** RelacionCorte con 2 partidas: ATRASO Q1 ($1300 = $1000 saldo + $300 recargo) y normal Q2 ($1050 = $1000 + $50 comisión). Total = $2350.
- **Acción:** distribuidora reporta pago de $1500. Cajera concilia.
- **Esperado:**
  - `RelacionCorte.estado = PARCIAL`
  - ATRASO Q1: `monto_pagado_previo = 1300` (cubierta completa)
  - Normal Q2: `monto_pagado_previo = 200` (cubierta parcial)
  - El orden de aplicación es ATRASO primero (sortBy `es_atraso desc`)
- **Verificar:**
  ```sql
  SELECT es_atraso, numero_quincena, monto_total_linea, monto_pagado_previo
  FROM partidas_relacion_corte
  WHERE relacion_corte_id = X
  ORDER BY es_atraso DESC, numero_quincena ASC;
  ```

### T4.2 — Pago parcial → siguiente corte refleja el saldo
- **Setup:** continuación de T4.1. Cierra el siguiente corte.
- **Esperado:** la nueva RelacionCorte trae:
  - ATRASO Q2 (quincena que se quedó parcialmente pagada): `monto_pagado_previo = 200`, saldo a cobrar = `1000 - 200 = 800`, recargo = $300
  - Normal Q3 sin atraso

### T4.3 — Pago completo pone todas las partidas en pagado_previo = total
- **Setup:** RelacionCorte con cualquier desglose, total = $X
- **Acción:** pagar exactamente $X (o más con cierta tolerancia).
- **Esperado:**
  - `RelacionCorte.estado = PAGADA`
  - Todas las partidas tienen `monto_pagado_previo = monto_total_linea` (via `marcarPartidasComoPagadas`)

### T4.4 — Sobrepago se ignora correctamente
- **Setup:** total $1000, distribuidora paga $1100
- **Esperado:** RelacionCorte = PAGADA, todas las partidas con `monto_pagado_previo = monto_total_linea` (no se exceden los topes individuales).

---

## 5. UI distribuidora (Fase 5)

### T5.1 — Banner de arrastre visible
- **Setup:** RelacionCorte con `total_arrastre_recibido > 0`
- **Acción:** distribuidora abre el modal de detalle de esa relación
- **Esperado:** banner amarillo en la parte superior del modal: "⚠ Esta relación incluye saldo de cortes anteriores. Arrastre recibido: $X"

### T5.2 — Badge de partida ATRASO
- **Setup:** partida con `es_atraso = true`
- **Esperado en UI:**
  - Fondo del bloque rojo claro (`bg-red-50 border-red-200`)
  - Badge rojo: "ATRASO Q{n}"
  - Texto adicional: "del corte DD/MM/YYYY" (fecha del corte_origen)
  - Si `quincenas_atrasadas_acumuladas > 1`: texto "Recargo acumulado por X corte(s) vencido(s)"

### T5.3 — Badge de partida normal
- **Setup:** partida con `es_atraso = false`
- **Esperado:** badge gris "Quincena {n}/{total}"

### T5.4 — Indicador "PAGADA · ANTICIPADO"
- **Setup:** RelacionCorte con `estado = PAGADA` y conciliación dentro de la ventana `fecha_inicio_pago_anticipado` ↔ `fecha_fin_pago_anticipado`
- **Esperado:** etiqueta verde fuerte "✓ PAGADA · ANTICIPADO (dentro de la ventana de descuento)"

### T5.5 — Indicador "CERRADA · ARRASTRADA"
- **Setup:** RelacionCorte con `estado = CERRADA` y `cerrada_por_arrastre_en` no nulo
- **Esperado:** etiqueta gris "CERRADA · ARRASTRADA al siguiente corte"

### T5.6 — `monto_pagado_previo` visible en partidas con abono parcial
- **Setup:** partida con `monto_pagado_previo > 0`
- **Esperado:** texto pequeño debajo: "Ya abonado previamente: $X"

---

## 6. Hardening (Fase 6)

### T6.1 — Bitácora registra el cierre por arrastre
- **Setup:** ejecutar T3.1 (atraso simple)
- **Esperado:**
  ```sql
  SELECT * FROM bitacora_auditorias
  WHERE modulo = 'CORTE' AND descripcion LIKE '%cerrada por arrastre%'
  ORDER BY id DESC LIMIT 5;
  ```
  Debe haber al menos 1 registro con `datos_extra` JSON que incluya `relacion_corte_id`, `numero_relacion`, `estado_anterior`.

### T6.2 — Cron `DetectarDistribuidorasMorosas` sigue funcionando
- **Setup:** `migrate:fresh --seed`, cierra un corte, NO pagas, espera (o adelanta `fecha_limite_pago` por SQL).
- **Acción:** `php artisan app:detectar-distribuidoras-morosas`
- **Esperado:** la RelacionCorte abierta queda VENCIDA, distribuidora pasa a MOROSA y `puede_emitir_vales = false`.
- **Validación crítica:** las RelacionCorte CERRADA por arrastre **NO** deben ser marcadas VENCIDA (filtro `whereIn estado [GENERADA, PARCIAL]` las ignora).

### T6.3 — Doble penalización de morosidad NO ocurre
- **Setup:** distribuidora ya está MOROSA por un corte vencido. Otro corte se cierra y queda VENCIDA también.
- **Acción:** correr `app:detectar-distribuidoras-morosas`
- **Esperado:** la guarda `if (!$yaEraMorosa)` evita penalizar puntos 2 veces.

### T6.4 — RelacionCorte cerrada se carga en frontend con etiqueta "ARRASTRADA"
- **Setup:** lo mismo que T3.1
- **Acción:** distribuidora abre la relación CERRADA en su estado de cuenta
- **Esperado:** la etiqueta "CERRADA · ARRASTRADA al siguiente corte" se ve. La relación queda en lista pero claramente diferenciada.

---

## 7. Regresiones críticas (asegurar que NADA se rompió)

### T7.1 — Crear vale para cliente nuevo
- **Acción:** entra como distribuidora, "Cliente nuevo", llena todo el formulario con fotos y guarda.
- **Esperado:** vale en estado BORRADOR, cliente en EN_VERIFICACION, requiere prevale por cajera.

### T7.2 — Cajera aprueba prevale (camino existente)
- **Acción:** entra como cajera → Prevale → aprobar el vale del T7.1
- **Esperado:** vale pasa a ACTIVO, cliente a ACTIVO, crédito de la distribuidora baja.

### T7.3 — Reportar pago como distribuidora
- **Acción:** entra como distribuidora → estado de cuenta → reportar pago de una RelacionCorte abierta
- **Esperado:** se crea PagoDistribuidora en estado REPORTADO. Aparece en la lista "Pagos reportados" del modal.

### T7.4 — Conciliación manual (cajera)
- **Acción:** entra como cajera → Conciliaciones → conciliar manualmente un MovimientoBancario contra una RelacionCorte
- **Esperado:** conciliación creada, RelacionCorte cambia de estado, partidas se actualizan via `AbonoPartidasService` (NUEVO comportamiento).

### T7.5 — Calendario de cortes funciona
- **Acción:** entra como gerente → Cortes
- **Esperado:** calendario carga, próximo corte visible, botón "Cerrar corte ahora" aparece si hay corte PROGRAMADO.

### T7.6 — Reportes y auditorías cargan
- **Acción:** entra como admin → Reportes / Auditorías
- **Esperado:** sin errores 500. Los reportes pueden mostrar menos relaciones VENCIDAS (esperado, ahora se cierran al siguiente corte).

### T7.7 — Dashboard de cada rol carga
- **Acción:** smoke test de los 4 dashboards principales
- **Esperado:** sin errores en consola del navegador ni en `storage/logs/laravel.log`.

---

## 8. Checklist final antes de marcar como "listo"

- [ ] T1.1 a T1.4 (smoke)
- [ ] T2.1 a T2.3 (filtro fecha)
- [ ] T3.1 a T3.7 (atrasos y arrastre)
- [ ] T4.1 a T4.4 (pagos parciales)
- [ ] T5.1 a T5.6 (UI)
- [ ] T6.1 a T6.4 (hardening)
- [ ] T7.1 a T7.7 (regresiones)
- [ ] `php artisan test` pasa sin errores nuevos
- [ ] No hay errores nuevos en `storage/logs/laravel.log` durante las pruebas

---

## 9. Bugs encontrados durante desarrollo (ya arreglados)

1. **`Auth::id()` retornaba string en lugar de id numérico** porque `Usuario::getAuthIdentifierName()` devuelve `'nombre_usuario'`.
   - Fix aplicado en `Distribuidora/DashboardController.php:478,509`.
   - **PENDIENTE para el otro dev:** mismos arreglos en `Cajera/PrevaleController.php:152` y `Cajera/ConciliacionController.php:1315`.

2. **Service Worker se registraba en dev y rompía con assets viejos.**
   - Fix aplicado en `resources/js/app.jsx`: SW solo en producción + auto-unregister en desarrollo.

3. **No había botón en UI para cerrar corte manualmente.**
   - Agregado botón "Cerrar corte ahora" en `resources/js/Pages/Gerente/Cortes.jsx`.

---

## 10. Archivos tocados durante implementación

**Modificados:**
- `app/Services/CorteService.php` (algoritmo nuevo + 4 helpers + constante RECARGO_POR_ATRASO)
- `app/Models/PartidaRelacionCorte.php` (fillable, casts, relaciones, scopes)
- `app/Models/RelacionCorte.php` (fillable, casts, relaciones, helper)
- `app/Http/Controllers/Distribuidora/DashboardController.php` (transformarRelacion + helper conciliada anticipada + eager loading + 2 fixes Auth::id)
- `app/Http/Controllers/Cajera/ConciliacionController.php` (1 cambio mínimo: integrar AbonoPartidasService — coordinar con otro dev)
- `resources/js/Pages/Distribuidora/EstadoCuenta.jsx` (banner arrastre, badges atraso, etiquetas extras)
- `resources/js/Pages/Gerente/Cortes.jsx` (botón cerrar corte)
- `resources/js/app.jsx` (Service Worker condicional)

**Nuevos:**
- `database/migrations/2026_04_28_000001_add_arrastre_to_partidas_relacion_corte.php`
- `database/migrations/2026_04_28_000002_add_arrastre_to_relaciones_corte.php`
- `app/Services/AbonoPartidasService.php`
