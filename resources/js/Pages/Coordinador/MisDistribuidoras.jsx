import React, { useState, useEffect, useRef } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';

const estadoColor = {
    ACTIVA: 'bg-green-100 text-green-800',
    MOROSA: 'bg-red-100 text-red-800',
    BLOQUEADA: 'bg-amber-100 text-amber-800',
    INACTIVA: 'bg-gray-100 text-gray-700',
    CANDIDATA: 'bg-blue-100 text-blue-800',
    POSIBLE: 'bg-indigo-100 text-indigo-800',
    CERRADA: 'bg-slate-100 text-slate-700',
};

export default function MisDistribuidoras({ distribuidoras, estadisticas, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [estado, setEstado] = useState(filters?.estado || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(route('coordinador.mis-distribuidoras'), { search, estado }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [search, estado]);

    const buscar = (e) => {
        e.preventDefault();
        router.get(route('coordinador.mis-distribuidoras'), { search, estado }, { preserveState: true, preserveScroll: true });
    };

    const limpiar = () => {
        setSearch('');
        setEstado('');
        router.get(route('coordinador.mis-distribuidoras'), {}, { preserveState: true, preserveScroll: true });
    };

    const totalRegistros = distribuidoras?.total ?? 0;
    const enVista = distribuidoras?.data?.length ?? 0;
    const activasEnVista = (distribuidoras?.data || []).filter((item) => item.estado === 'ACTIVA').length;

    const estadoBorde = {
        ACTIVA: 'border-l-emerald-400',
        MOROSA: 'border-l-rose-400',
        BLOQUEADA: 'border-l-amber-400',
        INACTIVA: 'border-l-gray-400',
        CANDIDATA: 'border-l-blue-400',
        POSIBLE: 'border-l-indigo-400',
        CERRADA: 'border-l-slate-400',
    };

    return (
        <TabletLayout title="Mis Distribuidoras">
            <Head title="Mis Distribuidoras" />

            <div className="max-w-6xl mx-auto space-y-4 tablet-form">
                <div className="fin-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs tracking-wide text-blue-700 uppercase">Coordinación</p>
                            <h1 className="text-xl font-bold text-gray-900">Mis Distribuidoras</h1>
                            <p className="text-sm text-gray-500">Vista compacta para revisar estado, categoría y capacidad de crédito.</p>
                        </div>
                        <Link
                            href={route('coordinador.solicitudes.create')}
                            className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 min-h-[44px]"
                        >
                            + Nueva Solicitud
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-semibold text-gray-900">{totalRegistros}</p>
                        </div>
                        <div className="p-3 border border-emerald-200 rounded-lg bg-emerald-50">
                            <p className="text-xs text-emerald-700">Activas</p>
                            <p className="text-lg font-semibold text-emerald-900">{activasEnVista}</p>
                        </div>
                        <div className="p-3 border border-rose-200 rounded-lg bg-rose-50">
                            <p className="text-xs text-rose-700">Morosas</p>
                            <p className="text-lg font-semibold text-rose-900">{estadisticas?.morosas ?? 0}</p>
                        </div>
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                            <p className="text-xs text-blue-700">En pantalla</p>
                            <p className="text-lg font-semibold text-blue-900">{enVista}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 fin-card">
                    <form onSubmit={buscar} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
                        <div className="md:col-span-2">
                            <label className="block mb-1 text-sm font-medium text-gray-700">Buscar</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre o número de distribuidora"
                                className="fin-input"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Estado</label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="fin-input"
                            >
                                <option value="">Todos los estados</option>
                                <option value="ACTIVA">ACTIVA</option>
                                <option value="MOROSA">MOROSA</option>
                                <option value="BLOQUEADA">BLOQUEADA</option>
                                <option value="INACTIVA">INACTIVA</option>
                            </select>
                        </div>

                        <div className="flex gap-2 md:justify-end">
                            <button type="submit" className="px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 min-h-[44px]">
                                Buscar
                            </button>
                            <button type="button" onClick={limpiar} className="px-4 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 min-h-[44px]">
                                Limpiar
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3">
                    {(distribuidoras?.data || []).length === 0 ? (
                        <div className="p-6 text-sm text-center text-gray-500 fin-card">
                            No se encontraron distribuidoras con esos filtros.
                        </div>
                    ) : (distribuidoras.data.map((dist) => {
                        const persona = dist.persona || {};
                        const estadoBadge = estadoColor[dist.estado] || 'bg-gray-100 text-gray-700';
                        const estadoLinea = estadoBorde[dist.estado] || 'border-l-gray-300';

                        return (
                            <div key={dist.id} className={`group cursor-pointer p-4 transition border border-gray-200 border-l-4 rounded-xl bg-white hover:shadow-md ${estadoLinea}`}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500">Registro #{dist.id}</p>
                                        <p className="font-semibold text-gray-900">
                                            {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            No. Distribuidora: {dist.numero_distribuidora || 'Sin asignar'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoBadge}`}>{dist.estado}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 mt-2 text-sm md:grid-cols-3">
                                    <div>
                                        <span className="text-gray-500">Categoría:</span>
                                        <p className="text-gray-900">{dist.categoria?.nombre || 'Sin categoría'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Crédito disponible:</span>
                                        <p className="font-medium text-blue-700">${Number(dist.credito_disponible ?? 0).toLocaleString('es-MX')}</p>
                                    </div>
                                    <div className="flex items-center mt-2 md:justify-end md:mt-0">
                                        <Link
                                            href={route('coordinador.mis-distribuidoras.show', dist.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200"
                                        >
                                            Ver datos
                                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    }))}
                </div>

                {distribuidoras?.links && distribuidoras.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                        <div className="text-sm text-gray-600">
                            Mostrando {distribuidoras.from || 0} - {distribuidoras.to || 0} de {distribuidoras.total || 0}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {distribuidoras.links.map((link, index) => {
                                if (!link.url) return null;
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 rounded min-h-[40px] ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </TabletLayout>
    );
}
