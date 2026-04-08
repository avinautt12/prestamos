import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from '../utils';

function ValeDetailModal({ vale, open, onClose }) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open || !vale) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Detalle del vale</p>
                        <h2 className="mt-1 text-xl font-semibold text-gray-900">{vale.numero_vale}</h2>
                        <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre || 'Cliente sin nombre'} · {vale.producto_nombre || 'Producto no definido'}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-10 h-10 text-gray-500 transition border border-gray-200 rounded-xl hover:bg-gray-50"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="p-3 border rounded-xl border-gray-200">
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto principal</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(vale.monto_principal)}</p>
                        </div>
                        <div className="p-3 border rounded-xl border-gray-200">
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo actual</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                        </div>
                        <div className="p-3 border rounded-xl border-gray-200">
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Avance</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatNumber(vale.pagos_realizados)} / {formatNumber(vale.quincenas_totales)}</p>
                        </div>
                        <div className="p-3 border rounded-xl border-gray-200">
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(vale.fecha_limite_pago)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-xl border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">Condiciones congeladas</p>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto total deuda</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.monto_total_deuda)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto quincenal</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.monto_quincenal)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Ventana anticipado</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(vale.fecha_inicio_pago_anticipado)} a {formatDate(vale.fecha_fin_pago_anticipado)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha del vale</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(vale.fecha_emision, true)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-xl border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">Último pago registrado</p>
                            {vale.ultimo_pago ? (
                                <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto</p>
                                        <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.ultimo_pago.monto)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha</p>
                                        <p className="mt-1 font-semibold text-gray-900">{formatDate(vale.ultimo_pago.fecha_pago, true)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Método</p>
                                        <p className="mt-1 font-semibold text-gray-900">{vale.ultimo_pago.metodo_pago}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-gray-500">Este vale todavía no tiene pagos asociados en base de datos.</p>
                            )}
                        </div>
                    </div>

                    {(vale.motivo_reclamo || vale.notas) && (
                        <div className="p-4 border rounded-xl border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">Observaciones</p>
                            {vale.motivo_reclamo && (
                                <p className="mt-3 text-sm text-amber-700">Reclamo: {vale.motivo_reclamo}</p>
                            )}
                            {vale.notas && (
                                <p className="mt-2 text-sm text-gray-600">Notas: {vale.notas}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Index({ distribuidora, resumen, vales = [], filtros = {}, opciones = {}, valeSeleccionado = null }) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        q: filtros.q || '',
        estado: filtros.estado || 'TODOS',
        cliente_id: filtros.cliente_id || '',
        seleccionado: filtros.seleccionado || '',
    });
    const [modalOpen, setModalOpen] = useState(Boolean(valeSeleccionado));

    useEffect(() => {
        setModalOpen(Boolean(valeSeleccionado));
    }, [valeSeleccionado]);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.vales'), { ...form, seleccionado: '' }, {
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
        if (Number(valeSeleccionado?.id) === Number(valeId)) {
            setModalOpen(true);
            return;
        }

        const next = { ...form, seleccionado: valeId };
        setForm(next);
        router.get(route('distribuidora.vales'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const closeModal = () => {
        setModalOpen(false);
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
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <h2 className="fin-title">Listado de vales</h2>
                                <p className="mt-1 fin-subtitle">
                                    Filtra por estado, cliente o folio. Al seleccionar un vale se abrirá su detalle financiero en una ventana.
                                </p>
                            </div>
                            <Link href={route('distribuidora.vales.create')} className="w-full lg:w-auto fin-btn-primary">
                                Pre vale
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

                    <div className="mt-6 space-y-3">
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
                                    className={`w-full p-4 text-left border rounded-xl transition ${valeSeleccionado?.id === vale.id && modalOpen ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}
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
                </>
            )}

            <ValeDetailModal vale={valeSeleccionado} open={modalOpen} onClose={closeModal} />
        </DistribuidoraLayout>
    );
}
