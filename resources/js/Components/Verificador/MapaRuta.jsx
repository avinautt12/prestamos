import React, { useState, useEffect } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// Icono personalizado para los marcadores
const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Componente para centrar el mapa en la ubicación del verificador
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

export default function MapaRuta({ solicitudes, ubicacionActual }) {
    const [centro, setCentro] = useState(ubicacionActual || [19.4326, -99.1332]);

    return (
        <TabletLayout title="Mapa de Ruta">
            <Head title="Mapa de Ruta - Verificador" />

            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900">Mapa de Ruta</h1>
                <p className="text-sm text-gray-500">
                    {solicitudes.length} solicitudes pendientes en tu zona
                </p>
            </div>

            {/* Mapa */}
            <div className="overflow-hidden border border-gray-300 rounded-lg shadow-lg" style={{ height: '70vh' }}>
                <MapContainer
                    center={centro}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapController center={centro} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marcador de ubicación actual del verificador */}
                    {ubicacionActual && (
                        <Marker
                            position={ubicacionActual}
                            icon={markerIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="inline-flex items-center gap-1 font-bold text-green-600">
                                        <FontAwesomeIcon icon={faLocationDot} />
                                        Tu ubicación
                                    </p>
                                    <p className="text-xs">Estás aquí</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Marcadores de solicitudes */}
                    {solicitudes.map((solicitud) => {
                        const persona = solicitud.persona;
                        if (!persona.latitud || !persona.longitud) return null;

                        return (
                            <Marker
                                key={solicitud.id}
                                position={[parseFloat(persona.latitud), parseFloat(persona.longitud)]}
                                icon={markerIcon}
                            >
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <p className="font-bold">{persona.primer_nombre} {persona.apellido_paterno}</p>
                                        <p className="text-xs text-gray-600">{persona.calle} {persona.numero_exterior}</p>
                                        <p className="text-xs text-gray-600">{persona.colonia}, {persona.ciudad}</p>
                                        <button
                                            onClick={() => router.get(route('verificador.solicitudes.show', solicitud.id))}
                                            className="w-full px-2 py-1 mt-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FontAwesomeIcon icon={faArrowRight} />
                                                Ver detalles
                                            </span>
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Lista de solicitudes */}
            <div className="mt-4 space-y-2">
                <h2 className="font-semibold text-gray-900">Solicitudes cercanas</h2>
                {solicitudes.map((solicitud) => {
                    const persona = solicitud.persona;
                    return (
                        <div key={solicitud.id} className="p-3 bg-white rounded-lg shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{persona.primer_nombre} {persona.apellido_paterno}</p>
                                    <p className="text-xs text-gray-500">{persona.calle} {persona.numero_exterior}</p>
                                </div>
                                <button
                                    onClick={() => router.get(route('verificador.solicitudes.show', solicitud.id))}
                                    className="px-3 py-1 text-xs text-white bg-blue-600 rounded"
                                >
                                    Ver
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </TabletLayout>
    );
}