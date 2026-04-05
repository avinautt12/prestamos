import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';

const estadoColor = {
    ACTIVO: 'bg-green-100 text-green-800',
    MOROSO: 'bg-red-100 text-red-800',
    BLOQUEADO: 'bg-amber-100 text-amber-800',
    INACTIVO: 'bg-gray-100 text-gray-700',
};

export default function Clientes({ clientes, estadisticas, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [estado, setEstado] = useState(filters?.estado || '');

    const buscar = (e) => {
        e.preventDefault();
        router.get(route('coordinador.clientes'), { search, estado }, { preserveState: true, preserveScroll: true });
    };

    const limpiar = () => {
        setSearch('');
        setEstado('');
        router.get(route('coordinador.clientes'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <TabletLayout title="Clientes">
            <Head title="Clientes" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
                        <p className="text-sm text-gray-500">Cartera asociada a tus distribuidoras.</p>
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
                        <p className="text-xs text-green-600">Activos</p>
                        <p className="text-lg font-semibold text-green-800">{estadisticas?.activos ?? 0}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-red-600">Morosos</p>
                        <p className="text-lg font-semibold text-red-800">{estadisticas?.morosos ?? 0}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow">
                        <p className="text-xs text-amber-600">Bloqueados</p>
                        <p className="text-lg font-semibold text-amber-800">{estadisticas?.bloqueados ?? 0}</p>
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                    <form onSubmit={buscar} className="space-y-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre, CURP o código cliente"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />

                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="MOROSO">MOROSO</option>
                            <option value="BLOQUEADO">BLOQUEADO</option>
                            <option value="INACTIVO">INACTIVO</option>
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
                    {(clientes?.data || []).length === 0 ? (
                        <div className="p-6 text-sm text-center text-gray-500 bg-white rounded-lg shadow">
                            No se encontraron clientes con esos filtros.
                        </div>
                    ) : (clientes.data.map((cliente) => {
                        const persona = cliente.persona || {};
                        const estadoBadge = estadoColor[cliente.estado] || 'bg-gray-100 text-gray-700';
                        const distribuidoras = cliente.distribuidoras || [];

                        return (
                            <div key={cliente.id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            CURP: {persona.curp || 'No registrada'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Código cliente: {cliente.codigo_cliente || 'Sin código'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoBadge}`}>{cliente.estado}</span>
                                </div>

                                <div className="mt-3 text-xs text-gray-600">
                                    {distribuidoras.length > 0 ? (
                                        <p>
                                            Distribuidoras vinculadas: {distribuidoras.map((item) => item.numero_distribuidora || `#${item.id}`).join(', ')}
                                        </p>
                                    ) : (
                                        <p>Sin distribuidora vinculada.</p>
                                    )}
                                </div>
                            </div>
                        );
                    }))}
                </div>

                {clientes?.links && clientes.links.length > 3 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                            Mostrando {clientes.from || 0} - {clientes.to || 0} de {clientes.total || 0}
                        </div>
                        <div className="flex gap-1">
                            {clientes.links.map((link, index) => {
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
