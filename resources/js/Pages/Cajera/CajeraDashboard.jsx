import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faClipboardCheck,
    faClock,
    faFileInvoiceDollar,
    faFileSignature,
    faMoneyBillWave,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

export default function CajeraDashboard({ auth, stats }) {
    const quickActions = [
        {
            title: 'Verificación Prevale',
            description: 'Validar documentos y autorizar primer depósito a clientes',
            href: route('cajera.prevale.index'),
            icon: faShieldHalved,
            color: 'bg-green-500'
        },
        {
            title: 'Cobros y Pagos',
            description: 'Registrar pagos de distribuidoras y abonos',
            href: route('cajera.cobros'),
            icon: faMoneyBillWave,
            color: 'bg-blue-500'
        },
        {
            title: 'Conciliación Bancaria',
            description: 'Carga masiva de archivos y cruce de pagos',
            href: route('cajera.conciliaciones'),
            icon: faFileInvoiceDollar,
            color: 'bg-purple-500'
        },
        {
            title: 'Módulo de Cobranza',
            description: 'Gestión de morosidad y bloqueo de cuentas',
            href: route('cajera.cobranza.index'),
            icon: faClipboardCheck,
            color: 'bg-red-500'
        }
    ];

    const statsCards = [
        {
            label: 'Cobros de Hoy',
            value: `$${stats?.cobros_hoy ?? 0}`,
            icon: faMoneyBillWave,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-100',
        },
        {
            label: 'Pendientes Conciliar',
            value: stats?.pendientes_conciliar ?? 0,
            icon: faClock,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100',
        },
        {
            label: 'Prevales por Validar',
            value: stats?.prevales_pendientes ?? 0,
            icon: faFileSignature,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
        },
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
                        {statsCards.map((card) => (
                            <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{card.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}>
                                    <FontAwesomeIcon icon={card.icon} fixedWidth className={`text-2xl leading-none ${card.iconColor}`} />
                                </div>
                            </div>
                        ))}
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
                                <div className={`inline-flex w-12 h-12 rounded-lg ${action.color} text-white mb-4 shadow-sm items-center justify-center`}>
                                    <FontAwesomeIcon icon={action.icon} fixedWidth className="text-xl leading-none" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    {action.description}
                                </p>
                                <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                                    Acceder
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </TabletLayout>
    );
}