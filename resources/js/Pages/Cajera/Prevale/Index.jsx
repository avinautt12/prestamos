import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function IndexPrevale({ solicitudes }) {
    return (
        <TabletLayout title="Bandeja de Prevales">
            <Head title="Prevales Pendientes" />
            <div className="py-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Lista de Prevales por Revisar</h2>
                
                <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
                    {(!solicitudes?.data || solicitudes.data.length === 0) ? (
                        <p className="text-gray-500">No hay prevales pendientes.</p>
                    ) : (
                        <ul className="space-y-4">
                            {solicitudes.data.map((sol) => (
                                <li key={sol.id} className="p-4 border rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">Folio: #{sol.id}</p>
                                        <p>{sol.persona?.primer_nombre} {sol.persona?.apellido_paterno}</p>
                                    </div>
                                    <Link 
                                        href={route('cajera.prevale.show', sol.id)} 
                                        className="bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        Ir al Expediente (Show)
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