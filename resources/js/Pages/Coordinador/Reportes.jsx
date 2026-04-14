import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TabletLayout from '@/Layouts/TabletLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faClock,
    faCircleCheck,
    faUsers,
    faPeopleGroup,
    faListCheck,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

export default function Reportes({ sucursal, filtro, resumen, topDistribuidoras = [] }) {
    const periodoActivo = filtro?.periodo || 'mes';

    const periodos = [
        { key: 'mes', label: 'Mes actual' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'anio', label: 'Ano' },
    ];

    const formatNumber = (value) => Number(value ?? 0).toLocaleString('es-MX');
    const formatMoney = (value) => `$${Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;

    const pipelineTotal =
        Number(resumen?.solicitudes_pendientes ?? 0)
        + Number(resumen?.solicitudes_validadas ?? 0)
        + Number(resumen?.solicitudes_aprobadas ?? 0)
        + Number(resumen?.solicitudes_rechazadas ?? 0);

    const calcPct = (value) => {
        if (!pipelineTotal) return 0;
        return Math.round((Number(value ?? 0) / pipelineTotal) * 100);
    };

    const cards = [
        {
            title: 'Solicitudes del periodo',
            value: formatNumber(resumen?.solicitudes_total_periodo),
            icon: faListCheck,
            tone: 'text-sky-700',
            bg: 'bg-sky-50',
        },
        {
            title: 'Pendientes',
            value: formatNumber(resumen?.solicitudes_pendientes),
            icon: faClock,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            title: 'Validadas',
            value: formatNumber(resumen?.solicitudes_validadas),
            icon: faCircleCheck,
            tone: 'text-blue-700',
            bg: 'bg-blue-50',
        },
        {
            title: 'Tasa de aprobación',
            value: `${Number(resumen?.tasa_aprobacion ?? 0).toLocaleString('es-MX')}%`,
            icon: faChartLine,
            tone: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
    ];

    return (
        <TabletLayout title="Reportes Coordinador" showTitle={false}>
            <Head title="Reportes Coordinador" />

            <div className="mb-5 overflow-hidden border border-blue-100 fin-card bg-gradient-to-r from-cyan-50 via-white to-blue-50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs tracking-wide text-cyan-700 uppercase">Control operativo</p>
                        <h2 className="mt-1 fin-title">Reportes de coordinación - {sucursal?.nombre || 'Sin sucursal asignada'}</h2>
                        <p className="mt-1 fin-subtitle">
                            Seguimiento del avance de solicitudes y productividad de cartera sin saturar la vista.
                        </p>
                    </div>
                    <div className="p-3 bg-white border border-cyan-100 rounded-lg">
                        <p className="text-xs text-gray-500">Tiempo promedio de revisión</p>
                        <p className="text-base font-semibold text-cyan-700">{Number(resumen?.tiempo_revision_promedio_horas ?? 0).toLocaleString('es-MX')} h</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {periodos.map((periodo) => (
                        <Link
                            key={periodo.key}
                            href={route('coordinador.reportes', { periodo: periodo.key })}
                            className={`px-3 py-1.5 text-xs rounded-full border transition ${periodoActivo === periodo.key
                                ? 'border-cyan-300 bg-cyan-100 text-cyan-800 font-semibold'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-cyan-200 hover:text-cyan-700'
                                }`}
                        >
                            {periodo.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.title} className={`fin-card ${card.bg}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-600">{card.title}</p>
                                <p className={`text-2xl font-semibold ${card.tone}`}>{card.value}</p>
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
                        <FontAwesomeIcon icon={faChartLine} className="text-cyan-600" />
                        <h3 className="font-semibold">Avance de solicitudes</h3>
                    </div>

                    <div className="space-y-3">
                        <PipelineRow label="Pendientes" value={resumen?.solicitudes_pendientes} pct={calcPct(resumen?.solicitudes_pendientes)} barClass="bg-amber-400" />
                        <PipelineRow label="Validadas" value={resumen?.solicitudes_validadas} pct={calcPct(resumen?.solicitudes_validadas)} barClass="bg-blue-500" />
                        <PipelineRow label="Aprobadas" value={resumen?.solicitudes_aprobadas} pct={calcPct(resumen?.solicitudes_aprobadas)} barClass="bg-emerald-500" />
                        <PipelineRow label="Rechazadas" value={resumen?.solicitudes_rechazadas} pct={calcPct(resumen?.solicitudes_rechazadas)} barClass="bg-rose-500" />
                    </div>

                    <div className="p-3 mt-4 border border-gray-100 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-500">Lectura rápida</p>
                        <p className="mt-1 text-sm text-gray-700">
                            {Number(resumen?.solicitudes_pendientes ?? 0) > Number(resumen?.solicitudes_validadas ?? 0)
                                ? 'La bandeja pendiente supera a las validadas; conviene priorizar seguimiento de expedientes.'
                                : 'El flujo de validación va al ritmo esperado para este periodo.'}
                        </p>
                    </div>
                </div>

                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faPeopleGroup} className="text-indigo-600" />
                        <h3 className="font-semibold">Cartera asignada</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg border-indigo-100 bg-indigo-50">
                            <p className="text-xs text-gray-600">Distribuidoras asignadas</p>
                            <p className="text-lg font-semibold text-indigo-700">{formatNumber(resumen?.distribuidoras_asignadas)}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-cyan-100 bg-cyan-50">
                            <p className="text-xs text-gray-600">Clientes activos</p>
                            <p className="text-lg font-semibold text-cyan-700">{formatNumber(resumen?.clientes_activos)}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-rose-100 bg-rose-50">
                            <p className="text-xs text-gray-600">Distribuidoras morosas</p>
                            <p className="text-lg font-semibold text-rose-700">{formatNumber(resumen?.distribuidoras_morosas)}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-emerald-100 bg-emerald-50">
                            <p className="text-xs text-gray-600">Aprobación del periodo</p>
                            <p className="text-lg font-semibold text-emerald-700">{Number(resumen?.tasa_aprobacion ?? 0).toLocaleString('es-MX')}%</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Link href={route('coordinador.solicitudes.index')} className="fin-btn-secondary text-xs">
                            Ver solicitudes
                        </Link>
                        <Link href={route('coordinador.mis-distribuidoras')} className="fin-btn-secondary text-xs">
                            Ver distribuidoras
                        </Link>
                    </div>
                </div>
            </div>

            <div className="fin-card">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-900">
                        <FontAwesomeIcon icon={faUsers} className="text-blue-700" />
                        <h3 className="font-semibold">Distribuidoras con mayor actividad</h3>
                    </div>
                    <Link href={route('coordinador.mis-distribuidoras')} className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                        Ir a cartera
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>

                {topDistribuidoras.length > 0 ? (
                    <div className="space-y-2">
                        {topDistribuidoras.map((dist) => (
                            <div key={dist.id} className="p-3 border border-gray-100 rounded-lg">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-gray-900">{dist.nombre}</p>
                                        <p className="text-xs text-gray-500">No. {dist.numero_distribuidora || 'N/A'} · Estado: {dist.estado}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-right min-w-[230px]">
                                        <div className="p-2 rounded bg-blue-50">
                                            <p className="text-gray-500">Clientes</p>
                                            <p className="font-semibold text-blue-700">{formatNumber(dist.clientes_activos)}</p>
                                        </div>
                                        <div className="p-2 rounded bg-emerald-50">
                                            <p className="text-gray-500">Vales</p>
                                            <p className="font-semibold text-emerald-700">{formatNumber(dist.vales_activos)}</p>
                                        </div>
                                        <div className="p-2 rounded bg-indigo-50">
                                            <p className="text-gray-500">Crédito disp.</p>
                                            <p className="font-semibold text-indigo-700">{formatMoney(dist.credito_disponible)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay distribuidoras asignadas para mostrar actividad en este momento.</p>
                )}
            </div>
        </TabletLayout>
    );
}

function PipelineRow({ label, value, pct, barClass }) {
    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{Number(value ?? 0).toLocaleString('es-MX')} ({pct}%)</span>
            </div>
            <div className="w-full h-2 mt-1 bg-gray-100 rounded-full">
                <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
        </div>
    );
}
