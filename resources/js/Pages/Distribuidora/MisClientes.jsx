import React, { useMemo, useState } from 'react';
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
    const [filterOpen, setFilterOpen] = useState(false);

    const copiarCodigo = async (codigo) => {
        if (!codigo) {
            return;
        }

        try {
            await navigator.clipboard.writeText(codigo);
            window.alert(`Codigo copiado: ${codigo}`);
        } catch (error) {
            const input = document.createElement('input');
            input.value = codigo;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            window.alert(`Codigo copiado: ${codigo}`);
        }
    };

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.clientes'), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const empty = { q: '', estado_relacion: 'TODOS', elegibilidad: 'TODOS' };
        setForm(empty);
        router.get(route('distribuidora.clientes'), empty, { preserveState: true, preserveScroll: true, replace: true });
        setFilterOpen(false);
    };

    const iniciales = (nombre) => {
        if (!nombre) return '?';
        return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    };

    const filtrosActivos = useMemo(() => {
        let total = 0;
        if (form.estado_relacion !== 'TODOS') total += 1;
        if (form.elegibilidad !== 'TODOS') total += 1;
        if ((form.q || '').trim().length > 0) total += 1;
        return total;
    }, [form]);

    return (
        <DistribuidoraLayout
            title="Clientes"
            subtitle="Tu cartera de clientes y su estado actual."
        >
            <Head title="Clientes" />

            {sinConfig ? (
                <div className="fin-card bg-white/95 backdrop-blur">
                    <p className="fin-title">Tu cuenta todavía no tiene una distribuidora ligada</p>
                    <p className="mt-2 fin-subtitle">Cuando el registro operativo exista, aquí verás tu cartera de clientes.</p>
                </div>
            ) : (
                <>
                    {/* Resumen compacto */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5 fin-enter">
                        <div className="fin-card border-green-100 bg-green-50/50">
                            <p className="text-xs font-medium text-gray-500">Total</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(resumen.total)}</p>
                        </div>
                        <div className="fin-card border-green-100 bg-green-50/60">
                            <p className="text-xs font-medium text-gray-500">Activos</p>
                            <p className="mt-1 text-xl font-bold text-green-600">{formatNumber(resumen.activos)}</p>
                        </div>
                        <div className="fin-card border-rose-100 bg-rose-50/60">
                            <p className="text-xs font-medium text-gray-500">Bloqueados</p>
                            <p className="mt-1 text-xl font-bold text-red-600">{formatNumber(resumen.bloqueados)}</p>
                        </div>
                        <div className="fin-card border-indigo-100 bg-indigo-50/60">
                            <p className="text-xs font-medium text-gray-500">Elegibles</p>
                            <p className="mt-1 text-xl font-bold text-green-600">{formatNumber(resumen.elegibles)}</p>
                        </div>
                        <div className="fin-card border-amber-100 bg-amber-50/60">
                            <p className="text-xs font-medium text-gray-500">Con saldo</p>
                            <p className="mt-1 text-xl font-bold text-amber-600">{formatNumber(resumen.con_saldo)}</p>
                        </div>
                    </div>

                    <form onSubmit={submitFilters} className="mt-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Buscar</label>
                                <input
                                    type="text"
                                    value={form.q}
                                    onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
                                    className="fin-input"
                                    placeholder="Nombre del cliente"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setFilterOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl"
                            >
                                Filtros
                                {filtrosActivos > 0 && (
                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-700 rounded-full">
                                        {filtrosActivos}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button type="submit" className="w-full fin-btn-primary">Aplicar búsqueda</button>
                    </form>

                    {filterOpen && (
                        <div className="fin-modal-backdrop" onClick={() => setFilterOpen(false)}>
                            <div className="fin-modal-sheet max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="fin-modal-head">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Filtros de clientes</h2>
                                        <p className="mt-1 text-sm text-gray-500">Ajusta relación y elegibilidad.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFilterOpen(false)}
                                        className="inline-flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-xl"
                                        aria-label="Cerrar filtros"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="fin-modal-body space-y-4">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Relación</label>
                                        <select value={form.estado_relacion} onChange={(e) => setForm((p) => ({ ...p, estado_relacion: e.target.value }))} className="fin-input">
                                            <option value="TODOS">Todas</option>
                                            <option value="ACTIVA">Activas</option>
                                            <option value="BLOQUEADA">Bloqueadas</option>
                                            <option value="TERMINADA">Terminadas</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Elegibilidad</label>
                                        <select value={form.elegibilidad} onChange={(e) => setForm((p) => ({ ...p, elegibilidad: e.target.value }))} className="fin-input">
                                            <option value="TODOS">Todos</option>
                                            <option value="ELEGIBLES">Elegibles</option>
                                            <option value="OBSERVADOS">Observados</option>
                                            <option value="CON_SALDO">Con saldo</option>
                                            <option value="SIN_DEUDA">Sin deuda</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="fin-modal-foot flex gap-2">
                                    <button type="button" onClick={clearFilters} className="flex-1 fin-btn-secondary">Limpiar</button>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            submitFilters(event);
                                            setFilterOpen(false);
                                        }}
                                        className="flex-1 fin-btn-primary"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista de clientes */}
                    {!clientes.length ? (
                        <div className="flex items-center justify-center p-12 mt-6 border-2 border-gray-200 border-dashed rounded-xl">
                            <p className="text-sm text-gray-400">No hay clientes que cumplan con el filtro actual.</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3 fin-enter">
                            {clientes.map((cliente, index) => (
                                <div key={cliente.id} className="overflow-hidden border rounded-xl border-gray-200 bg-white fin-interactive fin-stagger-item" style={{ animationDelay: `${Math.min(index * 28, 196)}ms` }}>
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold ${cliente.puede_solicitar_vale
                                                ? 'bg-green-100 text-green-700'
                                                : cliente.bloqueado_por_parentesco
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {iniciales(cliente.nombre)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
                                                    <span className={statusBadgeClass(cliente.estado_cliente)}>Cliente: {cliente.estado_cliente}</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-y-1 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center gap-2">
                                                        Codigo cliente: <span className="font-semibold text-gray-700">{cliente.codigo_cliente || 'Sin codigo'}</span>
                                                        {cliente.codigo_cliente && (
                                                            <button
                                                                type="button"
                                                                onClick={() => copiarCodigo(cliente.codigo_cliente)}
                                                                className="inline-flex items-center rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Copiar
                                                            </button>
                                                        )}
                                                    </span>
                                                    <span>Vales abiertos: <span className="font-semibold text-gray-700">{formatNumber(cliente.vales_abiertos)}</span></span>
                                                    <span>Saldo pendiente: <span className="font-semibold text-gray-700">{formatCurrency(cliente.saldo_pendiente)}</span></span>
                                                    {cliente.siguiente_vencimiento && (
                                                        <span>Siguiente vencimiento: <span className="font-semibold text-gray-700">{formatDate(cliente.siguiente_vencimiento)}</span></span>
                                                    )}
                                                    <span>Vinculado: <span className="font-semibold text-gray-700">{formatDate(cliente.vinculado_en)}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <Link href={route('distribuidora.vales', { cliente_id: cliente.id })} className="w-full text-sm fin-btn-secondary">
                                                Ver vales
                                            </Link>
                                            {cliente.puede_solicitar_vale && (
                                                <Link href={route('distribuidora.vales.create')} className="w-full text-sm fin-btn-primary">
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
                                        <div className="px-4 py-2 text-sm border-t bg-green-50 border-green-100 text-green-700">
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


