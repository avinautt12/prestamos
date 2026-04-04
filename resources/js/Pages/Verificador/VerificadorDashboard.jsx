import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function VerificadorDashboard({ stats, usuario, solicitudesDisponibles = [], solicitudesEnProceso = [] }) {
    // Extraer el nombre de manera segura
    const nombreVerificador = usuario?.persona?.primer_nombre || 'Verificador';

    const formatDate = (date) => {
        if (!date) return 'No disponible';

        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const quickActions = [
        {
            title: 'Solicitudes Pendientes',
            description: 'Ver solicitudes que necesitan verificación en campo',
            href: route('verificador.solicitudes.index'),
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            variant: 'primary'
        },
        {
            title: 'Mis Validaciones',
            description: 'Historial de verificaciones realizadas',
            href: route('verificador.validaciones'),
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            variant: 'secondary'
        },
    ];

    const statCards = [
        {
            title: 'Pendientes de Verificar',
            value: stats?.solicitudes_pendientes ?? 0,
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            badgeClass: 'fin-badge-pending',
            badgeLabel: 'Pendiente'
        },
        {
            title: 'Solicitudes por revisión',
            value: stats?.solicitudes_por_revision ?? 0,
            icon: 'M12 8v4l3 3m-3-7v8m4-4H8',
            badgeClass: 'fin-badge-approved',
            badgeLabel: 'En revisión',
            href: route('verificador.solicitudes.por-revisar'),
            description: 'Solicitudes que ya aceptaste y aún no has revisado'
        },
        {
            title: 'Verificadas',
            value: stats?.solicitudes_verificadas ?? 0,
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            badgeClass: 'fin-badge-approved',
            badgeLabel: 'Verificada'
        },
        {
            title: 'Validaciones Hoy',
            value: stats?.validaciones_hoy ?? 0,
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            badgeClass: 'fin-badge-approved',
            badgeLabel: 'Informativo'
        },
        {
            title: 'Rechazadas',
            value: stats?.solicitudes_rechazadas ?? 0,
            icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
            badgeClass: 'fin-badge-rejected',
            badgeLabel: 'Rechazada'
        },
        {
            title: 'Mapa de Ruta',
            description: 'Ver todas las ubicaciones en un mapa',
            href: route('verificador.mapa-ruta'),
            icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
            badgeClass: 'fin-badge-pending',
            badgeLabel: 'Informativo'
        },
    ];

    // Calcular fecha actual en español
    const hoy = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = hoy.toLocaleDateString('es-MX', opcionesFecha);

    return (
        <TabletLayout title="Dashboard Verificador">
            <Head title="Dashboard Verificador" />
            <div className="fin-page">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {statCards.map((stat, index) => (
                        <Link
                            key={index}
                            href={stat.href || '#'}
                            className={`block fin-card ${stat.href ? 'transition-transform hover:-translate-y-0.5 hover:shadow-md' : ''}`}
                            onClick={stat.href ? undefined : (e) => e.preventDefault()}
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-2 rounded-md" style={{ backgroundColor: '#F3F4F6' }}>
                                    <svg className="w-5 h-5 fin-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{stat.title}</p>
                                    {stat.value !== undefined && stat.value !== null && (
                                        <p className="fin-stat-value">{stat.value}</p>
                                    )}
                                    {stat.description && (
                                        <p className="mt-1 text-xs text-gray-600">{stat.description}</p>
                                    )}
                                </div>
                                <div className="ml-auto">
                                    <span className={`fin-badge ${stat.badgeClass}`}>{stat.badgeLabel}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="mb-3 text-lg font-semibold">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className={`flex items-center justify-between ${action.variant === 'primary' ? 'fin-btn-primary' : 'fin-btn-secondary'}`}
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 p-2 rounded-md" style={{ backgroundColor: action.variant === 'primary' ? 'rgba(255,255,255,0.2)' : '#EFF6FF' }}>
                                        <svg className={`w-5 h-5 ${action.variant === 'primary' ? 'text-white' : ''}`} style={action.variant === 'secondary' ? { color: '#2563EB' } : undefined} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`font-medium ${action.variant === 'primary' ? 'text-white' : 'text-gray-900'}`}>{action.title}</h3>
                                        <p className={`text-xs ${action.variant === 'primary' ? 'text-green-100' : 'text-gray-500'}`}>{action.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="fin-info">
                    <p className="text-sm font-medium">
                        Bienvenido {nombreVerificador}. Hoy es {fechaFormateada}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: '#1E40AF' }}>
                        Tienes {stats?.solicitudes_pendientes ?? 0} solicitudes pendientes de verificación en campo.
                    </p>
                </div>
            </div>
        </TabletLayout>
    );
} 