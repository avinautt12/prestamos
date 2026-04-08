import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleExclamation,
    faClock,
    faFileInvoiceDollar,
    faMoneyBillTransfer,
    faStar,
    faTriangleExclamation,
    faUsers,
    faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatNumber, statusBadgeClass } from './utils';

const statCards = (stats) => ([
    {
        title: 'Crédito disponible',
        value: formatCurrency(stats.credito_disponible),
        icon: faWallet,
        description: 'Disponible hoy para operación.',
    },
    {
        title: 'Puntos actuales',
        value: formatNumber(stats.puntos_actuales),
        icon: faStar,
        description: 'Saldo actual acumulado.',
    },
    {
        title: 'Clientes activos',
        value: formatNumber(stats.clientes_activos),
        icon: faUsers,
        description: 'Cartera activa ligada a tu cuenta.',
    },
    {
        title: 'Vales con saldo',
        value: formatNumber(stats.vales_activos),
        icon: faFileInvoiceDollar,
        description: 'Vales con deuda vigente o atraso.',
    },
]);

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

    return (
        <DistribuidoraLayout
            title="Dashboard"
            subtitle="Vista móvil de tu operación: crédito, clientes, vales, puntos y relación de corte."
        >
            <Head title="Dashboard Distribuidora" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Tu acceso todavía no está ligado a una distribuidora</p>
                    <p className="mt-2 fin-subtitle">
                        El rol ya existe, pero todavía no se encontró un registro operativo en la tabla de distribuidoras para tu persona.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statCards(stats).map((item) => (
                            <div key={item.title} className="fin-card">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{item.title}</p>
                                        <p className="fin-stat-value">{item.value}</p>
                                        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                                    </div>
                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-700">
                                        <FontAwesomeIcon icon={item.icon} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-3">
                        <div className="xl:col-span-2 fin-card">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="fin-title">Resumen de tu cuenta</h2>
                                    <p className="mt-1 fin-subtitle">
                                        Número {distribuidora.numero_distribuidora} · {distribuidora.nombre}
                                    </p>
                                </div>
                                <span className={statusBadgeClass(distribuidora.estado)}>{distribuidora.estado}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                                <div className="p-3 border rounded-xl border-gray-200">
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Categoría</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {distribuidora.categoria?.nombre || 'Sin categoría'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Comisión {distribuidora.categoria ? `${Number(distribuidora.categoria.porcentaje_comision || 0).toFixed(2)}%` : 'Pendiente'}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-xl border-gray-200">
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Límite de crédito</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {distribuidora.sin_limite ? 'Sin límite' : formatCurrency(distribuidora.limite_credito)}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Activada {formatDate(distribuidora.activada_en, true)}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-xl border-gray-200">
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Sucursal</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">{distribuidora.sucursal?.nombre || 'Sin sucursal'}</p>
                                    <p className="mt-1 text-sm text-gray-500">{distribuidora.sucursal?.codigo || 'Sin código'}</p>
                                </div>
                                <div className="p-3 border rounded-xl border-gray-200">
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Cuenta bancaria</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {distribuidora.cuenta_bancaria?.banco || 'Pendiente'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {distribuidora.cuenta_bancaria?.numero_cuenta_mascarado || 'Sin cuenta principal'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!alertas.distribuidora_activa && (
                                <div className="fin-card border-red-200 bg-red-50">
                                    <div className="flex gap-3">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-red-600 rounded-xl bg-white">
                                            <FontAwesomeIcon icon={faCircleExclamation} />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-red-800">Operación detenida</p>
                                            <p className="mt-1 text-sm text-red-700">
                                                Tu distribuidora no está en estado ACTIVA. Revisa con gerencia o coordinación antes de operar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!alertas.puede_emitir_vales && (
                                <div className="fin-card border-red-200 bg-red-50">
                                    <div className="flex gap-3">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-red-600 rounded-xl bg-white">
                                            <FontAwesomeIcon icon={faTriangleExclamation} />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-red-800">Inicio de vale bloqueado</p>
                                            <p className="mt-1 text-sm text-red-700">
                                                Tu registro operativo no tiene habilitado el proceso para levantar nuevos vales en este momento.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {alertas.pagos_pendientes_conciliar > 0 && (
                                <div className="fin-card border-amber-200 bg-amber-50">
                                    <p className="font-semibold text-amber-800">Pagos pendientes de conciliación</p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        Tienes {formatNumber(alertas.pagos_pendientes_conciliar)} pago(s) reportados o detectados que todavía no están conciliados.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-2">
                        <div className="fin-card">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="fin-title">Relación de corte</h2>
                                    <p className="mt-1 fin-subtitle">Resumen de la relación abierta o la más reciente.</p>
                                </div>
                                {relacionActual && <span className={statusBadgeClass(relacionActual.estado)}>{relacionActual.estado}</span>}
                            </div>

                            {!relacionActual ? (
                                <p className="mt-4 text-sm text-gray-500">Todavía no hay relaciones generadas para esta distribuidora.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                                        <div className="p-3 border rounded-xl border-gray-200">
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Número</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{relacionActual.numero_relacion}</p>
                                        </div>
                                        <div className="p-3 border rounded-xl border-gray-200">
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total a pagar</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(relacionActual.total_a_pagar)}</p>
                                        </div>
                                        <div className="p-3 border rounded-xl border-gray-200">
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(relacionActual.fecha_limite_pago)}</p>
                                        </div>
                                        <div className="p-3 border rounded-xl border-gray-200">
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Referencia</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900 break-all">{relacionActual.referencia_pago || 'Sin referencia'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Link href={route('distribuidora.estado-cuenta', { relacion_id: relacionActual.id })} className="fin-btn-secondary">
                                            Abrir estado de cuenta
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="fin-card">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="fin-title">Pagos reportados recientes</h2>
                                    <p className="mt-1 fin-subtitle">Seguimiento rápido a pagos de relación y conciliación.</p>
                                </div>
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-700">
                                    <FontAwesomeIcon icon={faMoneyBillTransfer} />
                                </span>
                            </div>

                            {!pagosRecientes.length ? (
                                <p className="mt-4 text-sm text-gray-500">Todavía no hay pagos reportados por esta distribuidora.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {pagosRecientes.map((pago) => (
                                        <div key={pago.id} className="p-3 border rounded-xl border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{formatCurrency(pago.monto)}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{pago.relacion_numero || 'Sin relación'} · {formatDate(pago.fecha_pago, true)}</p>
                                                </div>
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <span className={statusBadgeClass(pago.estado)}>{pago.estado}</span>
                                                    {pago.conciliacion_estado && (
                                                        <span className={statusBadgeClass(pago.conciliacion_estado)}>{pago.conciliacion_estado}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-2">
                        <div className="fin-card">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="fin-title">Próximos vencimientos</h2>
                                    <p className="mt-1 fin-subtitle">Vales abiertos ordenados por su fecha límite.</p>
                                </div>
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-700">
                                    <FontAwesomeIcon icon={faClock} />
                                </span>
                            </div>

                            {!proximosVencimientos.length ? (
                                <p className="mt-4 text-sm text-gray-500">No hay vales con saldo pendiente.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {proximosVencimientos.map((vale) => (
                                        <div key={vale.id} className="p-3 border rounded-xl border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{vale.numero_vale}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre} · {vale.producto_nombre}</p>
                                                </div>
                                                <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saldo</p>
                                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha límite</p>
                                                    <p className="mt-1 font-semibold text-gray-900">{formatDate(vale.fecha_limite_pago)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="fin-card">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="fin-title">Últimos vales</h2>
                                    <p className="mt-1 fin-subtitle">Historial reciente emitido para tus clientes.</p>
                                </div>
                                <Link href={route('distribuidora.vales')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                    Ver todo
                                </Link>
                            </div>

                            {!ultimosVales.length ? (
                                <p className="mt-4 text-sm text-gray-500">Todavía no hay vales registrados para esta distribuidora.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {ultimosVales.map((vale) => (
                                        <div key={vale.id} className="p-3 border rounded-xl border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{vale.numero_vale}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{vale.producto_nombre} · {formatNumber(vale.pagos_realizados)} / {formatNumber(vale.quincenas_totales)} pagos</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                                    <p className="text-xs text-gray-500">Saldo actual</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
