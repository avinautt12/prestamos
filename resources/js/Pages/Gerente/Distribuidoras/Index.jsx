import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faListCheck,
    faMagnifyingGlass,
    faArrowRight,
    faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

export default function Index({ solicitudes, filters }) {
    const handleSearch = (event) => {
        const value = event.target.value;

        router.get(route('gerente.distribuidoras'), { search: value }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout title="Aprobación de Distribuidoras">
            <Head title="Aprobación de Distribuidoras" />

            <div className="fin-card mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title">Bandeja de Solicitudes Verificadas</h2>
                        <p className="fin-subtitle mt-1">
                            Expedientes listos para decisión final del gerente.
                        </p>
                    </div>
                    <span className="fin-badge fin-badge-pending">{solicitudes.total} pendientes</span>
                </div>

                <div className="mt-4 max-w-md">
                    <label className="block text-sm font-medium text-gray-700">Buscar solicitud</label>
                    <div className="relative mt-1">
                        <input
                            type="text"
                            defaultValue={filters.search || ''}
                            onChange={handleSearch}
                            placeholder="Nombre, apellido o CURP"
                            className="fin-input pl-10"
                        />
                        <span className="absolute inset-y-0 left-0 inline-flex items-center pl-3 text-gray-400">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </span>
                    </div>
                </div>
            </div>

            {solicitudes.data.length === 0 ? (
                <div className="fin-card">
                    <p className="text-gray-500">
                        No hay solicitudes verificadas pendientes por aprobar o rechazar.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {solicitudes.data.map((solicitud) => (
                        <div key={solicitud.id} className="fin-card">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:items-center">
                                <div className="lg:col-span-2">
                                    <p className="text-sm text-gray-500">Prospecto</p>
                                    <p className="font-semibold text-gray-900">
                                        {solicitud.persona?.primer_nombre} {solicitud.persona?.apellido_paterno} {solicitud.persona?.apellido_materno}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">CURP: {solicitud.persona?.curp || 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Sucursal</p>
                                    <p className="font-medium text-gray-900">{solicitud.sucursal?.nombre || 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Límite solicitado</p>
                                    <p className="font-medium text-gray-900">
                                        ${Number(solicitud.limite_credito_solicitado || 0).toLocaleString('es-MX')}
                                    </p>
                                </div>

                                <div className="flex justify-start lg:justify-end">
                                    <Link
                                        href={route('gerente.distribuidoras.show', solicitud.id)}
                                        className="fin-btn-secondary"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            Revisar expediente
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="fin-info mt-4">
                <p className="text-sm inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Las decisiones de aprobación/rechazo se registran con impacto financiero sobre capital colocado.
                </p>
            </div>
        </AdminLayout>
    );
}
