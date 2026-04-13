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
        router.get(route('distribuidora.clientes'), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const empty = { q: '', estado_relacion: 'TODOS', elegibilidad: 'TODOS' };
        setForm(empty);
        router.get(route('distribuidora.clientes'), empty, { preserveState: true, preserveScroll: true, replace: true });
    };

    const iniciales = (nombre) => {
        if (!nombre) return '?';
        return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    };

    return (
        <DistribuidoraLayout
            title="Clientes"
            subtitle="Tu cartera de clientes y su estado actual."
        >
            <Head title="Clientes" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Tu cuenta todavía no tiene una distribuidora ligada</p>
                    <p className="mt-2 fin-subtitle">Cuando el registro operativo exista, aquí verás tu cartera de clientes.</p>
                </div>
            ) : (
                <>
                    {/* Resumen compacto */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Total</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(resumen.total)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Activos</p>
                            <p className="mt-1 text-xl font-bold text-green-600">{formatNumber(resumen.activos)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Bloqueados</p>
                            <p className="mt-1 text-xl font-bold text-red-600">{formatNumber(resumen.bloqueados)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Elegibles</p>
                            <p className="mt-1 text-xl font-bold text-blue-600">{formatNumber(resumen.elegibles)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Con saldo</p>
                            <p className="mt-1 text-xl font-bold text-amber-600">{formatNumber(resumen.con_saldo)}</p>
                        </div>
                    </div>

                    {/* Filtros inline */}
                    <form onSubmit={submitFilters} className="flex flex-wrap items-end gap-3 mt-6">
                        <div className="flex-1 min-w-[180px]">
                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Buscar</label>
                            <input
                                type="text"
                                value={form.q}
                                onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
                                className="fin-input"
                                placeholder="Nombre del cliente"
                            />
                        </div>
                        <div className="w-36">
                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Relación</label>
                            <select value={form.estado_relacion} onChange={(e) => setForm((p) => ({ ...p, estado_relacion: e.target.value }))} className="fin-input">
                                <option value="TODOS">Todas</option>
                                <option value="ACTIVA">Activas</option>
                                <option value="BLOQUEADA">Bloqueadas</option>
                                <option value="TERMINADA">Terminadas</option>
                            </select>
                        </div>
                        <div className="w-36">
                            <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Elegibilidad</label>
                            <select value={form.elegibilidad} onChange={(e) => setForm((p) => ({ ...p, elegibilidad: e.target.value }))} className="fin-input">
                                <option value="TODOS">Todos</option>
                                <option value="ELEGIBLES">Elegibles</option>
                                <option value="OBSERVADOS">Observados</option>
                                <option value="CON_SALDO">Con saldo</option>
                                <option value="SIN_DEUDA">Sin deuda</option>
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 fin-btn-primary">Aplicar</button>
                        <button type="button" onClick={clearFilters} className="px-4 py-2 fin-btn-secondary">Limpiar</button>
                    </form>

                    {/* Lista de clientes */}
                    {!clientes.length ? (
                        <div className="flex items-center justify-center p-12 mt-6 border-2 border-gray-200 border-dashed rounded-xl">
                            <p className="text-sm text-gray-400">No hay clientes que cumplan con el filtro actual.</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {clientes.map((cliente) => (
                                <div key={cliente.id} className="overflow-hidden border rounded-xl border-gray-200 bg-white">
                                    <div className="flex items-center gap-4 p-4">
                                        {/* Avatar con iniciales */}
                                        <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold ${
                                            cliente.puede_solicitar_vale
                                                ? 'bg-green-100 text-green-700'
                                                : cliente.bloqueado_por_parentesco
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {iniciales(cliente.nombre)}
                                        </div>

                                        {/* Info principal */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
                                                <span className={statusBadgeClass(cliente.estado_cliente)}>Cliente: {cliente.estado_cliente}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-gray-500">
                                                <span>Vales: <span className="font-semibold text-gray-700">{formatNumber(cliente.vales_abiertos)}</span></span>
                                                <span>Saldo: <span className="font-semibold text-gray-700">{formatCurrency(cliente.saldo_pendiente)}</span></span>
                                                {cliente.siguiente_vencimiento && (
                                                    <span>Vence: <span className="font-semibold text-gray-700">{formatDate(cliente.siguiente_vencimiento)}</span></span>
                                                )}
                                                <span>Desde: <span className="font-semibold text-gray-700">{formatDate(cliente.vinculado_en)}</span></span>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex flex-shrink-0 gap-2">
                                            <Link href={route('distribuidora.vales', { cliente_id: cliente.id })} className="px-3 py-2 text-xs fin-btn-secondary">
                                                Ver vales
                                            </Link>
                                            {cliente.puede_solicitar_vale && (
                                                <Link href={route('distribuidora.vales.create')} className="px-3 py-2 text-xs fin-btn-primary">
                                                    Pre vale
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Alertas (solo si aplica) */}
                                    {cliente.bloqueado_por_parentesco && (
                                        <div className="px-4 py-2 text-sm border-t bg-amber-50 border-amber-100 text-amber-700">
                                            Bloqueado por parentesco — {cliente.observaciones_parentesco || 'Relación sensible marcada para revisión.'}
                                        </div>
                                    )}
                                    {!cliente.puede_solicitar_vale && !cliente.bloqueado_por_parentesco && cliente.saldo_pendiente > 0 && (
                                        <div className="px-4 py-2 text-sm border-t bg-blue-50 border-blue-100 text-blue-700">
                                            Deuda vigente — Debe liquidar antes de solicitar un nuevo pre vale.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </DistribuidoraLayout>
    );
}