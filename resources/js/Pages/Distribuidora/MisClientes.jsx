import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faPlus, faXmark, faCircleCheck, faTriangleExclamation, faUsers } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber } from './utils';

export default function MisClientes({ distribuidora, resumen, clientes = [], filtros = {} }) {
    const [form, setForm] = useState({ q: filtros.q || '', estado_relacion: filtros.estado_relacion || 'TODOS', elegibilidad: filtros.elegibilidad || 'TODOS' });
    const [showFilters, setShowFilters] = useState(false);
    const [clienteSel, setClienteSel] = useState(null);

    useEffect(() => {
        const unsubscribe = router.on('start', () => {
            setClienteSel(null);
            setShowFilters(false);
        });
        return unsubscribe;
    }, []);

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

            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-gray-900">{formatNumber(resumen.total)}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Total</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-green-600">{formatNumber(resumen.activos)}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Activos</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-green-600">{formatNumber(resumen.elegibles)}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Elegibles</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={form.q}
                            onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
                            className="w-full pl-11 pr-4 py-3 text-base border border-gray-200 rounded-lg"
                            placeholder="Buscar cliente por nombre, código..."
                            onKeyDown={(e) => e.key === 'Enter' && submitFilters(e)}
                        />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3 border border-gray-200 rounded-lg ${form.estado_relacion !== 'TODOS' || form.elegibilidad !== 'TODOS' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'}`}>
                        <FontAwesomeIcon icon={faFilter} className="w-5 h-5" />
                    </button>
                </div>

                {showFilters && (
                    <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Relación</label>
                                <select value={form.estado_relacion} onChange={(e) => setForm((p) => ({ ...p, estado_relacion: e.target.value }))} className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg">
                                    <option value="TODOS">Todos</option>
                                    <option value="ACTIVA">Activas</option>
                                    <option value="BLOQUEADA">Bloqueadas</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Elegibilidad</label>
                                <select value={form.elegibilidad} onChange={(e) => setForm((p) => ({ ...p, elegibilidad: e.target.value }))} className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg">
                                    <option value="TODOS">Todos</option>
                                    <option value="ELEGIBLES">Para nuevo vale</option>
                                    <option value="CON_SALDO">Con deuda</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={clearFilters} className="flex-1 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Limpiar</button>
                            <button onClick={() => { submitFilters({ preventDefault: () => {} }); setShowFilters(false); }} className="flex-1 py-2.5 text-base font-medium text-white bg-green-700 rounded-lg hover:bg-green-800">Aplicar</button>
                        </div>
                    </div>
                )}

                <Link href={route('distribuidora.vales.create')} className="flex items-center justify-center gap-3 w-full py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-colors">
                    <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
                    Nuevo cliente
                </Link>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {!clientes.length ? (
                        <div className="p-12 text-center text-gray-400">Sin clientes registrados.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {clientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    type="button"
                                    onClick={() => setClienteSel(cliente)}
                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-base font-bold ${
                                                cliente.puede_solicitar_vale
                                                    ? 'bg-green-100 text-green-700'
                                                    : cliente.bloqueado_por_parentesco
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {iniciales(cliente.nombre)}
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-900">{cliente.nombre}</p>
                                                <p className="text-sm text-gray-500">{cliente.codigo_cliente}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {cliente.saldo_pendiente > 0 && (
                                                <span className="text-base font-bold text-amber-600">{formatCurrency(cliente.saldo_pendiente)}</span>
                                            )}
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                                cliente.puede_solicitar_vale ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {cliente.puede_solicitar_vale ? '✓ Elegible' : '✗ No elegible'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {clienteSel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setClienteSel(null)}>
                        <div className="w-full max-w-2xl bg-white rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-base font-bold ${
                                        clienteSel.puede_solicitar_vale
                                            ? 'bg-green-100 text-green-700'
                                            : clienteSel.bloqueado_por_parentesco
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {iniciales(clienteSel.nombre)}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{clienteSel.nombre}</p>
                                        <p className="text-sm text-gray-500">{clienteSel.codigo_cliente}</p>
                                    </div>
                                </div>
                                <button onClick={() => setClienteSel(null)} className="p-2 text-gray-400 hover:text-gray-600">
                                    <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className={`p-4 border rounded-xl flex items-center gap-4 ${
                                    clienteSel.puede_solicitar_vale ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <FontAwesomeIcon
                                        icon={clienteSel.puede_solicitar_vale ? faCircleCheck : faTriangleExclamation}
                                        className={`w-8 h-8 flex-shrink-0 ${clienteSel.puede_solicitar_vale ? 'text-green-600' : 'text-amber-600'}`}
                                    />
                                    <div>
                                        <p className={`text-lg font-bold ${clienteSel.puede_solicitar_vale ? 'text-green-800' : 'text-amber-800'}`}>
                                            {clienteSel.puede_solicitar_vale ? 'Elegible para nuevo vale' : 'No elegible para nuevo vale'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {clienteSel.puede_solicitar_vale ? 'Cumple con todas las reglas.' : 'Revisa los motivos abajo.'}
                                        </p>
                                    </div>
                                </div>

                                {!clienteSel.puede_solicitar_vale && clienteSel.motivos?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Motivos de no elegibilidad</p>
                                        <ul className="space-y-2">
                                            {clienteSel.motivos.map((motivo, i) => (
                                                <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-900">
                                                    <span className="text-amber-600 flex-shrink-0 mt-0.5">•</span>
                                                    <span>{motivo}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Datos operativos</p>
                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm space-y-2">
                                        <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="font-medium text-gray-900">{clienteSel.estado_cliente}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Vales abiertos</span><span className="font-medium text-gray-900">{formatNumber(clienteSel.vales_abiertos)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Saldo pendiente</span><span className={`font-medium ${clienteSel.saldo_pendiente > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{formatCurrency(clienteSel.saldo_pendiente)}</span></div>
                                        {clienteSel.siguiente_vencimiento && (
                                            <div className="flex justify-between"><span className="text-gray-500">Próximo vencimiento</span><span className="font-medium text-gray-900">{formatDate(clienteSel.siguiente_vencimiento)}</span></div>
                                        )}
                                        {clienteSel.vinculado_en && (
                                            <div className="flex justify-between"><span className="text-gray-500">Vinculado desde</span><span className="font-medium text-gray-900">{formatDate(clienteSel.vinculado_en)}</span></div>
                                        )}
                                    </div>
                                </div>

                                {clienteSel.puede_solicitar_vale && (
                                    <Link
                                        href={route('distribuidora.vales.create', { cliente_id: clienteSel.id })}
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
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