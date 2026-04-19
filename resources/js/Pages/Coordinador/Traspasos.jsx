import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TabletLayout from '@/Layouts/TabletLayout';

const estados = [
    'PENDIENTE_COORDINADOR',
    'TODOS',
    'APROBADA_CODIGO_EMITIDO',
    'EJECUTADA',
    'RECHAZADA',
    'EXPIRADA',
    'CANCELADA',
];

export default function Traspasos({ filtros = {}, solicitudes = [], sucursal = null }) {
    const [estado, setEstado] = useState(filtros.estado || 'PENDIENTE_COORDINADOR');
    const [motivos, setMotivos] = useState({});

    const cambiarEstado = (value) => {
        setEstado(value);
        router.get(route('coordinador.traspasos.index'), {
            estado: value,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const aprobar = (id) => {
        router.post(route('coordinador.traspasos.aprobar', id), {}, {
            preserveScroll: true,
        });
    };

    const rechazar = (id) => {
        const motivo = (motivos[id] || '').trim();
        if (!motivo) {
            return;
        }

        router.post(route('coordinador.traspasos.rechazar', id), {
            motivo_rechazo: motivo,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <TabletLayout title="Traspasos de Clientes">
            <Head title="Traspasos de Clientes" />

            <div className="max-w-6xl mx-auto space-y-4">
                <div className="fin-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs tracking-wide text-blue-700 uppercase">Coordinación</p>
                            <h1 className="text-xl font-bold text-gray-900">Bandeja de traspasos</h1>
                            <p className="text-sm text-gray-500">
                                {sucursal ? `Sucursal activa: ${sucursal.nombre}` : 'Sin sucursal activa detectada'}
                            </p>
                        </div>
                        <select value={estado} onChange={(e) => cambiarEstado(e.target.value)} className="fin-input max-w-[280px]">
                            {estados.map((item) => (
                                <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {solicitudes.length === 0 && (
                        <div className="fin-card text-sm text-gray-500">No hay solicitudes para el filtro actual.</div>
                    )}

                    {solicitudes.map((solicitud) => (
                        <div key={solicitud.id} className="fin-card border border-gray-200">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {solicitud.cliente.nombre} <span className="text-xs text-gray-500">({solicitud.cliente.codigo})</span>
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Origen: {solicitud.origen.numero || '-'} ({solicitud.origen.nombre || 'Sin nombre'})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Destino: {solicitud.destino.numero || '-'} ({solicitud.destino.nombre || 'Sin nombre'})
                                    </p>
                                </div>
                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                    {solicitud.estado.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {solicitud.motivo_solicitud && (
                                <p className="mt-3 text-sm text-gray-700">Motivo: {solicitud.motivo_solicitud}</p>
                            )}

                            {solicitud.motivo_rechazo && (
                                <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 p-2 text-sm text-rose-700">
                                    Rechazo: {solicitud.motivo_rechazo}
                                </p>
                            )}

                            {solicitud.codigo_confirmacion && (
                                <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-2 text-sm text-blue-700">
                                    Código vigente: <span className="font-semibold">{solicitud.codigo_confirmacion}</span>
                                </p>
                            )}

                            {solicitud.puede_dictaminar && (
                                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">Motivo de rechazo</label>
                                        <input
                                            type="text"
                                            value={motivos[solicitud.id] || ''}
                                            onChange={(e) => setMotivos((prev) => ({ ...prev, [solicitud.id]: e.target.value }))}
                                            className="fin-input"
                                            placeholder="Obligatorio para rechazar"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => aprobar(solicitud.id)}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Aprobar y generar código
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => rechazar(solicitud.id)}
                                        className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </TabletLayout>
    );
}
