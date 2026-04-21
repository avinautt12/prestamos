import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faPlus, faUser as faUserIcon } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatNumber, statusBadgeClass } from './utils';

export default function MisClientes({ distribuidora, resumen, clientes = [], filtros = {} }) {
    const [form, setForm] = useState({ q: filtros.q || '', estado_relacion: filtros.estado_relacion || 'TODOS', elegibilidad: filtros.elegibilidad || 'TODOS' });
    const [showFilters, setShowFilters] = useState(false);

    const iniciales = (nombre) => {
        if (!nombre) return '?';
        return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    };

    const submitFilters = (e) => {
        e?.preventDefault();
        router.get(route('distribuidora.clientes'), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setForm({ q: '', estado_relacion: 'TODOS', elegibilidad: 'TODOS' });
        setShowFilters(false);
        router.get(route('distribuidora.clientes'), { q: '', estado_relacion: 'TODOS', elegibilidad: 'TODOS' }, { preserveState: true });
    };

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Clientes" subtitle="No disponible">
                <Head title="Clientes" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora asignada.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Mi cartera" subtitle={`${resumen.total} clientes`}>
            <Head title="Mis Clientes" />

            <div className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-xl font-bold text-gray-900">{formatNumber(resumen.total)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Total</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-xl font-bold text-green-600">{formatNumber(resumen.activos)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Activos</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-xl font-bold text-green-600">{formatNumber(resumen.elegibles)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Elegibles</p>
                    </div>
                </div>

                {/* Buscador + Filtro */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={form.q}
                            onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl"
                            placeholder="Buscar cliente..."
                            onKeyDown={(e) => e.key === 'Enter' && submitFilters(e)}
                        />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2.5 border border-gray-200 rounded-xl ${form.estado_relacion !== 'TODOS' || form.elegibilidad !== 'TODOS' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'}`}>
                        <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
                    </button>
                </div>

                {/* Filtros expandidos */}
                {showFilters && (
                    <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Relación</label>
                            <select value={form.estado_relacion} onChange={(e) => setForm((p) => ({ ...p, estado_relacion: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                <option value="TODOS">Todos</option>
                                <option value="ACTIVA">Activas</option>
                                <option value="BLOQUEADA">Bloqueadas</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Elegibilidad</label>
                            <select value={form.elegibilidad} onChange={(e) => setForm((p) => ({ ...p, elegibilidad: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                <option value="TODOS">Todos</option>
                                <option value="ELEGIBLES">Para nuevo vale</option>
                                <option value="CON_SALDO">Con deuda</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={clearFilters} className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Limpiar</button>
                            <button onClick={() => { submitFilters({ preventDefault: () => {} }); setShowFilters(false); }} className="flex-1 py-2 text-sm font-medium text-white bg-green-700 rounded-lg">Aplicar</button>
                        </div>
                    </div>
                )}

                {/* Botón crear vale rápido */}
                <Link href={route('distribuidora.vales.create')} className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white rounded-xl font-medium">
                    <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                    Nuevo cliente
                </Link>

                {/* Lista de clientes */}
                <div className="space-y-2">
                    {!clientes.length ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Sin clientes.</div>
                    ) : (
                        clientes.map((cliente) => (
                            <div key={cliente.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-bold ${
                                        cliente.puede_solicitar_vale
                                            ? 'bg-green-100 text-green-700'
                                            : cliente.bloqueado_por_parentesco
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {iniciales(cliente.nombre)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{cliente.nombre}</p>
                                        <p className="text-xs text-gray-500 truncate">{cliente.codigo_cliente}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {cliente.saldo_pendiente > 0 && (
                                        <span className="text-xs font-bold text-amber-600">{formatCurrency(cliente.saldo_pendiente)}</span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                        cliente.puede_solicitar_vale ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {cliente.puede_solicitar_vale ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DistribuidoraLayout>
    );
}