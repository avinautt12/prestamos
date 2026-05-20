import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faSearch, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from '../utils';

const ESTADOS_PAGABLES = ['ACTIVO', 'PAGO_PARCIAL', 'PAGADO', 'MOROSO'];

function ValeDetailModal({ vale, open, onClose }) {
    const [cancelando, setCancelando] = useState(false);
    const [tipoPago, setTipoPago] = useState('COMPLETO');
    const today = useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const estaEnEstadoPagable = Boolean(vale) && ESTADOS_PAGABLES.includes(vale?.estado);
    const puedePagar = Boolean(vale?.puede_registrar_pago);
    const pagoBloqueadoPorPeriodo = estaEnEstadoPagable && !puedePagar;

    const saldoActual = Number(vale?.saldo_actual || 0);
    const montoQuincenal = Number(vale?.monto_quincenal || 0);
    const acumuladoPeriodo = Number(vale?.acumulado_pagos_periodo || 0);
    const faltanteQuincena = Math.max(0, Number((montoQuincenal - acumuladoPeriodo).toFixed(2)));
    const montoCompleto = Math.min(faltanteQuincena, saldoActual);
    const completoDisponible = montoCompleto > 0.009;

    const pagoForm = useForm({ monto: '', fecha_pago: today, notas: '' });

    useEffect(() => {
        if (!vale) return;
        const tipoInicial = completoDisponible ? 'COMPLETO' : 'LIQUIDAR';
        setTipoPago(tipoInicial);
        pagoForm.clearErrors();
        pagoForm.setData({
            monto: tipoInicial === 'COMPLETO' ? montoCompleto.toFixed(2) : saldoActual.toFixed(2),
            fecha_pago: today,
            notas: '',
        });
    }, [vale?.id, vale?.saldo_actual, vale?.acumulado_pagos_periodo]);

    const switchTipoPago = (nuevo) => {
        setTipoPago(nuevo);
        pagoForm.clearErrors('monto');
        if (nuevo === 'COMPLETO') pagoForm.setData('monto', montoCompleto.toFixed(2));
        else if (nuevo === 'LIQUIDAR') pagoForm.setData('monto', saldoActual.toFixed(2));
        else pagoForm.setData('monto', '');
    };

    const montoNum = parseFloat(pagoForm.data.monto) || 0;
    const saldoDespues = Math.max(0, Number((saldoActual - montoNum).toFixed(2)));
    const acumuladoDespues = Number((acumuladoPeriodo + montoNum).toFixed(2));
    const cierraQuincena = montoQuincenal > 0 && acumuladoDespues >= montoQuincenal - 0.009;

    let estadoPrevisto;
    if (saldoDespues <= 0.009) estadoPrevisto = 'LIQUIDADO';
    else if (vale?.estado === 'MOROSO') estadoPrevisto = 'MOROSO';
    else if (cierraQuincena) estadoPrevisto = 'PAGADO';
    else estadoPrevisto = 'PAGO_PARCIAL';

    const montoMaxPermitido = tipoPago === 'LIQUIDAR' ? saldoActual : montoCompleto;
    const montoInvalido = !pagoForm.data.monto || montoNum <= 0 || montoNum > montoMaxPermitido + 0.009;

    const confirmarPago = (e) => {
        e?.preventDefault();
        if (!puedePagar || montoInvalido || pagoForm.processing) return;
        const msg = `¿Registrar pago de ${formatCurrency(montoNum)} al vale ${vale.numero_vale}?`;
        if (!window.confirm(msg)) return;
        pagoForm.post(route('distribuidora.vales.pagos.store', vale.id), {
            preserveScroll: true,
            onSuccess: () => {
                setTipoPago('COMPLETO');
                pagoForm.reset('monto', 'notas');
                router.reload({ only: ['vales', 'valeSeleccionado', 'resumenEstados'], preserveScroll: true });
            },
            onError: (errors) => {
                const mensaje = errors?.general || errors?.monto || errors?.fecha_pago || Object.values(errors || {})[0] || 'No se pudo registrar el pago. Intenta de nuevo.';
                window.alert(mensaje);
            },
        });
    };

    const cancelarVale = () => {
        if (!window.confirm('¿Cancelar vale?')) return;
        setCancelando(true);
        router.post(route('distribuidora.vales.cancelar', vale.id), {}, { onFinish: () => { setCancelando(false); onClose(); } });
    };

    useEffect(() => {
        if (!open) return;
        const handle = (ev) => { if (ev.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
    }, [open]);

    if (!open || !vale) return null;
    const pagos = Array.isArray(vale.pagos) ? vale.pagos : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Vale</p>
                        <p className="text-lg font-bold text-gray-900">{vale.numero_vale}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded ${statusBadgeClass(vale.estado).split(' ').slice(0, 2).join(' ')}`}>{vale.estado}</span>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold text-gray-900">{vale.cliente_nombre}</p></div>
                        <div><p className="text-sm text-gray-500">Producto</p><p className="font-semibold text-gray-900">{vale.producto_nombre}</p></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div><p className="text-sm text-gray-500">Monto</p><p className="font-bold text-gray-900">{formatCurrency(vale.monto_principal)}</p></div>
                        <div><p className="text-sm text-gray-500">Saldo</p><p className="font-bold text-amber-600">{formatCurrency(saldoActual)}</p></div>
                        <div><p className="text-sm text-gray-500">Pagos</p><p className="font-semibold text-gray-900">{formatNumber(vale.pagos_realizados)}/{formatNumber(vale.quincenas_totales)}</p></div>
                        <div><p className="text-sm text-gray-500">Vence</p><p className="font-semibold text-gray-900">{formatDate(vale.fecha_limite_pago)}</p></div>
                    </div>

                    {pagoBloqueadoPorPeriodo && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm font-semibold text-amber-900">Pago bloqueado este corte</p>
                            <p className="mt-1 text-sm text-amber-800">
                                Ya se registró un pago que cubre o supera la quincena. Podrás registrar otro cuando se ejecute el próximo corte.
                            </p>
                        </div>
                    )}

                    {puedePagar && (
                        <div className="p-5 bg-green-50 border border-green-200 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-green-700">Registrar pago</p>
                                {acumuladoPeriodo > 0.009 && (
                                    <p className="text-sm text-green-800">
                                        Abonado este corte: <span className="font-bold">{formatCurrency(acumuladoPeriodo)}</span> / {formatCurrency(montoQuincenal)}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => switchTipoPago('PARCIAL')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tipoPago === 'PARCIAL' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Parcial
                                </button>
                                {completoDisponible && (
                                    <button
                                        type="button"
                                        onClick={() => switchTipoPago('COMPLETO')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tipoPago === 'COMPLETO' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Completo ({formatCurrency(montoCompleto)})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => switchTipoPago('LIQUIDAR')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tipoPago === 'LIQUIDAR' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Liquidar ({formatCurrency(saldoActual)})
                                </button>
                            </div>

                            <div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={montoMaxPermitido.toFixed(2)}
                                    value={pagoForm.data.monto}
                                    onChange={(e) => pagoForm.setData('monto', e.target.value)}
                                    disabled={tipoPago !== 'PARCIAL' || pagoForm.processing}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-700"
                                />
                                {tipoPago === 'PARCIAL' && montoCompleto > 0 && (
                                    <p className="mt-1 text-sm text-gray-500">Máx para esta quincena: {formatCurrency(montoCompleto)}</p>
                                )}
                                {pagoForm.errors.monto && <p className="mt-1 text-sm text-red-600">{pagoForm.errors.monto}</p>}
                                {pagoForm.errors.general && <p className="mt-1 text-sm text-red-600">{pagoForm.errors.general}</p>}
                            </div>

                            <div className="p-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 space-y-1">
                                <p>Saldo actual: <span className="font-semibold text-gray-900">{formatCurrency(saldoActual)}</span></p>
                                <p>Después del pago: <span className="font-semibold text-gray-900">{formatCurrency(saldoDespues)}</span></p>
                                <p className="flex items-center gap-2">
                                    Nuevo estado:
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(estadoPrevisto).split(' ').slice(0, 2).join(' ')}`}>{estadoPrevisto}</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={confirmarPago}
                                disabled={montoInvalido || pagoForm.processing}
                                className="w-full py-3 text-base font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pagoForm.processing ? 'Registrando...' : 'Confirmar pago'}
                            </button>
                        </div>
                    )}

                    {pagos.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">Historial de pagos</p>
                            <div className="space-y-2">
                                {pagos.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{formatCurrency(p.monto)} · {formatDate(p.fecha_pago, true)}</span>
                                        <span className={`text-xs font-bold px-3 py-1 rounded ${p.es_parcial ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{p.es_parcial ? 'Parcial' : 'Completo'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {vale.estado === 'BORRADOR' && (
                        <button onClick={cancelarVale} disabled={cancelando} className="w-full py-3 text-base font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                            {cancelando ? 'Cancelando...' : 'Cancelar vale'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Index({ distribuidora, resumen, vales = [], filtros = {}, valeSeleccionado = null }) {
    const [form, setForm] = useState({ q: filtros.q || '', estado: filtros.estado || 'TODOS', seleccionado: '' });
    const [modalOpen, setModalOpen] = useState(Boolean(valeSeleccionado));

    useEffect(() => setModalOpen(Boolean(valeSeleccionado)), [valeSeleccionado]);

    useEffect(() => {
        const unsubscribe = router.on('start', () => setModalOpen(false));
        return unsubscribe;
    }, []);

    const applyFilters = () => router.get(route('distribuidora.vales'), { ...form, seleccionado: '' }, { preserveState: true });
    const clearFilters = () => { setForm({ q: '', estado: 'TODOS', seleccionado: '' }); router.get(route('distribuidora.vales'), { q: '', estado: 'TODOS' }, { preserveState: true }); };

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Vales" subtitle="No disponible">
                <Head title="Vales" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Mis vales" subtitle={`${resumen.total} vales`}>
            <Head title="Vales" />

            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{resumen.total}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{resumen.activos}</p>
                        <p className="text-sm text-gray-500">Activos</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{resumen.parciales}</p>
                        <p className="text-sm text-gray-500">Parciales</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{resumen.morosos}</p>
                        <p className="text-sm text-gray-500">Morosos</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex-1">
                        <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Buscar vale, cliente o producto..." onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                    </div>
                    <button onClick={applyFilters} className="px-5 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800">
                        <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
                    </button>
                    <Link href={route('distribuidora.vales.create')} className="px-5 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800">
                        <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                    </Link>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">¿Para qué es esta pantalla?</span> Aquí registras los pagos que los clientes te hacen en efectivo. 
                        Click en un vale → &quot;Registrar pago&quot;.
                    </p>
                </div>

                <div className="flex gap-2">
                    {[
                        { value: 'TODOS', label: 'Todos' },
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'PAGO_PARCIAL', label: 'Parcial' },
                        { value: 'MOROSO', label: 'Moroso' },
                        { value: 'LIQUIDADO', label: 'Liquidado' },
                    ].map(({ value, label }) => (
                        <button key={value} onClick={() => { setForm((p) => ({ ...p, estado: value })); router.get(route('distribuidora.vales'), { ...form, estado: value }, { preserveState: true }); }} className={`px-4 py-2 text-sm font-medium rounded-lg ${form.estado === value ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {!vales.length ? (
                        <div className="p-12 text-center text-gray-400">Sin vales registrados.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {vales.map((vale) => (
                                <button key={vale.id} onClick={() => router.get(route('distribuidora.vales'), { ...form, seleccionado: vale.id }, { preserveState: true })} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${valeSeleccionado?.id === vale.id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-green-100 text-green-600">
                                                <FontAwesomeIcon icon={faFileAlt} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-900">{vale.numero_vale}</p>
                                                <p className="text-sm text-gray-500">{vale.cliente_nombre} · {vale.producto_nombre}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-lg font-bold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                                <p className="text-sm text-gray-500">{formatNumber(vale.pagos_realizados)}/{formatNumber(vale.quincenas_totales)} pagos</p>
                                            </div>
                                            <span className={`text-sm font-bold px-3 py-1 rounded ${statusBadgeClass(vale.estado).split(' ').slice(0, 2).join(' ')}`}>{vale.estado}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <ValeDetailModal vale={valeSeleccionado} open={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
        </DistribuidoraLayout>
    );
}