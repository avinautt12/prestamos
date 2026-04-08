import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

export default function EstadoCuenta({ distribuidora, resumen, filtros = {}, opciones = {}, relaciones = [], relacionSeleccionada = null, pagos = [] }) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        estado: filtros.estado || 'TODAS',
        q: filtros.q || '',
        relacion_id: filtros.relacion_id || '',
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.estado-cuenta'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty = { estado: 'TODAS', q: '', relacion_id: '' };
        setForm(empty);
        router.get(route('distribuidora.estado-cuenta'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const selectRelacion = (relacionId) => {
        const next = { ...form, relacion_id: relacionId };
        setForm(next);
        router.get(route('distribuidora.estado-cuenta'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const copiarReferencia = async (referencia) => {
        if (!referencia || !navigator?.clipboard) {
            return;
        }
        await navigator.clipboard.writeText(referencia);
        window.dispatchEvent(new CustomEvent('app-notification', {
            detail: {
                titulo: 'Referencia copiada',
                mensaje: `Se copió la referencia ${referencia} al portapapeles.`,
            },
        }));
    };

    return (
        <DistribuidoraLayout
            title="Estado de Cuenta"
            subtitle="Relaciones generadas, pagos reportados y estatus de conciliación contra empresa."
        >
            <Head title="Estado de Cuenta" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Aún no existe una distribuidora operativa ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando se complete el alta formal, aquí aparecerán tus relaciones y pagos a empresa.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Relaciones abiertas</p>
                            <p className="fin-stat-value">{formatNumber(resumen.relaciones_abiertas)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Total pendiente</p>
                            <p className="fin-stat-value">{formatCurrency(resumen.total_pendiente)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Última relación</p>
                            <p className="text-base font-bold text-gray-900">{resumen.ultima_relacion?.numero_relacion || 'Sin relaciones'}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Pagos pendientes</p>
                            <p className="fin-stat-value">{formatNumber(resumen.pagos_pendientes)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="fin-title">Filtrar relaciones</h2>
                                <p className="mt-1 fin-subtitle">Busca por número o referencia y selecciona una relación para ver detalle, partidas y pagos ligados.</p>
                            </div>
                            <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:min-w-[760px]">
                                <div className="lg:col-span-2">
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar</label>
                                    <input
                                        type="text"
                                        value={form.q}
                                        onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                        className="fin-input"
                                        placeholder="Número o referencia"
                                    />
                                </div>
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
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                                    <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-5">
                        <div className="space-y-3 xl:col-span-2">
                            {!relaciones.length ? (
                                <div className="fin-card">
                                    <p className="text-sm text-gray-500">Todavía no hay relaciones de corte registradas con ese filtro.</p>
                                </div>
                            ) : (
                                relaciones.map((relacion) => (
                                    <button
                                        key={relacion.id}
                                        type="button"
                                        onClick={() => selectRelacion(relacion.id)}
                                        className={`w-full p-4 text-left border rounded-xl transition ${relacionSeleccionada?.id === relacion.id ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{relacion.numero_relacion}</p>
                                                <p className="mt-1 text-sm text-gray-500">Referencia: {relacion.referencia_pago || 'Sin referencia'}</p>
                                            </div>
                                            <span className={statusBadgeClass(relacion.estado)}>{relacion.estado}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total a pagar</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(relacion.total_a_pagar)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(relacion.fecha_limite_pago)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Pagos ligados</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatNumber(relacion.pagos_count)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Partidas</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatNumber(relacion.partidas_count)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="space-y-4 xl:col-span-3">
                            {!relacionSeleccionada ? (
                                <div className="fin-card">
                                    <p className="text-sm text-gray-500">Selecciona una relación para revisar su detalle, partidas y pagos reportados.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="fin-card">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <h2 className="fin-title">Detalle de la relación</h2>
                                                <p className="mt-1 text-lg font-semibold text-gray-900">{relacionSeleccionada.numero_relacion}</p>
                                                <p className="mt-1 fin-subtitle">Generada {formatDate(relacionSeleccionada.generada_en, true)}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={statusBadgeClass(relacionSeleccionada.estado)}>{relacionSeleccionada.estado}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copiarReferencia(relacionSeleccionada.referencia_pago)}
                                                    className="fin-btn-secondary"
                                                >
                                                    Copiar referencia
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-4">
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Referencia</p>
                                                <p className="mt-1 font-semibold text-gray-900 break-all">{relacionSeleccionada.referencia_pago || 'Sin referencia'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(relacionSeleccionada.fecha_limite_pago)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total pago</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.total_pago)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Recargos</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(relacionSeleccionada.total_recargos)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className="fin-card">
                                            <h3 className="font-semibold text-gray-900">Partidas incluidas</h3>
                                            {!relacionSeleccionada.partidas?.length ? (
                                                <p className="mt-3 text-sm text-gray-500">Esta relación todavía no tiene partidas ligadas.</p>
                                            ) : (
                                                <div className="mt-3 space-y-3">
                                                    {relacionSeleccionada.partidas.map((partida) => (
                                                        <div key={partida.id} className="p-3 border rounded-xl border-gray-200">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{partida.cliente_nombre || 'Cliente sin nombre'}</p>
                                                                    <p className="mt-1 text-sm text-gray-500">{partida.vale_numero || 'Sin vale'} · {partida.nombre_producto_snapshot}</p>
                                                                </div>
                                                                {partida.vale_estado && <span className={statusBadgeClass(partida.vale_estado)}>{partida.vale_estado}</span>}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Pago base</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(partida.monto_pago)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Recargo</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(partida.monto_recargo)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total línea</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(partida.monto_total_linea)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Avance</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{formatNumber(partida.pagos_realizados)} / {formatNumber(partida.pagos_totales)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="fin-card">
                                            <h3 className="font-semibold text-gray-900">Pagos reportados de esta relación</h3>
                                            {!pagos.length ? (
                                                <p className="mt-3 text-sm text-gray-500">Todavía no hay pagos reportados para esta relación.</p>
                                            ) : (
                                                <div className="mt-3 space-y-3">
                                                    {pagos.map((pago) => (
                                                        <div key={pago.id} className="p-3 border rounded-xl border-gray-200">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{formatCurrency(pago.monto)}</p>
                                                                    <p className="mt-1 text-sm text-gray-500">{formatDate(pago.fecha_pago, true)}</p>
                                                                </div>
                                                                <div className="flex flex-wrap justify-end gap-2">
                                                                    <span className={statusBadgeClass(pago.estado)}>{pago.estado}</span>
                                                                    {pago.conciliacion_estado && (
                                                                        <span className={statusBadgeClass(pago.conciliacion_estado)}>{pago.conciliacion_estado}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Método</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{pago.metodo_pago}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Diferencia</p>
                                                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(pago.diferencia_monto)}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Referencia reportada</p>
                                                                    <p className="mt-1 font-semibold text-gray-900 break-all">{pago.referencia_reportada || 'Sin referencia reportada'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
