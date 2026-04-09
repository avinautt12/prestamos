import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faArrowRight, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

export default function IndexPrevale({ vales }) {
    const tieneDatos = vales && vales.data && vales.data.length > 0;

    return (
        <TabletLayout title="Bandeja de Prevales">
            <Head title="Prevales Pendientes" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Encabezado y Buscador */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Prevales por Validar</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Vales de primer ingreso en estado borrador, en espera de verificación y auditoría.
                            </p>
                        </div>
                        
                        <div className="relative w-full md:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Buscar folio o cliente..."
                            />
                        </div>
                    </div>

                    {/* Tabla / Lista de Prevales */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        {!tieneDatos ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-gray-300 text-3xl" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Bandeja al día</h3>
                                <p className="text-gray-500 text-sm mt-1">No hay vales en estado borrador pendientes de revisión.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {vales.data.map((vale) => {
                                    const clientePersona = vale.cliente?.persona || {};
                                    const distPersona = vale.distribuidora?.persona || {};
                                    
                                    return (
                                        <li key={vale.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                                            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center min-w-0 gap-4">
                                                    
                                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                                        {clientePersona.primer_nombre ? clientePersona.primer_nombre.charAt(0) : '#'}
                                                    </div>
                                                    
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-base font-semibold text-gray-900 truncate">
                                                            {clientePersona.primer_nombre} {clientePersona.apellido_paterno} {clientePersona.apellido_materno}
                                                        </p>
                                                        <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 gap-x-4 gap-y-1">
                                                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                {vale.numero_vale}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                                                Distribuidora: <span className="font-medium text-gray-700">{distPersona.primer_nombre} {distPersona.apellido_paterno}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                Monto: <span className="font-bold text-green-600">${vale.monto_principal}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-shrink-0">
                                                    <Link
                                                        href={route('cajera.prevale.show', vale.id)}
                                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 transition ease-in-out duration-150 shadow-sm"
                                                    >
                                                        Verificar Prevale
                                                        <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </TabletLayout>
    );
}
