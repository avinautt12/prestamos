import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faUsers,
    faFileInvoiceDollar,
    faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';

export default function Sucursales({ sucursal, stats }) {
    const cards = [
        {
            title: 'Distribuidoras activas',
            value: stats?.distribuidoras_activas ?? 0,
            icon: faUsers,
            color: 'text-green-700',
        },
        {
            title: 'Vales activos',
            value: stats?.vales_activos ?? 0,
            icon: faFileInvoiceDollar,
            color: 'text-amber-700',
        },
        {
            title: 'Capital colocado',
            value: `$${Number(stats?.capital_colocado ?? 0).toLocaleString('es-MX')}`,
            icon: faMoneyBillWave,
            color: 'text-blue-700',
        },
    ];

    return (
        <AdminLayout title="Mi Sucursal">
            <Head title="Mi Sucursal" />

            <div className="fin-card mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faBuilding} className="text-blue-700" />
                            {sucursal?.nombre || 'Sin sucursal asignada'}
                        </h2>
                        <p className="fin-subtitle mt-1">
                            Vista informativa de la sucursal asignada al gerente. La administración de sucursales pertenece al rol Admin.
                        </p>
                    </div>
                </div>
            </div>

            {sucursal ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {cards.map((card) => (
                            <div key={card.title} className="fin-card">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-600">{card.title}</p>
                                        <p className={`text-xl font-semibold ${card.color}`}>{card.value}</p>
                                    </div>
                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 ${card.color}`}>
                                        <FontAwesomeIcon icon={card.icon} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="fin-card">
                        <h3 className="font-semibold text-gray-900 mb-3">Datos generales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <p><span className="text-gray-500">Código:</span> {sucursal.codigo || 'N/A'}</p>
                            <p><span className="text-gray-500">Teléfono:</span> {sucursal.telefono || 'N/A'}</p>
                            <p className="md:col-span-2"><span className="text-gray-500">Dirección:</span> {sucursal.direccion_texto || 'No registrada'}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="fin-card">
                    <p className="text-sm text-gray-500">No se encontró una sucursal activa asignada a este gerente.</p>
                </div>
            )}
        </AdminLayout>
    );
}
