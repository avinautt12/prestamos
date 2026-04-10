import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

function Paginator({ currentPage, lastPage, total, onChange, label = 'Página' }) {
    if (lastPage <= 1) return null;
    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2 mt-2 text-xs text-gray-600 border rounded-lg border-gray-200 bg-gray-50">
            <span>{label} {currentPage} de {lastPage} · {formatNumber(total)} en total</span>
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => onChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Anterior
                </button>
                <button
                    type="button"
                    onClick={() => onChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    className="px-3 py-1 font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Siguiente →
                </button>
            </div>
        </div>
    );
}

export default function EstadoCuenta({ distribuidora, resumen, filtros = {}, opciones = {}, relaciones = { data: [], current_page: 1, last_page: 1, total: 0 }, relacionSeleccionada = null, pagos = { data: [], current_page: 1, last_page: 1, total: 0 }, cuentasEmpresa = [] }) {
    const sinConfig = !distribuidora;
    const { errors } = usePage().props;
    const [form, setForm] = useState({
        estado: filtros.estado || 'TODAS',
        q: filtros.q || '',
        relacion_id: filtros.relacion_id || '',
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: 1, pagos_page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const empty = { estado: 'TODAS', q: '', relacion_id: '' };
        setForm(empty);
        router.get(route('distribuidora.estado-cuenta'), empty, { preserveState: true, preserveScroll: true, replace: true });
    };

    const selectRelacion = (relacionId) => {
        const next = { ...form, relacion_id: relacionId, pagos_page: 1 };
        setForm({ ...form, relacion_id: relacionId });
        router.get(route('distribuidora.estado-cuenta'), next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const cambiarPaginaRelaciones = (page) => {
        router.get(route('distribuidora.estado-cuenta'), { ...form, relaciones_page: page }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const cambiarPaginaPagos = (page) => {
        router.get(route('distribuidora.estado-cuenta'), { ...form, pagos_page: page }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const copiarReferencia = async (referencia) => {
        if (!referencia || !navigator?.clipboard) return;
        await navigator.clipboard.writeText(referencia);
        window.dispatchEvent(new CustomEvent('app-notification', {
            detail: { titulo: 'Referencia copiada', mensaje: `Se copió ${referencia} al portapapeles.` },
        }));
    };

    const [canjeInline, setCanjeInline] = useState({ abierto: false, puntos: '' });
    const [canjeando, setCanjeando] = useState(false);
    const puntosDisponibles = distribuidora?.puntos_actuales || 0;
    const puntosNum = parseInt(canjeInline.puntos, 10) || 0;
    const puedeAplicarPuntos = relacionSeleccionada
        && ['GENERADA', 'PARCIAL', 'VENCIDA'].includes(relacionSeleccionada.estado)
        && puntosDisponibles >= 2;
    const valorPorPunto = distribuidora?.valor_punto || 2;
    const puntosMaxRelacion = relacionSeleccionada ? Math.min(puntosDisponibles, Math.floor(relacionSeleccionada.total_a_pagar / valorPorPunto)) : 0;

    const aplicarPuntos = () => {
        if (canjeando || puntosNum < 2) return;
        setCanjeando(true);
        router.post(route('distribuidora.puntos.canjear'), {
            relacion_corte_id: relacionSeleccionada.id,
            puntos_a_canjear: puntosNum,
        }, {
            onSuccess: () => { setCanjeInline({ abierto: false, puntos: '' }); },
            onFinish: () => setCanjeando(false),
        });
    };

    return (
        <DistribuidoraLayout
            title="Estado de Cuenta"
            subtitle="Relaciones de corte, partidas y pagos a empresa."
        >
            <Head title="Estado de Cuenta" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Aún no existe una distribuidora operativa ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando se complete el alta formal, aquí aparecerán tus relaciones y pagos a empresa.</p>
                </div>
            ) : (
                <>
                    {/* Resumen compacto */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Abiertas</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{formatNumber(resumen.relaciones_abiertas)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Pendiente</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(resumen.total_pendiente)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Última relación</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{resumen.ultima_relacion?.numero_relacion || '—'}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Pagos pendientes</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{formatNumber(resumen.pagos_pendientes)}</p>
                        </div>
                    </div>

                    {/* Filtros inline */}
                    <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 mt-6">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Buscar</label>
                            <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="fin-input" placeholder="Número o referencia" />
                        </div>
                        <div className="w-40">
                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Estado</label>
                            <select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className="fin-input">
                                {(opciones.estados || []).map((e) => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 fin-btn-primary">Aplicar</button>
                        <button type="button" onClick={clearFilters} className="px-4 py-2 fin-btn-secondary">Limpiar</button>
                    </form>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-5">
                        {/* Lista de relaciones */}
                        <div className="space-y-2 xl:col-span-2">
                            {!relaciones.data?.length ? (
                                <p className="p-4 text-sm text-gray-500">Sin relaciones con ese filtro.</p>
                            ) : (
                                <>
                                    {relaciones.data.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => selectRelacion(r.id)}
                                            className={`w-full p-3 text-left border rounded-xl transition ${relacionSeleccionada?.id === r.id ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{r.numero_relacion}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(r.fecha_limite_pago)} · {formatNumber(r.partidas_count)} partidas</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={statusBadgeClass(r.estado)}>{r.estado}</span>
                                                    <p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(r.total_a_pagar)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    <Paginator
                                        currentPage={relaciones.current_page}
                                        lastPage={relaciones.last_page}
                                        total={relaciones.total}
                                        onChange={cambiarPaginaRelaciones}
                                    />
                                </>
                            )}
                        </div>

                        {/* Detalle de la relación */}
                        <div className="xl:col-span-3">
                            {!relacionSeleccionada ? (
                                <div className="flex items-center justify-center p-12 border-2 border-gray-200 border-dashed rounded-xl">
                                    <p className="text-sm text-gray-400">Selecciona una relación de la lista</p>
                                </div>
                            ) : (
                                <div className="border rounded-xl border-gray-200 bg-white overflow-hidden">
                                    {/* Header de la relación */}
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-bold text-gray-900">{relacionSeleccionada.numero_relacion}</p>
                                                <p className="text-sm text-gray-500">Generada {formatDate(relacionSeleccionada.generada_en, true)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={statusBadgeClass(relacionSeleccionada.estado)}>{relacionSeleccionada.estado}</span>
                                                <button type="button" onClick={() => copiarReferencia(relacionSeleccionada.referencia_pago)} className="px-3 py-1 text-xs fin-btn-secondary">
                                                    Copiar ref.
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info clave en una sola línea */}
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                                            <span className="text-gray-500">Ref: <span className="font-semibold text-gray-900">{relacionSeleccionada.referencia_pago || '—'}</span></span>
                                            <span className="text-gray-500">Límite: <span className="font-semibold text-gray-900">{formatDate(relacionSeleccionada.fecha_limite_pago)}</span></span>
                                            {relacionSeleccionada.fecha_inicio_pago_anticipado && (
                                                <span className="text-gray-500">Anticipado: <span className="font-semibold text-green-700">{formatDate(relacionSeleccionada.fecha_inicio_pago_anticipado)} — {formatDate(relacionSeleccionada.fecha_fin_pago_anticipado)}</span></span>
                                            )}
                                            <span className="text-gray-500">Crédito: <span className="font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.credito_disponible_snapshot)}</span> / {formatCurrency(relacionSeleccionada.limite_credito_snapshot)}</span>
                                            <span className="text-gray-500">Puntos: <span className="font-semibold text-gray-900">{formatNumber(relacionSeleccionada.puntos_snapshot)}</span></span>
                                        </div>
                                    </div>

                                    {/* Tabla de partidas */}
                                    <div className="p-4">
                                        {!relacionSeleccionada.partidas?.length ? (
                                            <p className="text-sm text-gray-500">Sin partidas ligadas.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="py-2 pr-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                                            <th className="py-2 pr-2 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                                                            <th className="py-2 pr-2 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                                                            <th className="py-2 pr-2 text-center text-xs font-semibold text-gray-500 uppercase">Pagos</th>
                                                            <th className="py-2 pr-2 text-right text-xs font-semibold text-gray-500 uppercase">Comisión</th>
                                                            <th className="py-2 pr-2 text-right text-xs font-semibold text-gray-500 uppercase">Pago</th>
                                                            <th className="py-2 pr-2 text-right text-xs font-semibold text-gray-500 uppercase">Recargos</th>
                                                            <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {relacionSeleccionada.partidas.map((p, i) => (
                                                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                                <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                                                                <td className="py-2 pr-2 font-medium text-gray-900">{p.nombre_producto_snapshot}</td>
                                                                <td className="py-2 pr-2 text-gray-700">{p.cliente_nombre || '—'}</td>
                                                                <td className="py-2 pr-2 text-center text-gray-700">{p.pagos_realizados}/{p.pagos_totales}</td>
                                                                <td className="py-2 pr-2 text-right text-gray-700">{formatCurrency(p.monto_comision)}</td>
                                                                <td className="py-2 pr-2 text-right text-gray-700">{formatCurrency(p.monto_pago)}</td>
                                                                <td className="py-2 pr-2 text-right text-gray-700">{formatCurrency(p.monto_recargo)}</td>
                                                                <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(p.monto_total_linea)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="border-t-2 border-gray-300">
                                                            <td colSpan={4} className="py-3 pr-2 text-right font-semibold text-gray-700">Totales</td>
                                                            <td className="py-3 pr-2 text-right font-semibold">{formatCurrency(relacionSeleccionada.total_comision)}</td>
                                                            <td className="py-3 pr-2 text-right font-semibold">{formatCurrency(relacionSeleccionada.total_pago)}</td>
                                                            <td className="py-3 pr-2 text-right font-semibold">{formatCurrency(relacionSeleccionada.total_recargos)}</td>
                                                            <td className="py-3 text-right text-lg font-bold text-gray-900">{formatCurrency(relacionSeleccionada.total_a_pagar)}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Aplicar puntos */}
                                    {puedeAplicarPuntos && (
                                        <div className="p-4 border-t border-gray-100 bg-amber-50/40">
                                            {!canjeInline.abierto ? (
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-amber-800">
                                                        Tienes <span className="font-bold">{formatNumber(puntosDisponibles)} puntos</span> ({formatCurrency(puntosDisponibles * valorPorPunto)} disponibles)
                                                    </p>
                                                    <button type="button" onClick={() => setCanjeInline({ abierto: true, puntos: '' })} className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-200 rounded-lg hover:bg-amber-300 transition">
                                                        Aplicar puntos
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-semibold text-amber-800">Canjear puntos en esta relación</p>
                                                    <div className="flex items-end gap-3">
                                                        <div className="flex-1">
                                                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Puntos (máx. {formatNumber(puntosMaxRelacion)})</label>
                                                            <input
                                                                type="number"
                                                                value={canjeInline.puntos}
                                                                onChange={(e) => setCanjeInline((p) => ({ ...p, puntos: e.target.value }))}
                                                                className="fin-input"
                                                                min={2}
                                                                max={puntosMaxRelacion}
                                                                placeholder="Ej. 50"
                                                            />
                                                        </div>
                                                        {puntosNum >= 2 && (
                                                            <p className="pb-2 text-sm font-bold text-green-700">= {formatCurrency(puntosNum * valorPorPunto)} descuento</p>
                                                        )}
                                                        <button type="button" onClick={aplicarPuntos} disabled={canjeando || puntosNum < 2} className="px-4 py-2 text-sm fin-btn-primary disabled:opacity-50">
                                                            {canjeando ? 'Aplicando...' : 'Confirmar'}
                                                        </button>
                                                        <button type="button" onClick={() => setCanjeInline({ abierto: false, puntos: '' })} className="px-4 py-2 text-sm fin-btn-secondary">
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                    {(errors?.puntos_a_canjear || errors?.general) && (
                                                        <p className="text-xs text-red-600">{errors?.puntos_a_canjear || errors?.general}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pagos reportados (colapsable, solo si hay) */}
                                    {pagos.total > 0 && (
                                        <div className="p-4 border-t border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-700">Pagos reportados ({pagos.total})</h3>
                                            <div className="mt-2 space-y-2">
                                                {pagos.data.map((pago) => (
                                                    <div key={pago.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-semibold text-gray-900">{formatCurrency(pago.monto)}</p>
                                                            <p className="text-xs text-gray-500">{formatDate(pago.fecha_pago, true)} · {pago.metodo_pago}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <span className={statusBadgeClass(pago.estado)}>{pago.estado}</span>
                                                            {pago.conciliacion_estado && <span className={statusBadgeClass(pago.conciliacion_estado)}>{pago.conciliacion_estado}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Paginator
                                                currentPage={pagos.current_page}
                                                lastPage={pagos.last_page}
                                                total={pagos.total}
                                                onChange={cambiarPaginaPagos}
                                            />
                                        </div>
                                    )}

                                    {/* Cuentas bancarias de la empresa (inline, compacto) */}
                                    {cuentasEmpresa.length > 0 && (
                                        <div className="p-4 border-t border-gray-100 bg-blue-50/40">
                                            <p className="text-xs font-semibold text-blue-800 uppercase">Depositar a</p>
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                {cuentasEmpresa.map((c, i) => (
                                                    <div key={i} className="text-sm">
                                                        <span className="font-semibold text-gray-900">{c.banco}</span>
                                                        {c.convenio && <span className="text-gray-500"> · Conv. {c.convenio}</span>}
                                                        <span className="text-gray-500"> · </span>
                                                        <span className="font-mono text-gray-700">{c.clabe}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
