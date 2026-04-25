import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faCheck,
    faXmark,
    faClock,
    faArrowUp,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

export default function SugerenciasCredito({ sugerencias, filters, securityPolicy = {} }) {
    const { flash = {} } = usePage().props;
    const requiresVpn = securityPolicy?.requires_vpn ?? false;

    const runFilter = (next = {}) => {
        router.get(route('gerente.credito.sugerencias'), {
            estado: next.estado ?? filters.estado ?? '',
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleEstado = (e) => runFilter({ estado: e.target.value });

    const aprobar = (id) => {
        if (confirm('¿Aprobar este incremento de crédito?')) {
            router.post(route('gerente.credito.sugerencias.aprobar', id), {}, {
                preserveScroll: true,
            });
        }
    };

    const rechazar = (id) => {
        const motivo = prompt('Motivo del rechazo:');
        if (motivo) {
            router.post(route('gerente.credito.sugerencias.rechazar', id), {
                motivo,
            }, {
                preserveScroll: true,
            });
        }
    };

    const getBadge = (estado) => {
        switch (estado) {
            case 'PENDIENTE':
                return 'fin-badge-warning';
            case 'APROBADA':
                return 'fin-badge-success';
            case 'RECHAZADA':
                return 'fin-badge-danger';
            default:
                return '';
        }
    };

    return (
        <AdminLayout title="Sugerencias de Crédito">
            <Head title="Sugerencias de Crédito" />

            <div className="fin-card mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title">Sugerencias de Incremento</h2>
                        <p className="fin-subtitle mt-1">
                            Propuestas automáticas generadas por el sistema.
                        </p>
                    </div>
                    <Link
                        href={route('gerente.credito.index')}
                        className="fin-btn-secondary flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowUp} />
                        Gestión Crédito
                    </Link>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                        value={filters.estado || ''}
                        onChange={handleEstado}
                        className="fin-input mt-1 w-full md:w-48"
                    >
                        <option value="">Todos</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="APROBADA">Aprobadas</option>
                        <option value="RECHAZADA">Rechazadas</option>
                    </select>
                </div>

                {flash?.success && (
                    <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                {requiresVpn && (
                    <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
                        <p>
                            <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
                            <strong>VPN requerida:</strong> Aprobar o rechazar sugerencias requiere conexión VPN WireGuard.
                        </p>
                    </div>
                )}
            </div>

            {sugerencias.data.length === 0 ? (
                <div className="fin-card">
                    <p className="text-gray-500">
                        No hay sugerencias de incremento de crédito.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sugerencias.data.map((sug) => (
                        <div key={sug.id} className="fin-card">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-6 lg:items-center">
                                <div className="lg:col-span-2">
                                    <p className="font-semibold text-gray-900">
                                        {sug.distribuidora?.persona?.primer_nombre} {sug.distribuidora?.persona?.apellido_paterno}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {sug.distribuidora?.numero_distribuidora}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Score</p>
                                    <p className="font-medium text-gray-900">{sug.score}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Incremento</p>
                                    <p className="font-semibold text-green-600">
                                        ${Number(sug.incremento_sugerido).toLocaleString('es-MX')}
                                    </p>
                                </div>

                                <div>
                                    <span className={`fin-badge ${getBadge(sug.estado)}`}>
                                        {sug.estado}
                                    </span>
                                </div>

<div className="flex justify-end gap-2">
                                    {sug.estado === 'PENDIENTE' && (
                                        <>
                                            <button
                                                onClick={() => aprobar(sug.id)}
                                                disabled={requiresVpn}
                                                className={`fin-btn-primary text-sm py-1 px-3 flex items-center gap-1 ${requiresVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={requiresVpn ? "Requiere conexión VPN WireGuard" : "Aprobar incremento"}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => rejectar(sug.id)}
                                                disabled={requiresVpn}
                                                className={`fin-btn-danger text-sm py-1 px-3 flex items-center gap-1 ${requiresVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={requiresVpn ? "Requiere conexión VPN WireGuard" : "Rechazar incremento"}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                    {sug.estado !== 'PENDIENTE' && sug.aprobada_por_usuario_id && (
                                        <p className="text-xs text-gray-500">
                                            {sug.aprobada_por_usuario_id ? 'Aprobada por: ' + sug.aprobada_por_usuario_id : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {sugerencias.total > 0 && (
                <div className="mt-4 flex justify-center">
                    <nav className="flex gap-2">
                        {sugerencias.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                </div>
            )}
        </AdminLayout>
    );
}