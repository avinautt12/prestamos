import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faListCheck,
    faMagnifyingGlass,
    faArrowRight,
    faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

export default function Index({ solicitudes, filters, securityPolicy }) {
    const [ultimaSolicitudEnTiempoReal, setUltimaSolicitudEnTiempoReal] = useState(null);

    useEffect(() => {
        const handleSolicitudLista = (event) => {
            const payload = event.detail || null;

            if (!payload?.solicitud_id) {
                return;
            }

            setUltimaSolicitudEnTiempoReal(payload);

            router.reload({
                only: ['solicitudes'],
                preserveState: true,
                preserveScroll: true,
            });
        };

        window.addEventListener('gerente-solicitud-lista', handleSolicitudLista);

        return () => {
            window.removeEventListener('gerente-solicitud-lista', handleSolicitudLista);
        };
    }, []);

    const runFilter = (next = {}) => {
        router.get(route('gerente.distribuidoras'), {
            search: next.search ?? filters.search ?? '',
            verificador: next.verificador ?? filters.verificador ?? '',
            fecha_desde: next.fecha_desde ?? filters.fecha_desde ?? '',
            fecha_hasta: next.fecha_hasta ?? filters.fecha_hasta ?? '',
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (event) => {
        runFilter({ search: event.target.value });
    };

    const handleVerificador = (event) => {
        runFilter({ verificador: event.target.value });
    };

    const handleDesde = (event) => {
        runFilter({ fecha_desde: event.target.value });
    };

    const handleHasta = (event) => {
        runFilter({ fecha_hasta: event.target.value });
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

                <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Verificador</label>
                        <input
                            type="text"
                            defaultValue={filters.verificador || ''}
                            onChange={handleVerificador}
                            placeholder="Nombre del verificador"
                            className="fin-input mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Desde</label>
                        <input
                            type="date"
                            defaultValue={filters.fecha_desde || ''}
                            onChange={handleDesde}
                            className="fin-input mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hasta</label>
                        <input
                            type="date"
                            defaultValue={filters.fecha_hasta || ''}
                            onChange={handleHasta}
                            className="fin-input mt-1"
                        />
                    </div>
                </div>

                {securityPolicy?.requires_vpn && (
                    <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                        Las acciones de aprobar y rechazar están protegidas por política de seguridad VPN (WireGuard / nodo S3).
                    </div>
                )}

                {ultimaSolicitudEnTiempoReal?.solicitud_id && (
                    <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
                        Nueva solicitud recibida en tiempo real: folio #{ultimaSolicitudEnTiempoReal.solicitud_id}.
                    </div>
                )}
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
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-6 lg:items-center">
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

                                <div>
                                    <p className="text-sm text-gray-500">Verificador</p>
                                    <p className="font-medium text-gray-900">
                                        {solicitud.verificacion?.verificador?.persona
                                            ? `${solicitud.verificacion.verificador.persona.primer_nombre} ${solicitud.verificacion.verificador.persona.apellido_paterno}`
                                            : 'N/A'}
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
