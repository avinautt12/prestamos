import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, 
    faCheckCircle, 
    faTimesCircle, 
    faUser, 
    faBuildingColumns, 
    faIdCard, 
    faFileInvoice 
} from '@fortawesome/free-solid-svg-icons';

export default function ShowPrevale({ solicitud }) {
    const persona = solicitud.persona || {};
    const cuenta = solicitud.cuenta_bancaria || {};
    const sucursal = solicitud.sucursal || {};

    // Modales de Acción
    const [showAprobar, setShowAprobar] = useState(false);
    const [showRechazar, setShowRechazar] = useState(false);

    // Formulario para Aprobar
    const formAprobar = useForm({
        folio_transferencia: '',
    });

    // Formulario para Rechazar
    const formRechazar = useForm({
        motivo_rechazo: '',
    });

    const handleAprobar = (e) => {
        e.preventDefault();
        formAprobar.post(route('cajera.prevale.aprobar', solicitud.id), {
            onSuccess: () => setShowAprobar(false),
        });
    };

    const handleRechazar = (e) => {
        e.preventDefault();
        formRechazar.post(route('cajera.prevale.rechazar', solicitud.id), {
            onSuccess: () => setShowRechazar(false),
        });
    };

    return (
        <TabletLayout title={`Folio #${solicitud.id} - Validación de Prevale`}>
            <Head title={`Prevale #${solicitud.id}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Encabezado y Botón de Regresar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('cajera.prevale.index')}
                                className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {persona.primer_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Sucursal: {sucursal.nombre} | Estado Actual: <span className="text-yellow-600 font-medium">{solicitud.estado}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Monto Solicitado</p>
                            <p className="text-3xl font-bold text-green-600">${solicitud.limite_credito_solicitado || '0.00'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* COLUMNA IZQUIERDA: Datos del Cliente */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Tarjeta Datos Personales */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                                    <h3 className="font-semibold text-gray-800">Datos Personales</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Nombre Completo</p>
                                        <p className="font-medium text-gray-900">{persona.primer_nombre} {persona.segundo_nombre} {persona.apellido_paterno} {persona.apellido_materno}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">RFC</p>
                                        <p className="font-medium text-gray-900">{persona.rfc || 'No registrado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">CURP</p>
                                        <p className="font-medium text-gray-900">{persona.curp || 'No registrado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Teléfono</p>
                                        <p className="font-medium text-gray-900">{persona.telefono_celular || 'No registrado'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta Cuenta Bancaria */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBuildingColumns} className="text-blue-500" />
                                    <h3 className="font-semibold text-gray-800">Datos para Transferencia</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {cuenta.id ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500">Banco</p>
                                                <p className="font-medium text-gray-900">{cuenta.banco}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Titular de la Cuenta</p>
                                                <p className="font-medium text-gray-900">{cuenta.nombre_titular}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">CLABE Interbancaria</p>
                                                <p className="font-medium text-lg tracking-widest text-blue-700 bg-blue-50 p-2 rounded text-center border border-blue-100 mt-1">
                                                    {cuenta.clabe}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-red-500 font-medium text-sm">No hay cuenta bancaria registrada</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: Visualizador de Documentos */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faIdCard} className="text-blue-500" />
                                        <h3 className="font-semibold text-gray-800">Identificación Oficial (INE)</h3>
                                    </div>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">Por cotejar</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* INE Frente */}
                                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-center">
                                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Frente</p>
                                        {solicitud.ine_frente_path ? (
                                            <img src={`/storage/${solicitud.ine_frente_path}`} alt="INE Frente" className="w-full h-auto rounded shadow-sm max-h-64 object-contain bg-black/5" />
                                        ) : (
                                            <div className="h-48 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-sm">Sin imagen</div>
                                        )}
                                    </div>
                                    {/* INE Reverso */}
                                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-center">
                                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Reverso</p>
                                        {solicitud.ine_reverso_path ? (
                                            <img src={`/storage/${solicitud.ine_reverso_path}`} alt="INE Reverso" className="w-full h-auto rounded shadow-sm max-h-64 object-contain bg-black/5" />
                                        ) : (
                                            <div className="h-48 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-sm">Sin imagen</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
                                    <h3 className="font-semibold text-gray-800">Comprobante de Domicilio</h3>
                                </div>
                                <div className="p-4">
                                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-center">
                                        {solicitud.comprobante_domicilio_path ? (
                                            <img src={`/storage/${solicitud.comprobante_domicilio_path}`} alt="Comprobante" className="w-full h-auto rounded shadow-sm max-h-64 object-contain bg-black/5 mx-auto" />
                                        ) : (
                                            <div className="h-48 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-sm">Sin imagen</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botones de Acción Globales */}
                            <div className="flex justify-end gap-4 pt-4">
                                <button 
                                    onClick={() => setShowRechazar(true)}
                                    className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                    Rechazar Documentos
                                </button>
                                <button 
                                    onClick={() => setShowAprobar(true)}
                                    disabled={!cuenta.id}
                                    className={`px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm ${cuenta.id ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Aprobar y Registrar Fondeo
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
                MODAL: APROBAR Y FONDEAR
            ========================================= */}
            {showAprobar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aprobar Prevale</h3>
                        <p className="text-sm text-gray-500 mb-6">Confirma que los documentos coinciden y registra el folio de la transferencia bancaria realizada a la cuenta terminación <b>{cuenta.clabe?.slice(-4)}</b>.</p>
                        
                        <form onSubmit={handleAprobar}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Folio de Transferencia</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formAprobar.data.folio_transferencia}
                                    onChange={e => formAprobar.setData('folio_transferencia', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500" 
                                    placeholder="Ej. 098123847"
                                />
                                {formAprobar.errors.folio_transferencia && <p className="text-red-500 text-xs mt-1">{formAprobar.errors.folio_transferencia}</p>}
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAprobar(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" disabled={formAprobar.processing} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Confirmar Fondeo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL: RECHAZAR DOCUMENTOS
            ========================================= */}
            {showRechazar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Rechazar Prevale</h3>
                        <p className="text-sm text-gray-500 mb-6">El expediente regresará a estatus de corrección. Ingresa el motivo exacto para que el coordinador pueda solucionarlo.</p>
                        
                        <form onSubmit={handleRechazar}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rechazo</label>
                                <textarea 
                                    required
                                    rows="4"
                                    value={formRechazar.data.motivo_rechazo}
                                    onChange={e => formRechazar.setData('motivo_rechazo', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500" 
                                    placeholder="Ej. La fotografía del INE reverso está borrosa y no se distingue la vigencia."
                                ></textarea>
                                {formRechazar.errors.motivo_rechazo && <p className="text-red-500 text-xs mt-1">{formRechazar.errors.motivo_rechazo}</p>}
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowRechazar(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" disabled={formRechazar.processing} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Confirmar Rechazo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </TabletLayout>
    );
}