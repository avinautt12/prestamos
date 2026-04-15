import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatDate, statusBadgeClass } from './utils';

const estados = [
    'TODOS',
    'PENDIENTE_COORDINADOR',
    'APROBADA_CODIGO_EMITIDO',
    'EJECUTADA',
    'RECHAZADA',
    'EXPIRADA',
    'CANCELADA',
];

export default function Traspasos({ distribuidora, filtros = {}, solicitudes = [] }) {
    const [codigoCliente, setCodigoCliente] = useState('');
    const [motivoSolicitud, setMotivoSolicitud] = useState('');
    const [estado, setEstado] = useState(filtros.estado || 'TODOS');
    const [codigos, setCodigos] = useState({});

    const resumen = useMemo(() => {
        return {
            total: solicitudes.length,
            pendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE_COORDINADOR').length,
            aprobadas: solicitudes.filter((s) => s.estado === 'APROBADA_CODIGO_EMITIDO').length,
            ejecutadas: solicitudes.filter((s) => s.estado === 'EJECUTADA').length,
        };
    }, [solicitudes]);

    const submitSolicitud = (event) => {
        event.preventDefault();

        router.post(route('distribuidora.traspasos.store'), {
            codigo_cliente: codigoCliente,
            motivo_solicitud: motivoSolicitud,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCodigoCliente('');
                setMotivoSolicitud('');
            },
        });
    };

    const filtrar = (nuevoEstado) => {
        setEstado(nuevoEstado);
        router.get(route('distribuidora.traspasos.index'), {
            estado: nuevoEstado,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const confirmar = (solicitudId) => {
        const codigo = (codigos[solicitudId] || '').trim();
        if (!codigo) {
            return;
        }

        router.post(route('distribuidora.traspasos.confirmar', solicitudId), {
            codigo_confirmacion: codigo,
        }, {
            preserveScroll: true,
        });
    };

    const cancelar = (solicitudId) => {
        router.post(route('distribuidora.traspasos.cancelar', solicitudId), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DistribuidoraLayout title="Traspasos" subtitle="Solicita clientes de otras distribuidoras y confirma entregas con código.">
            <Head title="Traspasos de Clientes" />

            {!distribuidora ? (
                <div className="fin-card">
                    <p className="fin-title">No tienes distribuidora ligada</p>
                    <p className="mt-2 fin-subtitle">Cuando tu cuenta quede vinculada, aquí podrás gestionar traspasos de cartera.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="fin-card bg-white/95 backdrop-blur">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="p-3 border rounded-xl border-emerald-100 bg-emerald-50">
                                <p className="text-xs text-emerald-700">Total</p>
                                <p className="text-lg font-semibold text-emerald-900">{resumen.total}</p>
                            </div>
                            <div className="p-3 border rounded-xl border-amber-100 bg-amber-50">
                                <p className="text-xs text-amber-700">Pendientes</p>
                                <p className="text-lg font-semibold text-amber-900">{resumen.pendientes}</p>
                            </div>
                            <div className="p-3 border border-blue-100 rounded-xl bg-blue-50">
                                <p className="text-xs text-blue-700">Aprobadas</p>
                                <p className="text-lg font-semibold text-blue-900">{resumen.aprobadas}</p>
                            </div>
                            <div className="p-3 border rounded-xl border-violet-100 bg-violet-50">
                                <p className="text-xs text-violet-700">Ejecutadas</p>
                                <p className="text-lg font-semibold text-violet-900">{resumen.ejecutadas}</p>
                            </div>
                        </div>
                    </div>

                    <div className="fin-card bg-white/95 backdrop-blur">
                        <h2 className="fin-title">Solicitar traspaso</h2>
                        <p className="mt-1 text-sm text-gray-600">Captura el código del cliente para pedir su traslado a tu cartera.</p>

                        <form onSubmit={submitSolicitud} className="grid gap-3 mt-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Código cliente</label>
                                <input
                                    type="text"
                                    value={codigoCliente}
                                    onChange={(e) => setCodigoCliente(e.target.value.toUpperCase())}
                                    className="fin-input"
                                    placeholder="Ej. CLI-000123"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Motivo (opcional)</label>
                                <textarea
                                    value={motivoSolicitud}
                                    onChange={(e) => setMotivoSolicitud(e.target.value)}
                                    className="fin-input min-h-[90px]"
                                    placeholder="Contexto comercial del traspaso"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                                    Enviar solicitud
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="fin-card bg-white/95 backdrop-blur">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="fin-title">Bandeja de traspasos</h2>
                            <select
                                value={estado}
                                onChange={(e) => filtrar(e.target.value)}
                                className="fin-input max-w-[260px]"
                            >
                                {estados.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 space-y-3">
                            {solicitudes.length === 0 && (
                                <div className="p-4 text-sm text-gray-500 border border-gray-300 border-dashed rounded-xl">
                                    No hay solicitudes para el filtro seleccionado.
                                </div>
                            )}

                            {solicitudes.map((solicitud) => (
                                <div key={solicitud.id} className="p-4 border border-gray-200 rounded-2xl">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {solicitud.cliente.nombre} <span className="text-xs text-gray-500">({solicitud.cliente.codigo})</span>
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Origen: {solicitud.origen.numero || '-'} · Destino: {solicitud.destino.numero || '-'}
                                            </p>
                                        </div>
                                        <span className={statusBadgeClass(solicitud.estado)}>{solicitud.estado}</span>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-500">
                                        Solicitud: {formatDate(solicitud.creado_en, true)}
                                        {solicitud.codigo_expira_en ? ` · Expira: ${formatDate(solicitud.codigo_expira_en, true)}` : ''}
                                    </div>

                                    {solicitud.motivo_solicitud && (
                                        <p className="mt-2 text-sm text-gray-700">Motivo: {solicitud.motivo_solicitud}</p>
                                    )}

                                    {solicitud.motivo_rechazo && (
                                        <p className="p-2 mt-2 text-sm border rounded-lg border-rose-100 bg-rose-50 text-rose-700">
                                            Rechazo: {solicitud.motivo_rechazo}
                                        </p>
                                    )}

                                    {solicitud.es_origen && solicitud.codigo_confirmacion && solicitud.estado === 'APROBADA_CODIGO_EMITIDO' && (
                                        <p className="p-2 mt-2 text-sm text-blue-700 border border-blue-100 rounded-lg bg-blue-50">
                                            Codigo de confirmacion: <span className="font-semibold">{solicitud.codigo_confirmacion}</span>
                                        </p>
                                    )}

                                    {solicitud.puede_confirmar && (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                                            <input
                                                type="text"
                                                value={codigos[solicitud.id] || ''}
                                                onChange={(e) => setCodigos((prev) => ({ ...prev, [solicitud.id]: e.target.value.toUpperCase() }))}
                                                className="fin-input"
                                                placeholder="Código de confirmación"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => confirmar(solicitud.id)}
                                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                            >
                                                Confirmar y traspasar
                                            </button>
                                        </div>
                                    )}

                                    {solicitud.es_destino && solicitud.estado === 'PENDIENTE_COORDINADOR' && (
                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="button"
                                                onClick={() => cancelar(solicitud.id)}
                                                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                            >
                                                Cancelar solicitud
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </DistribuidoraLayout>
    );
}
