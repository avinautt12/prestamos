import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSearch, faCheck, faClock, faTriangleExclamation, faFileAlt } from '@fortawesome/free-solid-svg-icons';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Vale</p>
                        <p className="text-lg font-bold text-gray-900">{partida.vale_numero}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {esAtrasado && (
                            <span className="text-xs font-bold px-3 py-1 rounded bg-red-100 text-red-700">ATRASO</span>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold text-gray-900">{partida.cliente_nombre}</p></div>
                        <div><p className="text-sm text-gray-500">Quincena</p><p className="font-semibold text-gray-900">{partida.numero_quincena}/{partida.pagos_totales}</p></div>
                    </div>

                    {esAtrasado && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
                                <p className="text-sm font-semibold">Esta partida está en ATRASO</p>
                            </div>
                            <p className="mt-2 text-sm text-red-600">
                                Recargo aplicado: {formatCurrency(partida.monto_recargo || 0)}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Monto quincenal</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(partida.monto_pago)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total con recargo</p>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(partida.monto_total_linea)}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-500">
                        <p>Vence: {formatDate(partida.fecha_limite_pago)}</p>
                        <p>Relación: {partida.numero_relacion}</p>
                        {partida.referencia_pago && (
                            <p className="mt-2 font-mono font-bold text-blue-700">
                                Ref: {partida.referencia_pago}
                            </p>
                        )}
                    </div>

                    <form onSubmit={confirmarReporte} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500 mb-2 block">Monto a reportar</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={montoMaximo.toFixed(2)}
                                value={pagoForm.data.monto}
                                onChange={(e) => pagoForm.setData('monto', e.target.value)}
                                disabled={reportando}
                                placeholder="0.00"
                                className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg disabled:bg-gray-100"
                            />
                            {pagoForm.errors.monto && <p className="mt-1 text-sm text-red-600">{pagoForm.errors.monto}</p>}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500 mb-2 block">Método de pago</label>
                            <select
                                value={pagoForm.data.metodo_pago}
                                onChange={(e) => pagoForm.setData('metodo_pago', e.target.value)}
                                disabled={reportando}
                                className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg"
                            >
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="DEPOSITO">Depósito</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-500 mb-2 block">Referencia</label>
                            <input
                                type="text"
                                value={pagoForm.data.referencia_reportada}
                                onChange={(e) => pagoForm.setData('referencia_reportada', e.target.value)}
                                disabled={reportando}
                                placeholder="Referencia de la transferencia"
                                className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg"
                            />
                            {pagoForm.errors.referencia_reportada && <p className="mt-1 text-sm text-red-600">{pagoForm.errors.referencia_reportada}</p>}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500 mb-2 block">Fecha de pago</label>
                            <input
                                type="date"
                                value={pagoForm.data.fecha_pago}
                                onChange={(e) => pagoForm.setData('fecha_pago', e.target.value)}
                                disabled={reportando}
                                className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={montoInvalido || reportando}
                            className="w-full py-3 text-base font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Total</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.pendientes}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Pendientes</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{stats.reportadas}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Reportadas</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-red-600">{stats.atrasadas}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Atrasadas</p>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-base text-blue-700">
                        <span className="font-semibold">¿Para qué es esta pantalla?</span> Aquí reportas a la empresa el pago de cada vale que ya pagaste. 
                        Los clientes te pagan a ti → tú reportas aquí → la cajera concilia.
                    </p>
                </div>

                {!partidas.length ? (
                    <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
                        No hay vales pendientes de pago.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedByRelacion.map((grupo) => (
                            <div key={grupo.numero_relacion} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                            <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{grupo.numero_relacion}</p>
                                            <p className="text-sm text-gray-500">Vence: {formatDate(grupo.fecha_limite_pago)}</p>
                                        </div>
                                    </div>
                                    {grupo.referencia_pago && (
                                        <p className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            Ref: {grupo.referencia_pago}
                                        </p>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {grupo.partidas.map((partida) => {
                                        const yaReportado = partida.ya_reportado;
                                        const esAtrasado = partida.es_atraso;

                                        let itemClass = 'p-4 hover:bg-gray-50 transition-colors';
                                        if (yaReportado) {
                                            itemClass += ' bg-green-50';
                                        } else if (esAtrasado) {
                                            itemClass += ' bg-red-50';
                                        }

                                        return (
                                            <button
                                                key={partida.id}
                                                onClick={() => handleSelectPartida(partida)}
                                                disabled={yaReportado}
                                                className={`w-full text-left ${itemClass}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                                            <FontAwesomeIcon icon={yaReportado ? faCheck : (esAtrasado ? faClock : faFileAlt)} className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-base font-semibold text-gray-900">
                                                                    {partida.vale_numero}
                                                                </p>
                                                                {esAtrasado && !yaReportado && (
                                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                                        ATRASO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500">
                                                                {partida.cliente_nombre} · Q{partida.numero_quincena}/{partida.pagos_totales}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-4">
                                                        <div>
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {formatCurrency(partida.monto_total_linea)}
                                                            </p>
                                                            {esAtrasado && Number(partida.monto_recargo) > 0 && (
                                                                <p className="text-sm text-red-600">
                                                                    +Recargo: {formatCurrency(partida.monto_recargo)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {yaReportado ? (
                                                            <span className="text-sm font-bold px-3 py-1 rounded bg-green-100 text-green-700">
                                                                Reportado
                                                            </span>
                                                        ) : esAtrasado ? (
                                                            <span className="text-sm font-bold px-3 py-1 rounded bg-red-100 text-red-700">
                                                                Atraso
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-bold px-3 py-1 rounded bg-gray-100 text-gray-700">
                                                                Pendiente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
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