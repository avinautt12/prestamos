import React, { useState, useEffect, useCallback } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapaRuta({ solicitudes, ubicacionActual }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [infoWindowAbierto, setInfoWindowAbierto] = useState(null);
    const [centro, setCentro] = useState(
        ubicacionActual
            ? { lat: ubicacionActual[0], lng: ubicacionActual[1] }
            : { lat: 19.4326, lng: -99.1332 }
    );

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return (
            <TabletLayout title="Mapa de Ruta">
                <Head title="Mapa de Ruta - Verificador" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando Google Maps...</p>
                    </div>
                </div>
            </TabletLayout>
        );
    }

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
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={centro}
                    zoom={12}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {/* Marcador de ubicación actual del verificador */}
                    {ubicacionActual && (
                        <>
                            <Marker
                                position={{ lat: ubicacionActual[0], lng: ubicacionActual[1] }}
                                icon={{
                                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                }}
                                title="Tu ubicación"
                                onClick={() => setInfoWindowAbierto('actual')}
                            />
                            {infoWindowAbierto === 'actual' && (
                                <InfoWindow
                                    position={{ lat: ubicacionActual[0], lng: ubicacionActual[1] }}
                                    onCloseClick={() => setInfoWindowAbierto(null)}
                                >
                                    <div className="text-center">
                                        <p className="inline-flex items-center gap-1 font-bold text-green-600">
                                            <FontAwesomeIcon icon={faLocationDot} />
                                            Tu ubicación
                                        </p>
                                        <p className="text-xs">Estás aquí</p>
                                    </div>
                                </InfoWindow>
                            )}
                        </>
                    )}

                    {/* Marcadores de solicitudes */}
                    {solicitudes.map((solicitud) => {
                        const persona = solicitud.persona;
                        if (!persona.latitud || !persona.longitud) return null;

                        const lat = parseFloat(persona.latitud);
                        const lng = parseFloat(persona.longitud);

                        return (
                            <React.Fragment key={solicitud.id}>
                                <Marker
                                    position={{ lat, lng }}
                                    icon={{
                                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                    }}
                                    title={`${persona.primer_nombre} ${persona.apellido_paterno}`}
                                    onClick={() => setInfoWindowAbierto(solicitud.id)}
                                />
                                {infoWindowAbierto === solicitud.id && (
                                    <InfoWindow
                                        position={{ lat, lng }}
                                        onCloseClick={() => setInfoWindowAbierto(null)}
                                    >
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
                                    </InfoWindow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </GoogleMap>
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