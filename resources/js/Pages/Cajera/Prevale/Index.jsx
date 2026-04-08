import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleInfo, faFileSignature, faFolderOpen, faUser } from '@fortawesome/free-solid-svg-icons';

export default function IndexPrevale({ solicitudes }) {
    return (
        <TabletLayout title="Bandeja de Prevales">
            <Head title="Prevales Pendientes" />
            <div className="py-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileSignature} className="text-blue-600" />
                    Lista de Prevales por Revisar
                </h2>

                <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
                    {(!solicitudes?.data || solicitudes.data.length === 0) ? (
                        <p className="text-gray-500 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500" />
                            No hay prevales pendientes.
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {solicitudes.data.map((sol) => (
                                <li key={sol.id} className="p-4 border rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-bold flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFolderOpen} className="text-indigo-600" />
                                            Folio: #{sol.id}
                                        </p>
                                        <p className="flex items-center gap-2 text-gray-700">
                                            <FontAwesomeIcon icon={faUser} className="text-gray-500" />
                                            {sol.persona?.primer_nombre} {sol.persona?.apellido_paterno}
                                        </p>
                                    </div>
                                    <Link
                                        href={route('cajera.prevale.show', sol.id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                                    >
                                        Ir al Expediente
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </TabletLayout>
    );
}