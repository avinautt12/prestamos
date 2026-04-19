import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faMoneyBillWave, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from '../utils';

const ESTADOS_PAGABLES = ['ACTIVO', 'PAGO_PARCIAL', 'PAGADO', 'MOROSO'];

function ValeDetailModal({ vale, open, onClose }) {
    const [cancelando, setCancelando] = useState(false);
    const [tipoPago, setTipoPago] = useState('COMPLETO');
    const [revirtiendoId, setRevirtiendoId] = useState(null);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const estaEnEstadoPagable = Boolean(vale) && ESTADOS_PAGABLES.includes(vale?.estado);
    const puedePagar = Boolean(vale?.puede_registrar_pago);
    const pagoBloqueadoPorPeriodo = estaEnEstadoPagable && !puedePagar;
    const saldoActual = Number(vale?.saldo_actual || 0);
    const montoQuincenal = Number(vale?.monto_quincenal || 0);
    const completoDisponible = montoQuincenal > 0 && saldoActual >= montoQuincenal - 0.009;

    const pagoForm = useForm({
        monto: '',
        fecha_pago: today,
        notas: '',
    });

    useEffect(() => {
        if (!vale) return;
        const tipoInicial = completoDisponible ? 'COMPLETO' : 'LIQUIDAR';
        const montoInicial = tipoInicial === 'COMPLETO'
            ? montoQuincenal.toFixed(2)
            : saldoActual.toFixed(2);
        setTipoPago(tipoInicial);
        pagoForm.clearErrors();
        pagoForm.setData({
            monto: montoInicial,
            fecha_pago: today,
            notas: '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vale?.id, vale?.saldo_actual]);

    const switchTipoPago = (nuevo) => {
        setTipoPago(nuevo);
        pagoForm.clearErrors('monto');
        if (nuevo === 'COMPLETO') {
            pagoForm.setData('monto', montoQuincenal.toFixed(2));
        } else if (nuevo === 'LIQUIDAR') {
            pagoForm.setData('monto', saldoActual.toFixed(2));
        } else {
            pagoForm.setData('monto', '');
        }
    };

    const montoNum = parseFloat(pagoForm.data.monto) || 0;
    const saldoDespues = Math.max(0, Number((saldoActual - montoNum).toFixed(2)));
    let estadoPrevisto;
    if (saldoDespues <= 0.009) {
        estadoPrevisto = 'LIQUIDADO';
    } else if (vale?.estado === 'MOROSO') {
        estadoPrevisto = 'MOROSO';
    } else if (montoQuincenal > 0 && montoNum >= montoQuincenal - 0.009) {
        estadoPrevisto = 'PAGADO';
    } else {
        estadoPrevisto = 'PAGO_PARCIAL';
    }
    const montoInvalido = !pagoForm.data.monto || montoNum <= 0 || montoNum > saldoActual + 0.009;

    const cancelarVale = () => {
        if (!window.confirm('¿Seguro que deseas cancelar este vale? Esta acción no se puede deshacer.')) return;
        setCancelando(true);
        router.post(route('distribuidora.vales.cancelar', vale.id), {}, {
            onFinish: () => {
                setCancelando(false);
                onClose();
            },
        });
    };

    const registrarPago = (event) => {
        event?.preventDefault();
        if (!puedePagar || montoInvalido || pagoForm.processing) return;
        const mensaje = `¿Registrar pago de ${formatCurrency(montoNum)} al vale ${vale.numero_vale}?`;
        if (!window.confirm(mensaje)) return;
        pagoForm.post(route('distribuidora.vales.pagos.store', vale.id), {
            preserveScroll: true,
            onSuccess: () => {
                setTipoPago('COMPLETO');
            },
        });
    };

    const revertirPago = (pago) => {
        const mensaje = `¿Deshacer el pago de ${formatCurrency(pago.monto)} del ${formatDate(pago.fecha_pago)}?`;
        if (!window.confirm(mensaje)) return;
        const motivo = window.prompt('Motivo de la reversa (opcional):') || '';
        setRevirtiendoId(pago.id);
        router.post(route('distribuidora.pagos.revertir', pago.id), { motivo }, {
            preserveScroll: true,
            onFinish: () => setRevirtiendoId(null),
        });
    };

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

    const pagos = Array.isArray(vale.pagos) ? vale.pagos : [];

    return (
        <div className="fin-modal-backdrop" onClick={onClose}>
            <div className="fin-modal-sheet max-w-3xl" onClick={(event) => event.stopPropagation()}>
                <div className="fin-modal-head">
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

                <div className="fin-modal-body space-y-5">
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

                    <div className="p-4 border rounded-xl border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">Condiciones congeladas</p>
                        <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
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

                    {pagoBloqueadoPorPeriodo && (
                        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50/60">
                            <div className="flex items-start gap-2">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="mt-0.5 text-amber-700" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">Ya registraste un pago este corte</p>
                                    <p className="mt-1 text-xs text-amber-800">Solo se permite un pago por vale entre cortes. Podrás registrar el siguiente cuando se ejecute el próximo corte.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {puedePagar && (
                        <form onSubmit={registrarPago} className="p-4 space-y-3 border rounded-xl border-green-200 bg-green-50/40">
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-700" />
                                <p className="text-sm font-semibold text-gray-900">Registrar pago del cliente</p>
                            </div>

                            <div className={`grid gap-2 ${completoDisponible ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                <button
                                    type="button"
                                    onClick={() => switchTipoPago('PARCIAL')}
                                    className={`py-2 text-sm font-semibold rounded-lg border transition ${tipoPago === 'PARCIAL' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    Parcial
                                </button>
                                {completoDisponible && (
                                    <button
                                        type="button"
                                        onClick={() => switchTipoPago('COMPLETO')}
                                        className={`py-2 text-sm font-semibold rounded-lg border transition ${tipoPago === 'COMPLETO' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        Completo
                                        <span className="block text-[10px] font-normal opacity-80">({formatCurrency(montoQuincenal)})</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => switchTipoPago('LIQUIDAR')}
                                    className={`py-2 text-sm font-semibold rounded-lg border transition ${tipoPago === 'LIQUIDAR' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    Liquidar
                                    <span className="block text-[10px] font-normal opacity-80">({formatCurrency(saldoActual)})</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={saldoActual.toFixed(2)}
                                        value={pagoForm.data.monto}
                                        onChange={(event) => pagoForm.setData('monto', event.target.value)}
                                        disabled={tipoPago !== 'PARCIAL' || pagoForm.processing}
                                        className="fin-input"
                                        placeholder="0.00"
                                    />
                                    {pagoForm.errors.monto && <p className="mt-1 text-xs text-red-600">{pagoForm.errors.monto}</p>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha del pago</label>
                                    <input
                                        type="date"
                                        max={today}
                                        value={pagoForm.data.fecha_pago}
                                        onChange={(event) => pagoForm.setData('fecha_pago', event.target.value)}
                                        disabled={pagoForm.processing}
                                        className="fin-input"
                                    />
                                    {pagoForm.errors.fecha_pago && <p className="mt-1 text-xs text-red-600">{pagoForm.errors.fecha_pago}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Notas (opcional)</label>
                                <textarea
                                    rows={2}
                                    maxLength={500}
                                    value={pagoForm.data.notas}
                                    onChange={(event) => pagoForm.setData('notas', event.target.value)}
                                    disabled={pagoForm.processing}
                                    className="fin-input"
                                    placeholder="Referencia interna, comentario, etc."
                                />
                                {pagoForm.errors.notas && <p className="mt-1 text-xs text-red-600">{pagoForm.errors.notas}</p>}
                            </div>

                            <div className="p-3 text-sm bg-white border border-gray-200 rounded-lg">
                                <p className="font-semibold text-gray-700">Resumen</p>
                                <p className="mt-1 text-gray-600">Saldo actual: <span className="font-semibold text-gray-900">{formatCurrency(saldoActual)}</span></p>
                                <p className="text-gray-600">Después del pago: <span className="font-semibold text-gray-900">{formatCurrency(saldoDespues)}</span></p>
                                <p className="inline-flex flex-wrap items-center gap-2 text-gray-600">
                                    Nuevo estado:
                                    <span className={statusBadgeClass(estadoPrevisto)}>{estadoPrevisto}</span>
                                </p>
                            </div>

                            {pagoForm.errors.general && <p className="text-sm text-red-600">{pagoForm.errors.general}</p>}

                            <button
                                type="submit"
                                disabled={montoInvalido || pagoForm.processing}
                                className="w-full px-4 py-3 text-sm font-semibold text-white transition bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pagoForm.processing ? 'Registrando...' : 'Registrar pago'}
                            </button>
                        </form>
                    )}

                    {pagos.length > 0 && (
                        <div className="p-4 border rounded-xl border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">Histórico de pagos</p>
                            <div className="mt-3 divide-y divide-gray-100">
                                {pagos.map((pago) => {
                                    const revertido = Boolean(pago.revertido_en);
                                    return (
                                        <div key={pago.id} className={`flex items-center justify-between gap-3 py-3 ${revertido ? 'opacity-60' : ''}`}>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold text-gray-900 ${revertido ? 'line-through' : ''}`}>
                                                    {formatCurrency(pago.monto)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(pago.fecha_pago, true)} · {pago.metodo_pago}
                                                    {pago.es_parcial ? ' · parcial' : ' · completo'}
                                                </p>
                                                {pago.notas && <p className="text-xs italic text-gray-500">"{pago.notas}"</p>}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {revertido ? (
                                                    <span className="fin-badge fin-badge-rejected">Revertido</span>
                                                ) : pago.puede_revertir ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => revertirPago(pago)}
                                                        disabled={revirtiendoId === pago.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <FontAwesomeIcon icon={faRotateLeft} />
                                                        {revirtiendoId === pago.id ? 'Deshaciendo...' : 'Deshacer'}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Cerrado en corte</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {vale.estado === 'BORRADOR' && (
                        <div className="fin-modal-foot flex justify-end">
                            <button
                                type="button"
                                onClick={cancelarVale}
                                disabled={cancelando}
                                className="px-5 py-2 text-sm font-semibold text-white transition bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelando ? 'Cancelando...' : 'Cancelar vale'}
                            </button>
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
    const [filterOpen, setFilterOpen] = useState(false);

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
        setFilterOpen(false);
    };

    const filtrosActivos = useMemo(() => {
        let total = 0;
        if ((form.q || '').trim().length > 0) total += 1;
        if (form.estado !== 'TODOS') total += 1;
        if (form.cliente_id) total += 1;
        return total;
    }, [form]);

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
                <div className="fin-card bg-white/95 backdrop-blur">
                    <p className="fin-title">No se encontró una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás los vales emitidos para tus clientes.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="fin-card border-green-100 bg-green-50/50">
                            <p className="text-sm font-medium text-gray-600">Total visibles</p>
                            <p className="fin-stat-value">{formatNumber(resumen.total)}</p>
                        </div>
                        <div className="fin-card border-green-100 bg-green-50/60">
                            <p className="text-sm font-medium text-gray-600">Activos</p>
                            <p className="fin-stat-value">{formatNumber(resumen.activos)}</p>
                        </div>
                        <div className="fin-card border-indigo-100 bg-indigo-50/60">
                            <p className="text-sm font-medium text-gray-600">Pago parcial</p>
                            <p className="fin-stat-value">{formatNumber(resumen.parciales)}</p>
                        </div>
                        <div className="fin-card border-amber-100 bg-amber-50/60">
                            <p className="text-sm font-medium text-gray-600">Morosos</p>
                            <p className="fin-stat-value">{formatNumber(resumen.morosos)}</p>
                        </div>
                        <div className="fin-card border-rose-100 bg-rose-50/60">
                            <p className="text-sm font-medium text-gray-600">Cancelados</p>
                            <p className="fin-stat-value">{formatNumber(resumen.cancelados)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card bg-white/95 backdrop-blur">
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

                        <form onSubmit={applyFilters} className="mt-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar</label>
                                    <input
                                        type="text"
                                        value={form.q}
                                        onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                        className="fin-input"
                                        placeholder="Número, cliente o producto"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setFilterOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl"
                                >
                                    Filtros
                                    {filtrosActivos > 0 && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-700 rounded-full">
                                            {filtrosActivos}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                                <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                            </div>
                        </form>

                        {filterOpen && (
                            <div className="fin-modal-backdrop" onClick={() => setFilterOpen(false)}>
                                <div className="fin-modal-sheet max-w-md" onClick={(e) => e.stopPropagation()}>
                                    <div className="fin-modal-head">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Filtros de vales</h2>
                                            <p className="mt-1 text-sm text-gray-500">Filtra por estado y cliente.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFilterOpen(false)}
                                            className="inline-flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-xl"
                                            aria-label="Cerrar filtros"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="fin-modal-body space-y-4">
                                        <div>
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

                                        <div>
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
                                    </div>

                                    <div className="fin-modal-foot flex gap-2">
                                        <button type="button" onClick={clearFilters} className="flex-1 fin-btn-secondary">Limpiar</button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                applyFilters(event);
                                                setFilterOpen(false);
                                            }}
                                            className="flex-1 fin-btn-primary"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3 fin-enter">
                        {!vales.length ? (
                            <div className="fin-card">
                                <p className="text-sm text-gray-500">No hay vales que cumplan con el filtro actual.</p>
                            </div>
                        ) : (
                            vales.map((vale, index) => (
                                <button
                                    key={vale.id}
                                    type="button"
                                    onClick={() => selectVale(vale.id)}
                                    className={`w-full p-4 text-left border rounded-xl fin-interactive fin-stagger-item ${valeSeleccionado?.id === vale.id && modalOpen ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{vale.numero_vale}</p>
                                            <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre || 'Cliente sin nombre'} · {vale.producto_nombre || 'Producto no definido'}</p>
                                        </div>
                                        <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-2 md:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto principal</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(vale.monto_principal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo actual</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Avance</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatNumber(vale.pagos_realizados)} / {formatNumber(vale.quincenas_totales)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(vale.fecha_limite_pago)}</p>
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


