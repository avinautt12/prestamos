# README personal del módulo Gerente

Este documento está escrito para entender el sistema con calma, desde el negocio y no solo desde el código.
La idea es explicar por qué existe cada dato, qué hace cada archivo y cómo salen las fórmulas financieras.

## 1. Qué problema resuelve Gerente

Gerente es la capa de decisión y control de una sucursal.

En palabras simples:
- Coordinador captura la solicitud.
- Verificador revisa en campo.
- Gerente decide si se aprueba o se rechaza.
- Gerente también define reglas variables de su sucursal, como cortes, comisiones y parámetros de cálculo.

Por eso este módulo no es solo una pantalla de aprobación. También es el lugar donde se guardan las reglas que hacen que una sucursal pueda tener comportamiento distinto a otra.

## 2. La idea financiera detrás del diseño

El proyecto ya no usa números fijos regados por todo el código. La idea fue mover esos números a una tabla de configuración por sucursal.

Eso sirve para tres cosas:
- cambiar reglas sin tocar el código,
- tener una sola fuente de verdad,
- guardar historial de quién cambió qué.

En términos prácticos, el gerente puede ajustar:
- cuándo corta la sucursal,
- cuánto cobra de comisión de apertura,
- cuánto cobra de interés quincenal,
- cuánto vale un seguro según el monto prestado,
- cuál es la multa por incumplimiento,
- qué reglas usar para puntos.

## 3. Qué significa cada dato de la migración principal

La tabla principal es `sucursal_configuraciones`.
Solo debe existir una fila por sucursal. Por eso tiene un índice único en `sucursal_id`.

### 3.1 Datos de corte

- `sucursal_id`: identifica a qué sucursal pertenece la configuración.
- `dia_corte`: día del mes en que debe ocurrir el corte. Ejemplo: 15 significa que el corte es el día 15.
- `hora_corte`: hora exacta del corte. Ejemplo: 10:30.

Estos dos campos son la base de la agenda automática.
Si no existen, no se puede calcular un próximo corte programado.

### 3.2 Reglas de pago

- `frecuencia_pago_dias`: cada cuántos días se espera un pago o una revisión de ciclo.
- `plazo_pago_dias`: cuántos días dura el plazo total del producto o del ciclo de pago.

En lenguaje simple:
- frecuencia = ritmo,
- plazo = límite total.

No significan lo mismo. La frecuencia dice “cada cuánto”, el plazo dice “hasta cuándo”.

### 3.3 Línea base de crédito

- `linea_credito_default`: cantidad inicial sugerida como crédito base.

Sirve como referencia para aprobaciones o para arrancar una sucursal con un valor estándar.

No obliga a usar ese monto en todos los casos. Es una guía.

### 3.4 Seguro por tabuladores

- `seguro_tabuladores_json`: guarda una lista de rangos y montos de seguro.

Este campo es importante porque el seguro no siempre debe ser un porcentaje fijo. A veces el seguro depende del monto del préstamo.

Ejemplo de estructura:

```json
[
  { "desde": 0, "hasta": 5000, "monto": 50 },
  { "desde": 5001, "hasta": 15000, "monto": 100 },
  { "desde": 15001, "hasta": null, "monto": 150 }
]
```

Cómo se interpreta:
- si el préstamo está entre 0 y 5000, el seguro cuesta 50,
- si está entre 5001 y 15000, cuesta 100,
- si supera 15000, cuesta 150.

Esto es mejor que poner un solo valor porque te deja adaptar el seguro al tamaño del préstamo.

### 3.5 Comisión e interés

- `porcentaje_comision_apertura`: porcentaje que se cobra al abrir el préstamo.
- `porcentaje_interes_quincenal`: porcentaje de interés por cada quincena.

Estos son los parámetros que más afectan la utilidad del préstamo.

### 3.6 Multa

- `multa_incumplimiento_monto`: monto fijo que se puede usar cuando hay atraso o incumplimiento.

Hoy el sistema la guarda y la muestra, pero todavía no se suma automáticamente a cada pago de la tabla de amortización.
Eso significa que la multa está preparada para usarla, pero la lógica de aplicación real puede ampliarse después.

### 3.7 Puntos

- `factor_divisor_puntos`: número usado como divisor para transformar dinero en puntos.
- `multiplicador_puntos`: factor que multiplica el resultado final de puntos.
- `valor_punto_mxn`: valor monetario de cada punto.

Estos tres campos todavía funcionan más como reglas preparadas para el sistema de puntos que como una fórmula completamente activa en la tabla de amortización.

La idea es que después se pueda calcular recompensa, penalización o valor operativo a partir de los puntos.

### 3.8 Overrides por sucursal

- `categorias_config_json`: permite cambiar el porcentaje de comisión de una categoría solo para esa sucursal.
- `productos_config_json`: permite cambiar comisiones e intereses de productos sin alterar el catálogo global.

Esto existe porque una sucursal puede negociar condiciones distintas a otra.
No conviene modificar la tabla global si el cambio solo aplica localmente.

### 3.9 Auditoría

- `actualizado_por_usuario_id`: quién hizo el último cambio.
- `creado_en`: cuándo se creó el registro.
- `actualizado_en`: cuándo se modificó por última vez.

Esto da trazabilidad. Si una regla cambia, siempre se puede saber quién la tocó y cuándo.

## 4. Qué significa la tabla de bitácora

La tabla `bitacora_configuracion_sucursal` guarda el historial de cambios.

Sus campos son:

- `sucursal_configuracion_id`: cuál configuración cambió.
- `sucursal_id`: de qué sucursal hablamos.
- `actualizado_por_usuario_id`: quién hizo el cambio.
- `tipo_evento`: qué tipo de cambio fue.
  - `SUCURSAL`: cambió la configuración general.
  - `CATEGORIA`: cambió una categoría.
  - `PRODUCTO`: cambió un producto.
- `referencia_id`: si el cambio fue de categoría o producto, aquí va el id del registro afectado.
- `cambios_antes_json`: valor anterior.
- `cambios_despues_json`: valor nuevo.
- `creado_en` y `actualizado_en`: fechas de auditoría.

Esta tabla responde la pregunta más importante del control financiero: qué cambió, quién lo cambió y cómo estaba antes.

## 5. Las fórmulas financieras explicadas simple

Todo esto vive principalmente en `app/Services/LoanService.php`.

### 5.1 Seguro

La fórmula no es un porcentaje directo. Primero busca el rango correcto del préstamo.

Regla:
- si el monto cae dentro de un rango, se toma el seguro de ese rango.

Ejemplo:
- préstamo de 4,000 => seguro de 50,
- préstamo de 10,000 => seguro de 100,
- préstamo de 20,000 => seguro de 150.

Por qué se hizo así:
- porque el seguro no crece necesariamente proporcional al préstamo,
- porque es más fácil de modificar por sucursal,
- porque permite reglas por bandas, que es una práctica común en finanzas operativas.

### 5.2 Comisión de apertura

Fórmula:

Comisión de apertura = principal × porcentaje_comision_apertura / 100

Si el préstamo es de 5,000 y la comisión es 10%, entonces:
- 5,000 × 10 / 100 = 500

Esto se cobra una sola vez al inicio.

### 5.3 Interés total

Fórmula:

Interés total = principal × porcentaje_interes_quincenal / 100 × número de quincenas

Ejemplo:
- principal = 5,000
- interés quincenal = 5%
- plazo = 14 quincenas

Entonces:
- 5,000 × 0.05 × 14 = 3,500

Por qué está así:
- porque el sistema está pensado en ciclos quincenales,
- porque el interés se acumula por cada quincena del plazo,
- porque es una forma simple y controlable de proyectar el costo total.

### 5.4 Comisión de distribuidora

Fórmula:

Comisión de distribuidora = principal × porcentaje_comision_de_categoria / 100

Ejemplo:
- principal = 5,000
- comisión de categoría = 12%

Entonces:
- 5,000 × 0.12 = 600

Ojo importante:
- esta comisión se calcula por separado,
- no se suma dentro del total que paga el cliente en la tabla de amortización,
- se maneja como parte de la lógica interna de liquidación o reparto.

Eso fue una decisión de diseño para no mezclar lo que paga el cliente con lo que gana la cadena operativa.

### 5.5 Total del préstamo

Fórmula que usa hoy el servicio:

Total = principal + comisión de apertura + seguro + interés total

Ejemplo con números simples:
- principal = 5,000
- comisión de apertura = 500
- seguro = 50
- interés total = 3,500

Total = 5,000 + 500 + 50 + 3,500 = 9,050

### 5.6 Monto quincenal

Fórmula:

Monto quincenal = total / número de quincenas

Ejemplo:
- total = 9,050
- quincenas = 14

Monto quincenal ≈ 646.43

Eso es lo que el sistema usa como base para repartir el pago entre quincenas.

### 5.7 Tabla de amortización

El servicio reparte el total en varias filas:
- quincena,
- abono a capital,
- abono a interés,
- comisión de distribuidora,
- seguro,
- multa,
- pago programado,
- saldo restante.

Importante:
- hoy la tabla está pensada como proyección y control,
- no es todavía un motor contable completo de cobranza real,
- sirve para tener una base uniforme de cálculo.

### 5.8 Qué NO hace todavía la fórmula

Hay tres cosas que conviene entender:

- La multa de incumplimiento no se aplica automáticamente al total de la tabla.
- El parámetro `producto` todavía entra más como contexto que como calculadora real.
- Los puntos se guardan como variables listas, pero aún no están integrados de forma fuerte en la amortización.

Eso no significa que esté mal. Significa que el diseño está preparado para crecer sin romper la estructura actual.

## 6. Cómo se calcula el corte

Esto vive en `app/Services/CorteService.php`.

### 6.1 Sincronizar próximo corte

Cuando el gerente guarda la configuración de una sucursal, el sistema busca crear o actualizar un corte programado.

Se usa:
- `dia_corte`
- `hora_corte`

Si faltan ambos, no hace nada.

Si existen, calcula la fecha programada y crea un corte con:
- estado `PROGRAMADO`,
- observación `AUTO_CONFIG_SUCURSAL`.

### 6.2 Cómo se calcula la fecha programada

La regla es:
- si la fecha de este mes todavía no pasó, usa este mes,
- si ya pasó, usa el siguiente mes,
- si el día pedido no existe en ese mes, usa el último día disponible.

Ejemplo:
- si pones día 31 y el mes tiene 30 días, se usa día 30,
- si pones 31 en febrero, se usa 28 o 29 según el año.

Por qué se hizo así:
- porque evita fechas inválidas,
- porque hace el sistema más robusto,
- porque una sucursal puede configurarse con un día fijo que no siempre existe en todos los meses.

### 6.3 Qué es “corte atrasado”

El servicio primero busca el corte programado que todavía esté en fecha futura.
Si no existe, toma el primero programado aunque ya haya pasado y lo marca como atrasado.

Eso ayuda al dashboard a mostrar si la sucursal tiene un corte pendiente que ya se venció.

### 6.4 Cierre manual

Cuando el gerente cierra un corte manualmente:
- cambia el estado a `EJECUTADO`,
- guarda `fecha_ejecucion`,
- conserva o reemplaza observaciones.

Esto sirve para cerrar operaciones sin esperar a un proceso automático.

## 7. Qué hace cada archivo importante

### 7.1 `app/Http/Controllers/Gerente/ConfiguracionController.php`

Es el controlador que guarda la configuración de sucursal.

Hace cuatro cosas principales:
- carga la configuración actual,
- deja editar sucursal, categorías y productos,
- registra cambios en bitácora,
- sincroniza el próximo corte automático.

En simple: es el lugar donde el gerente cambia las reglas.

### 7.2 `app/Http/Controllers/Gerente/CorteController.php`

Es la pantalla del calendario de cortes.

Hace dos cosas:
- muestra el próximo corte y los cortes del mes,
- permite cerrar manualmente un corte programado.

### 7.3 `app/Http/Controllers/Gerente/DashboardController.php`

Arma los números principales del gerente:
- solicitudes pendientes,
- distribuidoras activas,
- vales activos,
- capital colocado,
- solicitudes aprobadas o rechazadas en el mes,
- capital en riesgo,
- próximo corte,
- actividad reciente.

Es el panel de control de la sucursal.

### 7.4 `app/Services/LoanService.php`

Es el motor de cálculo financiero.

Aquí se concentran las fórmulas para no repetir la lógica en varios controladores.

Esto fue importante porque antes los números podían terminar dispersos o hardcodeados.

### 7.5 `app/Services/CorteService.php`

Es el motor del calendario de cortes.

Centraliza la lógica de:
- crear corte automático,
- buscar próximo corte,
- listar cortes del mes,
- cerrar cortes manuales.

### 7.6 `resources/js/Pages/Gerente/Configuraciones.jsx`

Es la pantalla donde tú editas la configuración.

Muestra:
- formulario de sucursal,
- porcentajes de categorías,
- comisiones e intereses de productos,
- historial de cambios.

### 7.7 `resources/js/Pages/Gerente/Cortes.jsx`

Es el calendario visual de cortes.

Sirve para ver:
- próximo corte,
- cortes del mes,
- cortes ejecutados,
- cortes atrasados,
- cierres manuales.

### 7.8 `resources/js/Pages/Gerente/GerenteDashboard.jsx`

Es el panel principal.

No es solo decoración. Está hecho para contestar rápido:
- cómo va la sucursal,
- qué tanto riesgo hay,
- qué decisión falta,
- cuándo será el siguiente corte.

### 7.9 `resources/js/Pages/Gerente/Distribuidoras/Show.jsx`

Es la ficha de una solicitud lista para decisión.

Ahí el gerente ve:
- datos de la persona,
- domicilio,
- evidencias,
- categoría,
- límite sugerido,
- botón de aprobar o rechazar.

### 7.10 `resources/js/Pages/Gerente/Distribuidoras/Rechazadas.jsx`

Es el historial visible de rechazos.

Te ayuda a revisar por qué se rechazó algo y cuándo.

### 7.11 `app/Http/Middleware/TrustProxies.php`

Este archivo cambió por seguridad.

Antes se confiaba en headers de proxy, y eso podía permitir que una IP falsa pareciera válida.

Ahora el sistema desconfía de esos headers y usa la IP real de la conexión.

Eso importa mucho porque las acciones críticas del gerente dependen de la validación VPN.

## 8. Por qué se hizo así y no de otra manera

### 8.1 Se separó la configuración por sucursal

Porque una sucursal no siempre debe tener las mismas reglas que otra.

Si los números viven en configuración, se pueden ajustar sin tocar código.

### 8.2 Se creó una bitácora

Porque en finanzas no basta con cambiar datos. Hay que saber quién los cambió y cuándo.

### 8.3 Se centralizaron fórmulas en servicios

Porque si una fórmula se repite en varios controladores, tarde o temprano una versión se desalineará.

Un servicio único evita eso.

### 8.4 Se separó el total del cliente de la comisión de distribuidora

Porque no son lo mismo:
- una cosa es lo que paga el cliente,
- otra cosa es cómo se reparte la ganancia interna.

### 8.5 Se prepararon puntos y multa aunque todavía no sean el centro del cálculo

Porque el sistema está creciendo por etapas.
Primero se dejó el esqueleto correcto, luego se puede conectar la lógica fina.

## 9. Ejemplo completo con números

Supón este caso:
- préstamo principal: 5,000
- comisión de apertura: 10%
- interés quincenal: 5%
- plazo: 14 quincenas
- seguro según rango: 50
- comisión de categoría: 12%

Entonces:
- comisión de apertura = 500
- interés total = 3,500
- seguro = 50
- total del cliente = 9,050
- monto quincenal = 9,050 / 14 = 646.43 aprox.
- comisión de distribuidora = 600, pero se maneja aparte

Interpretación humana:
- el cliente ve un costo total calculado con reglas claras,
- la sucursal tiene su propio control de comisión,
- el sistema puede cambiar las reglas sin reprogramar todo.

## 10. Qué comparar con el archivo del profesor

Como no tengo aquí el archivo exacto del profesor, te dejo la guía para compararlo:

- Si el profesor usa interés simple o interés sobre saldo, compáralo con nuestro interés quincenal fijo sobre principal.
- Si el profesor mete el seguro como porcentaje, compáralo con nuestro sistema por tabuladores.
- Si el profesor suma la comisión de distribuidora al total del cliente, aquí no se hace así: aquí va separada.
- Si el profesor aplica multa dentro de cada cuota, aquí todavía no está integrado al cálculo base.
- Si el profesor calcula puntos como recompensa de venta o cobranza, aquí ya están los campos, pero la fórmula todavía está preparada más que activa.

La comparación correcta no es solo ver números. Hay que ver la lógica:
- si el valor depende del monto,
- si depende del plazo,
- si depende de la categoría,
- si afecta al cliente o solo a la operación interna.

## 11. Resumen corto de lo que sí hace hoy

- Guarda reglas por sucursal.
- Crea auditoría de cambios.
- Calcula seguro por rangos.
- Calcula comisión de apertura.
- Calcula interés total por quincenas.
- Calcula comisión de categoría por separado.
- Programa y cierra cortes.
- Muestra al gerente el riesgo y la operación de su sucursal.

## 12. Lo más importante para quedarte tranquilo

No se hizo así por capricho.
Se hizo así para que el sistema sea editable, auditable y entendible por sucursal.

Si mañana cambian las reglas, no deberías tener que reescribir toda la aplicación.
Solo cambias la configuración y, si hace falta, la fórmula central.
