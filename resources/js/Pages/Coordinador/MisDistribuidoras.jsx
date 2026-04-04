import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';

export default function MisDistribuidoras() {
    return (
        <TabletLayout title="Mis Distribuidoras">
            <Head title="Mis Distribuidoras" />

            <div className="space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Mis Distribuidoras</h1>
                    <p className="text-sm text-gray-500">
                        Esta sección ya responde correctamente. Aquí puedes integrar el listado de distribuidoras del coordinador.
                    </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-600">
                        No hay una vista detallada implementada todavía para esta sección.
                    </p>
                    <div className="mt-3">
                        <Link
                            href={route('coordinador.dashboard')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Volver al dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </TabletLayout>
    );
}
