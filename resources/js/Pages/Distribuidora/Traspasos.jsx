import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightArrowLeft, faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { formatDate, statusBadgeClass } from './utils';

const estados = ['TODOS', 'PENDIENTE_COORDINADOR', 'APROBADA_CODIGO_EMITIDO', 'EJECUTADA', 'RECHAZADA', 'CANCELADA'];

export default function Traspasos({ distribuidora, filtros = {}, solicitudes = [] }) {
    const [codigoCliente, setCodigoCliente] = useState('');
    const [motivoSolicitud, setMotivoSolicitud] = useState('');
    const [estado, setEstado] = useState(filtros.estado || 'TODOS');
    const [codigos, setCodigos] = useState({});

    const submitSolicitud = (e) => {
        e?.preventDefault();
        if (!codigoCliente) return;
        router.post(route('distribuidora.traspasos.store'), { codigo_cliente: codigoCliente, motivo_solicitud: motivoSolicitud }, { preserveScroll: true, onSuccess: () => setCodigoCliente('') });
    };

    const filtrar = (nuevoEstado) => {
        setEstado(nuevoEstado);
        router.get(route('distribuidora.traspasos.index'), { estado: nuevoEstado }, { preserveState: true, replace: true });
    };

    const confirmar = (solicitudId) => {
        const codigo = (codigos[solicitudId] || '').trim();
        if (!codigo) return;
        router.post(route('distribuidora.traspasos.confirmar', solicitudId), { codigo_confirmacion: codigo }, { preserveScroll: true });
    };

    const cancelar = (solicitudId) => {
        router.post(route('distribuidora.traspasos.cancelar', solicitudId), {}, { preserveScroll: true });
    };

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Traspasos" subtitle="No disponible">
                <Head title="Traspasos" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Traspasos" subtitle={`${solicitudes.length} solicitudes`}>
            <Head title="Traspasos" />

            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-gray-900">{solicitudes.length}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Total</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-amber-600">{solicitudes.filter((s) => s.estado === 'PENDIENTE_COORDINADOR').length}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Pendientes</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-green-600">{solicitudes.filter((s) => s.estado === 'EJECUTADA').length}</p>
                        <p className="text-sm text-gray-500 uppercase mt-1">Ejecutadas</p>
                    </div>
                </div>

                <form onSubmit={submitSolicitud} className="p-5 bg-white border border-gray-200 rounded-xl space-y-4">
                    <p className="text-base font-semibold text-gray-700">Solicitar cliente</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <input type="text" value={codigoCliente} onChange={(e) => setCodigoCliente(e.target.value.toUpperCase())} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Código del cliente" required />
                        <input type="text" value={motivoSolicitud} onChange={(e) => setMotivoSolicitud(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Motivo (opcional)" />
                    </div>
                    <button type="submit" className="w-full py-3 text-base font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Solicitar traspaso
                    </button>
                </form>

                <div className="flex gap-2 flex-wrap">
                    {estados.map((est) => (
                        <button key={est} onClick={() => filtrar(est)} className={`px-4 py-2 text-sm font-medium rounded-lg ${estado === est ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {est === 'TODOS' ? 'Todos' : est.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {!solicitudes.length ? (
                        <div className="p-12 text-center text-gray-400">Sin solicitudes.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {solicitudes.map((solicitud) => (
                                <div key={solicitud.id} className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <FontAwesomeIcon icon={faArrowRightArrowLeft} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-900">{solicitud.cliente.nombre}</p>
                                                <p className="text-sm text-gray-500">{solicitud.cliente.codigo}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold px-3 py-1 rounded ${statusBadgeClass(solicitud.estado).split(' ').slice(0, 2).join(' ')}`}>
                                            {solicitud.estado.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                                        <span>De #{solicitud.origen.numero}</span>
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} className="w-4 h-4" />
                                        <span>A #{solicitud.destino.numero}</span>
                                    </div>

                                    {solicitud.es_origen && solicitud.codigo_confirmacion && solicitud.estado === 'APROBADA_CODIGO_EMITIDO' && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-600 mb-2">Confirmar: {solicitud.codigo_confirmacion}</p>
                                            <div className="flex gap-2">
                                                <input type="text" value={codigos[solicitud.id] || ''} onChange={(e) => setCodigos((p) => ({ ...p, [solicitud.id]: e.target.value.toUpperCase() }))} className="flex-1 px-3 py-2.5 text-base border border-gray-200 rounded-lg" placeholder="Código de confirmación" />
                                                <button onClick={() => confirmar(solicitud.id)} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">✓</button>
                                            </div>
                                        </div>
                                    )}

                                    {solicitud.es_destino && solicitud.estado === 'PENDIENTE_COORDINADOR' && (
                                        <button onClick={() => cancelar(solicitud.id)} className="mt-4 w-full py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">
                                            Cancelar solicitud
                                        </button>
                                    )}

                                    {solicitud.motivo_rechazo && <p className="mt-3 text-sm text-red-600">Rechazo: {solicitud.motivo_rechazo}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DistribuidoraLayout>
    );
}