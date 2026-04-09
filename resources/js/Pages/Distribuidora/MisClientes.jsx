import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

export default function MisClientes({ distribuidora, resumen, clientes = [], filtros = {} }) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        q: filtros.q || '',
        estado_relacion: filtros.estado_relacion || 'TODOS',
        elegibilidad: filtros.elegibilidad || 'TODOS',
    });

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.clientes'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty = { q: '', estado_relacion: 'TODOS', elegibilidad: 'TODOS' };
        setForm(empty);
        router.get(route('distribuidora.clientes'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DistribuidoraLayout
            title="Mis Clientes"
            subtitle="Cartera activa y estado resumido de cada cliente ligado a tu distribuidora."
        >
            <Head title="Mis Clientes" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Tu cuenta todavía no tiene una distribuidora ligada</p>
                    <p className="mt-2 fin-subtitle">Cuando el registro operativo exista, aquí verás tu cartera de clientes.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Total de clientes</p>
                            <p className="fin-stat-value">{formatNumber(resumen.total)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Relaciones activas</p>
                            <p className="fin-stat-value">{formatNumber(resumen.activos)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Relaciones bloqueadas</p>
                            <p className="fin-stat-value">{formatNumber(resumen.bloqueados)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Elegibles para vale</p>
                            <p className="fin-stat-value">{formatNumber(resumen.elegibles)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Clientes con saldo</p>
                            <p className="fin-stat-value">{formatNumber(resumen.con_saldo)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="fin-title">Listado de clientes</h2>
                                <p className="mt-1 fin-subtitle">Consulta cartera, elegibilidad para pre vale, bloqueo por parentesco y saldos vigentes.</p>
                            </div>
                            <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:min-w-[720px]">
                                <div>
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar</label>
                                    <input
                                        type="text"
                                        value={form.q}
                                        onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                        className="fin-input"
                                        placeholder="Nombre o código"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Relación</label>
                                    <select
                                        value={form.estado_relacion}
                                        onChange={(event) => setForm((prev) => ({ ...prev, estado_relacion: event.target.value }))}
                                        className="fin-input"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="ACTIVA">Activas</option>
                                        <option value="BLOQUEADA">Bloqueadas</option>
                                        <option value="TERMINADA">Terminadas</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Elegibilidad</label>
                                    <select
                                        value={form.elegibilidad}
                                        onChange={(event) => setForm((prev) => ({ ...prev, elegibilidad: event.target.value }))}
                                        className="fin-input"
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="ELEGIBLES">Elegibles</option>
                                        <option value="OBSERVADOS">Observados</option>
                                        <option value="CON_SALDO">Con saldo</option>
                                        <option value="SIN_DEUDA">Sin deuda</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                                    <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                                </div>
                            </form>
                        </div>

                        {!clientes.length ? (
                            <p className="mt-4 text-sm text-gray-500">No hay clientes que cumplan con el filtro actual.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {clientes.map((cliente) => (
                                    <div key={cliente.id} className="p-4 border rounded-xl border-gray-200">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                                                    {cliente.puede_solicitar_vale ? (
                                                        <span className="fin-badge fin-badge-approved">LISTO PARA PRE VALE</span>
                                                    ) : (
                                                        <span className="fin-badge fin-badge-pending">REVISAR ANTES DEL PRE VALE</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={statusBadgeClass(cliente.estado_relacion)}>Relación: {cliente.estado_relacion}</span>
                                                <span className={statusBadgeClass(cliente.estado_cliente)}>Cliente: {cliente.estado_cliente}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-4">
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Vales abiertos</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatNumber(cliente.vales_abiertos)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo pendiente</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(cliente.saldo_pendiente)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Vinculado</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(cliente.vinculado_en)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Siguiente vencimiento</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(cliente.siguiente_vencimiento)}</p>
                                            </div>
                                        </div>

                                        {cliente.bloqueado_por_parentesco && (
                                            <div className="p-3 mt-4 border rounded-xl border-amber-200 bg-amber-50">
                                                <p className="text-sm font-semibold text-amber-800">Relación bloqueada por parentesco</p>
                                                <p className="mt-1 text-sm text-amber-700">{cliente.observaciones_parentesco || 'Se marcó como relación sensible para revisión.'}</p>
                                            </div>
                                        )}

                                        {!cliente.puede_solicitar_vale && !cliente.bloqueado_por_parentesco && cliente.saldo_pendiente > 0 && (
                                            <div className="p-3 mt-4 border rounded-xl border-blue-200 bg-blue-50">
                                                <p className="text-sm font-semibold text-blue-800">Cliente con deuda vigente</p>
                                                <p className="mt-1 text-sm text-blue-700">Antes de levantar un nuevo pre vale, revisa los vales abiertos y el saldo pendiente de este cliente.</p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <Link
                                                href={route('distribuidora.vales', { cliente_id: cliente.id })}
                                                className="fin-btn-secondary"
                                            >
                                                Ver vales
                                            </Link>
                                            {cliente.puede_solicitar_vale && (
                                                <Link
                                                    href={route('distribuidora.vales.create')}
                                                    className="fin-btn-primary"
                                                >
                                                    Pre vale
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
