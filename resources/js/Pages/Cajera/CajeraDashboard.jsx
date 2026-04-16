import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function CajeraDashboard({ stats, vales_por_verificar, movimientos_pendientes, usuario }) {
    
    const quickActions = [
        { title: 'Verificación Prevale', description: 'Validar documentos y autorizar primer depósito', href: route('cajera.prevale.index'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', variant: 'primary' },
        { title: 'Conciliación Bancaria', description: 'Carga masiva de archivos y cruce de pagos', href: route('cajera.conciliaciones'), icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', variant: 'secondary' },
        { title: 'Módulo de Cobranza', description: 'Gestión de morosidad y bloqueo de cuentas', href: route('cajera.cobranza.index'), icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', variant: 'secondary' }
    ];

    const statCards = [
        { title: 'Prevales por Validar', value: stats.prevales_pendientes, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { title: 'Movimientos sin Conciliar', value: stats.pendientes_conciliar, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { title: 'Cortes Vencidos', value: stats.cortes_vencidos, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { title: 'Distribuidoras Bloqueadas', value: stats.distribuidoras_morosas_bloqueadas, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' }
    ];

    const forzarMoneda = (valor) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor || 0);
    };

    return (
        <TabletLayout title="Panel de Cajera">
            <Head title="Dashboard Cajera" />
            
            <div className="fin-page">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                {/* Data Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Prevales por Verificar */}
                    <div className="fin-card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Prevales por Verificar</h2>
                            <Link href={route('cajera.prevale.index')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Ver todos</Link>
                        </div>
                        {vales_por_verificar?.length > 0 ? (
                            <div className="space-y-3">
                                {vales_por_verificar.map((vale) => (
                                    <div key={vale.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Folio #{vale.id}</p>
                                            <p className="text-xs text-gray-500">{vale.cliente?.persona?.primer_nombre} {vale.cliente?.persona?.apellido_paterno}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">{forzarMoneda(vale.monto)}</p>
                                            <Link href={route('cajera.prevale.index')} className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block mt-1">Validar</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                No hay prevales pendientes de verificación en este momento.
                            </div>
                        )}
                    </div>

                    {/* Movimientos sin Conciliar */}
                    <div className="fin-card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Movimientos Bancarios sin Conciliar</h2>
                            <Link href={route('cajera.conciliaciones')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Ir a conciliar</Link>
                        </div>
                        {movimientos_pendientes?.length > 0 ? (
                            <div className="space-y-3">
                                {movimientos_pendientes.map((mov) => (
                                    <div key={mov.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{mov.fecha_movimiento}</p>
                                            <p className="text-xs text-gray-500 truncate w-48">{mov.concepto_raw || 'Transferencia'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">{forzarMoneda(mov.monto)}</p>
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-block mt-1">Ref: {mov.referencia || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                Todos los movimientos del estado de cuenta han sido conciliados.
                            </div>
                        )}
                    </div>
                </div>

                {/* Conciliaciones del Día y Operatividad */}
                <div className="mb-6 fin-card">
                    <h2 className="mb-3 text-lg font-semibold">Métricas del Día</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                        <div className="p-3 border rounded-lg bg-green-50 shadow-sm">
                            <p className="text-green-700 font-semibold tracking-wide uppercase text-xs">Monto Conciliado</p>
                            <p className="text-xl font-bold text-green-900 mt-1">{forzarMoneda(stats.total_cobrado)}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-blue-50 shadow-sm">
                            <p className="text-blue-700 font-semibold tracking-wide uppercase text-xs">Pagos Registrados</p>
                            <p className="text-xl font-bold text-blue-900 mt-1">{stats.cobros_hoy}</p>
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="fin-info">
                    <p className="text-sm font-medium">
                        Bienvenida {usuario?.persona?.primer_nombre}. Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>
        </TabletLayout>
    );
}