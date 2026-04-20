import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTriangleExclamation,
    faMoneyBillWave,
    faUsers,
    faCalendarDays,
    faArrowRight,
    faScaleBalanced,
    faClipboardCheck,
    faRankingStar,
    faCircleCheck,
    faClock,
    faShield,
} from '@fortawesome/free-solid-svg-icons';

export default function Reportes({
    sucursal,
    resumen,
    distribuidorasMorosas,
    filtro,
    saldoCortes,
    presolicitudes,
    puntosPorDistribuidora,
    corteReferencia,
}) {
    const periodoActivo = filtro?.periodo || 'mes';

    const periodos = [
        { key: 'mes', label: 'Mes actual' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'anio', label: 'Año' },
    ];

    const formatMoney = (value) => `$${Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
    const formatNumber = (value) => Number(value ?? 0).toLocaleString('es-MX');

    const proximoCorteTexto =
        resumen && resumen.proximo_corte && resumen.proximo_corte.fecha_programada
            ? new Date(resumen.proximo_corte.fecha_programada).toLocaleString('es-MX')
            : 'Sin corte programado';

    const totalProcesoPresolicitud = (presolicitudes?.pendientes ?? 0) + (presolicitudes?.validadas ?? 0);
    const pendientePct = totalProcesoPresolicitud > 0
        ? Math.round(((presolicitudes?.pendientes ?? 0) / totalProcesoPresolicitud) * 100)
        : 0;
    const validadaPct = totalProcesoPresolicitud > 0
        ? Math.round(((presolicitudes?.validadas ?? 0) / totalProcesoPresolicitud) * 100)
        : 0;

    const maxPuntos = Math.max(...(puntosPorDistribuidora?.map((item) => Number(item.puntos_snapshot ?? 0)) || [0]), 1);

    const cards = [
        {
            title: 'Vales morosos',
            value: resumen?.vales_morosos ?? 0,
            icon: faTriangleExclamation,
            tone: 'text-red-700',
            bg: 'bg-red-50',
        },
        {
            title: 'Capital en riesgo',
            value: `$${Number(resumen?.capital_en_riesgo ?? 0).toLocaleString('es-MX')}`,
            icon: faMoneyBillWave,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            title: 'Capital colocado',
            value: formatMoney(resumen?.capital_colocado ?? 0),
            icon: faMoneyBillWave,
            tone: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
        {
            title: 'Distribuidoras morosas',
            value: resumen?.distribuidoras_morosas ?? 0,
            icon: faUsers,
            tone: 'text-rose-700',
            bg: 'bg-rose-50',
        },
        {
            title: 'Próximo corte',
            value: proximoCorteTexto,
            icon: faCalendarDays,
            tone: 'text-blue-700',
            bg: 'bg-blue-50',
        },
        {
            title: 'Saldo de cortes',
            value: formatMoney(resumen?.saldo_cortes ?? 0),
            icon: faScaleBalanced,
            tone: 'text-indigo-700',
            bg: 'bg-indigo-50',
        },
        {
            title: 'Pre-solicitudes pendientes',
            value: resumen?.presolicitudes_pendientes ?? 0,
            icon: faClock,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            title: 'Pre-solicitudes validadas',
            value: resumen?.presolicitudes_validadas ?? 0,
            icon: faCircleCheck,
            tone: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
    ];

    return (
        <AdminLayout title="Reportes Gerenciales">
            <Head title="Reportes Gerenciales" />

            <div className="mb-5 overflow-hidden border border-blue-100 fin-card bg-gradient-to-r from-blue-50 via-white to-emerald-50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs tracking-wide text-blue-700 uppercase">Vista ejecutiva</p>
                        <h2 className="mt-1 fin-title">Reportes de sucursal: {sucursal?.nombre || 'Sin sucursal asignada'}</h2>
                        <p className="mt-1 fin-subtitle">
                            Indicadores clave para seguimiento de riesgo, corte y avance de pre-solicitudes.
                        </p>
                    </div>

                    <div className="p-3 bg-white border border-blue-100 rounded-lg">
                        <p className="text-xs text-gray-500">Próximo corte</p>
                        <p className="text-sm font-semibold text-gray-900">{proximoCorteTexto}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {periodos.map((periodo) => (
                        <Link
                            key={periodo.key}
                            href={route('gerente.reportes', { periodo: periodo.key })}
                            className={`px-3 py-1.5 text-xs rounded-full border transition ${periodoActivo === periodo.key
                                ? 'border-blue-300 bg-blue-100 text-blue-800 font-semibold'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'
                                }`}
                        >
                            {periodo.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.title} className={`fin-card ${card.bg}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-600">{card.title}</p>
                                <p className={`text-xl font-semibold ${card.tone}`}>{card.value}</p>
                            </div>
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white ${card.tone}`}>
                                <FontAwesomeIcon icon={card.icon} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 xl:grid-cols-2">
                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faShield} className="text-indigo-600" />
                        <h3 className="font-semibold">Saldo de cortes</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50">
                            <p className="text-gray-600">Relaciones abiertas</p>
                            <p className="text-xl font-semibold text-indigo-700">{formatNumber(saldoCortes?.relaciones_abiertas)}</p>
                        </div>
                        <div className="p-3 border border-blue-100 rounded-lg bg-blue-50">
                            <p className="text-gray-600">Saldo total</p>
                            <p className="text-xl font-semibold text-blue-700">{formatMoney(saldoCortes?.saldo_total)}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-rose-100 bg-rose-50">
                            <p className="text-gray-600">Saldo vencido</p>
                            <p className="text-xl font-semibold text-rose-700">{formatMoney(saldoCortes?.monto_vencido)}</p>
                        </div>
                    </div>

                    <div className="p-3 mt-3 border border-gray-100 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-500">Lectura rápida</p>
                        <p className="mt-1 text-sm text-gray-700">
                            {Number(saldoCortes?.monto_vencido ?? 0) > 0
                                ? 'Existe saldo vencido que requiere seguimiento inmediato con cajera y coordinacion.'
                                : 'No hay saldo vencido en corte; mantener monitoreo preventivo.'}
                        </p>
                    </div>
                </div>

                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-emerald-600" />
                        <h3 className="font-semibold">Pre-solicitudes ({periodos.find(p => p.key === periodoActivo)?.label?.toLowerCase() || periodoActivo})</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Pendientes</span>
                                <span className="font-semibold text-amber-700">{formatNumber(presolicitudes?.pendientes)} ({pendientePct}%)</span>
                            </div>
                            <div className="w-full h-2 mt-1 bg-gray-100 rounded-full">
                                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pendientePct}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Validadas</span>
                                <span className="font-semibold text-emerald-700">{formatNumber(presolicitudes?.validadas)} ({validadaPct}%)</span>
                            </div>
                            <div className="w-full h-2 mt-1 bg-gray-100 rounded-full">
                                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${validadaPct}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                            <div className="p-3 rounded-lg bg-emerald-50">
                                <p className="text-gray-600">Aprobadas</p>
                                <p className="font-semibold text-emerald-700">{formatNumber(presolicitudes?.aprobadas)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-rose-50">
                                <p className="text-gray-600">Rechazadas</p>
                                <p className="font-semibold text-rose-700">{formatNumber(presolicitudes?.rechazadas)}</p>
                            </div>
                        </div>

                        <div className="p-3 border rounded-lg border-emerald-100 bg-emerald-50">
                            <p className="text-xs text-gray-600">Tasa de validación (pendiente vs validada)</p>
                            <p className="text-lg font-semibold text-emerald-700">{Number(presolicitudes?.tasa_validacion ?? 0).toLocaleString('es-MX')}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 fin-card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-900">
                        <FontAwesomeIcon icon={faRankingStar} className="text-blue-700" />
                        <h3 className="font-semibold">Puntos por distribuidora al corte</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                        Corte: {corteReferencia?.fecha_programada ? new Date(corteReferencia.fecha_programada).toLocaleString('es-MX') : 'Sin corte de referencia'}
                    </p>
                </div>

                {puntosPorDistribuidora?.length ? (
                    <div className="space-y-3">
                        {puntosPorDistribuidora.map((item) => {
                            const widthPct = Math.max(8, Math.round((Number(item.puntos_snapshot ?? 0) / maxPuntos) * 100));
                            return (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-lg">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.nombre}</p>
                                            <p className="text-xs text-gray-500">No. {item.numero_distribuidora || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-700">{formatNumber(item.puntos_snapshot)} pts</p>
                                            <p className="text-xs text-gray-500">Saldo: {formatMoney(item.saldo_relacion)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-blue-50">
                                        <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600" style={{ width: `${widthPct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay relaciones de corte con puntos para mostrar en esta sucursal.</p>
                )}
            </div>

            <div className="fin-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Distribuidoras en estatus moroso</h3>
                    <Link href={route('gerente.distribuidoras')} className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                        Ir a bandeja
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>

                {distribuidorasMorosas?.length ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {distribuidorasMorosas.slice(0, 8).map((dist) => (
                            <div key={dist.id} className="p-3 border border-red-100 rounded-lg bg-red-50">
                                <p className="font-medium text-red-900">
                                    {dist.persona?.primer_nombre} {dist.persona?.apellido_paterno} {dist.persona?.apellido_materno}
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    No. distribuidora: {dist.numero_distribuidora || 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay distribuidoras morosas registradas en tu sucursal.</p>
                )}
            </div>
        </AdminLayout>
    );
}
