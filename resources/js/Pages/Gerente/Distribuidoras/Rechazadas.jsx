import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faCircleInfo,
    faListCheck,
} from '@fortawesome/free-solid-svg-icons';

export default function Rechazadas({ solicitudes, filters }) {
    const runFilter = (next = {}) => {
        router.get(route('gerente.distribuidoras.rechazadas'), {
            search: next.search ?? filters.search ?? '',
            motivo: next.motivo ?? filters.motivo ?? '',
            fecha_desde: next.fecha_desde ?? filters.fecha_desde ?? '',
            fecha_hasta: next.fecha_hasta ?? filters.fecha_hasta ?? '',
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout title="Solicitudes Rechazadas">
            <Head title="Solicitudes Rechazadas" />

            <div className="mb-4 fin-card">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title">Historial de Rechazos</h2>
                        <p className="mt-1 fin-subtitle">
                            Consulta solicitudes rechazadas y su motivo para auditoría y seguimiento.
                        </p>
                    </div>
                    <span className="fin-badge">{solicitudes.total} rechazadas</span>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prospecto / CURP</label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                defaultValue={filters.search || ''}
                                onChange={(event) => runFilter({ search: event.target.value })}
                                placeholder="Nombre, apellido o CURP"
                                className="pl-10 fin-input"
                            />
                            <span className="absolute inset-y-0 left-0 inline-flex items-center pl-3 text-gray-400">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo</label>
                        <input
                            type="text"
                            defaultValue={filters.motivo || ''}
                            onChange={(event) => runFilter({ motivo: event.target.value })}
                            placeholder="Texto del motivo"
                            className="mt-1 fin-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Desde</label>
                        <input
                            type="date"
                            defaultValue={filters.fecha_desde || ''}
                            onChange={(event) => runFilter({ fecha_desde: event.target.value })}
                            className="mt-1 fin-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hasta</label>
                        <input
                            type="date"
                            defaultValue={filters.fecha_hasta || ''}
                            onChange={(event) => runFilter({ fecha_hasta: event.target.value })}
                            className="mt-1 fin-input"
                        />
                    </div>
                </div>
            </div>

            {solicitudes.data.length === 0 ? (
                <div className="fin-card">
                    <p className="text-gray-500">No hay solicitudes rechazadas para los filtros seleccionados.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {solicitudes.data.map((solicitud) => (
                        <div key={solicitud.id} className="fin-card">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-6 lg:items-start">
                                <div className="lg:col-span-2">
                                    <p className="text-sm text-gray-500">Prospecto</p>
                                    <p className="font-semibold text-gray-900">
                                        {solicitud.persona?.primer_nombre} {solicitud.persona?.apellido_paterno} {solicitud.persona?.apellido_materno}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">CURP: {solicitud.persona?.curp || 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Sucursal</p>
                                    <p className="font-medium text-gray-900">{solicitud.sucursal?.nombre || 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Fecha rechazo</p>
                                    <p className="font-medium text-gray-900">
                                        {solicitud.decidida_en ? new Date(solicitud.decidida_en).toLocaleString('es-MX') : 'N/A'}
                                    </p>
                                </div>

                                <div className="lg:col-span-2">
                                    <p className="text-sm text-gray-500">Motivo</p>
                                    <p className="text-sm text-gray-900 break-words whitespace-pre-wrap">
                                        {solicitud.motivo_rechazo || 'Sin motivo registrado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 fin-info">
                <p className="inline-flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Cada rechazo conserva su motivo para trazabilidad operativa en sucursal.
                </p>
                <p className="inline-flex items-center gap-2 mt-2 text-sm">
                    <FontAwesomeIcon icon={faListCheck} />
                    La lista se limita a la sucursal activa del gerente.
                </p>
            </div>
        </AdminLayout>
    );
}
