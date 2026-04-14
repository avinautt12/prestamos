import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
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

const quickActions = [
    {
        title: 'Crear pre vale',
        description: 'Levanta una nueva solicitud desde el móvil.',
        href: route('distribuidora.vales.create'),
        icon: faFileInvoiceDollar,
        tone: 'primary',
    },
    {
        title: 'Revisar vales',
        description: 'Consulta saldo, vencimientos y cancelaciones.',
        href: route('distribuidora.vales'),
        icon: faClock,
        tone: 'neutral',
    },
    {
        title: 'Canjear puntos',
        description: 'Aplica saldo a una relación pendiente.',
        href: route('distribuidora.puntos'),
        icon: faStar,
        tone: 'neutral',
    },
    {
        title: 'Estado de cuenta',
        description: 'Abre relaciones, partidas y pagos.',
        href: route('distribuidora.estado-cuenta'),
        icon: faWallet,
        tone: 'neutral',
    },
];

function CompactStatusCard({ title, value, subtitle, icon, accentClass }) {
    return (
        <div className="overflow-hidden border border-white/70 shadow-sm bg-white/90 backdrop-blur-xl rounded-3xl">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-gray-500 uppercase">{title}</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-gray-900">{value}</p>
                        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                    </div>
                    <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${accentClass}`}>
                        <FontAwesomeIcon icon={icon} />
                    </span>
                </div>
            </div>
        </div>
    );
}

function DashboardSection({ title, subtitle, icon, children, action = null }) {
    return (
        <section className="overflow-hidden border border-gray-200 shadow-sm bg-white/95 rounded-3xl">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-green-700 rounded-2xl bg-green-50">
                        <FontAwesomeIcon icon={icon} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                    </div>
                </div>
                {action}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function MiniItem({ title, subtitle, value }) {
    return (
        <div className="p-3 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-gray-500 uppercase">{title}</p>
            <p className="mt-2 text-base font-bold text-gray-900 break-words">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
    );
}

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
            subtitle="Panel móvil tipo app: operación, crédito, puntos y estado de cuenta en una sola vista."
        >
            <Head title="Dashboard Distribuidora" />

            {sinConfig ? (
                <div className="overflow-hidden border border-gray-200 shadow-sm bg-white/95 rounded-3xl">
                    <div className="p-5 bg-gradient-to-br from-green-600 via-green-500 to-green-600 text-white">
                        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80">Distribuidora</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight">Tu panel todavía no está activado</h2>
                        <p className="mt-2 text-sm text-white/85">
                            El acceso existe, pero aún no está ligado a un registro operativo de distribuidora para tu persona.
                        </p>
                    </div>
                    <div className="p-5">
                        <div className="p-4 border border-dashed border-gray-300 rounded-2xl bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">Cuando se complete el alta, aquí aparecerán:</p>
                            <ul className="mt-3 space-y-2 text-sm text-gray-600">
                                <li>Crédito disponible y puntos.</li>
                                <li>Accesos rápidos a vales, clientes y estado de cuenta.</li>
                                <li>Relación de corte, pagos recientes y alertas operativas.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-green-700 to-green-700 text-white shadow-xl shadow-slate-900/15">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.40) 0, transparent 30%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.22) 0, transparent 20%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.18) 0, transparent 24%)' }} />
                        <div className="relative p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/75">Tu operación</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                                        {distribuidora.nombre || 'Distribuidora'}
                                    </h2>
                                    <p className="mt-2 text-sm text-white/85">
                                        #{distribuidora.numero_distribuidora} · {distribuidora.sucursal?.nombre || 'Sin sucursal'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`${statusBadgeClass(distribuidora.estado)} border-white/20 bg-white/15 text-white`}>
                                        {distribuidora.estado}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                                        <FontAwesomeIcon icon={faCircleExclamation} />
                                        App móvil
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {statCards(stats).map((item) => (
                                    <div key={item.title} className="rounded-3xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">{item.title}</p>
                                                <p className="mt-2 text-lg font-black tracking-tight text-white">{item.value}</p>
                                            </div>
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-white/15 text-white">
                                                <FontAwesomeIcon icon={item.icon} />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className={`group flex items-start gap-3 rounded-3xl p-4 shadow-sm transition-transform duration-200 active:scale-[0.99] ${action.tone === 'primary' ? 'bg-green-700 text-white' : 'border border-gray-200 bg-white text-gray-900'}`}
                            >
                                <span className={`inline-flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-2xl ${action.tone === 'primary' ? 'bg-white/15 text-white' : 'bg-green-50 text-green-700'}`}>
                                    <FontAwesomeIcon icon={action.icon} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-bold ${action.tone === 'primary' ? 'text-white' : 'text-gray-900'}`}>{action.title}</p>
                                    <p className={`mt-1 text-[11px] leading-4 ${action.tone === 'primary' ? 'text-white/75' : 'text-gray-500'}`}>{action.description}</p>
                                </div>
                                <span className={`mt-1 hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full ${action.tone === 'primary' ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        ))}
                    </div>

                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <CompactStatusCard
                            title="Categoría"
                            value={distribuidora.categoria?.nombre || 'Sin categoría'}
                            subtitle={`Comisión ${distribuidora.categoria ? `${Number(distribuidora.categoria.porcentaje_comision || 0).toFixed(2)}%` : 'pendiente'}`}
                            icon={faStar}
                            accentClass="bg-amber-50 text-amber-600"
                        />
                        <CompactStatusCard
                            title="Límite de crédito"
                            value={distribuidora.sin_limite ? 'Sin límite' : formatCurrency(distribuidora.limite_credito)}
                            subtitle={`Activada ${formatDate(distribuidora.activada_en, true)}`}
                            icon={faWallet}
                            accentClass="bg-green-50 text-green-700"
                        />
                        <CompactStatusCard
                            title="Sucursal"
                            value={distribuidora.sucursal?.nombre || 'Sin sucursal'}
                            subtitle={distribuidora.sucursal?.codigo || 'Sin código'}
                            icon={faUsers}
                            accentClass="bg-slate-100 text-slate-700"
                        />
                        <CompactStatusCard
                            title="Cuenta bancaria"
                            value={distribuidora.cuenta_bancaria?.banco || 'Pendiente'}
                            subtitle={distribuidora.cuenta_bancaria?.numero_cuenta_mascarado || 'Sin cuenta principal'}
                            icon={faMoneyBillTransfer}
                            accentClass="bg-green-50 text-green-700"
                        />
                    </section>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <DashboardSection
                            title="Relación de corte"
                            subtitle="Resumen de la relación abierta o la más reciente."
                            icon={faFileInvoiceDollar}
                            action={relacionActual ? <span className={statusBadgeClass(relacionActual.estado)}>{relacionActual.estado}</span> : null}
                        >
                            {!relacionActual ? (
                                <p className="text-sm text-gray-500">Todavía no hay relaciones generadas para esta distribuidora.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <MiniItem title="Número" subtitle="Identificador operativo" value={relacionActual.numero_relacion} />
                                        <MiniItem title="Total a pagar" subtitle="Saldo actual de la relación" value={formatCurrency(relacionActual.total_a_pagar)} />
                                        <MiniItem title="Fecha límite" subtitle="Vencimiento programado" value={formatDate(relacionActual.fecha_limite_pago)} />
                                        <MiniItem title="Referencia" subtitle="Usa esta referencia al pagar" value={relacionActual.referencia_pago || 'Sin referencia'} />
                                    </div>
                                    <Link href={route('distribuidora.estado-cuenta', { relacion_id: relacionActual.id })} className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-700 rounded-2xl shadow-sm w-full sm:w-auto">
                                        Abrir estado de cuenta
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </Link>
                                </div>
                            )}
                        </DashboardSection>

                        <DashboardSection
                            title="Alertas operativas"
                            subtitle="Estado rápido de la cuenta antes de operar."
                            icon={faTriangleExclamation}
                        >
                            <div className="space-y-3">
                                {!alertas.distribuidora_activa && (
                                    <div className="flex gap-3 p-4 border border-red-200 bg-red-50 rounded-2xl">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-red-600 bg-white rounded-2xl">
                                            <FontAwesomeIcon icon={faCircleExclamation} />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-red-800">Operación detenida</p>
                                            <p className="mt-1 text-sm text-red-700">Tu distribuidora no está en estado ACTIVA.</p>
                                        </div>
                                    </div>
                                )}

                                {!alertas.puede_emitir_vales && (
                                    <div className="flex gap-3 p-4 border border-amber-200 bg-amber-50 rounded-2xl">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-amber-700 bg-white rounded-2xl">
                                            <FontAwesomeIcon icon={faTriangleExclamation} />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-amber-800">Emisión bloqueada</p>
                                            <p className="mt-1 text-sm text-amber-700">El proceso para levantar nuevos vales no está habilitado.</p>
                                        </div>
                                    </div>
                                )}

                                {alertas.pagos_pendientes_conciliar > 0 && (
                                    <div className="flex gap-3 p-4 border border-green-200 bg-green-50 rounded-2xl">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-green-700 bg-white rounded-2xl">
                                            <FontAwesomeIcon icon={faMoneyBillTransfer} />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-green-700">Pagos pendientes de conciliación</p>
                                            <p className="mt-1 text-sm text-green-700">
                                                Tienes {formatNumber(alertas.pagos_pendientes_conciliar)} pago(s) por revisar.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!alertas.distribuidora_activa && !alertas.pagos_pendientes_conciliar && alertas.puede_emitir_vales && (
                                    <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
                                        <p className="text-sm font-semibold text-gray-900">Todo en orden</p>
                                        <p className="mt-1 text-sm text-gray-500">La cuenta está lista para operar.</p>
                                    </div>
                                )}
                            </div>
                        </DashboardSection>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <DashboardSection
                            title="Próximos vencimientos"
                            subtitle="Vales abiertos ordenados por su fecha límite."
                            icon={faClock}
                        >
                            {!proximosVencimientos.length ? (
                                <p className="text-sm text-gray-500">No hay vales con saldo pendiente.</p>
                            ) : (
                                <div className="space-y-3">
                                    {proximosVencimientos.map((vale) => (
                                        <div key={vale.id} className="p-4 border border-gray-200 rounded-2xl bg-gray-50/70">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{vale.numero_vale}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{vale.cliente_nombre} · {vale.producto_nombre}</p>
                                                </div>
                                                <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                                                <MiniItem title="Saldo" subtitle="Monto pendiente" value={formatCurrency(vale.saldo_actual)} />
                                                <MiniItem title="Fecha límite" subtitle="Próximo vencimiento" value={formatDate(vale.fecha_limite_pago)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DashboardSection>

                        <DashboardSection
                            title="Últimos vales"
                            subtitle="Historial reciente emitido para tus clientes."
                            icon={faFileInvoiceDollar}
                            action={<Link href={route('distribuidora.vales')} className="text-sm font-semibold text-green-700">Ver todo</Link>}
                        >
                            {!ultimosVales.length ? (
                                <p className="text-sm text-gray-500">Todavía no hay vales registrados para esta distribuidora.</p>
                            ) : (
                                <div className="space-y-3">
                                    {ultimosVales.map((vale) => (
                                        <div key={vale.id} className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{vale.numero_vale}</p>
                                                    <p className="mt-1 text-sm text-gray-500 truncate">{vale.cliente_nombre}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{vale.producto_nombre} · {formatNumber(vale.pagos_realizados)} / {formatNumber(vale.quincenas_totales)} pagos</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={statusBadgeClass(vale.estado)}>{vale.estado}</span>
                                                    <p className="mt-2 text-2xl font-black tracking-tight text-gray-900">{formatCurrency(vale.saldo_actual)}</p>
                                                    <p className="text-xs text-gray-500">Saldo actual</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DashboardSection>

                        <DashboardSection
                            title="Pagos recientes"
                            subtitle="Últimos reportes capturados para conciliación."
                            icon={faMoneyBillTransfer}
                        >
                            {!pagosRecientes.length ? (
                                <p className="text-sm text-gray-500">Todavía no hay pagos reportados recientemente.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pagosRecientes.map((pago) => (
                                        <div key={pago.id} className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(pago.monto)}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{pago.relacion_numero || 'Sin relación'} · {formatDate(pago.fecha_pago, true)}</p>
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
                        </DashboardSection>
                    </div>
                </div>
            )}
        </DistribuidoraLayout>
    );
}


