import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Validaciones({ validaciones }) {
    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return format(new Date(date), "dd MMM yyyy HH:mm", { locale: es });
    };

    return (
        <TabletLayout title="Mis Validaciones">
            <Head title="Mis Validaciones" />

            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900">Mis Validaciones</h1>
                <p className="text-sm text-gray-500">Historial de verificaciones realizadas</p>
            </div>

            <div className="space-y-3">
                {validaciones.data.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-lg shadow">
                        <p className="text-gray-500">Aún no has realizado validaciones</p>
                    </div>
                ) : (
                    validaciones.data.map((validacion) => {
                        const solicitud = validacion.solicitud;
                        const persona = solicitud?.persona;

                        const estadoColor = validacion.resultado === 'VERIFICADA'
                            ? 'bg-green-100 text-green-800'
                            : validacion.resultado === 'RECHAZADA'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800';

                        return (
                            <div key={validacion.id} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {persona?.primer_nombre} {persona?.apellido_paterno} {persona?.apellido_materno}
                                        </h3>
                                        <p className="text-xs text-gray-500">Solicitud #{solicitud?.id || 'N/A'}</p>
                                        <p className="mt-1 text-sm text-gray-600">{validacion.observaciones || 'Sin observaciones'}</p>
                                        <p className="mt-1 text-xs text-gray-500">Fecha visita: {formatDate(validacion.fecha_visita)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColor}`}>
                                        {validacion.resultado}
                                    </span>
                                </div>

                                <div className="flex justify-end mt-3">
                                    {solicitud?.id && (
                                        <Link
                                            href={route('verificador.solicitudes.show', solicitud.id)}
                                            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                            Ver solicitud
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {validaciones.links && validaciones.links.length > 3 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                        Mostrando {validaciones.from || 0} - {validaciones.to || 0} de {validaciones.total || 0}
                    </div>
                    <div className="flex gap-1">
                        {validaciones.links.map((link, index) => {
                            if (link.url === null) return null;
                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-3 py-1 rounded ${link.active
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </TabletLayout>
    );
}