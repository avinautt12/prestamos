# Flujo Completo del Sistema de Préstamos

## Diagrama General del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FASE 1: CREACIÓN DE VALE                                │
│                                                                                      │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │Distribuid│      │   Create Vale    │      │   BORRADOR   │      │ Dashboard │ │
│  │ crea     ─────► │  (Vales/Create)   │────► │    Vale      │      │   listo   │ │
│  │ cliente  │      │  cliente nuevo    │      │  NO descuenta │     │           │ │
│  └──────────┘      └──────────────────┘      │  crédito     │      └───────────┘ │
│                                              └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FASE 2: PREVALE (Cajera)                              │
│                                                                                      │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌─────────────┐│
│  │Cajera    │      │    Prevale      │      │   Muestra    │      │  Aprueba    ││
│  │revisa    ─────► │    Index        │────► │  docs cliente │────► │  (ACTIVO)   ││
│  │ docs     │      │  (lista boron) │      │  datos vale   │      │            ││
│  └──────────┘      └──────────────────┘      └──────────────┘      └─────────────┘│
│                                                                           │        │
│                                                                           ▼        │
│                                              ┌──────────────┐      ┌─────────────┐│
│                                              │ Cliente      │      │ Descuenta   ││
│                                              │ EN_VERIF →   │◄──── │ crédito     ││
│                                              │ ACTIVO       │      │ distribuidora││
│                                              └──────────────┘      └─────────────┘│
│                                                                           │        │
│                                                                           ▼        │
│                                              ┌──────────────┐      ┌─────────────┐│
│                                              │ Pivot        │      │ Egreso      ││
│                                              │ prevale_aprob│      │EmpresaSimul ││
│                                              │ = true       │      │ creado     ││
│                                              └──────────────┘      └─────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FASE 3: PAGO DEL CLIENTE (Distribuidora)                    │
│                                                                                      │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌─────────────┐│
│  │Cliente   │      │  Distribuidora   │      │  Registra    │      │  Vale       ││
│  │paga a    ─────► │  registra pago   │────► │  PagoCliente │────► │ actualiza   ││
│  │distribuid│      │  (Vales/Index)   │      │  EFECTIVO    │      │ saldo/pagos ││
│  └──────────┘      └──────────────────┘      └──────────────┘      └─────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FASE 4: CORTE Y RELACIONES (Admin)                          │
│                                                                                      │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌─────────────┐│
│  │Admin     │      │  Cortes         │      │  Genera      │      │ Relacion   ││
│  │cierra    ─────► │  (Gerente)       │────► │  Relaciones │────► │  Corte      ││
│  │corte     │      │  ejecuta corte   │      │  Partidas    │      │ GENERADA    ││
│  └──────────┘      └──────────────────┘      └──────────────┘      └─────────────┘│
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │ CÁLCULO DE RELACIÓN:                                                          │ │
│  │ • total_comision = suma de comisiones por quincena de cada vale              │ │
│  │ • total_pago = suma de montos quincenales de cada vale                      │ │
│  │ • total_recargos = recargos por atrasos de cortes anteriores                │ │
│  │ • total_a_pagar = total_comision + total_pago + total_recargos               │ │
│  │ • total_arrastre_recibido = saldo de relaciones anteriores (atraso)          │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    FASE 5: PAGO DE DISTRIBUIDORA A EMPRESA                          │
│                                                                                      │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌─────────────┐│
│  │Distribuid│      │  Estado Cuenta  │      │  Reportar    │      │  Pago       ││
│  │ ve       ─────► │  (relación       │────► │  pago        │────► │  Distribuid ││
│  │ relación│      │  pendiente)      │      │  (transfer)  │      │ REPORTADO   ││
│  └──────────┘      └──────────────────┘      └──────────────┘      └─────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FASE 6: CONCILIACIÓN                                         │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CONCILIACIÓN AUTOMÁTICA                                │ │
│  │                                                                               │ │
│  │  MovimientoBanco ─────► Busca relación por              ─────► CONCILIADA        │ │
│  │  (importado)        │  referencia_pago + monto_exacto  │                       │ │
│  │                    │  (conciliarAutoExacto)           │                       │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CONCILIACIÓN MANUAL                                   │ │
│  │                                                                               │ │
│  │  Cajera ─────► Selecciona ─────► Selecciona ─────► Aplica ─────► CONCILIADA     │ │
│  │              │ movimiento │    relación      │ estado    │                      │ │
│  │              │ bancario  │    corte         │ manual   │                       │ │
│  │              └────────────┴──────────────────┴───────────┘                       │ │
│  │                     (conciliarManual)                                          │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FASE 7: POST-CONCILIACIÓN                                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ DESPUÉS DE CONCILIAR (automática o manual):                                  │  │
│  │                                                                               │  │
│  │ 1. PagoDistribuidora ESTADO → CONCILIADO (o CON_DIFERENCIA)                   │  │
│  │ 2. Conciliacion registro creado                                               │  │
│  │ 3. RelacionCorte estado → PAGADA (si cubre total) o PARCIAL (si parcial)    │  │
│  │ 4. Partidas actualizadas (abonadas o pagadas)                                  │  │
│  │ 5. Crédito distribuidora RESTAURADO (= suma de montos principales de vales)   │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Resumen de Estados

### Cliente
```
EN_VERIFICACION ─────► ACTIVO (al aprobar prevale)
EN_VERIFICACION ─────► BLOQUEADO (al rechazar prevale)
```

### Vale
```
BORRADOR ─────► ACTIVO (al aprobar prevale en cajera)
BORRADOR ─────► CANCELADO (al rechazar prevale)
ACTIVO ─────► PAGO_PARCIAL (pago parcial registrado)
ACTIVO ─────► PAGADO (quincena cubierta)
ACTIVO ─────► MOROSO (atraso en pagos)
PAGO_PARCIAL ─► LIQUIDADO (saldo = 0)
PAGADO ─────► MOROSO (si hay incumplimiento en siguiente quincena)
```

### RelacionCorte
```
GENERADA ─────► PAGADA (pago conciliado cubre total)
GENERADA ─────► PARCIAL (pago conciliado parcial)
GENERADA ─────► VENCIDA (pasó fecha límite sin reporte)
PARCIAL ─────► VENCIDA (pasó fecha límite)
CERRADA ─────► (cerrada por arrastre al siguiente corte)
```

### PagoDistribuidora
```
REPORTADO ─────► CONCILIADO (conciliación exitosa)
REPORTADO ─────► CON_DIFERENCIA (monto no coincide exactamente)
REPORTADO ─────► RECHAZADO (conciliación manual rechazada)
DETECTADO ─────► (detectado por importación bancaria sin previo reporte)
```

## Puntos Clave del Flujo

### 1. Crédito de Distribuidora
- **Al crear BORRADOR**: NO se descuenta crédito
- **Al aprobar PREVALE**: SÍ descuenta crédito (línea 109 PrevaleController)
- **Al conciliar relación PAGADA**: RESTAURA crédito (líneas 957, 1026-1038 ConciliacionController)

### 2. Puntos de Fidelización
- Se generan con cada corte (líneas 407-418 CorteService)
- Se penalizan si hay recargos/atrasos (líneas 420-438 CorteService)
- Se canjean contra deuda de relaciones

### 3. Flujo de Partidas en Corte
- **Quincena 1**: incluye monto_principal en cálculo de puntos
- **Siguientes quincenas**: solo comisión + abono
- **Atrasos**: arrastran saldo anterior + recargos

## Posibles Bugs Detectados

### Bug 1: pagos_realizados += monto (Linea 998 ConciliacionController)
```
En aplicarDesgloseVales():
$vale->pagos_realizados += $montoAplicar;

❌ PROBLEMA: pagos_realizados es un CONTADOR de quincenas, no un ACUMULADOR de montos.
   Debería ser: $vale->pagos_realizados += 1; (por cada quincena cubierta)

⚠️ IMPACTO: Esto puede hacer que pagos_realizados tenga valores absurdos como 1500
   cuando el vale solo tiene 12 quincenas, arruinando los cálculos de corte.
```

### Bug 2: Validación de Crédito en Crear Vale
```
En DashboardController::guardarPreVale():
if (!(bool) $distribuidora->sin_limite && $montoPrincipal > (float) $distribuidora->credito_disponible) {
    return back()->withErrors(['general' => 'El monto fijo del producto supera el crédito disponible']);
}

⚠️ El crédito solo se descuenta cuando se APRUEBA el prevale, no al crear el BORRADOR.
   Pero el crédito ya está validado al crear... lo que significa que si alguien más
   también creó un pre-vale por el mismo monto antes, ambos pasarían la validación
   pero al aprobar ambos se descuenta el mismo crédito.
```

## Verificaciones Recomendadas

Para probar el flujo completo, realiza estos pasos en orden:

1. **DISTRIBUIDORA - Crear cliente nuevo**
   - Registrar datos personales, documentos, cuenta bancaria
   - Verificar que se crea con estado EN_VERIFICACION

2. **DISTRIBUIDORA - Crear pre-vale (BORRADOR)**
   - Seleccionar producto y cliente recién creado
   - Verificar que NO se descuenta crédito todavía

3. **CAJERA - Revisar y aprobar prevale**
   - Verificar docs del cliente
   - Aprobar y verificar:
     - Cliente pasa a ACTIVO
     - Crédito de distribuidora SE DESCUENTA
     - Vale pasa a ACTIVO
     - EgresoEmpresaSimulado creado

4. **DISTRIBUIDORA - Registrar pago del cliente**
   - Verificar que se crea PagoCliente
   - Verificar que vale actualiza saldo_actual y pagos_realizados

5. **ADMIN - Cerrar corte**
   - Ejecutar corte en管理器
   - Verificar que se genera RelacionCorte
   - Verificar que se generan PartidaRelacionCorte

6. **DISTRIBUIDORA - Reportar pago a empresa**
   - Verificar que se crea PagoDistribuidora REPORTADO

7. **CAJERA - Conciliar**
   - Automática: importar archivo banco → referencia y monto coinciden → CONCILIADO
   - Manual: seleccionar movimiento + relación + aplicar

8. **VERIFICAR POST-CONCILIACIÓN**
   - RelacionCorte estado = PAGADA
   - Crédito distribuidora RESTAURADO
   - Puntos actualizados según resultado del corte