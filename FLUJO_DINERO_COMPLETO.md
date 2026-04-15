# 🔄 FLUJO COMPLETO DEL DINERO EN SISTEMA DE PRÉSTAMOS

**Última actualización:** 15 de Abril de 2026  
**Estado del documento:** ANÁLISIS COMPLETO + INCONSISTENCIAS IDENTIFICADAS

---

## 📋 TABLA DE CONTENIDOS
1. [Flujo Principal: Cliente Obtiene Vale](#flujo-principal)
2. [Flujo Auxiliar: Control interno de cobro](#flujo-cliente-paga)
3. [Flujo de Corte (Procesamiento Periódico)](#flujo-corte)
4. [Flujo de Pago Distribuidora a Empresa](#flujo-pago-distribuidora)
5. [Flujo de Conciliación Bancaria](#flujo-conciliacion)
6. [Gestión de Fechas de Corte](#gestion-fechas-corte)
7. [Diagramas de Estados](#diagramas-estados)
8. [INCONSISTENCIAS DETECTED](#inconsistencias)
9. [Recomendaciones](#recomendaciones)

---

## 🚀 FLUJO PRINCIPAL: CLIENTE OBTIENE VALE {#flujo-principal}

### FASE 1: Creación del Vale (distribuidora.vales.store)

**Ubicación del código:** `app/Http/Controllers/Distribuidora/DashboardController.php` → `guardarPreVale()`

#### PASO 1: Validaciones Iniciales
```
Cliente → Distribuidora elige producto y cliente
  ✓ Distribuidora debe estar ACTIVA
  ✓ Distribuidora debe tener HABILITADA la emisión de vales
  ✓ Crédito disponible debe ser ≥ monto_principal del producto
  ✓ Si cliente existe: debe estar vínculado con estado_relacion='ACTIVA'
```

#### PASO 2: Decisión del Flujo (NUEVO: Prevale vs Vale Directo)
```
SI cliente es NUEVO:
  → requiere_prevale = TRUE
  → Vale se crea en estado BORRADOR (esperando aprobación de cajera)
  → Sin descuento de crédito

SI cliente es EXISTENTE:
  → Revisar pivot clientes_distribuidora.prevale_aprobado
  → SI prevale_aprobado = FALSE:
    → requiere_prevale = TRUE
    → Vale en BORRADOR (espera cajera)
  → SI prevale_aprobado = TRUE:
    → requiere_prevale = FALSE
    → Vale en ACTIVO (emitido directamente)
    → SE DESCUENTA CRÉDITO (importante!)
    → SE CREA EgresoEmpresaSimulado (transferencia simulada)
```

#### PASO 3: Cálculo de Montos
**Servicio:** `ProductoFinancieroService::calcularMontosDelProducto()`

```
INPUTS:
  - monto_principal (del producto)
  - porcentaje_comision_empresa (del producto)
  - monto_seguro (del producto)
  - porcentaje_interes_quincenal (del producto)
  - numero_quincenas (del producto)

FÓRMULAS (ServicioReglasNegocio):
  comision_empresa = monto_principal × (% / 100)              [APERTURA]
  interes_total    = monto_principal × (% / 100) × quincenas  [QUINCENAL × N]
  seguro           = monto_seguro (fijo por rango)

RESULTADO:
  total_deuda       = principal + comision + seguro + interes
  monto_quincenal   = total_deuda / quincenas_totales
  
EJEMPLO CON NÚMEROS:
  Principal:        $5,000
  Comisión (10%):   $500
  Seguro (tabla):   $100
  Interés (5% × 24 quincenas): $6,000
  ─────────────────────────────
  TOTAL DEUDA:      $11,600
  Quincenal:        $11,600 / 24 = $483.33 c/quincena

GANANCIA DISTRIBUIDORA (sobre principal):
  ganancia_dist = principal × porcentaje_categoria
  Ejemplo: $5,000 × 5% = $250
```

#### PASO 4: Almacenamiento del Vale
```
Modelo: app/Models/Vale.php

CAMPOS SNAPSHOTS (congelan valores en ese momento):
  ✓ numero_vale                       (único, formato: VALE-YYMMDDhhmmss-NNN)
  ✓ porcentaje_comision_empresa_snap  (decimal:4)
  ✓ monto_comision_empresa            (decimal:2)
  ✓ monto_seguro_snap                 (decimal:2)
  ✓ porcentaje_interes_snap           (decimal:4)
  ✓ monto_interes                     (decimal:2)
  ✓ porcentaje_ganancia_dist_snap     (decimal:4)
  ✓ monto_ganancia_distribuidora      (decimal:2)
  ✓ monto_multa_snap                  (decimal:2)
  ✓ monto_quincenal                   (decimal:2)
  ✓ quincenas_totales                 (int)
  ✓ monto_total_deuda                 (decimal:2)
  ✓ saldo_actual                      (decimal:2, se declina con pagos)

ESTADO:
  → Si requiere_prevale: estado = 'BORRADOR'
  → Si no requiere: estado = 'ACTIVO'

REFERENCIAS:
  ✓ numero_vale
  ✓ referencia_transferencia (para vale directo): INT-{numeroVale}-{timestamp}
  ✓ fecha_transferencia (solo para vale directo)
```

#### PASO 5: Lado Efectos (No Vale Directo / No Prevale)
```
SI vale_directo (requiere_prevale = FALSE):

A) DESCUENTO DE CRÉDITO
   distribuidora.credito_disponible -= monto_principal
   
B) EGRESO SIMULADO
   EgresoEmpresaSimulado::updateOrCreate()
   Campos:
     - vale_id
     - distribuidora_id
     - cliente_id
     - origen: 'VALE_FERIADO'
     - referencia_interna: INT-...
     - monto: monto_principal
     - fecha_operacion: now()
     
   Propósito: Registrar que la empresa "desembolsó" dinero al cliente
              (simulado porque en realidad es crédito de la distribuidora)
   
C) NOTIFICACIÓN
   DistribuidoraNotificationService::notificar()
   Tipo: 'VALE_FERIADO'
   Mensaje: Tu vale fue emitido y activado
```

---

## 💳 FLUJO CLIENTE PAGA {#flujo-cliente-paga}

### CONTEXTO ACTUAL
**Estado:** Flujo auxiliar de la distribuidora, fuera del core financiero de la empresa.

La empresa no necesita seguir este dinero en su flujo contable principal. Si se usa, debe ser solo para que la distribuidora lleve control interno de quién le pagó y marque estados locales como pagado, parcial o pendiente. No debe alimentar cortes, conciliación ni deuda empresa-distribuidora.

**Conclusión operativa:** este bloque no forma parte del flujo central de empresa y se documenta solo como referencia funcional de la distribuidora.

---

## 📊 FLUJO DE CORTE (Procesamiento Periódico) {#flujo-corte}

### Qué es un CORTE
Un **Corte** es un evento periódico que:
1. Se ejecuta en una **fecha programada** (ej: 15 de cada mes)
2. Genera un **resumen de deudas** por cada distribuidora
3. Crea **partidas** (line items) con lo que DEBE pagar cada distribuidora a la empresa

### Configuración
```
Tabla: sucursal_configuraciones
Campos relevantes:
  - dia_corte              (ej: 15)
  - plazo_pago_dias        (ej: 15, días para que pague)
  - formula_puntos_base    (ej: 1200, bloque de venta)
  - puntos_por_bloque      (ej: 3, puntos ganados)
```

Regla operativa:
- El día de corte es editable desde administración.
- El plazo de pago también es editable desde administración.
- La segunda fecha de corte se deriva automáticamente sumando 15 días a la primera.
- Los cambios de configuración se reflejan a partir del siguiente ciclo mensual.

### FASE 3: Programación de Corte
```
El sistema AUTO-SINCRONIZA cortes cada vez que se accede a dashboard:

CorteService::sincronizarProximoCorteProgramado()
  → Calcula próxima fecha programada
  → `updateOrCreate` con observaciones='AUTO_CONFIG_SUCURSAL'
  → Estado: 'PROGRAMADO'
  
Fechas:
  - fecha_programada: Calculada a partir de dia_corte
  - segundo_corte: fecha_programada + 15 días
  - hora_base: 18:00 (FIJA)
```

### FASE 4: Ejecución del Corte (Manual)
```
Acción: Cajera cierra manualmente el corte (o se auto-cierra en fecha)

CorteService::cerrarManual()
  estado: 'PROGRAMADO' → 'EJECUTADO'
  fecha_ejecucion: now()
```

### FASE 5: Generación de Relaciones
```
Trigger: DESPUÉS de ejecutar corte

CorteService::generarRelacionesParaCorte(Corte $corte)

Por cada distribuidora ACTIVA de la sucursal:

  1. SELECCIONAR VALES ABIERTOS
     Vale.estado IN ('ACTIVO', 'PAGO_PARCIAL', 'MOROSO')
     
  2. PARA CADA VALE, CALCULAR:
     - quincenas = max(1, vale.quincenas_totales)
     - comision_por_quincena = vale.monto_comision_empresa / quincenas
     - pago_quincenal = vale.monto_quincenal (ya calculado)
     - recargo = (vale.estado == MOROSO) ? vale.monto_multa_snap : 0
     - total_linea = comision + pago + recargo
     
  3. ACUMULAR POR DISTRIBUIDORA:
     - total_comision += comision_por_quincena
     - total_pago += pago_quincenal
     - total_recargos += recargo
     - total_a_pagar = total_comision + total_pago + total_recargos
     
  4. CREAR RelacionCorte
     Modelo: app/Models/RelacionCorte.php
     Tabla: relaciones_corte
     
     Campos principales:
       - corte_id
       - distribuidora_id
       - numero_relacion     (formato: REL-{sucursal}-{año}-{seq})
       - referencia_pago     (formato: {sucursal}{dist_id}{ymd})
       - fecha_limite_pago   = fecha_ejecucion + plazo_pago_dias
       - fecha_inicio_pago_anticipado = fecha_limite - 3 días
       - fecha_fin_pago_anticipado = fecha_limite - 1 día
       - total_comision      (empresa gana de los vales)
       - total_pago          (dinero que cliente owe, agregado)
       - total_recargos      (multas por atraso)
       - total_a_pagar       (lo que distribuidora DEBE pagar a empresa)
       - estado: 'GENERADA'
       
       SNAPSHOTS (congelan estado de distribuidora en ese momento):
       - limite_credito_snapshot
       - credito_disponible_snapshot
       - puntos_snapshot
     
  5. CREAR PartidaRelacionCorte (una por vale)
     Modelo: app/Models/PartidaRelacionCorte.php
     Tabla: partidas_relacion_corte
     
     Campos:
       - relacion_corte_id
       - vale_id
       - cliente_id
       - nombre_producto_snapshot
       - pagos_realizados
       - pagos_totales
       - monto_comision
       - monto_pago
       - monto_recargo
       - monto_total_linea
     
     Propósito: Detalle por cada vale incluido en el corte
```

**EJEMPLO NUMÉRICO:**

```
Corte ejecutado: 15/abril/2026
Plazo pago: 15 días
Fecha límite: 30/abril/2026

Distribuidora "Sofia" con 3 vales abiertos:
  Vale #1: ACTIVO   → comisión=$50, pago=$500, recargo=$0 → total=$550
  Vale #2: PAGO_PARCIAL → comisión=$30, pago=$300, recargo=$0 → total=$330
  Vale #3: MOROSO   → comisión=$20, pago=$200, recargo=$50 → total=$270

RELACION GENERADA:
  numero_relacion: REL-SUC-2026-001
  referencia_pago: SUC175242026-04-15  (sucursal+dist_id+fecha)
  total_comision: $100
  total_pago: $1,000
  total_recargos: $50
  total_a_pagar: $1,150  ← Lo que Sofia DEBE pagar a empresa
  estado: GENERADA
  fecha_limite_pago: 30/abril/2026
```

### CLASIFICACIÓN DE PAGOS
```
Pago anticipado:
  - Se reporta antes de la fecha límite.

Pago puntual:
  - Se reporta exactamente en la fecha límite.

Pago atrasado:
  - Se reporta después de la fecha límite.

Regla práctica:
  - Con dos cortes mensuales, cada quincena genera su propia relación y su propia fecha límite de 15 días.
```

---

## 💰 FLUJO DE PAGO DISTRIBUIDORA A EMPRESA {#flujo-pago-distribuidora}

### FASE 6: Distribuidora Reporta Pago
```
Acción: Distribuidora transferencia dinero a empresa y reporta

DashboardController::reportarPago()
  
Input:
  - relacion_corte_id
  - monto (lo que pagó)
  - metodo_pago ('TRANSFERENCIA' | 'DEPOSITO' | 'OTRO')
  - referencia_reportada (ej: folio bancario)
  - fecha_pago
  - observaciones

Validaciones:
  ✓ RelacionCorte.estado IN ('GENERADA', 'PARCIAL', 'VENCIDA')
  
Creación:
  PagoDistribuidora::create()
  
  Tabla: pagos_distribuidora
  Campos:
    - relacion_corte_id
    - distribuidora_id
    - cuenta_banco_empresa_id (null al crear, se llena en conciliación)
    - monto
    - metodo_pago
    - referencia_reportada
    - fecha_pago
    - estado: 'REPORTADO'
    - observaciones
    
ESTADO DEL PAGO:
  'REPORTADO'    → Distribuidora dijo que pagó, espera confirmación bancaria
  'DETECTADO'    → Cajera encontró el movimiento en movimientos_bancarios (matching parcial)
  'CONCILIADO'   → Banco confirmó, dinero en cuenta empresa
  'RECHAZADO'    → No coincidió o error
```

---

## 🔗 FLUJO DE CONCILIACIÓN BANCARIA {#flujo-conciliacion}

### Qué es CONCILIACIÓN
Es el proceso de **MATCHING** entre:
- PagoDistribuidora (lo que DICE haber pagado)
- MovimientoBancario (lo que REALMENTE vio el banco)

### FASE 7A: Importación de Archivo Bancario
```
Flujo: Cajera descarga archivo de banco (CSV/XLSX simulado o real)

ConciliacionController::simularArchivoBancario() o ::importar()

VENTANAS DE CORTE (REGLAS DE CHARLY):
  
  Día de corte = 15 (ejemplo)
  
  VENTANA PRINCIPAL: 15, 16, 17 (3 días después de corte)
    → Excel incluye pagos con fecha <= 15
  
  VENTANA TARDIOS: día 20 (corte + 5)
    → Excel incluye pagos de 16 al 20
  
  FUERA DE VENTANA: otros días
    → Cajera NO PUEDE descargar nada

ARCHIVO BANCARIO ESPERADO:
  Columnas: referencia, folio, monto, fecha, hora, tipo_pago, nombre_pagador, concepto
  
  Ejemplo:
    referencia     | folio        | monto   | fecha      | hora     | tipo_pago     | nombre_pagador | concepto
    SUC175242026-04-15 | SIM-001  | 1150.00 | 2026-04-16 | 10:30:00 | TRANSFERENCIA | Sofia Jimenez  | Pago relacion
```

### FASE 7B: Creación de Movimientos Bancarios
```
ConciliacionController::importar()

Por cada fila en archivo:

  1. PARSEAR Y VALIDAR
     - referencia (obligatorio)
     - fecha (obligatorio)
     - monto (obligatorio)
     - Validar no sean duplicados
     
  2. CREAR MovimientoBancario
     Tabla: movimientos_bancarios
     
     Campos:
       - cuenta_banco_empresa_id (null)
       - referencia
       - fecha_movimiento
       - hora_movimiento
       - monto
       - tipo_movimiento
       - folio
       - nombre_pagador
       - concepto_raw
       - creado_en
     
  3. LÓGICA DE CONCILIACIÓN AUTOMÁTICA
     conciliarAutomaticoExacto():
       → SI existe PagoDistribuidora con:
         - referencia_reportada == movimiento.referencia
         - monto == movimiento.monto
         → ENTONCES: Conciliar automáticamente
       
       Result: 'CONCILIADA_AUTOMATICA'
       else: 'PENDIENTE_MANUAL'

Resultado final:
  - Conciliadas automáticas: N
  - Pendientes de revisión manual: N
  - Duplicadas (rechazo): N
  - Inválidas: N
```

### FASE 7C: Conciliación Manual
```
ConciliacionController::conciliarManual()

Cajera evalúa:
  - ¿Coinciden referencia + monto?
  - ¿Hay diferencia de centavos?
  
Input:
  - movimiento_bancario_id
  - relacion_corte_id
  - estado ('CONCILIADA' | 'CON_DIFERENCIA' | 'RECHAZADA')
  - observaciones

Lógica:
  diferencia = movimiento.monto - relacion.total_a_pagar
  
  SI estado == 'CONCILIADA' && abs(diferencia) > 0.01:
    → Auto-cambiar a: 'CON_DIFERENCIA'
  
  Crear:
    - PagoDistribuidora (si no fue reportado antes, crea con estado='CONCILIADO')
    - Conciliacion::create()
  
  Campos Conciliacion:
    - pago_distribuidora_id
    - movimiento_bancario_id
    - conciliado_por_usuario_id (FK)
    - conciliado_en (timestamp)
    - monto_conciliado
    - diferencia_monto
    - estado
    - observaciones

RESULTADO FINAL:
  ✓ Conciliacion::ESTADO_CONCILIADA    → Todo OK
  ✓ Conciliacion::ESTADO_CON_DIFERENCIA → Hay $ de diferencia
  ✓ Conciliacion::ESTADO_RECHAZADA     → Error (no coincide)
  
PROPÓSITO: Registrar PRUEBA de que dinero llegó a empresa
```

---

## 📅 GESTIÓN DE FECHAS DE CORTE {#gestion-fechas-corte}

### Timeline de un Corte Completo
```
T0: 15/abril (día de corte)
    ✓ Corte.fecha_programada = 15/abril/2026 18:00

T0 (ejecución manual):
    ✓ Corte.estado = 'EJECUTADO'
    ✓ Corte.fecha_ejecucion = now() (date puede ser diferente, pero se usa como referencia)
    
T0 + 0 a 2 días (15-17 abril):
    VENTANA PRINCIPAL DE CORTE
    ✓ Distribuidoras PUEDEN pagar
    ✓ Pueden REPORTAR PagoDistribuidora
    ✓ Cajera PUEDE descargar archivo bancario
    
T0 + 5 días (20 abril):
    VENTANA DE TARDIOS
    ✓ Distribuidoras que no pagaron pueden reportar ahora
    ✓ Cajera puede descargar archivo con pagos retroactivos
    
T0 + 15 días (30 abril):
    FECHA LÍMITE DE PAGO
    ✓ RelacionCorte.fecha_limite_pago
    ✓ Después de esto: estado = 'VENCIDA'
    
T0 + 12-14 días (27-29 abril):
    PAGO ANTICIPADO (3 días antes del límite)
    ✓ Si pagan antes: descuento puede aplicarse (IMPLEMENTAR)
    ✓ Rango: fecha_inicio_pago_anticipado a fecha_fin_pago_anticipado
```

### Estados de RelacionCorte
```
'GENERADA'   → Acabada de crear, distribuidora debe pagar
'PAGADA'     → Todo el total_a_pagar fue pagado
'PARCIAL'    → Se pagó parte, falta más
'VENCIDA'    → Pasó fecha límite sin pagar
'CERRADA'    → Auditada y archivada
```

---

## 📊 DIAGRAMAS DE ESTADOS {#diagramas-estados}

### Estado del Vale (Máquina de Estados)
```
                  ┌─────────────────────────────┐
                  │      NUEVA SOLICITUD        │
                  └──────────────┬──────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ ¿Cliente es nuevo?     │
                    └────────────┬────────────┘
                         │           │
                    SÍ   │           │   NO
                         │           │
            ┌────────────┴─┐  ┌──────┴─────────────┐
            │              │  │ ¿prevale_aprobado?│
            ▼              │  │                    │
     ┌────────────┐        │  └──────┬──────────┬──┘
     │  BORRADOR  │        │      SÍ  │   NO    │
     └──────┬─────┘        │         │         │
            │              │         │         │
            │ (cajera      │         │         │
            │  aprueba)    │    ┌────▼──┐  ┌──▼────┐
            │              │    │ACTIVO │  │BORRADOR│
            │              ▼    │(direc)│  │        │
            │        ┌──────────┴──────┐   │(prevale)
            │        │    (rechaza)    │   │        │
            │        └─────────────────┘   │        │
            │                              │        │
            ├──────────────────────────────┼────────┤
            │                              │        │
            ▼                              ▼        ▼
     ┌─────────────┐               ┌─────────────────┐
     │   ACTIVO    │◄──────────────┤ (Misma situación)
     │ (aprobado)  │               └─────────────────┘
     └──────┬──────┘
            │
     ┌──────┴────────┐
     │ (cliente paga)│
     ▼               ▼
PAGO_PARCIAL     PAGADO
     │               │
     └───────┬───────┘
             │
        ┌────┴────────────┐
        │ (atrasa pago)   │
        ▼
      MOROSO
        │
        └──────────────────────┘  (sigue en ciclo de cortes)

TERMINAL STATES:
  - PAGADO (saldo_actual = 0)
  - CANCELADO (anulación)
  - REVERSADO (error/reclamación)
  - RECLAMADO (disputa)
```

### Estado de RelacionCorte
```
┌────────────┐
│ GENERADA   │  (acabada de crear)
└──────┬─────┘
       │ (distribuidora paga parcialmente)
       ▼
   PARCIAL
       │
       │ (distribuidora completa pago)
       ├─────────────────────────┐
       │                         │
       ▼                    ┌────▼────┴────┐
    PAGADA │                 (pasa límite)   │
       │   └─────────────────────────────────┤
       │                  ┌──────────────────┘
       │                  ▼
       │              VENCIDA
       │                  │
       │                  │ (paga después?
       │                  │  o auditoría)
       │                  │
       └──────────┬───────┘
                  │
                  ▼
              CERRADA
```

### Estado de Conciliación (Transversal)
```
MovimientoBancario + PagoDistribuidora  =  Conciliacion

Flowchart:
  MovimientoBancario
       ↓
  (import from banco)
       ↓
  Pendiente de matching
       ↓
  ┌─────┴──────────────┐
  │ Automático?        │
  └─────┬───────────┬──┘
    SÍ  │           │  NO
        │           │
        ▼           ▼
   CONCILIADA  (Manual review)
        │           │
        ├─┬─────────┘
        │ │
        │ ├─ ¿Dinero correcto?
        │ │   SÍ: CONCILIADA
        │ │   NO: CON_DIFERENCIA
        │ │  ERROR: RECHAZADA
        │ │
        ▼ ▼
   Entrada en Conciliacion
   (prueba de dinero recibido)
```

---

## 🚨 INCONSISTENCIAS DETECTED {#inconsistencias}

### INCONSISTENCIA #1: **Descuento de Crédito Solo en Vale Directo**
**Severidad:** 🔴 CRÍTICA

**Descripción:**
```
Línea 507 en DashboardController:
  if (!$requierePrevale) {
    $distribuidora->decrement('credito_disponible', $montoPrincipal);
```

**Problema:**
  - Cuando se crea un PREVALE (BORRADOR), NO se descuenta crédito
  - Distribuidora puede crear múltiples PREVALES que superan su crédito
  - Descuento ocurre DESPUÉS de aprobación de cajera
  
**Escenario de Riesgo:**
```
Distribuidora "Sofia" tiene: $10,000 crédito disponible

Day 1: Crea PREVALE #1 por $5,000 (BORRADOR, 0 descuento)
       Cédito: $10,000 ✗ DEBERÍA SER $5,000

Day 1: Crea PREVALE #2 por $6,000 (BORRADOR, 0 descuento)
       Crédito: $10,000 ✗ DEBERÍA SER $4,000

Day 2: Cajera aprueba PREVALE #1
       → Vale pasa a ACTIVO, descuento = $5,000
       Crédito: $5,000 ✓ OK

Day 2: Cajera aprueba PREVALE #2
       → Vale pasa a ACTIVO, descuento = $6,000
       Crédito: -$1,000 ✗ NEGATIVO (PROBLEMA!)
```

**Recomendación:**
```
OPCIÓN A: Reservar crédito al crear PREVALE
  distribuidora->decrement('credito_disponible', $montoPrincipal)
  en guardarPreVale() para ambos flujos

OPCIÓN B: Usar campo separado: credito_reservado
  Al crear PREVALE: credito_reservado += monto
  Al aprobar PREVALE: credito_reservado -= monto (ya descontado)
  Al rechazar PREVALE: credito_reservado -= monto

OPCIÓN C: Validar en guardarPreVale()
  if ($requierePrevale) {
    // Sumar prevales pendientes
    $prevalesPendientes = Vale::where('estado', 'BORRADOR')...->sum('monto')
    $creditoEfectivo = credito_disponible - prevalesPendientes
    if ($monto > creditoEfectivo) throw exception
  }
```

---

### INCONSISTENCIA #2: **Vinculos Entre Tablas Inconsistentes**
**Severidad:** 🟡 MEDIA

**Ubicación:**
```
Tabla: Egresos Empresa Simulados
Relación: ONE-TO-ONE con Vale (unique vale_id)
Problema: Se crea SOLO para vale directo
```

**Descripción:**
```
EgresoEmpresaSimulado se crea SOLO cuando:
  requiere_prevale = FALSE
  
Significa:
  - Vale PREVALE (BORRADOR): NO tiene EgresoEmpresaSimulado
  - Vale DIRECTO (ACTIVO): SÍ tiene EgresoEmpresaSimulado
  
Propósito del EgresoEmpresaSimulado:
  "Transferencia simulada de dinero de empresa a cliente"
  
PERO: ¿Qué pasa cuando PREVALE se aprueba? ¿Se crea EgresoEmpresaSimulado entonces?
```

**Búsqueda en código:**
```
grep -r "EgresoEmpresaSimulado" en PrevaleController.php
→ RESULTADO: 0 coincidencias

Significa: Cuando Cajera aprueba un PREVALE y cambia a ACTIVO,
          NO se crea EgresoEmpresaSimulado
```

**Recomendación:**
```
En PrevaleController::aprobar() agregar:

if ($vale->estado == Vale::ESTADO_BORRADOR) {
  // Cambiar a ACTIVO
  $vale->estado = Vale::ESTADO_ACTIVO;
  
  // CREAR EgresoEmpresaSimulado AHORA
  EgresoEmpresaSimulado::updateOrCreate(
    ['vale_id' => $vale->id],
    [
      'distribuidora_id' => $vale->distribuidora_id,
      'cliente_id' => $vale->cliente_id,
      'origen' => 'VALE_PREVALE_APROBADO',
      'referencia_interna' => 'INT-PREVALE-' . $vale->numero_vale,
      'monto' => $vale->monto,
      'fecha_operacion' => now(),
    ]
  );
  
  // Descuento crédito AQUÍ
  $vale->distribuidora()->decrement('credito_disponible', $vale->monto);
}
```

---

### INCONSISTENCIA #3: **PagoCliente Nunca Se Crea (UI Inexistente)**
**Severidad:** 🟣 BLOQUEADOR

**Descripción:**
```
Tabla: pagos_cliente
Registros esperados: N (un pago por quincena de cliente)
Registros reales: SOLO en seeder (para testing)

Controlador: NO EXISTE
  app/Http/Controllers/Cajera/CobroController.php ✗
  app/Http/Controllers/Distribuidora/CobroController.php ✗

Vista: EXISTE pero vacía
  resources/js/Pages/Cajera/Cobros.jsx
  resources/js/Pages/Cajera/Cobranza/Index.jsx
```

**Flujo que FALTA:**
```
1. Cliente llega con dinero para pagar
2. Distribuidora registra: PagoCliente::create()
3. Sistema actualiza:
   - Vale.pagos_realizados++
   - Vale.saldo_actual -= monto
   - Vale.estado (PAGADO | PAGO_PARCIAL | ACTIVO)
4. Genera: MovimientoPunto (si aplica)
5. Verifica: ¿Cliente en atraso?
```

**Recomendación:**
```
CREAR: CobroController (distribuidora/cajera)

public function registrarPago(RegistrarPagoRequest $request) {
  $vale = Vale::findOrFail($request->vale_id);
  
  // Validar vale está ACTIVO
  if (!in_array($vale->estado, [ACTIVO, PAGO_PARCIAL, MOROSO])) {
    throw new Exception('Vale no está en estado pago');
  }
  
  // Validar monto
  if ($request->monto <= 0 || $request->monto > $vale->saldo_actual) {
    throw new Exception('Monto inválido');
  }
  
  DB::transaction(function() {
    // Registrar pago
    $pago = PagoCliente::create([
      'vale_id' => $vale->id,
      'cliente_id' => $vale->cliente_id,
      'distribuidora_id' => $vale->distribuidora_id,
      'fecha_pago' => now(),
      'monto' => $request->monto,
      'metodo_pago' => $request->metodo_pago,
      'es_parcial' => $request->monto < $vale->saldo_actual,
      'afecta_puntos' => true,
      'cobrado_por_usuario_id' => auth()->id(),
    ]);
    
    // Actualizar vale
    $vale->pagos_realizados++;
    $vale->saldo_actual -= $request->monto;
    
    if ($vale->saldo_actual == 0) {
      $vale->estado = Vale::ESTADO_PAGADO;
    } elseif ($vale->estado != Vale::ESTADO_MOROSO) {
      $vale->estado = Vale::ESTADO_PAGO_PARCIAL;
    }
    
    $vale->save();
    
    // Generar movimiento de puntos si corresponde
    if ($request->metodo_pago == PagoCliente::METODO_EFECTIVO && $pago->afecta_puntos) {
      MovimientoPunto::create([
        'distribuidora_id' => $vale->distribuidora_id,
        'vale_id' => $vale->id,
        'pago_cliente_id' => $pago->id,
        'tipo_movimiento' => 'GANADO_PUNTUAL',
        'puntos' => calcularPuntosDelPago($request->monto),
      ]);
    }
  });
}
```

---

### INCONSISTENCIA #4: **Lógica de MOROSO No Implementada**
**Severidad:** 🟡 MEDIA

**Descripción:**
```
Base de datos: Vale.estado = 'MOROSO' (existe)
Sistema: ¿Cuándo CAMBIA a MOROSO?

Búsqueda en código:
  WHERE estado = 'MOROSO' ✓ Encontrado (en corte)
  estado = 'MOROSO' (asignación) ✗ NO ENCONTRADO

Significa:
  - Vale puede estar en MOROSO por seeder o manual
  - NUNCA se auto-transiciona a MOROSO cuando pasa fecha límite
  - No hay job/cron que marque como moroso
```

**Recomendación:**
```
Crear comando: php artisan app:detectar-vales-morosos

Lógica:
  UPDATE vales 
  SET estado = 'MOROSO'
  WHERE estado IN ('ACTIVO', 'PAGO_PARCIAL')
    AND fecha_limite_pago < NOW()
    AND saldo_actual > 0

Ejecutar: Daily (scheduled en Kernel.php)

Scheduler:
  $schedule->command('app:detectar-vales-morosos')
    ->daily()
    ->at('06:00'); // 6 AM todos los días
```

---

### INCONSISTENCIA #5: **Campos de Monto en PagoDistribuidora No Validados**
**Severidad:** 🟠 MEDIA-ALTA

**Descripción:**
```
Línea 675 en DashboardController:
  PagoDistribuidora::create([
    'monto' => round((float) $request->monto, 2),
    ...
  ]);

¿Validaciones?
  - ✓ monto > 0 (request validation)
  - ✓ monto <= total_a_pagar (AUSENTE)
  - ✓ NO SE PUEDE SUPERAR EL TOTAL (RIESGO!)

Ejemplo de Problema:
  RelacionCorte.total_a_pagar = $1,150
  Distribuidora reporta pago de $2,000 (error, o fraude)
  → Sistema acepta
  → Conciliación crea Conciliacion con estado='CON_DIFERENCIA'
  → Falta lógica de rechazo automático
```

**Recomendación:**
```
En DashboardController::reportarPago():

$monto = round((float) $request->monto, 2);

// Validar monto
$totalYaPagado = PagoDistribuidora::where('relacion_corte_id', $relacion->id)
  ->whereIn('estado', ['REPORTADO', 'DETECTADO', 'CONCILIADO'])
  ->sum('monto');

$montoDisponible = $relacion->total_a_pagar - $totalYaPagado;

if ($monto > $montoDisponible) {
  throw new Exception(
    "Monto excede lo adeudado. Total: {$relacion->total_a_pagar}, " .
    "Ya pagado: {$totalYaPagado}, Disponible: {$montoDisponible}"
  );
}

// Luego crear pago
PagoDistribuidora::create([...
```

---

### INCONSISTENCIA #6: **Diferencia de Centavos en Conciliación Sin Protocolo**
**Severidad:** 🟡 MEDIA

**Descripción:**
```
Línea 1157 en ConciliacionController:
  if ($estadoConciliacion === Conciliacion::ESTADO_CONCILIADA && abs($diferencia) > 0.009) {
    $estadoConciliacion = Conciliacion::ESTADO_CON_DIFERENCIA;
  }

Umbral: 0.009 (menos de 1 centavo)

¿Problemas?
  - Tolerancia arbitraria (0.009)
  - No hay registro de CUÁNDO ocurrieron diferencias
  - No hay auditoría de quién permitió diferencia
  - No hay reversión automática
```

**Recomendación:**
```
Crear tabla: conciliacion_diferencias
Campos:
  - conciliacion_id (FK)
  - diferencia_monto (decimal:2)
  - razon_diferencia (enum: 'REDONDEO', 'COMISION_BANCO', 'OTRO')
  - autorizado_por_usuario_id
  - autorizado_en
  - aprobado_en_auditoria (nullable)

Lógica mejorada:
  if (abs($diferencia) > 0) {
    ConciliacionDiferencia::create([
      'conciliacion_id' => $conciliacion->id,
      'diferencia_monto' => $diferencia,
      'razon_diferencia' => $request->razon_diferencia,
      'autorizado_por_usuario_id' => auth()->id(),
      'autorizado_en' => now(),
    ]);
  }
```

---

### INCONSISTENCIA #7: **Ventanas de Corte Calculadas Solo para Primer Sucursal**
**Severidad:** 🟠 MEDIA

**Ubicación:** [ConciliacionController.php](ConciliacionController.php#L1175)

```php
private function calcularEstadoVentanaCorte(): array {
  $sucursal = Sucursal::first(); // ✗ SOLO LA PRIMERA!
```

**Problema:**
  - Sistema multi-sucursal
  - Pero ventana se calcula para sucursal #1 siempre
  - Distribuidoras de otras sucursales reciben mensaje incorrecto

**Recomendación:**
```
$sucursal = auth()->user()->sucursales()->first();
// O si es cajera:
$sucursal = auth()->user()->sucursal;
```

---

### INCONSISTENCIA #8: **Sin Validación del Rango EgresoEmpresaSimulado**
**Severidad:** 🟠 MEDIA

**Descripción:**
```
EgresoEmpresaSimulado.monto siempre = Vale.monto (principal)

¿Qué pasa si:
  - Cliente realiza pago parcial?
  - Vale se cancela a mitad del period?
  - Vale se reversa?
  
RESPUESTA: No hay ajuste a EgresoEmpresaSimulado
           Es como si empresa "desembolsó" $5,000
           pero cliente solo recibió $2,500 (2 quincenas)
```

**Recomendación:**
```
Crear reversión de EgresoEmpresaSimulado si:
  - Vale.estado = CANCELADO
  - Vale.estado = REVERSADO
  - PagoCliente cubre el 100%

EgresoEmpresaSimulado.reverso_en (nullable)
EgresoEmpresaSimulado.reverso_por_usuario_id (nullable)
```

---

## 💡 RECOMENDACIONES FINALES {#recomendaciones}

### PRIORITARIO (SEMANA 1)

1. **Implementar Cobros (PagoCliente UI + Controller)**
   - Crear formulario para registrar pagos de clientes
   - Actualizar estado del vale
   - Generar puntos

2. **Arreglar Descuento de Crédito para Prevales**
   - Decisión: Reservar crédito al crear (Opción B recomendada)
   - Agregar campo: credito_reservado
   - Actualizar PrevaleController + DashboardController

3. **Validación de Montos en Conciliación**
   - No permitir PagoDistribuidora > total_a_pagar

### IMPORTANTE (SEMANA 2)

4. **Crear EgresoEmpresaSimulado en Aprobación de Prevale**
   - Trigger: PrevaleController::aprobar()
   - Descuento crédito en ese momento

5. **Implementar Detección Automática de Morosos**
   - Artisan command
   - Daily scheduler
   - Events/notifications

6. **Auditoría de Diferencias de Conciliación**
   - Tabla conciliacion_diferencias
   - Protocolo de autorización
   - Reporte mensual

### MEJORA (SEMANA 3)

7. **Validación de Usuario en Ventana de Corte**
   - Detectar sucursal del usuario logueado
   - No hardcodear Sucursal::first()

8. **Reversiones de EgresoEmpresaSimulado**
   - Cuando vale se cancela/reversa
   - Audit trail

---

## 📝 EJEMPLO COMPLETO: Un Cliente Toma un Vale y Paga (Escenario Integrado)

```
=== DÍA 1: CLIENTE NUEVO ===

ACTOR: Distribuidora "Sofia" crea prevale para Cliente Nuevo

INPUT:
  - Producto: "Producto Base" ($5,000 principal)
  - Cliente: "Juan Pérez" (NUEVO)
  - Categoría: 5% comisión

CÁLCULOS:
  Principal: $5,000
  Comisión: $500 (10% config)
  Seguro: $100 (tabla)
  Interés: $6,000 (5% × 24 quincenas)
  TOTAL DEUDA: $11,600
  Quincenal: $483.33

ACCIÓN: guardarPreVale()
  ✓ Crea Persona + Cliente + vínculo
  ✓ Crea Vale en BORRADOR
  ✓ NO descuenta crédito
  ✓ NO crea EgresoEmpresaSimulado
  ✓ Notifica: "PREVALE_CREADO"

BD RESULTADOS:
  vales: 1 registro BORRADOR
  clientes: 1 nuevo
  personas: 1 nuevo
  clientes_distribuidora: 1 ACTIVA, prevale_aprobado=false
  egresos_empresa_simulados: 0 registros
  distribuidora.credito_disponible: $10,000 (sin cambios)

---

=== DÍA 2: CAJERA APRUEBA ===

ACTOR: Cajera revisa KYC y APRUEBA

ACCIÓN: PrevaleController::aprobar()
  ✓ Validaciones pasan
  ✓ Vale BORRADOR → ACTIVO
  ✓ update clientes_distribuidora SET prevale_aprobado=true
  ✗ FALTA: Descuento de crédito
  ✗ FALTA: EgresoEmpresaSimulado
  ✓ Notifica: "PREVALE_APROBADO"

BD RESULTADOS:
  vales: mismo, pero estado=ACTIVO (BUG: sin EgresoEmpresaSimulado)
  clientes_distribuidora.prevale_aprobado: true
  distribuidora.credito_disponible: $10,000 (DEBERÍA SER $5,000)

---

=== DÍA 3-15: CLIENTE PAGA ===

ACTOR: Cliente llega con efectivo para primera quincena

INPUT:
  - Pago: $483.33 (primera quincena)
  - Método: EFECTIVO

ACCIÓN: CobroController::registrarPago() [FALTA IMPLEMENTAR]
  ✓ Crea PagoCliente
  ✓ Vale.pagos_realizados = 1
  ✓ Vale.saldo_actual = $11,600 - $483.33 = $11,116.67
  ✓ Vale.estado = PAGO_PARCIAL
  ✓ Crea MovimientoPunto: 0 puntos (comisión menor)
  ✓ Notifica: "PAGO_REGISTRADO"

BD RESULTADOS:
  pagos_cliente: 1 registro
  movimientos_puntos: 1 registro (tipo=GANADO_PUNTUAL, si aplica)

---

=== DÍA 14: 2ND PAGO ===
... (similar)

---

=== DÍA 15: CORTE (1er Corte del Mes) ===

ACTOR: Cajera ejecuta corte manualmente

ACCIÓN: CortService::cerrarManual()
  ✓ Corte.estado = EJECUTADO
  ✓ Corte.fecha_ejecucion = 15-abril

ACCIÓN: CorteService::generarRelacionesParaCorte()
  ✓ Vales incluidos: Vale (ACTIVO/PAGO_PARCIAL) de Sofia
  ✓ Pagos realizados: 2 quincenas = 2 × $483.33 = $966.66
  ✓ Saldo adeudado: 22 quincenas × $483.33 = $10,633.34
  
  Cálculo para RELACIÓN:
    comision_por_quincena = $500 / 24 = $20.83
    pago_quincenal = $483.33
    recargo = $0 (no moroso)
    total_linea = $504.16
    
    Pero: Solo para quincenas NO PAGADAS = 22
    total_comision = $20.83 × 1 = $20.83 (una sola cuota comisión)
    total_pago = $483.33 × 1 = $483.33 (próxima cuota)
    total_a_pagar = $504.16
    
  ✓ Crea RelacionCorte
    numero_relacion: "REL-SUC-2026-001"
    referencia_pago: "SUC175242026-04-15"
    total_a_pagar: $504.16
    fecha_limite_pago: 30-abril
    estado: GENERADA
    
  ✓ Crea PartidaRelacionCorte (detalles del vale)

BD RESULTADOS:
  cortes: 1 EJECUTADO
  relaciones_corte: 1 GENERADA
  partidas_relacion_corte: 1 registro

---

=== DÍA 16-18: VENTANA PRINCIPAL ===

ACTOR: Sofia reporta que pagó a empresa

ACCIÓN: DashboardController::reportarPago()
  INPUT:
    relacion_corte_id: 1
    monto: $504.16
    metodo_pago: TRANSFERENCIA
    referencia_reportada: "TRANSF-12345"
    fecha_pago: 16-abril
  
  ✓ Crea PagoDistribuidora
    estado: REPORTADO (esperando confirmación bancaria)

BD RESULTADOS:
  pagos_distribuidora: 1 REPORTADO

---

=== DÍA 16: BANCO ENVÍA ARCHIVO ===

ACTOR: Cajera importa archivo bancario

ARCHIVO:
  referencia | folio | monto | fecha
  SUC175242026-04-15 | BN-001 | 504.16 | 16-abril

ACCIÓN: ConciliacionController::importar()
  ✓ Crea MovimientoBancario
  ✓ Automáticamente matchea: referencia + monto match
    → Crea Conciliacion
    → Estado: CONCILIADA

BD RESULTADOS:
  movimientos_bancarios: 1 registro
  pagos_distribuidora: 1 CONCILIADO (actualizado por sistema)
  conciliaciones: 1 CONCILIADA
  
FINAL: Empresa recibió dinero de Sofia, relación está pagada.
```

---

## 📌 CONCLUSIÓN

El sistema está **~80% funcional** pero tiene **8 inconsistencias críticas** que deben resolver pour evitar errores de contabilidad. La arquitectura es sólida (máquinas de estado, snapshots, auditoría), pero **falta implementar la UI de cobros** y **ajustar la lógica de descuentos de crédito**.

**Prioridad máxima:** Inconsistencias #1, #3, #5

**Timeline recomendado:** 2-3 semanas con todo equipo

