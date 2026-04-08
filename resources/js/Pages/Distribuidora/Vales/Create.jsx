import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatNumber, statusBadgeClass } from '../utils';

export default function Create({
    distribuidora,
    prevalidacion,
    productos = [],
    clientes = { todos: [], elegibles: [], observados: [] },
    seleccion = {},
    simulacion,
    bloqueos = [],
    puedeContinuar = false,
}) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        cliente_id: seleccion.cliente_id || '',
        producto_id: seleccion.producto_id || '',
    });

    const clienteSeleccionado = useMemo(
        () => (clientes.todos || []).find((item) => Number(item.id) === Number(form.cliente_id)),
        [clientes.todos, form.cliente_id],
    );

    const productoSeleccionado = useMemo(
        () => (productos || []).find((item) => Number(item.id) === Number(form.producto_id)),
        [productos, form.producto_id],
    );

    const aplicarSimulacion = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.vales.create'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiar = () => {
        const empty = { cliente_id: '', producto_id: '' };
        setForm(empty);
        router.get(route('distribuidora.vales.create'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DistribuidoraLayout
            title="Preparar pre vale"
            subtitle="Selecciona cliente y producto, revisa el plan fijo del producto y valida si hoy puedes avanzar al pre vale."
        >
            <Head title="Preparar pre vale" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">No se encontró una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás la validación previa del pre vale.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Puede iniciar vale</p>
                            <p className="fin-stat-value">{prevalidacion.puede_emitir_vales ? 'Sí' : 'No'}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Crédito disponible</p>
                            <p className="fin-stat-value">{prevalidacion.sin_limite ? 'Sin límite' : formatCurrency(prevalidacion.credito_disponible)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Clientes elegibles</p>
                            <p className="fin-stat-value">{formatNumber((clientes.elegibles || []).length)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Pagos por conciliar</p>
                            <p className="fin-stat-value">{formatNumber(prevalidacion.pagos_pendientes_conciliar)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card border-green-200 bg-green-50/60">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">Estado operativo actual</p>
                                <p className="mt-1 text-sm text-gray-600">Esta vista valida cliente, producto y consumo de crédito con base en un plan fijo. Aún no persiste el vale.</p>
                            </div>
                            <span className={statusBadgeClass(prevalidacion.estado)}>{prevalidacion.estado || 'SIN ESTADO'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-5">
                        <div className="space-y-4 xl:col-span-3">
                            <div className="fin-card">
                                <h2 className="fin-title">Configuración del pre vale</h2>
                                <p className="mt-1 fin-subtitle">Selecciona el cliente y el producto. El monto principal viene definido por el plan financiero, así que aquí ya no se captura manualmente.</p>

                                <form onSubmit={aplicarSimulacion} className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Cliente</label>
                                        <select
                                            value={form.cliente_id}
                                            onChange={(event) => setForm((prev) => ({ ...prev, cliente_id: event.target.value }))}
                                            className="fin-input"
                                        >
                                            <option value="">Selecciona un cliente</option>
                                            {(clientes.todos || []).map((cliente) => (
                                                <option key={cliente.id} value={cliente.id}>
                                                    {(cliente.codigo_cliente ? `${cliente.codigo_cliente} · ` : '') + cliente.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Producto</label>
                                        <select
                                            value={form.producto_id}
                                            onChange={(event) => setForm((prev) => ({ ...prev, producto_id: event.target.value }))}
                                            className="fin-input"
                                        >
                                            <option value="">Selecciona un producto</option>
                                            {productos.map((producto) => (
                                                <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
                                        <button type="submit" className="w-full fin-btn-primary">Actualizar simulación</button>
                                        <button type="button" onClick={limpiar} className="w-full fin-btn-secondary">Limpiar</button>
                                    </div>
                                </form>
                            </div>

                            {clienteSeleccionado && (
                                <div className="fin-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="fin-title">Cliente seleccionado</h2>
                                            <p className="mt-1 fin-subtitle">{clienteSeleccionado.nombre}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={statusBadgeClass(clienteSeleccionado.estado_relacion)}>{clienteSeleccionado.estado_relacion}</span>
                                            <span className={statusBadgeClass(clienteSeleccionado.estado_cliente)}>{clienteSeleccionado.estado_cliente}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-3">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Vales abiertos</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatNumber(clienteSeleccionado.vales_abiertos)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo pendiente</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(clienteSeleccionado.saldo_pendiente)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Elegibilidad</p>
                                            <p className="mt-1 font-semibold text-gray-900">{clienteSeleccionado.puede_solicitar_vale ? 'Apta' : 'Con observaciones'}</p>
                                        </div>
                                    </div>
                                    {!!clienteSeleccionado.motivos?.length && (
                                        <div className="p-3 mt-4 border rounded-xl border-amber-200 bg-amber-50">
                                            <p className="text-sm font-semibold text-amber-800">Motivos de bloqueo u observación</p>
                                            <ul className="mt-2 space-y-1 text-sm text-amber-700 list-disc list-inside">
                                                {clienteSeleccionado.motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {productoSeleccionado && (
                                <div className="fin-card">
                                    <h2 className="fin-title">Producto seleccionado</h2>
                                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Producto</p>
                                            <p className="mt-1 font-semibold text-gray-900">{productoSeleccionado.nombre}</p>
                                            <p className="mt-1 text-sm text-gray-500">{productoSeleccionado.codigo} · {formatCurrency(productoSeleccionado.monto_principal)} · {productoSeleccionado.numero_quincenas} quincenas</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Desembolso</p>
                                            <p className="mt-1 font-semibold text-gray-900">{productoSeleccionado.modo_desembolso}</p>
                                            <p className="mt-1 text-sm text-gray-500">Multa base {formatCurrency(productoSeleccionado.monto_multa_tardia)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 xl:col-span-2">
                            <div className="fin-card">
                                <h2 className="fin-title">Checklist base</h2>
                                <div className="mt-4 space-y-3 text-sm text-gray-700">
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Distribuidora activa</span>
                                        <span className={statusBadgeClass(prevalidacion.estado)}>{prevalidacion.estado || 'SIN ESTADO'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Inicio de vale habilitado</span>
                                        <span className={statusBadgeClass(prevalidacion.puede_emitir_vales ? 'ACTIVO' : 'BLOQUEADO')}>
                                            {prevalidacion.puede_emitir_vales ? 'HABILITADA' : 'BLOQUEADA'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Clientes activos disponibles</span>
                                        <span className="font-semibold text-gray-900">{formatNumber(prevalidacion.clientes_activos)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Opera sin límite</span>
                                        <span className="font-semibold text-gray-900">{prevalidacion.sin_limite ? 'Sí' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {!!bloqueos.length && (
                                <div className="fin-card border-red-200 bg-red-50">
                                    <p className="font-semibold text-red-800">El pre vale todavía está bloqueado</p>
                                    <ul className="mt-3 space-y-1 text-sm text-red-700 list-disc list-inside">
                                        {bloqueos.map((bloqueo) => <li key={bloqueo}>{bloqueo}</li>)}
                                    </ul>
                                </div>
                            )}

                            {simulacion ? (
                                <div className="fin-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="fin-title">Resultado de la simulación</h2>
                                            <p className="mt-1 fin-subtitle">Vista previa del cálculo con base en el producto seleccionado, la categoría actual y el monto fijo configurado en ese plan.</p>
                                        </div>
                                        <span className={statusBadgeClass(puedeContinuar ? 'ACTIVO' : 'PAGO_PARCIAL')}>
                                            {puedeContinuar ? 'LISTA' : 'CON OBSERVACIONES'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto fijo del producto</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.monto_principal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Comisión empresa</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.comision_empresa)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Seguro</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.seguro)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Interés total</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.interes_total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Ganancia distribuidora</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.ganancia_distribuidora)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Multa base</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.multa_base)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total deuda</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(simulacion.total_deuda)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto quincenal</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(simulacion.monto_quincenal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Consumo de crédito</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.consumo_credito)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Crédito restante</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {simulacion.credito_restante === null ? 'Sin límite' : formatCurrency(simulacion.credito_restante)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="fin-card">
                                    <p className="font-semibold text-gray-900">Aún no hay simulación</p>
                                    <p className="mt-1 text-sm text-gray-500">Selecciona cliente y producto para calcular el pre vale con el monto fijo del plan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
