import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function CajeraDashboard({ auth, stats }) {
    const quickActions = [
        {
            title: 'Verificación Prevale',
            description: 'Validar documentos y autorizar primer depósito a clientes',
            href: route('cajera.prevale.index'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-green-500'
        },
        {
            title: 'Cobros y Pagos',
            description: 'Registrar pagos de distribuidoras y abonos',
            href: route('cajera.cobros'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-blue-500'
        },
        {
            title: 'Conciliación Bancaria',
            description: 'Carga masiva de archivos y cruce de pagos',
            href: route('cajera.conciliaciones'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'bg-purple-500'
        },
        {
            title: 'Módulo de Cobranza',
            description: 'Gestión de morosidad y bloqueo de cuentas',
            href: route('cajera.cobranza.index'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            color: 'bg-red-500'
        }
    ];

    return (
        <TabletLayout title="Panel de Cajera">
            <Head title="Dashboard Cajera" />

            {/* Acomodo exactamente igual a tu diseño original */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Mensaje de Bienvenida */}
                    <div className="mb-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 font-medium">
                            Bienvenida a tu panel de Cajera. Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Stats Originales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Cobros de Hoy</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${stats?.cobros_hoy ?? 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pendientes Conciliar</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.pendientes_conciliar ?? 0}</p>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-full">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Prevales por Validar</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.prevales_pendientes ?? 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Grid Original */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickActions.map((action, idx) => (
                            <Link
                                key={idx}
                                href={action.href}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group border-t-4"
                                style={{ borderTopColor: action.color === 'bg-green-500' ? '#22c55e' : action.color === 'bg-blue-500' ? '#3b82f6' : action.color === 'bg-purple-500' ? '#a855f7' : '#ef4444' }}
                            >
                                <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4 shadow-sm`}>
                                    {action.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    {action.description}
                                </p>
                                <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                                    Acceder
                                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </TabletLayout>
    );
}