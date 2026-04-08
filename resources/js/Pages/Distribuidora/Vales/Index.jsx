import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from '../utils';

export default function Index({ distribuidora, resumen, vales = [], filtros = {}, opciones = {}, valeSeleccionado = null }) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        q: filtros.q || '',
        estado: filtros.estado || 'TODOS',
        cliente_id: filtros.cliente_id || '',
        seleccionado: filtros.seleccionado || '',
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.vales'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty = { q: '', estado: 'TODOS', cliente_id: '', seleccionado: '' };
        setForm(empty);
        router.get(route('distribuidora.vales'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const selectVale = (valeId) => {
        const next = { ...form, seleccionado: valeId };
        setForm(next);
        router.get(route('distribuidora.vales'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DistribuidoraLayout
            title="Vales"
            subtitle="Consulta el histórico, el avance de pago y el saldo vigente de los vales emitidos a tu cartera."
        >
            <Head title="Vales" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">No se encontró una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás los vales emitidos para tus clientes.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Total visibles</p>
                            <p className="fin-stat-value">{formatNumber(resumen.total)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Activos</p>
                            <p className="fin-stat-value">{formatNumber(resumen.activos)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Pago parcial</p>
                            <p className="fin-stat-value">{formatNumber(resumen.parciales)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Morosos</p>
                            <p className="fin-stat-value">{formatNumber(resumen.morosos)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Cancelados</p>
                            <p className="fin-stat-value">{formatNumber(resumen.cancelados)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="fin-title">Listado de vales</h2>
                                <p className="mt-1 fin-subtitle">
                                    Filtra por estado, cliente o folio. Al seleccionar un vale podrás revisar su detalle financiero.
                                </p>
                            </div>
                            <Link href={route('distribuidora.vales.create')} className="w-full md:w-auto fin-btn-primary">
                                Preparar emisión
                            </Link>
                        </div>

                        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 mt-5 md:grid-cols-2 xl:grid-cols-12">
                            <div className="xl:col-span-5">
                                <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar</label>
                                <input
                                    type="text"
                                    value={form.q}
                                    onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                    className="fin-input"
                                    placeholder="Número, cliente o producto"
                                />
                            </div>
                            <div className="xl:col-span-3">
                                <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Estado</label>
                                <select
                                    value={form.estado}
                                    onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
                                    className="fin-input"
                                >
                                    {(opciones.estados || []).map((estado) => (
                                        <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="xl:col-span-2">
                                <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Cliente</label>
                                <select
                                    value={form.cliente_id}
                                    onChange={(event) => setForm((prev) => ({ ...prev, cliente_id: event.target.value }))}
                                    className="fin-input"
                                >
                                    <option value="">Todos</option>
                                    {(opciones.clientes || []).map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>{cliente.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-2 xl:self-end">
                                <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                                <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-5">
                        <div className="space-y-3 xl:col-span-3">
                            {!vales.length ? (
                                <div className="fin-card">
                                    <p className="text-sm text-gray-500">No hay vales que cumplan con el filtro actual.</p>
                                </div>
                            ) : (
                                vales.map((vale) => (
                                    <button
                                        key={vale.id}
                                        type="button"
                                        onClick={() => selectVale(vale.id)}
                                        className={`w-full p-4 text-left border rounded-xl transition ${valeSeleccionado?.id === vale.id ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{vale.numero_vale}</p>
                                                <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre || 'Cliente sin nombre'} · {vale.producto_nombre || 'Producto no definido'}</p>
                                            </div>
                                            <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto principal</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.monto_principal)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo actual</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Avance</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatNumber(vale.pagos_realizados)} / {formatNumber(vale.quincenas_totales)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(vale.fecha_limite_pago)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="xl:col-span-2">
                            <div className="sticky top-24 space-y-4">
                                <div className="fin-card">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="fin-title">Detalle del vale</h2>
                                            <p className="mt-1 fin-subtitle">Consulta condiciones congeladas, ventana de pago y último movimiento registrado.</p>
                                        </div>
                                        <Link href={route('distribuidora.vales.create')} className="fin-btn-primary">
                                            Preparar emisión
                                        </Link>
                                    </div>
                                </div>

                                {!valeSeleccionado ? (
                                    <div className="fin-card">
                                        <p className="text-sm text-gray-500">Selecciona un vale del listado para revisar su detalle.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="fin-card">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{valeSeleccionado.numero_vale}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{valeSeleccionado.cliente_nombre} · {valeSeleccionado.producto_nombre}</p>
                                                </div>
                                                <span className={statusBadgeClass(valeSeleccionado.estado)}>{valeSeleccionado.estado}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto total deuda</p>
                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(valeSeleccionado.monto_total_deuda)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto quincenal</p>
                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(valeSeleccionado.monto_quincenal)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Ventana anticipado</p>
                                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(valeSeleccionado.fecha_inicio_pago_anticipado)} a {formatDate(valeSeleccionado.fecha_fin_pago_anticipado)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha emisión</p>
                                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(valeSeleccionado.fecha_emision, true)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {valeSeleccionado.ultimo_pago ? (
                                            <div className="fin-card">
                                                <p className="font-semibold text-gray-900">Último pago registrado</p>
                                                <div className="grid grid-cols-1 gap-3 mt-3 text-sm sm:grid-cols-3">
                                                    <div>
                                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto</p>
                                                        <p className="mt-1 font-semibold text-gray-900">{formatCurrency(valeSeleccionado.ultimo_pago.monto)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha</p>
                                                        <p className="mt-1 font-semibold text-gray-900">{formatDate(valeSeleccionado.ultimo_pago.fecha_pago, true)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Método</p>
                                                        <p className="mt-1 font-semibold text-gray-900">{valeSeleccionado.ultimo_pago.metodo_pago}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="fin-card">
                                                <p className="font-semibold text-gray-900">Todavía no hay pagos registrados</p>
                                                <p className="mt-1 text-sm text-gray-500">Este vale aún no tiene pagos asociados en base de datos.</p>
                                            </div>
                                        )}

                                        {(valeSeleccionado.motivo_reclamo || valeSeleccionado.notas) && (
                                            <div className="fin-card">
                                                <p className="font-semibold text-gray-900">Observaciones</p>
                                                {valeSeleccionado.motivo_reclamo && (
                                                    <p className="mt-3 text-sm text-amber-700">Reclamo: {valeSeleccionado.motivo_reclamo}</p>
                                                )}
                                                {valeSeleccionado.notas && (
                                                    <p className="mt-2 text-sm text-gray-600">Notas: {valeSeleccionado.notas}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
