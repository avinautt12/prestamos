import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Index({ solicitudes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || '');

    // Estados y sus colores
    const estadoConfig = {
        'PRE': { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
        'EN_REVISION': { label: 'En Verificación', color: 'bg-yellow-100 text-yellow-800' },
        'VERIFICADA': { label: 'Verificada', color: 'bg-blue-100 text-blue-800' },
        'APROBADA': { label: 'Activa', color: 'bg-green-100 text-green-800' },
        'RECHAZADA': { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
        'POSIBLE_DISTRIBUIDORA': { label: 'Posible Distribuidora', color: 'bg-purple-100 text-purple-800' }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('coordinador.solicitudes.index'),
            { search, estado },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setEstado('');
        router.get(route('coordinador.solicitudes.index'), {}, { preserveState: true });
    };

    const formatDate = (date) => {
        if (!date) return 'No enviada';
        return format(new Date(date), "dd MMM yyyy HH:mm", { locale: es });
    };

    return (
        <TabletLayout title="Mis Solicitudes">
            <Head title="Mis Solicitudes" />

            {/* Header con botón nueva solicitud */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Mis Solicitudes</h1>
                <Link
                    href={route('coordinador.solicitudes.create')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    + Nueva Solicitud
                </Link>
            </div>

            {/* Filtros */}
            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <form onSubmit={handleSearch} className="space-y-3">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Buscar por nombre o CURP
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre, apellido o CURP..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Estado
                        </label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="PRE">Borrador</option>
                            <option value="EN_REVISION">En Verificación</option>
                            <option value="VERIFICADA">Verificada</option>
                            <option value="APROBADA">Activa</option>
                            <option value="RECHAZADA">Rechazada</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Buscar
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Limpiar
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista de solicitudes */}
            <div className="space-y-3">
                {solicitudes.data.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-lg shadow">
                        <p className="text-gray-500">No hay solicitudes registradas</p>
                        <Link
                            href={route('coordinador.solicitudes.create')}
                            className="inline-block mt-2 text-blue-600 hover:text-blue-800"
                        >
                            Crear primera solicitud
                        </Link>
                    </div>
                ) : (
                    solicitudes.data.map((solicitud) => {
                        const estadoInfo = estadoConfig[solicitud.estado] || { label: solicitud.estado, color: 'bg-gray-100 text-gray-800' };
                        const persona = solicitud.persona;

                        return (
                            <Link
                                key={solicitud.id}
                                href={route('coordinador.solicitudes.show', solicitud.id)}
                                className="block p-4 transition-shadow bg-white rounded-lg shadow hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500">
                                            CURP: {persona.curp || 'No registrado'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoInfo.color}`}>
                                        {estadoInfo.label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Teléfono:</span>
                                        <p className="text-gray-900">{persona.telefono_celular || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Enviada:</span>
                                        <p className="text-gray-900">{formatDate(solicitud.enviada_en)}</p>
                                    </div>
                                </div>

                                {solicitud.observaciones_validacion && (
                                    <div className="p-2 mt-2 text-xs text-gray-600 rounded bg-gray-50">
                                        <span className="font-medium">Observaciones:</span> {solicitud.observaciones_validacion}
                                    </div>
                                )}
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Paginación */}
            {solicitudes.links && solicitudes.links.length > 3 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                        Mostrando {solicitudes.from || 0} - {solicitudes.to || 0} de {solicitudes.total || 0}
                    </div>
                    <div className="flex gap-1">
                        {solicitudes.links.map((link, index) => {
                            if (link.url === null) return null;
                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-3 py-1 rounded ${link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </TabletLayout>
    );
}