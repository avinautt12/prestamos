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

    const totalRegistros = clientes?.total ?? 0;
    const enVista = clientes?.data?.length ?? 0;
    const activosEnVista = (clientes?.data || []).filter((item) => item.estado === 'ACTIVO').length;

    const estadoBorde = {
        ACTIVO: 'border-l-emerald-400',
        MOROSO: 'border-l-rose-400',
        BLOQUEADO: 'border-l-amber-400',
        INACTIVO: 'border-l-gray-400',
    };

    return (
        <TabletLayout title="Clientes">
            <Head title="Clientes" />

            <div className="max-w-6xl mx-auto space-y-4 tablet-form">
                <div className="fin-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs tracking-wide text-blue-700 uppercase">Coordinación</p>
                            <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
                            <p className="text-sm text-gray-500">Vista compacta de cartera para seguimiento rápido en tablet.</p>
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
                            <p className="text-xs text-emerald-700">Activos</p>
                            <p className="text-lg font-semibold text-emerald-900">{activosEnVista}</p>
                        </div>
                        <div className="p-3 border border-rose-200 rounded-lg bg-rose-50">
                            <p className="text-xs text-rose-700">Morosos</p>
                            <p className="text-lg font-semibold text-rose-900">{estadisticas?.morosos ?? 0}</p>
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
                                placeholder="Nombre, CURP o código cliente"
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
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="MOROSO">MOROSO</option>
                                <option value="BLOQUEADO">BLOQUEADO</option>
                                <option value="INACTIVO">INACTIVO</option>
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
                    {(clientes?.data || []).length === 0 ? (
                        <div className="p-6 text-sm text-center text-gray-500 fin-card">
                            No se encontraron clientes con esos filtros.
                        </div>
                    ) : (clientes.data.map((cliente) => {
                        const persona = cliente.persona || {};
                        const estadoBadge = estadoColor[cliente.estado] || 'bg-gray-100 text-gray-700';
                        const distribuidoras = cliente.distribuidoras || [];
                        const estadoLinea = estadoBorde[cliente.estado] || 'border-l-gray-300';

                        return (
                            <div key={cliente.id} className={`p-4 transition border border-gray-200 border-l-4 rounded-xl bg-white hover:shadow-md ${estadoLinea}`}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500">Registro #{cliente.id}</p>
                                        <p className="font-semibold text-gray-900">
                                            {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            CURP: {persona.curp || 'No registrada'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoBadge}`}>{cliente.estado}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 mt-2 text-sm md:grid-cols-3">
                                    <div>
                                        <span className="text-gray-500">Código cliente:</span>
                                        <p className="text-gray-900">{cliente.codigo_cliente || 'Sin código'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Distribuidoras:</span>
                                        <p className="text-gray-900 truncate">
                                            {distribuidoras.length > 0
                                                ? distribuidoras.map((item) => item.numero_distribuidora || `#${item.id}`).join(', ')
                                                : 'Sin vinculación'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Acción:</span>
                                        <p className="font-medium text-blue-700">Revisar cartera</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }))}
                </div>

                {clientes?.links && clientes.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                        <div className="text-sm text-gray-600">
                            Mostrando {clientes.from || 0} - {clientes.to || 0} de {clientes.total || 0}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {clientes.links.map((link, index) => {
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
