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
} from '@fortawesome/free-solid-svg-icons';

export default function Reportes({ sucursal, resumen, distribuidorasMorosas }) {
    const proximoCorteTexto =
        resumen && resumen.proximo_corte && resumen.proximo_corte.fecha_programada
            ? new Date(resumen.proximo_corte.fecha_programada).toLocaleString('es-MX')
            : 'Sin corte programado';

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
    ];

    return (
        <AdminLayout title="Reportes de Morosidad">
            <Head title="Reportes de Morosidad" />

            <div className="mb-4 fin-card">
                <h2 className="fin-title">Supervisión de Riesgo - {sucursal?.nombre || 'Sin sucursal asignada'}</h2>
                <p className="mt-1 fin-subtitle">
                    Monitoreo operativo de morosidad y capital en riesgo para toma de decisiones del gerente.
                </p>
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

            <div className="fin-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Distribuidoras en estatus moroso</h3>
                    <Link href={route('gerente.distribuidoras')} className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                        Ir a bandeja
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>

                {distribuidorasMorosas?.length ? (
                    <div className="space-y-2">
                        {distribuidorasMorosas.map((dist) => (
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
