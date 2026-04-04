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
} from '@fortawesome/free-solid-svg-icons';

export default function Dashboard({ stats }) {
    const statCards = [
        {
            title: 'Sucursales activas',
            value: stats.total_sucursales ?? 0,
            icon: faBuilding,
            accent: 'text-blue-600',
            badge: 'Estructura',
            badgeClass: 'fin-badge-approved',
        },
        {
            title: 'Distribuidoras activas',
            value: stats.total_distribuidoras ?? 0,
            icon: faUsers,
            accent: 'text-green-600',
            badge: 'Operación',
            badgeClass: 'fin-badge-approved',
        },
        {
            title: 'Vales activos',
            value: stats.total_vales_activos ?? 0,
            icon: faFileInvoiceDollar,
            accent: 'text-amber-600',
            badge: 'Riesgo',
            badgeClass: 'fin-badge-pending',
        },
        {
            title: 'Capital colocado',
            value: `$${Number(stats.monto_prestado ?? 0).toLocaleString('es-MX')}`,
            icon: faMoneyBillWave,
            accent: 'text-emerald-600',
            badge: 'Finanzas',
            badgeClass: 'fin-badge-approved',
        },
    ];

    return (
        <AdminLayout title="Panel Gerencial">
            <Head title="Panel Gerencial" />

            <div className="mb-6 fin-card">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title">Centro de Decisión Operativa</h2>
                        <p className="mt-1 fin-subtitle">
                            Autoriza distribuidoras, supervisa saldos globales y controla parámetros de negocio desde escritorio.
                        </p>
                    </div>
                    <span className="fin-badge fin-badge-pending">Acciones críticas requieren VPN</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
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
                        <div className="mt-3">
                            <span className={`fin-badge ${stat.badgeClass}`}>{stat.badge}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-3">
                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-2 text-gray-900">
                        <FontAwesomeIcon icon={faListCheck} />
                        <h3 className="font-semibold">Aprobación de Distribuidoras</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                        Revisa expedientes verificados, consulta evidencias y toma decisión final con impacto financiero.
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>- Bandeja para estatus VERIFICADA</p>
                        <p>- Aprobación con límite de crédito y categoría</p>
                        <p>- Rechazo con motivo obligatorio y trazabilidad</p>
                    </div>
                    <Link href={route('gerente.distribuidoras')} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-700 hover:text-blue-900">
                        Ir al módulo
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>

                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-2 text-gray-900">
                        <FontAwesomeIcon icon={faSliders} />
                        <h3 className="font-semibold">Parámetros del Sistema</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                        Configura reglas operativas que afectan cortes, puntos y comisiones por categoría.
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>- Programación de cortes por sucursal</p>
                        <p>- Reglas de acumulación/penalización de puntos</p>
                        <p>- Porcentajes de comisiones por categoría</p>
                    </div>
                    <span className="inline-flex items-center gap-2 mt-4 text-xs font-medium text-amber-700">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        Próximo: panel de configuración
                    </span>
                </div>

                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-2 text-gray-900">
                        <FontAwesomeIcon icon={faChartLine} />
                        <h3 className="font-semibold">Reportes y Monitoreo</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                        Consolida indicadores de morosidad, saldos globales y auditoría de puntos para toma de decisiones.
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>- Reporte de morosidad en tiempo real</p>
                        <p>- Saldos globales y conciliaciones pendientes</p>
                        <p>- Historial de puntos y penalizaciones</p>
                    </div>
                    <Link href={route('gerente.reportes')} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-700 hover:text-blue-900">
                        Ver reportes
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}