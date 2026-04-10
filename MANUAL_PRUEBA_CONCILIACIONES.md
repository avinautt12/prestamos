# Manual de prueba — Flujo de Conciliaciones

Guía paso a paso para validar el flujo completo de pagos entre **Gerente → Distribuidora → Cajera**.

---

## 1. Objetivo

Probar de inicio a fin el ciclo de pagos:

1. El **Gerente** cierra un corte → se generan las relaciones de pago de la distribuidora.
2. La **Distribuidora** ve su relación y reporta uno o varios pagos.
3. La **Cajera** descarga un Excel simulado del banco y lo sube de vuelta para conciliar.
4. La **Distribuidora** ve su relación actualizada a pagada (o parcial) y los pagos como conciliados.

---

## 2. Preparar el proyecto

```bash
git fetch
git checkout Jona
git pull

composer install
npm install
npm run build

php artisan serve --port=8002
```

En el archivo `.env` asegúrate de tener:

```env
BROADCAST_CONNECTION=log
```

Luego corre:

```bash
php artisan config:clear
```

---

## 3. Setup en 1 comando

```bash
php artisan migrate:fresh --seed
```

Con esto queda todo listo. **No hace falta ningún comando manual adicional.**

---

## 4. Usuarios de prueba

Password para los 3: `password123`

| Usuario         | Rol           |
| --------------- | ------------- |
| `gerente`       | Gerente       |
| `distribuidora` | Distribuidora |
| `cajera`        | Cajera        |

---

## 5. Paso 1 — Distribuidora revisa su estado inicial

1. Login como `distribuidora`.
2. Ir a **Estado de cuenta**.
3. **Verificar**:
   - Aparecen **8 relaciones**, todas en estado **PAGADA**.
   - El resumen superior muestra **Total pendiente: $0.00**.
   - Están ordenadas por fecha descendente (la más reciente arriba).
4. **Probar filtros de fecha**:
   - Elegir una fecha **Desde** posterior a **Hasta** → debe aparecer un mensaje rojo y el botón **Aplicar** se deshabilita.
   - Limpiar filtros con el botón **Limpiar** → vuelven a aparecer las 8 relaciones.

---

## 6. Paso 2 — Gerente cierra el corte

1. Logout → login como `gerente`.
2. Ir a **Cortes**.
3. **Verificar**: aparece **1 corte en estado PROGRAMADO** con el botón **Cierre manual**.
4. Click en **Cierre manual** y confirmar.
5. **Verificar**: aparece el mensaje *"Corte cerrado. Se generaron 1 relaciones de pago."*

---

## 7. Paso 3 — Distribuidora ve la nueva relación

1. Logout → login como `distribuidora`.
2. Ir a **Estado de cuenta**.
3. **Verificar**:
   - La nueva relación aparece **arriba de la lista** con estado **GENERADA**.
   - El **Total pendiente** del resumen superior ya no es $0.
4. Seleccionar la nueva relación (click en la fila).
5. **Verificar**:
   - La tabla de **partidas** muestra los 2 vales activos.
   - El **total a pagar** es la suma de las comisiones + pagos quincenales de esos vales.

---

## 8. Paso 4 — Distribuidora reporta pago (probar validaciones)

Con la relación nueva seleccionada, click en **Reportar pago**.

### Validaciones a probar

- **Monto negativo**: escribir `-100` → error rojo *"El monto debe ser mayor a cero"*. El botón **Confirmar pago** debe estar deshabilitado.
- **Monto mayor al total**: escribir un monto más grande que el total de la relación → error *"El monto no puede exceder el total"*.
- **Referencia vacía**: borrar el campo referencia → error *"La referencia es obligatoria"*.
- **Contador de observaciones**: escribir texto → debajo aparece contador `X / 500`.

### Reportar primer abono parcial

1. Monto: `1000`
2. Método: **TRANSFERENCIA**
3. Referencia: dejar la que viene por default.
4. Click **Confirmar pago**.
5. **Verificar**: aparece una **franja azul** arriba del botón que dice *"1 pagos en revisión por $1,000.00"*.

### Reportar segundo abono parcial

1. Click otra vez **Reportar pago**.
2. Monto: `500`.
3. Confirmar.
4. **Verificar**: la franja azul ahora dice *"2 pagos en revisión por $1,500.00"*.

> La distribuidora puede acumular varios pagos en revisión antes de que la cajera los concilie. El botón **nunca** se bloquea.

---

## 9. Paso 5 — Cajera descarga el archivo simulado

1. Logout → login como `cajera`.
2. Ir a **Conciliaciones** → pestaña **Importar**.
3. **Verificar**: arriba del uploader aparece un **badge verde** con el texto **"Ventana principal"** y la fecha del corte.
   - Si aparece en otro color ("Ventana tardíos" o "Fuera de ventana"), ver la sección **Troubleshooting**.
4. Click en **Descargar Excel**.
5. **Verificar**: el navegador descarga un archivo `simulacion_banco_principal_...xlsx`.
6. *(Opcional)* Abrir el archivo: debe tener **2 filas** (los 2 pagos que reportó la distribuidora).

---

## 10. Paso 6 — Cajera sube el Excel (probar validaciones)

### Validaciones a probar

- **Extensión inválida**: intentar subir un archivo `.pdf` → error *"Extensión no permitida"*.
- **Tamaño** *(opcional)*: intentar subir un archivo mayor a 10 MB → error.

### Importar el Excel

1. Seleccionar el archivo `.xlsx` descargado en el paso anterior.
2. Click **Importar y conciliar**.
3. **Verificar**: aparece la tabla **"Detalle de la última importación"** con **2 filas** en estado **CONCILIADA_AUTOMATICA**.

---

## 11. Paso 7 — Distribuidora ve el resultado final

1. Logout → login como `distribuidora`.
2. Ir a **Estado de cuenta**.
3. Seleccionar la misma relación del Paso 4.
4. **Verificar**:
   - El estado de la relación ahora es **PARCIAL**.
   - La franja azul *"pagos en revisión"* **ya no aparece**.
   - En la sección **Pagos reportados**, los 2 pagos aparecen con estado **CONCILIADO**.
   - El **Total pendiente** del resumen superior disminuyó en **$1,500**.

---

## 12. Checklist final

- [ ] `migrate:fresh --seed` corrió sin errores.
- [ ] **Distribuidora (antes)**: vio 8 relaciones, todas PAGADA, orden descendente, filtros de fecha funcionando.
- [ ] **Gerente**: cerró el corte y apareció el mensaje *"1 relaciones generadas"*.
- [ ] **Distribuidora**: vio la nueva relación GENERADA arriba de la lista.
- [ ] **Distribuidora**: las validaciones del modal "Reportar pago" muestran los errores esperados.
- [ ] **Distribuidora**: reportó 2 pagos parciales y apareció la franja azul *"En revisión"*.
- [ ] **Cajera**: vio el badge verde **"Ventana principal"**.
- [ ] **Cajera**: descargó el Excel sin error.
- [ ] **Cajera**: las validaciones de upload rechazan archivos inválidos.
- [ ] **Cajera**: subió el Excel y las 2 filas quedaron **CONCILIADA_AUTOMATICA**.
- [ ] **Distribuidora**: la relación pasó a **PARCIAL** y los pagos quedaron en **CONCILIADO**.

---

## 13. Troubleshooting

| Problema | Solución |
|---|---|
| Error **Pusher 404** al reportar pago o conciliar | Poner `BROADCAST_CONNECTION=log` en `.env` y correr `php artisan config:clear` |
| Error **PhpSpreadsheet not found** al descargar Excel | Correr `composer update phpoffice/phpspreadsheet` |
| Badge **"Fuera de ventana"** en la cajera | Re-correr `php artisan migrate:fresh --seed` |
| No aparece el corte **PROGRAMADO** en gerente | Re-correr `php artisan migrate:fresh --seed` |
| Error **419 CSRF** al reportar pago | Recargar la página con F5 y volver a hacer login |
| Mensaje *"Se generaron 0 relaciones"* al cerrar el corte | Re-correr `php artisan migrate:fresh --seed` |
| Excel descargado viene vacío | Asegurarte de haber reportado los pagos en el Paso 4 antes de descargar |
| Error **Vite manifest not found** | Correr `npm run build` |

---

**Dudas / bugs**: pingea a Jona con screenshot + el paso del checklist donde se rompió.
