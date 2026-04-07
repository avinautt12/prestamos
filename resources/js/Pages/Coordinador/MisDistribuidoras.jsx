import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

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

    const buscar = (e) => {
        e.preventDefault();
        router.get(route('coordinador.mis-distribuidoras'), { search, estado }, { preserveState: true, preserveScroll: true });
    };

    const limpiar = () => {
        setSearch('');
        setEstado('');
        router.get(route('coordinador.mis-distribuidoras'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <TabletLayout title="Mis Distribuidoras">
            <Head title="Mis Distribuidoras" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Mis Distribuidoras</h1>
                        <p className="text-sm text-gray-500">Control de distribuidoras bajo tu coordinación.</p>
                    </div>
                    <Link
                        href={route('coordinador.solicitudes.create')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        + Nueva Solicitud
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-lg font-semibold text-gray-900">{estadisticas?.total ?? 0}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-green-600">Activas</p>
                        <p className="text-lg font-semibold text-green-800">{estadisticas?.activas ?? 0}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-red-600">Morosas</p>
                        <p className="text-lg font-semibold text-red-800">{estadisticas?.morosas ?? 0}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-amber-600">Bloqueadas</p>
                        <p className="text-lg font-semibold text-amber-800">{estadisticas?.bloqueadas ?? 0}</p>
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                    <form onSubmit={buscar} className="space-y-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre o número de distribuidora"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />

                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVA">ACTIVA</option>
                            <option value="MOROSA">MOROSA</option>
                            <option value="BLOQUEADA">BLOQUEADA</option>
                            <option value="INACTIVA">INACTIVA</option>
                        </select>

                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                Buscar
                            </button>
                            <button type="button" onClick={limpiar} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Limpiar
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3">
                    {(distribuidoras?.data || []).length === 0 ? (
                        <div className="p-6 text-sm text-center text-gray-500 bg-white rounded-lg shadow">
                            No se encontraron distribuidoras con esos filtros.
                        </div>
                    ) : (distribuidoras.data.map((dist) => {
                        const persona = dist.persona || {};
                        const estadoBadge = estadoColor[dist.estado] || 'bg-gray-100 text-gray-700';

                        return (
                            <div key={dist.id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            No. Distribuidora: {dist.numero_distribuidora || 'Sin asignar'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Categoría: {dist.categoria?.nombre || 'Sin categoría'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoBadge}`}>{dist.estado}</span>
                                </div>
                            </div>
                        );
                    }))}
                </div>

                {distribuidoras?.links && distribuidoras.links.length > 3 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                            Mostrando {distribuidoras.from || 0} - {distribuidoras.to || 0} de {distribuidoras.total || 0}
                        </div>
                        <div className="flex gap-1">
                            {distribuidoras.links.map((link, index) => {
                                if (!link.url) return null;
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-1 rounded ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
