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
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                        <FontAwesomeIcon icon={faCircleExclamation} className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Cuenta no activada</p>
                    <p className="text-sm text-gray-500 mt-1">Contacta al administrador.</p>
                </div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout
            title={distribuidora?.numero_distribuidora ? `#${distribuidora.numero_distribuidora}` : 'Mi Panel'}
            subtitle={distribuidora?.nombre ? distribuidora.nombre : null}
        >
            <Head title="Dashboard Distribuidora" />

            <div className="space-y-5">
                {/* Estado cuenta */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${hayAlerta ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <FontAwesomeIcon icon={hayAlerta ? faCircleExclamation : faCheck} className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{distribuidora.estado}</p>
                            <p className="text-xs text-gray-500">{distribuidora?.categoria?.nombre || 'Sin categoría'}</p>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusBadgeClass(distribuidora.estado).split(' ').slice(0, 2).join(' ')}`}>
                        {distribuidora.estado}
                    </span>
                </div>

                {/* Stats principales */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl">
                        <p className="text-[10px] uppercase tracking-wider text-green-100">Crédito</p>
                        <p className="text-xl font-bold mt-1">{formatCurrency(stats.credito_disponible)}</p>
                        <p className="text-[10px] text-green-200 mt-1">disponible</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">Clientes</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(stats.clientes_activos)}</p>
                        <p className="text-[10px] text-gray-400 mt-1">activos</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action) => (
                        <Link key={action.title} href={action.href} className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl active:bg-gray-50">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-600">
                                <FontAwesomeIcon icon={action.icon} className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-700">{action.title}</span>
                        </Link>
                    ))}
                </div>

                {/* Corte vigente */}
                {relacionActual && (
                    <Link href={route('distribuidora.estado-cuenta')} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl active:bg-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Corte #{relacionActual.numero_relacion}</p>
                                <p className="text-xs text-gray-500">Vence: {formatDate(relacionActual.fecha_limite_pago)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-bold text-gray-900">{formatCurrency(relacionActual.total_a_pagar)}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadgeClass(relacionActual.estado).split(' ').slice(0, 2).join(' ')}`}>
                                {relacionActual.estado}
                            </span>
                        </div>
                    </Link>
                )}

                {/* Alertas */}
                {hayAlerta && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs font-bold text-red-700 mb-2">⚠️ Atención</p>
                        <div className="space-y-1">
                            {!alertas.distribuidora_activa && <p className="text-xs text-red-600">• Cuenta no activa</p>}
                            {!alertas.puede_emitir_vales && <p className="text-xs text-red-600">• Vales bloqueados</p>}
                            {alertas.pagos_pendientes_conciliar > 0 && <p className="text-xs text-red-600">• {alertas.pagos_pendientes_conciliar} pagos por conciliar</p>}
                        </div>
                    </div>
                )}

                {/* Todo OK */}
                {!hayAlerta && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-xs font-bold text-green-700">Lista para operar</p>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}