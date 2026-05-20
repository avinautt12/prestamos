import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCheck,
    faCircleExclamation,
    faPlus,
    faUsers,
    faFileAlt,
    faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

const quickActions = [
    { title: 'Crear vale', desc: 'Nuevo crédito', href: route('distribuidora.vales.create'), icon: faPlus },
    { title: 'Cartera', desc: 'Mis clientes', href: route('distribuidora.clientes'), icon: faUsers },
    { title: 'Vales', desc: 'Consultar', href: route('distribuidora.vales'), icon: faFileAlt },
    { title: 'Cuenta', desc: 'Relaciones', href: route('distribuidora.estado-cuenta'), icon: faWallet },
];

export default function DistribuidoraDashboard({
    distribuidora,
    stats,
    relacionActual,
    ultimosVales = [],
    proximosVencimientos = [],
    pagosRecientes = [],
    alertas,
}) {
    const sinConfig = !distribuidora;
    const hayAlerta = !alertas?.distribuidora_activa || !alertas?.puede_emitir_vales || alertas?.pagos_pendientes_conciliar > 0;

    if (sinConfig) {
        return (
            <DistribuidoraLayout title="Dashboard" subtitle="No disponible">
                <Head title="Dashboard Distribuidora" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                        <FontAwesomeIcon icon={faCircleExclamation} className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">Cuenta no activada</p>
                    <p className="text-sm text-gray-500 mt-1">Contacta al administrador.</p>
                </div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Dashboard">
            <Head title="Dashboard Distribuidora" />

            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-xs uppercase tracking-wider text-green-100">Crédito Disponible</p>
                        <p className="text-3xl font-bold mt-2">{distribuidora.sin_limite ? 'Sin límite' : formatCurrency(stats.credito_disponible)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Clientes Activos</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.clientes_activos)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Vales Activos</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.vales_activos)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.title}
                                    href={action.href}
                                    className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <FontAwesomeIcon icon={action.icon} className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{action.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Relación actual</h3>
                            {relacionActual ? (
                                <Link href={route('distribuidora.estado-cuenta')} className="block p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                                <FontAwesomeIcon icon={faFileAlt} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-900">Corte #{relacionActual.numero_relacion}</p>
                                                <p className="text-sm text-gray-500">Vence: {formatDate(relacionActual.fecha_limite_pago)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(relacionActual.total_a_pagar)}</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(relacionActual.estado).split(' ').slice(0, 2).join(' ')}`}>
                                                {relacionActual.estado}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No hay relación activa</p>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Vales recientes</h3>
                            {ultimosVales.length > 0 ? (
                                <div className="space-y-2">
                                    {ultimosVales.map((vale) => (
                                        <div key={vale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{vale.numero_vale}</p>
                                                <p className="text-xs text-gray-500">{vale.cliente_nombre}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadgeClass(vale.estado).split(' ').slice(0, 2).join(' ')}`}>
                                                    {vale.estado}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">Sin vales recientes</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Próximos vencimientos</h3>
                        {proximosVencimientos.length > 0 ? (
                            <div className="space-y-2">
                                {proximosVencimientos.map((vale) => (
                                    <div key={vale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{vale.numero_vale}</p>
                                            <p className="text-xs text-gray-500">{vale.cliente_nombre}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-amber-600">{formatCurrency(vale.saldo_actual)}</p>
                                            <p className="text-xs text-gray-500">Vence: {formatDate(vale.fecha_limite_pago)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Sin vencimientos próximos</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Pagos recientes</h3>
                        {pagosRecientes.length > 0 ? (
                            <div className="space-y-2">
                                {pagosRecientes.map((pago) => (
                                    <div key={pago.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{formatCurrency(pago.monto)}</p>
                                            <p className="text-xs text-gray-500">{pago.numero_relacion} · {formatDate(pago.fecha_pago)}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(pago.estado).split(' ').slice(0, 2).join(' ')}`}>
                                            {pago.estado}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Sin pagos recientes</p>
                        )}
                    </div>
                </div>

                {hayAlerta && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-bold text-red-700 mb-2">Atención</p>
                        <div className="space-y-1">
                            {!alertas.distribuidora_activa && <p className="text-sm text-red-600">• Cuenta no activa</p>}
                            {!alertas.puede_emitir_vales && <p className="text-sm text-red-600">• Vales bloqueados</p>}
                            {alertas.pagos_pendientes_conciliar > 0 && <p className="text-sm text-red-600">• {alertas.pagos_pendientes_conciliar} pagos por conciliar</p>}
                        </div>
                    </div>
                )}

                {!hayAlerta && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100">
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-green-700">Lista para operar</p>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}