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

    const totalRegistros = solicitudes?.total ?? 0;
    const enVista = solicitudes?.data?.length ?? 0;
    const conUbicacion = (solicitudes?.data || []).filter((item) => item.persona?.latitud && item.persona?.longitud).length;

    return (
        <TabletLayout title={titulo}>
            <Head title={titulo} />

            <div className="max-w-6xl mx-auto tablet-form">
                <div className="mb-4 fin-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs tracking-wide text-green-700 uppercase">Verificación en campo</p>
                            <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
                            <p className="text-sm text-gray-500">{descripcion}</p>
                        </div>
                        <Link
                            href={route('verificador.mapa-ruta')}
                            className="px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 min-h-[44px]"
                        >
                            Ver mapa
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-semibold text-gray-900">{totalRegistros}</p>
                        </div>
                        <div className="p-3 border border-emerald-200 rounded-lg bg-emerald-50">
                            <p className="text-xs text-emerald-700">En pantalla</p>
                            <p className="text-lg font-semibold text-emerald-900">{enVista}</p>
                        </div>
                        <div className="p-3 border border-cyan-200 rounded-lg bg-cyan-50">
                            <p className="text-xs text-cyan-700">Con ubicación</p>
                            <p className="text-lg font-semibold text-cyan-900">{conUbicacion}</p>
                        </div>
                        <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                            <p className="text-xs text-amber-700">Búsqueda actual</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{search || 'Sin filtro'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-4 fin-card">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
                        <div className="md:col-span-2">
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Buscar por nombre o CURP
                            </label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre, apellido o CURP..."
                                className="fin-input"
                            />
                        </div>

                        <div className="flex gap-2 md:col-span-3">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 min-h-[44px]"
                            >
                                Buscar
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 min-h-[44px]"
                            >
                                Limpiar
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3">
                    {solicitudes.data.length === 0 ? (
                        <div className="p-8 text-center fin-card">
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
                                    className="p-4 transition border border-gray-200 border-l-4 rounded-xl bg-white hover:shadow-md border-l-green-400"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-gray-500">Folio #{solicitud.id}</p>
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

                                    <div className="grid grid-cols-1 gap-2 mt-2 text-sm md:grid-cols-3">
                                        <div>
                                            <span className="text-gray-500">Teléfono:</span>
                                            <p className="text-gray-900">{persona.telefono_celular || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">{modo === 'por-revision' ? 'Tomada:' : 'Creada:'}</span>
                                            <p className="text-gray-900">{formatDate(modo === 'por-revision' ? (solicitud.tomada_en || solicitud.creado_en) : solicitud.creado_en)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Ubicación:</span>
                                            <p className={solicitud.persona?.latitud && solicitud.persona?.longitud ? 'text-emerald-700 font-medium' : 'text-gray-900'}>
                                                {solicitud.persona?.latitud && solicitud.persona?.longitud ? 'Disponible' : 'Sin coordenadas'}
                                            </p>
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
                                                className="px-4 py-2 text-sm text-white rounded bg-emerald-600 hover:bg-emerald-700 min-h-[40px]"
                                            >
                                                Continuar revisión
                                            </Link>
                                        ) : (
                                            <Link
                                                href={route('verificador.solicitudes.tomar', solicitud.id)}
                                                method="post"
                                                as="button"
                                                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 min-h-[40px]"
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
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                        <div className="text-sm text-gray-600">
                            Mostrando {solicitudes.from || 0} - {solicitudes.to || 0} de {solicitudes.total || 0}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {solicitudes.links.map((link, index) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 rounded min-h-[40px] ${link.active
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