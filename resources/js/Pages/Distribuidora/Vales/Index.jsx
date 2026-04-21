import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from '../utils';

const ESTADOS_PAGABLES = ['ACTIVO', 'PAGO_PARCIAL', 'PAGADO', 'MOROSO'];

function ValeDetailModal({ vale, open, onClose }) {
    const [cancelando, setCancelando] = useState(false);
    const [tipoPago, setTipoPago] = useState('COMPLETO');
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const puedePagar = Boolean(vale?.puede_registrar_pago);
    const saldoActual = Number(vale?.saldo_actual || 0);
    const montoQuincenal = Number(vale?.monto_quincenal || 0);
    const acumuladoPeriodo = Number(vale?.acumulado_pagos_periodo || 0);
    const montoCompleto = Math.min(Math.max(0, montoQuincenal - acumuladoPeriodo), saldoActual);

    const pagoForm = useForm({ monto: '', fecha_pago: today, notas: '' });

    useEffect(() => {
        if (!vale) return;
        const tipo = montoCompleto > 0.009 ? 'COMPLETO' : 'LIQUIDAR';
        setTipoPago(tipo);
        pagoForm.setData({ monto: (tipo === 'COMPLETO' ? montoCompleto : saldoActual).toFixed(2), fecha_pago: today, notas: '' });
    }, [vale?.id]);

    const confirmarPago = (e) => {
        e?.preventDefault();
        if (!puedePagar || !pagoForm.data.monto) return;
        if (!window.confirm(`Registrar ${formatCurrency(pagoForm.data.monto)}?`)) return;
        pagoForm.post(route('distribuidora.vales.pagos.store', vale.id), { preserveScroll: true });
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Vale</p>
                        <p className="text-base font-bold text-gray-900">{vale.numero_vale}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusBadgeClass(vale.estado).split(' ').slice(0, 2).join(' ')}`}>{vale.estado}</span>
                        <button onClick={onClose} className="p-1 text-gray-400"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-gray-500">Cliente</p><p className="font-medium">{vale.cliente_nombre}</p></div>
                        <div><p className="text-xs text-gray-500">Producto</p><p className="font-medium">{vale.producto_nombre}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-gray-500">Monto</p><p className="font-bold">{formatCurrency(vale.monto_principal)}</p></div>
                        <div><p className="text-xs text-gray-500">Saldo</p><p className="font-bold text-amber-600">{formatCurrency(saldoActual)}</p></div>
                    </div>
                    <p className="text-xs text-gray-500">{formatNumber(vale.pagos_realizados)}/{formatNumber(vale.quincenas_totales)} pagos · Vence: {formatDate(vale.fecha_limite_pago)}</p>

                    {puedePagar && (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl space-y-3">
                            <p className="text-xs font-bold text-green-700">Registrar pago</p>
                            <div className="flex gap-1">
                                <button onClick={() => setTipoPago('COMPLETO')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${tipoPago === 'COMPLETO' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'}`}>Quincena</button>
                                <button onClick={() => setTipoPago('LIQUIDAR')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${tipoPago === 'LIQUIDAR' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'}`}>Liquidar</button>
                            </div>
                            <input type="number" step="0.01" value={pagoForm.data.monto} onChange={(e) => pagoForm.setData('monto', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                            <button onClick={confirmarPago} disabled={pagoForm.processing || !pagoForm.data.monto} className="w-full py-2.5 text-sm font-bold text-white bg-green-700 rounded-lg disabled:opacity-50">
                                {pagoForm.processing ? 'Registrando...' : 'Confirmar pago'}
                            </button>
                        </div>
                    )}

                    {pagos.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 mb-2">Historial</p>
                            <div className="space-y-1">
                                {pagos.map((p) => (
                                    <div key={p.id} className="flex justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                        <span>{formatCurrency(p.monto)} · {formatDate(p.fecha_pago, true)}</span>
                                        <span className={p.es_parcial ? 'text-amber-600' : 'text-green-600'}>{p.es_parcial ? 'Parcial' : 'Completo'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {vale.estado === 'BORRADOR' && (
                        <button onClick={cancelarVale} disabled={cancelando} className="w-full py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg">
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

            <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center"><p className="text-lg font-bold">{resumen.total}</p><p className="text-[10px] text-gray-500">Total</p></div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center"><p className="text-lg font-bold text-green-600">{resumen.activos}</p><p className="text-[10px] text-gray-500">Activos</p></div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center"><p className="text-lg font-bold text-amber-600">{resumen.parciales}</p><p className="text-[10px] text-gray-500">Parc.</p></div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center"><p className="text-lg font-bold text-red-600">{resumen.morosos}</p><p className="text-[10px] text-gray-500">Mor.</p></div>
                </div>

                <div className="flex gap-2">
                    <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl" placeholder="Buscar..." onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                    <button onClick={applyFilters} className="px-3 py-2.5 bg-green-700 text-white rounded-xl"><FontAwesomeIcon icon={faSearch} className="w-4 h-4" /></button>
                    <Link href={route('distribuidora.vales.create')} className="px-4 py-2.5 bg-green-700 text-white rounded-xl font-medium">+</Link>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
                    {['TODOS', 'ACTIVO', 'PAGO_PARCIAL', 'MOROSO', 'LIQUIDADO'].map((est) => (
                        <button key={est} onClick={() => { setForm((p) => ({ ...p, estado: est })); router.get(route('distribuidora.vales'), { ...form, estado: est }, { preserveState: true }); }} className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${form.estado === est ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {est === 'TODOS' ? 'Todos' : est.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div className="space-y-2">
                    {!vales.length ? <div className="p-8 text-center text-gray-400 text-sm">Sin vales.</div> : (
                        vales.map((vale) => (
                            <button key={vale.id} onClick={() => router.get(route('distribuidora.vales'), { ...form, seleccionado: vale.id }, { preserveState: true })} className={`w-full p-3 text-left bg-white border rounded-xl ${valeSeleccionado?.id === vale.id ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900">{vale.numero_vale}</p>
                                        <p className="text-xs text-gray-500 truncate">{vale.cliente_nombre}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadgeClass(vale.estado).split(' ').slice(0, 2).join(' ')}`}>{vale.estado}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <ValeDetailModal vale={valeSeleccionado} open={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
        </DistribuidoraLayout>
    );
}