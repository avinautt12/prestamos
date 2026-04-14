import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats, usuario }) {
    const estatus = stats.estatus_solicitudes || {};

    const quickActions = [
        { title: 'Reportes', description: 'Ver indicadores de pipeline y cartera', href: route('coordinador.reportes'), icon: 'M9 17v-6m4 6V7m4 10v-3M4 19h16', variant: 'secondary' },
        { title: 'Nueva Solicitud', description: 'Registrar una nueva solicitud de préstamo', href: route('coordinador.solicitudes.create'), icon: 'M12 4v16m8-8H4', variant: 'primary' },
        { title: 'Ver Solicitudes', description: 'Gestionar solicitudes pendientes', href: route('coordinador.solicitudes.index'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', variant: 'secondary' },
        { title: 'Mis Distribuidoras', description: 'Ver distribuidoras a tu cargo', href: route('coordinador.mis-distribuidoras'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', variant: 'secondary' },
        { title: 'Clientes', description: 'Gestionar cartera de clientes', href: route('coordinador.clientes'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', variant: 'secondary' }
    ];

    const statCards = [
        { title: 'Solicitudes Pendientes', value: stats.solicitudes_pendientes, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { title: 'Distribuidoras Activas', value: stats.distribuidoras_activas, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
        { title: 'Clientes Activos', value: stats.clientes_activos, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { title: 'Vales Activos', value: stats.vales_activos, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
    ];

    return (
        <TabletLayout title="Dashboard Coordinador">
            <Head title="Dashboard Coordinador" />
            <div className="fin-page">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className="fin-card">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-2 rounded-md" style={{ backgroundColor: '#F3F4F6' }}>
                                    <svg className="w-5 h-5 fin-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-xs" style={{ color: '#6B7280' }}>{stat.title}</p>
                                    <p className="fin-stat-value">{stat.value}</p>
                                </div>
                            </div>
                        </div>
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
                                className={`flex items-center justify-between fin-card ${action.variant === 'primary' ? 'fin-btn-primary' : 'fin-btn-secondary'}`}
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
                                <svg className={`w-5 h-5 ${action.variant === 'primary' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mb-6 fin-card">
                    <h2 className="mb-3 text-lg font-semibold">Seguimiento de Prospectos</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                        <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500">Pre-solicitud</p>
                            <p className="text-lg font-semibold text-gray-900">{estatus.pre_solicitud ?? 0}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-yellow-50">
                            <p className="text-yellow-700">En verificación</p>
                            <p className="text-lg font-semibold text-yellow-900">{estatus.en_verificacion ?? 0}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-blue-50">
                            <p className="text-blue-700">Verificada</p>
                            <p className="text-lg font-semibold text-blue-900">{estatus.verificada ?? 0}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-green-50">
                            <p className="text-green-700">Activa</p>
                            <p className="text-lg font-semibold text-green-900">{estatus.activa ?? 0}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-red-50">
                            <p className="text-red-700">Rechazada</p>
                            <p className="text-lg font-semibold text-red-900">{estatus.rechazada ?? 0}</p>
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="fin-info">
                    <p className="text-sm font-medium">
                        Bienvenido {usuario.persona?.primer_nombre}. Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>
        </TabletLayout>
    );
}