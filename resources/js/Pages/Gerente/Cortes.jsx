import React, { useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCircleCheck, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const formatServerDate = (value) => {
    if (!value) {
        return 'Sin fecha';
    }

    const text = String(value).replace('T', ' ');
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?/);

    if (match) {
        const [, year, month, day, hour, minute] = match;
        return `${day}/${month}/${year} ${hour}:${minute}`;
    }

    return String(value);
};

export default function Cortes({ sucursal, proximoCorte, cortesMes = [] }) {
    const diasMes = useMemo(() => {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const totalDias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        const primerDiaSemana = inicio.getDay();
        const grid = [];

        for (let i = 0; i < primerDiaSemana; i += 1) {
            grid.push(null);
        }

        for (let dia = 1; dia <= totalDias; dia += 1) {
            grid.push(dia);
        }

        return grid;
    }, []);

    const cortesPorDia = useMemo(() => {
        const map = {};
        (cortesMes || []).forEach((corte) => {
            const fecha = corte.fecha_programada ? new Date(corte.fecha_programada) : null;
            if (!fecha) return;
            const dia = fecha.getDate();
            map[dia] = corte;
        });
        return map;
    }, [cortesMes]);

    return (
        <AdminLayout title="Cortes">
            <Head title="Cortes" />

            <div className="fin-card mb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="fin-title">Calendario de cortes</h2>
                        <p className="fin-subtitle mt-1">
                            Vista operativa de cortes programados, ejecutados y cierres manuales.
                        </p>
                        <p className="text-sm text-gray-600 mt-2">Sucursal activa: <span className="font-semibold">{sucursal?.nombre || 'Sin sucursal'}</span></p>
                    </div>
                    <div className="space-y-2 text-right">
                        <div className="fin-badge fin-badge-pending inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} />
                            {proximoCorte?.fecha_programada ? formatServerDate(proximoCorte.fecha_programada) : 'Sin corte próximo'}
                        </div>
                        {proximoCorte?.es_atrasado ? (
                            <div className="fin-badge fin-badge-rejected inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                                Programado pero atrasado
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="fin-card xl:col-span-2">
                    <div className="flex items-center gap-2 mb-4 text-gray-900">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-blue-700" />
                        <h3 className="font-semibold">Calendario del mes</h3>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
                            <div key={day} className="text-center">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {diasMes.map((dia, index) => {
                            if (!dia) {
                                return <div key={`empty-${index}`} className="h-24 rounded-lg bg-gray-50 border border-dashed border-gray-200" />;
                            }

                            const corte = cortesPorDia[dia];
                            const color = corte
                                ? corte.estado === 'EJECUTADO'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-amber-50 border-amber-200'
                                : 'bg-white border-gray-200';

                            return (
                                <div key={dia} className={`h-24 rounded-lg border p-2 ${color}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">{dia}</span>
                                        {corte ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-gray-700 border border-gray-200">
                                                {corte.estado}
                                            </span>
                                        ) : null}
                                    </div>
                                    {corte ? (
                                        <div className="mt-2 text-xs text-gray-700 space-y-1">
                                            <p className="font-medium">{corte.tipo_corte}</p>
                                            <p>{formatServerDate(corte.fecha_programada)}</p>
                                            {corte.observaciones ? <p className="truncate">{corte.observaciones}</p> : null}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs text-gray-400">Sin corte</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="fin-card">
                        <div className="flex items-center gap-2 mb-3 text-gray-900">
                            <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-700" />
                            <h3 className="font-semibold">Proximo corte</h3>
                        </div>

                        {proximoCorte ? (
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-500">Fecha:</span> {formatServerDate(proximoCorte.fecha_programada)}</p>
                                <p><span className="text-gray-500">Estado:</span> {proximoCorte.estado}</p>
                                <p><span className="text-gray-500">Tipo:</span> {proximoCorte.tipo_corte}</p>
                                <p><span className="text-gray-500">Observaciones:</span> {proximoCorte.observaciones || 'Sin observaciones'}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Aun no hay un corte programado para tu sucursal.</p>
                        )}
                    </div>


                </div>
            </div>
        </AdminLayout>
    );
}
