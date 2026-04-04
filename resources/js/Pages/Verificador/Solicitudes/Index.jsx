import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Index({ solicitudes, filters, modo = 'pendientes', titulo = 'Solicitudes Pendientes', descripcion = 'Solicitudes que requieren verificación en campo' }) {
    const [search, setSearch] = useState(filters.search || '');
    const searchRoute = modo === 'por-revision'
        ? route('verificador.solicitudes.por-revisar')
        : route('verificador.solicitudes.index');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(searchRoute,
            { search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        router.get(searchRoute, {}, { preserveState: true });
    };

    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return format(new Date(date), "dd MMM yyyy HH:mm", { locale: es });
    };

    return (
        <TabletLayout title={titulo}>
            <Head title={titulo} />

            <div className="tablet-form max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
                    <p className="text-sm text-gray-500">{descripcion}</p>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
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
                            <p className="text-gray-500">
                                {modo === 'por-revision'
                                    ? 'No tienes solicitudes por revisar'
                                    : 'No hay solicitudes pendientes de verificación'}
                            </p>
                        </div>
                    ) : (
                        solicitudes.data.map((solicitud) => {
                            const persona = solicitud.persona;

                            return (
                                <div
                                    key={solicitud.id}
                                    className="p-4 transition-shadow bg-white rounded-lg shadow hover:shadow-md"
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
                                        <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                                            Pendiente
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Teléfono:</span>
                                            <p className="text-gray-900">{persona.telefono_celular || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">{modo === 'por-revision' ? 'Tomada:' : 'Creada:'}</span>
                                            <p className="text-gray-900">{formatDate(modo === 'por-revision' ? (solicitud.tomada_en || solicitud.creado_en) : solicitud.creado_en)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-sm">
                                        <span className="text-gray-500">Domicilio:</span>
                                        <p className="text-gray-900">
                                            {persona.calle} {persona.numero_exterior}, {persona.colonia}
                                        </p>
                                    </div>
                                    <div className="flex justify-end mt-3">
                                        {modo === 'por-revision' ? (
                                            <Link
                                                href={route('verificador.solicitudes.show', solicitud.id)}
                                                className="px-3 py-1 text-sm text-white rounded bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Continuar revisión
                                            </Link>
                                        ) : (
                                            <Link
                                                href={route('verificador.solicitudes.tomar', solicitud.id)}
                                                method="post"
                                                as="button"
                                                className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                                            >
                                                Tomar Solicitud
                                            </Link>
                                        )}
                                    </div>

                                    {solicitud.persona?.latitud && solicitud.persona?.longitud && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Ubicación registrada disponible</span>
                                        </div>
                                    )}
                                </div>
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
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
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