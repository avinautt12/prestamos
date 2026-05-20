import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faXmark, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

export default function EstadoCuenta({ distribuidora, resumen, filtros = {}, relaciones = { data: [] }, relacionSeleccionada = null, pagos = { data: [] }, cuentasEmpresa = [] }) {
    const [form, setForm] = useState({ estado: filtros.estado || 'TODAS', q: filtros.q || '' });
    const [modalPago, setModalPago] = useState(false);
    const [detalleOpen, setDetalleOpen] = useState(Boolean(relacionSeleccionada));
    const [canjeInline, setCanjeInline] = useState({ abierto: false, puntos: '' });
    const [canjeando, setCanjeando] = useState(false);
    const { errors } = usePage().props;

    React.useEffect(() => {
        setDetalleOpen(Boolean(relacionSeleccionada));
    }, [relacionSeleccionada?.id]);

    React.useEffect(() => {
        if (!detalleOpen) return;
        const handle = (ev) => { if (ev.key === 'Escape') setDetalleOpen(false); };
        window.addEventListener('keydown', handle);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
    }, [detalleOpen]);

    React.useEffect(() => {
        const unsubscribe = router.on('start', () => {
            setDetalleOpen(false);
            setModalPago(false);
            setCanjeInline({ abierto: false, puntos: '' });
        });
        return unsubscribe;
    }, []);

    const valorPorPunto = distribuidora?.valor_punto || 2;
    const puntosDisponibles = distribuidora?.puntos_actuales || 0;
    const puntosNum = parseInt(canjeInline.puntos, 10) || 0;
    const puedeAplicarPuntos = relacionSeleccionada && ['GENERADA', 'PARCIAL', 'VENCIDA'].includes(relacionSeleccionada.estado);

    const [pagoForm, setPagoForm] = useState({ monto: '', metodo_pago: 'TRANSFERENCIA', referencia_reportada: '', observaciones: '' });
    const [reportando, setReportando] = useState(false);

    const aplicarFiltros = (e) => {
        e?.preventDefault();
        router.get(route('distribuidora.estado-cuenta'), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const selectRelacion = (relacionId) => {
        setDetalleOpen(true);
        router.get(route('distribuidora.estado-cuenta'), { ...form, relacion_id: relacionId }, { preserveState: true, preserveScroll: true });
    };

    const puedoReportar = relacionSeleccionada && ['GENERADA', 'PARCIAL', 'VENCIDA'].includes(relacionSeleccionada.estado);

    const confirmarReporte = () => {
        if (!puedoReportar || !pagoForm.monto) return;
        setReportando(true);
        router.post(route('distribuidora.relaciones.reportar-pago', relacionSeleccionada.id), pagoForm, {
            onSuccess: () => { setModalPago(false); setPagoForm({ monto: '', metodo_pago: 'TRANSFERENCIA', referencia_reportada: '', observaciones: '' }); },
            onFinish: () => setReportando(false),
        });
    };

    const aplicarCanje = () => {
        if (canjeando || !canjeInline.puntos || puntosNum < 2) return;
        setCanjeando(true);
        router.post(route('distribuidora.puntos.canjear'), { relacion_corte_id: relacionSeleccionada.id, puntos_a_canjear: canjeInline.puntos }, {
            onSuccess: () => setCanjeInline({ abierto: false, puntos: '' }),
            onFinish: () => setCanjeando(false),
        });
    };

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Estado cuenta" subtitle="No disponible">
                <Head title="Estado de Cuenta" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Estado cuenta" subtitle={`Pendiente: ${formatCurrency(resumen.total_pendiente)}`}>
            <Head title="Estado de Cuenta" />

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-gray-900">{resumen.relaciones_abiertas}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Abiertas</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-amber-600">{formatCurrency(resumen.total_pendiente)}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Pendiente</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Buscar relación..." onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros(e)} />
                    </div>
                    <button onClick={aplicarFiltros} className="px-5 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800">
                        <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700">Relaciones</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {!relaciones.data?.length ? (
                                <div className="p-8 text-center text-gray-400">Sin relaciones.</div>
                            ) : (
                                relaciones.data.map((rel) => (
                                    <button key={rel.id} onClick={() => selectRelacion(rel.id)} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${form.relacion_id == rel.id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                                    <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">#{rel.numero_relacion}</p>
                                                    <p className="text-xs text-gray-500">Vence: {formatDate(rel.fecha_limite_pago)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-bold text-gray-900">{formatCurrency(rel.total_a_pagar)}</p>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(rel.estado).split(' ').slice(0, 2).join(' ')}`}>
                                                    {rel.estado}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        {relaciones.last_page > 1 && (
                            <div className="p-3 border-t border-gray-100 flex justify-center gap-2">
                                {relaciones.current_page > 1 && (
                                    <button onClick={() => router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: relaciones.current_page - 1 }, { preserveState: true })} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">←</button>
                                )}
                                <span className="px-2 py-1.5 text-xs">{relaciones.current_page}/{relaciones.last_page}</span>
                                {relaciones.current_page < relaciones.last_page && (
                                    <button onClick={() => router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: relaciones.current_page + 1 }, { preserveState: true })} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">→</button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        {detalleOpen && relacionSeleccionada && (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <p className="text-sm text-gray-500">Corte</p>
                                        <p className="text-xl font-bold text-gray-900">#{relacionSeleccionada.numero_relacion}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={route('distribuidora.relaciones.pdf', relacionSeleccionada.id)}
                                            className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                                        >
                                            Descargar PDF
                                        </a>
                                        <span className={`text-sm font-bold px-3 py-1 rounded ${statusBadgeClass(relacionSeleccionada.estado).split(' ').slice(0, 2).join(' ')}`}>
                                            {relacionSeleccionada.estado}
                                        </span>
                                        <button onClick={() => setDetalleOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                                            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {Number(relacionSeleccionada.total_arrastre_recibido) > 0 && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                                            <p className="font-semibold text-amber-800">Esta relación incluye saldo de cortes anteriores</p>
                                            <p className="mt-1 text-amber-700">Arrastre recibido: <span className="font-semibold">{formatCurrency(relacionSeleccionada.total_arrastre_recibido)}</span></p>
                                        </div>
                                    )}

                                    {relacionSeleccionada.estado === 'PAGADA' && relacionSeleccionada.conciliada_anticipada && (
                                        <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-sm font-bold text-green-800 text-center">
                                            ✓ PAGADA · ANTICIPADO (dentro de la ventana de descuento)
                                        </div>
                                    )}
                                    {relacionSeleccionada.estado === 'CERRADA' && relacionSeleccionada.cerrada_por_arrastre_en && (
                                        <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 text-center">
                                            CERRADA · ARRASTRADA al siguiente corte
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Total a pagar</p>
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(relacionSeleccionada.total_a_pagar)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Fecha límite</p>
                                            <p className="text-2xl font-bold text-amber-600">{formatDate(relacionSeleccionada.fecha_limite_pago)}</p>
                                        </div>
                                    </div>

                                    {relacionSeleccionada.referencia_pago && (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs uppercase tracking-wider text-blue-700">Referencia de pago</p>
                                            <p className="mt-1 font-mono text-base font-semibold text-gray-900 break-all">{relacionSeleccionada.referencia_pago}</p>
                                            <p className="mt-1 text-sm text-blue-700">Usa esta referencia al transferir a la empresa.</p>
                                        </div>
                                    )}

                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Anticipado</span>
                                            <span className="text-gray-900">{formatDate(relacionSeleccionada.fecha_inicio_pago_anticipado)} – {formatDate(relacionSeleccionada.fecha_fin_pago_anticipado)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Límite</span>
                                            <span className="text-gray-900">{formatDate(relacionSeleccionada.fecha_limite_pago)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Desglose</p>
                                        <div className="p-4 bg-white border border-gray-100 rounded-xl text-sm space-y-2">
                                            <div className="flex justify-between"><span className="text-gray-500">Pagos de vales</span><span className="font-medium text-gray-900">{formatCurrency(relacionSeleccionada.total_pago)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500">Comisión</span><span className="font-medium text-gray-900">{formatCurrency(relacionSeleccionada.total_comision)}</span></div>
                                            {Number(relacionSeleccionada.total_recargos) > 0 && (
                                                <div className="flex justify-between"><span className="text-gray-500">Recargos</span><span className="font-medium text-red-600">{formatCurrency(relacionSeleccionada.total_recargos)}</span></div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-gray-100">
                                                <span className="font-bold text-gray-900">Total</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(relacionSeleccionada.total_a_pagar)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {(relacionSeleccionada.monto_reportado_acumulado > 0 || relacionSeleccionada.reporte_completo) && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Estado del reporte</p>
                                            <div className={`p-4 border rounded-xl text-sm space-y-2 ${relacionSeleccionada.reporte_completo ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Reportado</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.monto_reportado_acumulado)} / {formatCurrency(relacionSeleccionada.total_a_pagar)}</span>
                                                </div>
                                                {relacionSeleccionada.reporte_completo ? (
                                                    <p className="font-bold text-green-700">✓ Reportado completo, pendiente conciliación</p>
                                                ) : (
                                                    <div className="flex justify-between">
                                                        <span className="text-amber-700 font-medium">Falta por reportar</span>
                                                        <span className="font-bold text-amber-700">{formatCurrency(relacionSeleccionada.monto_pendiente_reportar)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {relacionSeleccionada.partidas?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Vales del corte ({relacionSeleccionada.partidas.length})</p>
                                            <div className="space-y-2">
                                                {relacionSeleccionada.partidas.map((p) => {
                                                    const esAtraso = Boolean(p.es_atraso);
                                                    const wrapperCls = esAtraso
                                                        ? 'p-4 bg-red-50 border border-red-200 rounded-lg'
                                                        : 'p-4 bg-gray-50 rounded-lg';
                                                    const badgeCls = esAtraso
                                                        ? 'inline-block px-2 py-1 rounded text-xs font-bold bg-red-600 text-white'
                                                        : 'inline-block px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-700';

                                                    return (
                                                        <div key={p.id} className={wrapperCls}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex flex-col gap-2">
                                                                    <span className="font-medium text-gray-900">{p.nombre_producto_snapshot || 'Vale'}</span>
                                                                    <span className={badgeCls}>
                                                                        {esAtraso ? `ATRASO Q${p.numero_quincena ?? '?'}` : `Quincena ${p.numero_quincena ?? '?'}/${p.pagos_totales ?? '?'}`}
                                                                    </span>
                                                                </div>
                                                                <span className="font-bold text-gray-900">{formatCurrency(p.monto_total_linea)}</span>
                                                            </div>
                                                            <div className="flex justify-between mt-2 text-sm text-gray-500">
                                                                <span>
                                                                    {formatNumber(p.pagos_realizados)}/{formatNumber(p.pagos_totales)} pagos
                                                                    {esAtraso && p.corte_origen_fecha && (
                                                                        <span className="ml-1 text-red-700">· del corte {formatDate(p.corte_origen_fecha)}</span>
                                                                    )}
                                                                </span>
                                                                <span>
                                                                    {formatCurrency(p.monto_pago)}
                                                                    {Number(p.monto_recargo) > 0 && <span className="text-red-600"> +{formatCurrency(p.monto_recargo)}</span>}
                                                                </span>
                                                            </div>
                                                            {esAtraso && Number(p.quincenas_atrasadas_acumuladas) > 0 && (
                                                                <p className="mt-2 text-sm text-red-700 font-medium">
                                                                    Recargo acumulado por {p.quincenas_atrasadas_acumuladas} corte(s) vencido(s)
                                                                </p>
                                                            )}
                                                            {Number(p.monto_pagado_previo) > 0 && (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    Ya abonado previamente: {formatCurrency(p.monto_pagado_previo)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {pagos.data?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Pagos reportados</p>
                                            <div className="space-y-2">
                                                {pagos.data.map((p) => (
                                                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-700">{formatCurrency(p.monto)} · {formatDate(p.fecha_pago, true)}</span>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded ${statusBadgeClass(p.estado).split(' ').slice(0, 2).join(' ')}`}>{p.estado}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {puedeAplicarPuntos && puntosDisponibles >= 2 && (
                                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                                            <p className="text-sm font-semibold text-green-700 mb-3">Aplicar puntos ({formatNumber(puntosDisponibles)} disponibles)</p>
                                            {!canjeInline.abierto ? (
                                                <button onClick={() => setCanjeInline({ abierto: true, puntos: '' })} className="w-full py-3 text-sm font-medium text-green-700 bg-white border border-green-200 rounded-lg hover:bg-green-50">Aplicar puntos a este corte</button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input type="number" value={canjeInline.puntos} onChange={(e) => setCanjeInline((p) => ({ ...p, puntos: e.target.value }))} placeholder={`Máx ${Math.floor(relacionSeleccionada.total_a_pagar / valorPorPunto)}`} className="flex-1 px-3 py-3 text-base border border-gray-200 rounded-lg" />
                                                    <button onClick={aplicarCanje} disabled={canjeando || puntosNum < 2} className="px-5 py-3 text-sm font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50">
                                                        {canjeando ? '...' : 'Aplicar'}
                                                    </button>
                                                    <button onClick={() => setCanjeInline({ abierto: false, puntos: '' })} className="px-3 py-3 text-gray-500">
                                                        <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {puedoReportar && !relacionSeleccionada.reporte_completo && (
                                        <button
                                            onClick={() => {
                                                setPagoForm((p) => ({
                                                    ...p,
                                                    monto: Number(relacionSeleccionada.monto_pendiente_reportar || 0).toFixed(2),
                                                    referencia_reportada: relacionSeleccionada.referencia_pago || '',
                                                }));
                                                setDetalleOpen(false);
                                                setModalPago(true);
                                            }}
                                            className="flex items-center justify-center gap-3 w-full py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                                            Reportar pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {modalPago && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalPago(false)}>
                        <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Reportar pago</h2>
                                <button onClick={() => setModalPago(false)} className="p-2 text-gray-400 hover:text-gray-600">
                                    <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                                </button>
                            </div>
                            {relacionSeleccionada && (
                                <div className="p-4 mb-4 bg-gray-50 border border-gray-100 rounded-lg text-sm space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500">Total del corte</span><span className="font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.total_a_pagar)}</span></div>
                                    {relacionSeleccionada.monto_reportado_acumulado > 0 && (
                                        <div className="flex justify-between"><span className="text-gray-500">Ya reportado</span><span className="font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.monto_reportado_acumulado)}</span></div>
                                    )}
                                    <div className="flex justify-between pt-1 border-t border-gray-100 mt-1"><span className="font-bold text-amber-700">Pendiente por reportar</span><span className="font-bold text-amber-700">{formatCurrency(relacionSeleccionada.monto_pendiente_reportar)}</span></div>
                                </div>
                            )}
                            {errors?.general && <p className="text-sm text-red-600 mb-4">{errors.general}</p>}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 mb-2 block">Monto (máx {formatCurrency(relacionSeleccionada?.monto_pendiente_reportar || 0)})</label>
                                    <input type="number" step="0.01" min="0.01" max={relacionSeleccionada?.monto_pendiente_reportar || undefined} value={pagoForm.monto} onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 mb-2 block">Método</label>
                                    <select value={pagoForm.metodo_pago} onChange={(e) => setPagoForm((p) => ({ ...p, metodo_pago: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg">
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="DEPOSITO">Depósito</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 mb-2 block">Referencia</label>
                                    <input type="text" value={pagoForm.referencia_reportada} onChange={(e) => setPagoForm((p) => ({ ...p, referencia_reportada: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Referencia" />
                                </div>
                                {cuentasEmpresa?.[0] && <p className="text-sm text-gray-500">CLABE: {cuentasEmpresa[0].clabe}</p>}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModalPago(false)} className="flex-1 py-3 text-base font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                                <button onClick={confirmarReporte} disabled={reportando || !pagoForm.monto} className="flex-1 py-3 text-base font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50">
                                    {reportando ? 'Enviando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}