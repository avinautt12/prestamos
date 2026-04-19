import React, { useState, useEffect, useRef } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Index({ solicitudes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(route('coordinador.solicitudes.index'), { search, estado }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [search, estado]);

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

    const totalRegistros = solicitudes?.total ?? 0;
    const enVista = solicitudes?.data?.length ?? 0;
    const pendientesEnVista = (solicitudes?.data || []).filter((item) => ['PRE', 'EN_REVISION'].includes(item.estado)).length;
    const rechazadasEnVista = (solicitudes?.data || []).filter((item) => item.estado === 'RECHAZADA').length;

    const estadoBorde = {
        PRE: 'border-l-gray-400',
        EN_REVISION: 'border-l-amber-400',
        VERIFICADA: 'border-l-blue-400',
        APROBADA: 'border-l-emerald-400',
        RECHAZADA: 'border-l-rose-400',
        POSIBLE_DISTRIBUIDORA: 'border-l-violet-400',
    };

    return (
        <TabletLayout title="Mis Solicitudes">
            <Head title="Mis Solicitudes" />

            <div className="max-w-6xl mx-auto space-y-4 tablet-form">
                <div className="fin-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs tracking-wide text-blue-700 uppercase">Coordinación</p>
                            <h1 className="text-xl font-bold text-gray-900">Mis Solicitudes</h1>
                            <p className="text-sm text-gray-500">Vista compacta para revisar expedientes y dar seguimiento rápido.</p>
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
                        <div className="p-3 border rounded-lg border-amber-200 bg-amber-50">
                            <p className="text-xs text-amber-700">Pendientes</p>
                            <p className="text-lg font-semibold text-amber-900">{pendientesEnVista}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-rose-200 bg-rose-50">
                            <p className="text-xs text-rose-700">Rechazadas</p>
                            <p className="text-lg font-semibold text-rose-900">{rechazadasEnVista}</p>
                        </div>
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                            <p className="text-xs text-blue-700">En pantalla</p>
                            <p className="text-lg font-semibold text-blue-900">{enVista}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 fin-card">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
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

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Estado
                            </label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="fin-input"
                            >
                                <option value="">Todos</option>
                                <option value="PRE">Borrador</option>
                                <option value="EN_REVISION">En verificación</option>
                                <option value="VERIFICADA">Verificada</option>
                                <option value="APROBADA">Activa</option>
                                <option value="RECHAZADA">Rechazada</option>
                            </select>
                        </div>

                        <div className="flex gap-2 md:justify-end">
                            <button
                                type="submit"
                                className="px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 min-h-[44px]"
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
                        <div className="p-6 text-center fin-card">
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
                            const estadoLinea = estadoBorde[solicitud.estado] || 'border-l-gray-300';

                            return (
                                <Link
                                    key={solicitud.id}
                                    href={route('coordinador.solicitudes.show', solicitud.id)}
                                    className={`group block p-4 transition border border-gray-200 border-l-4 rounded-xl bg-white hover:shadow-md ${estadoLinea}`}
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
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoInfo.color}`}>
                                            {estadoInfo.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 mt-2 text-sm md:grid-cols-3">
                                        <div>
                                            <span className="text-gray-500">Teléfono:</span>
                                            <p className="text-gray-900">{persona.telefono_celular || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Enviada:</span>
                                            <p className="text-gray-900">{formatDate(solicitud.enviada_en)}</p>
                                        </div>
                                        <div className="flex items-center mt-2 md:justify-end md:mt-0">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                                Ver expediente
                                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {solicitud.verificacion?.observaciones && (
                                        <div className="p-2 mt-2 text-xs text-gray-600 rounded bg-gray-50">
                                            <span className="font-medium">Observaciones:</span> {solicitud.verificacion.observaciones}
                                        </div>
                                    )}
                                </Link>
                            );
                        })
                    )}
                </div>

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
            </div>
        </TabletLayout>
    );
}