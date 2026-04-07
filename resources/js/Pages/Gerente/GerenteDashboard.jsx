import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faUsers,
    faFileInvoiceDollar,
    faMoneyBillWave,
    faListCheck,
    faSliders,
    faChartLine,
    faTriangleExclamation,
    faArrowRight,
    faClock,
    faBan,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

export default function Dashboard({ stats, actividadReciente = [] }) {
    const statCards = [
        {
            title: 'Pendientes por decidir',
            value: stats.solicitudes_pendientes ?? 0,
            icon: faClock,
            accent: 'text-amber-600',
        },
        {
            title: 'Distribuidoras activas',
            value: stats.total_distribuidoras ?? 0,
            icon: faUsers,
            accent: 'text-green-600',
        },
        {
            title: 'Vales activos',
            value: stats.total_vales_activos ?? 0,
            icon: faFileInvoiceDollar,
            accent: 'text-indigo-600',
        },
        {
            title: 'Capital colocado',
            value: `$${Number(stats.monto_prestado ?? 0).toLocaleString('es-MX')}`,
            icon: faMoneyBillWave,
            accent: 'text-emerald-600',
        },
        {
            title: 'Aprobadas este mes',
            value: stats.solicitudes_aprobadas_mes ?? 0,
            icon: faCircleCheck,
            accent: 'text-teal-600',
        },
        {
            title: 'Rechazadas este mes',
            value: stats.solicitudes_rechazadas_mes ?? 0,
            icon: faBan,
            accent: 'text-rose-600',
        },
    ];

    const accionesRapidas = [
        {
            title: 'Decidir solicitudes',
            subtitle: `${stats.solicitudes_pendientes ?? 0} pendientes`,
            href: route('gerente.distribuidoras'),
            icon: faListCheck,
            accent: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        {
            title: 'Ver rechazadas',
            subtitle: 'Motivos y auditoria',
            href: route('gerente.distribuidoras.rechazadas'),
            icon: faBan,
            accent: 'bg-rose-50 text-rose-700 border-rose-200',
        },
        {
            title: 'Configurar reglas',
            subtitle: 'Parametros por sucursal',
            href: route('gerente.configuraciones'),
            icon: faSliders,
            accent: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
            title: 'Abrir reportes',
            subtitle: 'Morosidad y riesgo',
            href: route('gerente.reportes'),
            icon: faChartLine,
            accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
            title: 'Calendario de cortes',
            subtitle: 'Cierre manual y agenda',
            href: route('gerente.cortes'),
            icon: faClock,
            accent: 'bg-violet-50 text-violet-700 border-violet-200',
        },
    ];

    return (
        <AdminLayout title="Panel Gerencial">
            <Head title="Panel Gerencial" />

            <div className="mb-6 fin-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-gray-500">Sucursal activa</p>
                        <h2 className="mt-1 fin-title">{stats.sucursal_nombre || 'Sin sucursal asignada'}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="fin-badge fin-badge-pending">Gerencia operativa</span>
                        <span className="fin-badge fin-badge-approved">{new Date().toLocaleDateString('es-MX')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {statCards.map((stat) => (
                    <div key={stat.title} className="fin-card">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="fin-stat-value">{stat.value}</p>
                            </div>
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 ${stat.accent}`}>
                                <FontAwesomeIcon icon={stat.icon} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-3">
                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600" />
                        <h3 className="font-semibold">Foco inmediato</h3>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 border rounded-lg border-amber-200 bg-amber-50">
                            <span className="text-gray-700">Solicitudes pendientes</span>
                            <span className="font-semibold text-amber-700">{stats.solicitudes_pendientes ?? 0}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg border-rose-200 bg-rose-50">
                            <span className="text-gray-700">Distribuidoras morosas</span>
                            <span className="font-semibold text-rose-700">{stats.distribuidoras_morosas ?? 0}</span>
                        </div>

                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-gray-600">Capital en riesgo</p>
                            <p className="text-lg font-semibold text-gray-900">
                                ${Number(stats.capital_en_riesgo ?? 0).toLocaleString('es-MX')}
                            </p>
                        </div>

                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <p className="text-gray-600">Proximo corte programado</p>
                            {stats.proximo_corte?.fecha_programada ? (
                                <>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(stats.proximo_corte.fecha_programada).toLocaleString('es-MX')}
                                    </p>
                                    <p className={`text-xs mt-1 ${stats.proximo_corte.es_atrasado ? 'text-rose-700' : 'text-emerald-700'}`}>
                                        {stats.proximo_corte.es_atrasado ? 'Programado pero atrasado' : 'Programado vigente'}
                                    </p>
                                </>
                            ) : (
                                <p className="font-semibold text-gray-900">Sin corte proximo</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="fin-card xl:col-span-2">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
                        <h3 className="font-semibold">Acciones rapidas</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {accionesRapidas.map((accion) => (
                            <Link
                                key={accion.title}
                                href={accion.href}
                                className={`block border rounded-lg p-4 transition hover:shadow ${accion.accent}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{accion.title}</p>
                                        <p className="mt-1 text-sm opacity-90">{accion.subtitle}</p>
                                    </div>
                                    <FontAwesomeIcon icon={accion.icon} />
                                </div>
                                <div className="inline-flex items-center gap-2 mt-3 text-sm font-medium">
                                    Abrir
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 fin-card">
                <div className="flex items-center gap-2 mb-3 text-gray-900">
                    <FontAwesomeIcon icon={faListCheck} className="text-indigo-600" />
                    <h3 className="font-semibold">Actividad reciente del gerente</h3>
                </div>

                {actividadReciente.length === 0 ? (
                    <p className="text-sm text-gray-500">Aun no tienes decisiones registradas recientemente.</p>
                ) : (
                    <div className="space-y-2">
                        {actividadReciente.map((item) => (
                            <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {item.tipo_evento} · Folio #{item.solicitud_id}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {item.creado_en ? new Date(item.creado_en).toLocaleString('es-MX') : 'Sin fecha'}
                                    </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-700">{item.prospecto}</p>
                                <p className="mt-1 text-xs text-gray-600">
                                    Monto anterior: ${Number(item.monto_anterior ?? 0).toLocaleString('es-MX')} | Monto nuevo: ${Number(item.monto_nuevo ?? 0).toLocaleString('es-MX')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}