import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSearch, faCheck, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

function ReportarPagoModal({ partida, open, onClose }) {
    const [reportando, setReportando] = useState(false);
    const today = useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const pagoForm = useForm({
        monto: '',
        metodo_pago: 'TRANSFERENCIA',
        referencia_reportada: '',
        fecha_pago: today,
    });

    useEffect(() => {
        if (!open) return;
        const handle = (ev) => { if (ev.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        if (!partida || !open) return;
        pagoForm.clearErrors();
        pagoForm.setData({
            monto: Number(partida.monto_total_linea || 0).toFixed(2),
            metodo_pago: 'TRANSFERENCIA',
            referencia_reportada: `PAGO-${partida.vale_numero}`,
            fecha_pago: today,
        });
    }, [partida?.id, open]);

    if (!open || !partida) return null;

    const montoNum = parseFloat(pagoForm.data.monto) || 0;
    const montoMaximo = Number(partida.monto_total_linea || 0);
    const esAtrasado = Boolean(partida.es_atraso);
    const tieneRecargo = Number(partida.monto_recargo || 0) > 0;
    const montoInvalido = montoNum <= 0 || montoNum > montoMaximo + 0.01;

    const confirmarReporte = (e) => {
        e?.preventDefault();
        if (montoInvalido || reportando) return;
        const msg = `¿Reportar pago de ${formatCurrency(montoNum)} para ${partida.vale_numero}?`;
        if (!window.confirm(msg)) return;
        setReportando(true);
        pagoForm.post(route('distribuidora.partidas.reportar-pago', partida.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                router.reload({ only: ['partidas'] });
            },
            onError: (errors) => {
                const mensaje = errors?.general || errors?.monto || Object.values(errors || {})[0] || 'No se pudo reportar el pago.';
                window.alert(mensaje);
            },
            onFinish: () => setReportando(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Vale</p>
                        <p className="text-base font-bold text-gray-900">{partida.vale_numero}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {esAtrasado && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700">ATRASO</span>
                        )}
                        <button onClick={onClose} className="p-1 text-gray-400"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-gray-500">Cliente</p><p className="font-medium">{partida.cliente_nombre}</p></div>
                        <div><p className="text-xs text-gray-500">Quincena</p><p className="font-medium">{partida.numero_quincena}/{partida.pagos_totales}</p></div>
                    </div>

                    {esAtrasado && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-2 text-red-700">
                                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
                                <p className="text-xs font-bold">Esta partida está en ATRASO</p>
                            </div>
                            <p className="mt-1 text-xs text-red-600">
                                Recargo aplicado: {formatCurrency(partida.monto_recargo || 0)}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Monto quincenal</p>
                            <p className="font-bold">{formatCurrency(partida.monto_pago)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total con recargo</p>
                            <p className="font-bold text-amber-600">{formatCurrency(partida.monto_total_linea)}</p>
                        </div>
                    </div>

                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
                        <p>Vence: {formatDate(partida.fecha_limite_pago)}</p>
                        <p>Relación: {partida.numero_relacion}</p>
                        {partida.referencia_pago && (
                            <p className="mt-1 font-mono font-bold text-blue-700">
                                Ref: {partida.referencia_pago}
                            </p>
                        )}
                    </div>

                    <form onSubmit={confirmarReporte} className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Monto a reportar</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={montoMaximo.toFixed(2)}
                                value={pagoForm.data.monto}
                                onChange={(e) => pagoForm.setData('monto', e.target.value)}
                                disabled={reportando}
                                placeholder="0.00"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg disabled:bg-gray-100"
                            />
                            {pagoForm.errors.monto && <p className="mt-1 text-[10px] text-red-600">{pagoForm.errors.monto}</p>}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Método de pago</label>
                            <select
                                value={pagoForm.data.metodo_pago}
                                onChange={(e) => pagoForm.setData('metodo_pago', e.target.value)}
                                disabled={reportando}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
                            >
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="DEPOSITO">Depósito</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Referencia</label>
                            <input
                                type="text"
                                value={pagoForm.data.referencia_reportada}
                                onChange={(e) => pagoForm.setData('referencia_reportada', e.target.value)}
                                disabled={reportando}
                                placeholder="Referencia de la transferencia"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
                            />
                            {pagoForm.errors.referencia_reportada && <p className="mt-1 text-[10px] text-red-600">{pagoForm.errors.referencia_reportada}</p>}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Fecha de pago</label>
                            <input
                                type="date"
                                value={pagoForm.data.fecha_pago}
                                onChange={(e) => pagoForm.setData('fecha_pago', e.target.value)}
                                disabled={reportando}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={montoInvalido || reportando}
                            className="w-full py-2.5 text-sm font-bold text-white bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reportando ? 'Reportando...' : 'Confirmar pago'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ReportarPagos({ distribuidora, partidas = [] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);

    const handleSelectPartida = (partida) => {
        if (partida.ya_reportado) return;
        setPartidaSeleccionada(partida);
        setModalOpen(true);
    };

    const groupedByRelacion = useMemo(() => {
        const grupos = {};
        partidas.forEach((p) => {
            const key = p.numero_relacion || 'sin_relacion';
            if (!grupos[key]) {
                grupos[key] = {
                    numero_relacion: key,
                    fecha_limite_pago: p.fecha_limite_pago,
                    referencia_pago: p.referencia_pago,
                    partidas: [],
                };
            }
            grupos[key].partidas.push(p);
        });
        return Object.values(grupos);
    }, [partidas]);

    const stats = useMemo(() => ({
        total: partidas.length,
        pendientes: partidas.filter((p) => !p.ya_reportado).length,
        reportadas: partidas.filter((p) => p.ya_reportado).length,
        atrasadas: partidas.filter((p) => p.es_atraso && !p.ya_reportado).length,
    }), [partidas]);

    useEffect(() => {
        const unsubscribe = router.on('start', () => setModalOpen(false));
        return unsubscribe;
    }, []);

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Reportar pagos" subtitle="No disponible">
                <Head title="Reportar Pagos" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Reportar pagos" subtitle={`${stats.pendientes} pendientes`}>
            <Head title="Reportar Pagos" />

            <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold">{stats.total}</p>
                        <p className="text-[10px] text-gray-500">Total</p>
                    </div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-green-600">{stats.pendientes}</p>
                        <p className="text-[10px] text-gray-500">Pendientes</p>
                    </div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-blue-600">{stats.reportadas}</p>
                        <p className="text-[10px] text-gray-500">Reportadas</p>
                    </div>
                    <div className="p-2 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-red-600">{stats.atrasadas}</p>
                        <p className="text-[10px] text-gray-500">Atrasadas</p>
                    </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700">
                        <span className="font-bold">¿Para qué es esta pantalla?</span> Aquí reportas a la empresa el pago de cada vale que ya pagaste. 
                        Los clientes te pagan a ti → tú reportas aquí → la cajera concilia.
                    </p>
                </div>

                {!partidas.length ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No hay vales pendientes de pago.
                    </div>
                ) : (
                    groupedByRelacion.map((grupo) => (
                        <div key={grupo.numero_relacion} className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <p className="text-sm font-bold text-gray-700">
                                    {grupo.numero_relacion}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Vence: {formatDate(grupo.fecha_limite_pago)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                {grupo.partidas.map((partida) => {
                                    const yaReportado = partida.ya_reportado;
                                    const esAtrasado = partida.es_atraso;

                                    let itemClass = 'bg-white border rounded-xl';
                                    if (yaReportado) {
                                        itemClass += ' border-green-200 bg-green-50';
                                    } else if (esAtrasado) {
                                        itemClass += ' border-red-200';
                                    } else {
                                        itemClass += ' border-gray-200';
                                    }

                                    return (
                                        <button
                                            key={partida.id}
                                            onClick={() => handleSelectPartida(partida)}
                                            disabled={yaReportado}
                                            className={`w-full p-3 text-left ${itemClass} ${!yaReportado ? 'hover:border-green-300' : ''}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {partida.vale_numero}
                                                        </p>
                                                        {yaReportado && (
                                                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-600" />
                                                        )}
                                                        {esAtrasado && !yaReportado && (
                                                            <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-red-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {partida.cliente_nombre} · Q{partida.numero_quincena}/{partida.pagos_totales}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(partida.monto_total_linea)}
                                                    </p>
                                                    {yaReportado ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                            Reportado
                                                        </span>
                                                    ) : esAtrasado ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                            Atraso
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {esAtrasado && Number(partida.monto_recargo) > 0 && (
                                                <p className="mt-1 text-[10px] text-red-600">
                                                    +Recargo: {formatCurrency(partida.monto_recargo)}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}

                <ReportarPagoModal
                    partida={partidaSeleccionada}
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            </div>
        </DistribuidoraLayout>
    );
}