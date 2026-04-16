import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faHardHat,
    faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';

export default function PagosDistribuidora({ auth }) {
    return (
        <TabletLayout title="Pagos de Distribuidora">
            <Head title="Pagos de Distribuidora" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                                <FontAwesomeIcon icon={faHardHat} className="text-3xl text-blue-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Pagos de Distribuidora a Empresa
                            </h2>

                            <p className="text-gray-600 mb-2">
                                Este módulo está en desarrollo. Próximamente podrás:
                            </p>

                            <ul className="text-sm text-gray-500 space-y-2 mb-8 max-w-md mx-auto text-left">
                                <li className="flex items-start gap-2">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-500 mt-0.5" />
                                    <span>Ver pagos reportados por distribuidoras</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-500 mt-0.5" />
                                    <span>Seguimiento del estado de cada pago (REPORTADO, CONCILIADO, etc.)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-500 mt-0.5" />
                                    <span>Historial de pagos por distribuidora y relación de corte</span>
                                </li>
                            </ul>

                            <Link
                                href={route('cajera.dashboard')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Volver al Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </TabletLayout>
    );
}
