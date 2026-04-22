import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faPlus, faXmark, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber } from './utils';

export default function MisClientes({ distribuidora, resumen, clientes = [], filtros = {} }) {
    const [form, setForm] = useState({ q: filtros.q || '', estado_relacion: filtros.estado_relacion || 'TODOS', elegibilidad: filtros.elegibilidad || 'TODOS' });
    const [showFilters, setShowFilters] = useState(false);
    const [clienteSel, setClienteSel] = useState(null);

    // Cerrar modal al navegar (click en barra de navegación, links, router.visit)
    useEffect(() => {
        const unsubscribe = router.on('start', () => {
            setClienteSel(null);
            setShowFilters(false);
        });
        return unsubscribe;
    }, []);

    // Cerrar modal con tecla Escape + bloquear scroll de fondo
    useEffect(() => {
        if (!clienteSel) return;
        const handle = (ev) => { if (ev.key === 'Escape') setClienteSel(null); };
        window.addEventListener('keydown', handle);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
    }, [clienteSel]);

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
                            <button
                                key={cliente.id}
                                type="button"
                                onClick={() => setClienteSel(cliente)}
                                className="flex items-center justify-between w-full p-3 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                            >
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
                            </button>
                        ))
                    )}
                </div>

                {/* Modal detalle del cliente */}
                {clienteSel && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setClienteSel(null)}>
                        <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-bold ${
                                        clienteSel.puede_solicitar_vale
                                            ? 'bg-green-100 text-green-700'
                                            : clienteSel.bloqueado_por_parentesco
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {iniciales(clienteSel.nombre)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{clienteSel.nombre}</p>
                                        <p className="text-xs text-gray-500 truncate">{clienteSel.codigo_cliente}</p>
                                    </div>
                                </div>
                                <button onClick={() => setClienteSel(null)} className="p-1 text-gray-400">
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Estado general */}
                                <div className={`p-3 border rounded-xl flex items-center gap-3 ${
                                    clienteSel.puede_solicitar_vale ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <FontAwesomeIcon
                                        icon={clienteSel.puede_solicitar_vale ? faCircleCheck : faTriangleExclamation}
                                        className={`w-6 h-6 flex-shrink-0 ${clienteSel.puede_solicitar_vale ? 'text-green-600' : 'text-amber-600'}`}
                                    />
                                    <div>
                                        <p className={`text-sm font-bold ${clienteSel.puede_solicitar_vale ? 'text-green-800' : 'text-amber-800'}`}>
                                            {clienteSel.puede_solicitar_vale ? 'Elegible para nuevo vale' : 'No elegible para nuevo vale'}
                                        </p>
                                        <p className="text-[11px] text-gray-600">
                                            {clienteSel.puede_solicitar_vale ? 'Cumple con todas las reglas.' : 'Revisa los motivos abajo.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Motivos de no elegibilidad */}
                                {!clienteSel.puede_solicitar_vale && clienteSel.motivos?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2">Motivos</p>
                                        <ul className="space-y-1">
                                            {clienteSel.motivos.map((motivo, i) => (
                                                <li key={i} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-900">
                                                    <span className="text-amber-600 flex-shrink-0">•</span>
                                                    <span>{motivo}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Datos operativos */}
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Datos</p>
                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                                        <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="font-medium">{clienteSel.estado_cliente}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Vales abiertos</span><span className="font-medium">{formatNumber(clienteSel.vales_abiertos)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Saldo pendiente</span><span className={`font-medium ${clienteSel.saldo_pendiente > 0 ? 'text-amber-700' : ''}`}>{formatCurrency(clienteSel.saldo_pendiente)}</span></div>
                                        {clienteSel.siguiente_vencimiento && (
                                            <div className="flex justify-between"><span className="text-gray-500">Próximo vencimiento</span><span className="font-medium">{formatDate(clienteSel.siguiente_vencimiento)}</span></div>
                                        )}
                                        {clienteSel.vinculado_en && (
                                            <div className="flex justify-between"><span className="text-gray-500">Vinculado desde</span><span className="font-medium">{formatDate(clienteSel.vinculado_en)}</span></div>
                                        )}
                                    </div>
                                </div>

                                {/* Acción principal */}
                                {clienteSel.puede_solicitar_vale && (
                                    <Link
                                        href={route('distribuidora.vales.create', { cliente_id: clienteSel.id })}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white rounded-xl font-medium"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                                        Crear vale para este cliente
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}