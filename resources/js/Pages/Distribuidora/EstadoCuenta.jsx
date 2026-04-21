import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

export default function EstadoCuenta({ distribuidora, resumen, filtros = {}, relaciones = { data: [] }, relacionSeleccionada = null, pagos = { data: [] }, cuentasEmpresa = [] }) {
    const [form, setForm] = useState({ estado: filtros.estado || 'TODAS', q: filtros.q || '' });
    const [modalPago, setModalPago] = useState(false);
    const [canjeInline, setCanjeInline] = useState({ abierto: false, puntos: '' });
    const [canjeando, setCanjeando] = useState(false);
    const { errors } = usePage().props;

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

            <div className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-gray-900">{resumen.relaciones_abiertas}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Abiertas</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-amber-600">{formatCurrency(resumen.total_pendiente)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Pendiente</p>
                    </div>
                </div>

                {/* Botón reportar */}
                {puedoReportar && (
                    <button onClick={() => setModalPago(true)} className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white rounded-xl font-medium">
                        <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                        Reportar pago
                    </button>
                )}

                {/* Buscador */}
                <div className="flex gap-2">
                    <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl" placeholder="Buscar..." onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros(e)} />
                    <button onClick={aplicarFiltros} className="px-4 py-2.5 bg-green-700 text-white rounded-xl">
                        <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                    </button>
                </div>

                {/* Lista relaciones */}
                <div className="space-y-2">
                    {!relaciones.data?.length ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Sin relaciones.</div>
                    ) : (
                        relaciones.data.map((rel) => (
                            <button key={rel.id} onClick={() => selectRelacion(rel.id)} className={`w-full p-3 text-left bg-white border rounded-xl ${form.relacion_id == rel.id ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">#{rel.numero_relacion}</p>
                                        <p className="text-xs text-gray-500">Vence: {formatDate(rel.fecha_limite_pago)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(rel.total_a_pagar)}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadgeClass(rel.estado).split(' ').slice(0, 2).join(' ')}`}>
                                            {rel.estado}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Paginator */}
                {relaciones.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {relaciones.current_page > 1 && (
                            <button onClick={() => router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: relaciones.current_page - 1 }, { preserveState: true })} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg">←</button>
                        )}
                        <span className="px-2 py-1.5 text-xs">{relaciones.current_page}/{relaciones.last_page}</span>
                        {relaciones.current_page < relaciones.last_page && (
                            <button onClick={() => router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: relaciones.current_page + 1 }, { preserveState: true })} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg">→</button>
                        )}
                    </div>
                )}

                {/* Detalle selección */}
                {relacionSeleccionada && (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                            <p className="font-bold text-gray-900">#{relacionSeleccionada.numero_relacion}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(relacionSeleccionada.estado).split(' ').slice(0, 2).join(' ')}`}>
                                {relacionSeleccionada.estado}
                            </span>
                        </div>
                        <div className="text-sm space-y-1 mb-3">
                            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-medium">{formatCurrency(relacionSeleccionada.total_a_pagar)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Límite</span><span>{formatDate(relacionSeleccionada.fecha_limite_pago)}</span></div>
                            {relacionSeleccionada.referencia_pago && <div className="flex justify-between"><span className="text-gray-500">Ref.</span><span className="font-mono text-xs">{relacionSeleccionada.referencia_pago}</span></div>}
                        </div>

                        {/* Canje inline */}
                        {puedeAplicarPuntos && puntosDisponibles >= 2 && (
                            <div className="pt-3 border-t border-gray-100">
                                {!canjeInline.abierto ? (
                                    <button onClick={() => setCanjeInline({ abierto: true, puntos: '' })} className="w-full py-2 text-xs font-medium text-green-700 border border-green-200 rounded-lg">Aplicar puntos</button>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" value={canjeInline.puntos} onChange={(e) => setCanjeInline((p) => ({ ...p, puntos: e.target.value }))} placeholder={`Máx ${Math.floor(relacionSeleccionada.total_a_pagar / valorPorPunto)}`} className="flex-1 px-2 py-2 text-sm border border-gray-200 rounded-lg" />
                                        <button onClick={aplicarCanje} disabled={canjeando || puntosNum < 2} className="px-4 py-2 text-xs font-bold text-white bg-green-700 rounded-lg disabled:opacity-50">
                                            {canjeando ? '...' : 'Aplicar'}
                                        </button>
                                        <button onClick={() => setCanjeInline({ abierto: false, puntos: '' })} className="px-2 py-2 text-gray-500">
                                            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagos de la relación */}
                {pagos.data?.length > 0 && relacionSeleccionada && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-2">Pagos</p>
                        <div className="space-y-1">
                            {pagos.data.map((p) => (
                                <div key={p.id} className="flex justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                    <span>{formatCurrency(p.monto)} · {formatDate(p.fecha_pago, true)}</span>
                                    <span className={statusBadgeClass(p.estado)}>{p.estado}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal reportar pago */}
                {modalPago && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setModalPago(false)}>
                        <div className="w-full max-w-md bg-white rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <p className="text-base font-bold text-gray-900 mb-4">Reportar pago</p>
                            {errors?.general && <p className="text-xs text-red-600 mb-2">{errors.general}</p>}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Monto</label>
                                    <input type="number" step="0.01" value={pagoForm.monto} onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Método</label>
                                    <select value={pagoForm.metodo_pago} onChange={(e) => setPagoForm((p) => ({ ...p, metodo_pago: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg">
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="DEPOSITO">Depósito</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Referencia</label>
                                    <input type="text" value={pagoForm.referencia_reportada} onChange={(e) => setPagoForm((p) => ({ ...p, referencia_reportada: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" placeholder="Referencia" />
                                </div>
                                {cuentasEmpresa?.[0] && <p className="text-xs text-gray-500">CLABE: {cuentasEmpresa[0].clabe}</p>}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setModalPago(false)} className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
                                <button onClick={confirmarReporte} disabled={reportando || !pagoForm.monto} className="flex-1 py-3 text-sm font-medium text-white bg-green-700 rounded-lg disabled:opacity-50">
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