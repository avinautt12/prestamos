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

            <div className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold">{solicitudes.length}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Total</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-amber-600">{solicitudes.filter((s) => s.estado === 'PENDIENTE_COORDINADOR').length}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Pendientes</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-green-600">{solicitudes.filter((s) => s.estado === 'EJECUTADA').length}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Ejecutadas</p>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={submitSolicitud} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-gray-500">Solicitar cliente</p>
                    <input type="text" value={codigoCliente} onChange={(e) => setCodigoCliente(e.target.value.toUpperCase())} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" placeholder="Código del cliente" required />
                    <input type="text" value={motivoSolicitud} onChange={(e) => setMotivoSolicitud(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" placeholder="Motivo (opcional)" />
                    <button type="submit" className="w-full py-3 text-sm font-bold text-white bg-green-700 rounded-lg">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Solicitar traspaso
                    </button>
                </form>

                {/* Filtros */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {estados.map((est) => (
                        <button key={est} onClick={() => filtrar(est)} className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${estado === est ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {est === 'TODOS' ? 'Todos' : est.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div className="space-y-2">
                    {!solicitudes.length ? <div className="p-8 text-center text-gray-400 text-sm">Sin solicitudes.</div> : (
                        solicitudes.map((solicitud) => (
                            <div key={solicitud.id} className="p-3 bg-white border border-gray-200 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">{solicitud.cliente.nombre}</p>
                                        <p className="text-xs text-gray-500">{solicitud.cliente.codigo}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusBadgeClass(solicitud.estado).split(' ').slice(0, 2).join(' ')}`}>
                                        {solicitud.estado.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                    <span>De #{solicitud.origen.numero}</span>
                                    <FontAwesomeIcon icon={faArrowRightArrowLeft} className="w-3 h-3" />
                                    <span>A #{solicitud.destino.numero}</span>
                                </div>

                                {/*Confirmar códigos */}
                                {solicitud.es_origen && solicitud.codigo_confirmacion && solicitud.estado === 'APROBADA_CODIGO_EMITIDO' && (
                                    <div className="mt-3">
                                        <p className="text-xs text-blue-600 mb-1">Confirmar: {solicitud.codigo_confirmacion}</p>
                                        <div className="flex gap-2">
                                            <input type="text" value={codigos[solicitud.id] || ''} onChange={(e) => setCodigos((p) => ({ ...p, [solicitud.id]: e.target.value.toUpperCase() }))} className="flex-1 px-2 py-2 text-sm border border-gray-200 rounded-lg" placeholder="Código" />
                                            <button onClick={() => confirmar(solicitud.id)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg">✓</button>
                                        </div>
                                    </div>
                                )}

                                {/*Cancelar */}
                                {solicitud.es_destino && solicitud.estado === 'PENDIENTE_COORDINADOR' && (
                                    <button onClick={() => cancelar(solicitud.id)} className="mt-2 w-full py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg">
                                        Cancelar
                                    </button>
                                )}

                                {solicitud.motivo_rechazo && <p className="mt-2 text-xs text-red-600">Rechazo: {solicitud.motivo_rechazo}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DistribuidoraLayout>
    );
}