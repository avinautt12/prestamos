# Plan: Módulo Distribuidora - Roadmap y Auditoría

## Context
Se revisó toda la documentación del proyecto (PRESTAMO FACIL.docx, Requerimientos técnicos, Escenario Cliente, Relación.pdf, Dudas y Respuestas) junto con el código actual. El objetivo es definir qué falta por implementar en el módulo distribuidora y corregir errores encontrados.

## Infraestructura (de la imagen)
- **Proxy** → Balanceador en San Francisco → 3 APP servers en NY → BD Master/Slave en Toronto
- VPN + SSH para acceso administrativo
- FWA/DO = 3 (3 firewalls/droplets)

---

## Estado actual del módulo Distribuidora

### Ya implementado
- Dashboard con estadísticas
- Listado de vales con filtros y modal de detalle
- Creación de pre vale con registro de cliente nuevo (BORRADOR)
- Vista de clientes (solo lectura)
- Vista de puntos (solo lectura)
- Vista de estado de cuenta (solo lectura)
- Layout responsive con sidebar reordenado
- Sistema de notificaciones broadcast (Pusher)

### Falta implementar (según documentación)

| # | Funcionalidad | Prioridad | Notas del documento |
|---|--------------|-----------|---------------------|
| 1 | **Pre vale para cliente existente** | ALTA | Si ya es cliente ligado, no registrar persona nueva, solo crear vale |
| 2 | **Cancelación de vale antes de ser transferido** | ALTA | "La distribuidora puede cancelar un vale antes de ser feriado" (Resp. 10) |
| 3 | **Vista de relación de corte** | ALTA | Según Relación.pdf: tabla con productos, clientes, pagos, comisiones, recargos. Referencia de pago única |
| 4 | **Notificaciones a distribuidora** | MEDIA | Vale feriado, corte listo, corte de puntos listo, límite de crédito autorizado/incrementado |
| 5 | **Cuenta bancaria del cliente en pre vale** | MEDIA | "En el proceso prevale se da de alta la cuenta bancaria" (Resp. 6) |
| 6 | **Pago anticipado (fechas)** | MEDIA | Relación.pdf muestra fechas de pago anticipado (3 días antes del límite) |
| 7 | **Redención de puntos** | BAJA | 1 punto = $2, se necesita endpoint y UI |
| 8 | **Restricción de familiares** | BAJA | "No se pueden prestar entre familiares" (Resp. 13). Proponer método de verificación |

---

## Bugs y errores encontrados en auditoría

### CRÍTICOS (corregir ya)

**1. PagoCliente relación invertida**
- `app/Models/PagoCliente.php:61` — `movimientoPunto()` usa `belongsTo` con IDs invertidos
- Actual: `return $this->belongsTo(MovimientoPunto::class, 'id', 'pago_cliente_id');`
- Correcto: `return $this->hasOne(MovimientoPunto::class, 'pago_cliente_id');`

**2. Hard-coded 'ACTIVA' en vez de constantes**
- `app/Http/Controllers/Distribuidora/DashboardController.php` — líneas 333, 392, 592, 948, 1033
- Distribuidora tiene `ESTADO_ACTIVA` pero no se usa en el controller

**3. Categoría null safety**
- `DashboardController.php:400` — Si la distribuidora no tiene categoría, el vale se crea con 0% comisión silenciosamente
- Debe bloquear emisión si no hay categoría asignada

### MEDIOS (corregir pronto)

**4. Falta try/catch en DB::transaction de guardarPreVale**
- Sin manejo de excepciones, errores de BD muestran 500 genérico

**5. Missing `actualizado_en` cast en varios modelos**
- PagoDistribuidora, PartidaRelacionCorte, MovimientoPunto, RelacionCorte

**6. Controller gigante (1200+ líneas)**
- `DashboardController.php` mezcla vales, clientes, puntos, estado de cuenta, etc.
- Refactorizar en: ValeController, ClienteController, PuntosController, EstadoCuentaController

### BAJOS (mejorar cuando se pueda)

**7. Sin cascade/restrict en foreign keys de migraciones**
**8. Sin soft deletes para auditoría**
**9. Números mágicos en cálculos financieros** (round(..., 2) repetido 20+ veces)
**10. Sin validación client-side de CURP, email** (solo server-side)

---

## Reglas de negocio confirmadas (de Respuestas.txt)

1. **Morosidad**: Reactivación es decisión del gerente basada en reportes (Resp. 1)
2. **Puntos**: Castigo del 20% se aplica al **total acumulado** (Resp. 2)
3. **Cada relación genera puntos** (Resp. 3)
4. **Solo sanciones para la distribuidora**, no otros roles (Resp. 5)
5. **Cuenta bancaria**: Se registra en el proceso de pre vale (Resp. 6)
6. **Transferencias**: Sin importar el día (Resp. 7)
7. **Empresa→Distribuidora**: Por transferencia. **Distribuidora→Cliente**: En efectivo ("lechugas") (Resp. 8)
8. **Nuevo vale**: Hasta que se hagan las conciliaciones puede pedir otro vale (Resp. 9)
9. **Cancelación**: La distribuidora puede cancelar un vale antes de ser transferido (Resp. 10)
10. **Cambio de comisión**: Afecta solo vales nuevos, los anteriores conservan su snapshot (Resp. 11)
11. **Sin monto mínimo** de abono (Resp. 12)
12. **Distribuidora externa**: Se puede prestar mientras no sea familiar (Resp. 13)
13. **Cobros**: Responsabilidad del coordinador (Resp. 14)
14. **Si se quiere ir**: Debe pagar todo (Resp. 16)
15. **Categoría**: Empieza en la más baja (Resp. 20)

---

## Plan de trabajo sugerido (módulo distribuidora)

### Fase 1 — Corrección de bugs (esta sesión)
1. Fix relación PagoCliente → MovimientoPunto
2. Usar constantes en vez de strings hard-coded
3. Agregar validación de categoría antes de emisión
4. Try/catch en guardarPreVale
5. Fix casts faltantes en modelos

### Fase 2 — Pre vale para cliente existente
- Permitir seleccionar cliente ya ligado a la distribuidora
- No crear persona/cliente nuevo, solo el vale
- Reutilizar la misma vista Create.jsx con toggle "Cliente nuevo" / "Cliente existente"

### Fase 3 — Cancelación de vale
- Endpoint POST `/distribuidora/vales/{id}/cancelar`
- Solo si estado es BORRADOR (antes de ser transferido)
- Actualizar estado a CANCELADO

### Fase 4 — Relación de corte (vista)
- Vista según Relación.pdf: tabla con productos, clientes, pagos realizados, comisiones, recargos
- Mostrar referencia de pago única, fechas de pago anticipado/límite
- Datos de cuentas bancarias de la empresa

### Fase 5 — Cuenta bancaria del cliente
- Agregar campo de cuenta bancaria en el formulario de pre vale
- Modelo CuentaBancaria ya existe, vincular al cliente

### Fase 6 — Notificaciones
- Integrar con sistema de broadcast existente (Pusher)
- Eventos: vale transferido, corte listo, puntos actualizados, crédito incrementado

---

## Verificación
- Cada fase se prueba en `/distribuidora/` antes de pasar a la siguiente
- Verificar en BD que los registros sean consistentes
- Probar edge cases: crédito insuficiente, cliente duplicado, categoría nula