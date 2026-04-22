import React, { useState, useEffect, useCallback } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMap,
    faTriangleExclamation,
    faLocationDot,
    faArrowRotateRight,
} from '@fortawesome/free-solid-svg-icons';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapaRuta({ solicitudes }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [ubicacionActual, setUbicacionActual] = useState(null);
    const [cargandoGPS, setCargandoGPS] = useState(true);
    const [errorGPS, setErrorGPS] = useState(null);
    const [centroMapa, setCentroMapa] = useState({ lat: 19.4326, lng: -99.1332 }); // CDMX por defecto
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [infoWindowAbierto, setInfoWindowAbierto] = useState(null);

    // Obtener ubicación actual del verificador al cargar
    useEffect(() => {
        if (!isLoaded) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const ubicacion = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUbicacionActual(ubicacion);
                    setCentroMapa(ubicacion);
                    setCargandoGPS(false);
                },
                (error) => {
                    console.error('Error de geolocalización:', error);
                    setErrorGPS('No se pudo obtener tu ubicación. El mapa se centrará en la zona por defecto.');
                    setCargandoGPS(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                }
            );
        } else {
            setErrorGPS('Tu dispositivo no soporta geolocalización');
            setCargandoGPS(false);
        }
    }, [isLoaded]);

    // Filtrar solicitudes que tienen coordenadas
    const solicitudesConUbicacion = solicitudes.filter(s =>
        s.persona?.latitud && s.persona?.longitud
    );

    // Calcular distancia desde la ubicación actual (si está disponible)
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Ordenar solicitudes por distancia si tenemos ubicación actual
    const solicitudesOrdenadas = [...solicitudesConUbicacion];
    if (ubicacionActual) {
        solicitudesOrdenadas.sort((a, b) => {
            const distA = calcularDistancia(
                ubicacionActual.lat, ubicacionActual.lng,
                parseFloat(a.persona.latitud), parseFloat(a.persona.longitud)
            );
            const distB = calcularDistancia(
                ubicacionActual.lat, ubicacionActual.lng,
                parseFloat(b.persona.latitud), parseFloat(b.persona.longitud)
            );
            return distA - distB;
        });
    }

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const irASolicitud = (id) => {
        router.get(route('verificador.solicitudes.show', id));
    };

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

            {/* Header */}
            <div className="mb-4">
                <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <FontAwesomeIcon icon={faMap} className="text-blue-600" />
                    Mapa de Ruta
                </h1>
                <p className="text-sm text-gray-500">
                    {solicitudesConUbicacion.length} solicitudes pendientes en tu zona
                </p>
            </div>

            {/* Estado del GPS */}
            {cargandoGPS && (
                <div className="p-3 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <span>Obteniendo tu ubicación...</span>
                    </div>
                </div>
            )}

            {errorGPS && (
                <div className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50">
                    <span className="inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        {errorGPS}
                    </span>
                </div>
            )}

            {ubicacionActual && !errorGPS && !cargandoGPS && (
                <div className="p-3 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
                    <span className="inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faLocationDot} />
                        Tu ubicación actual está marcada en el mapa con el pin verde
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section className="lg:col-span-5">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-gray-900">
                            Solicitudes por cercanía
                            {ubicacionActual && <span className="ml-2 text-xs font-normal text-gray-500">(de más cerca a más lejos)</span>}
                        </h2>
                        <button
                            onClick={() => {
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(
                                        (position) => {
                                            const nuevaUbicacion = {
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            };
                                            setUbicacionActual(nuevaUbicacion);
                                            setCentroMapa(nuevaUbicacion);
                                            setErrorGPS(null);
                                        },
                                        () => setErrorGPS('No se pudo actualizar tu ubicación')
                                    );
                                }
                            }}
                            className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faArrowRotateRight} />
                                Actualizar GPS
                            </span>
                        </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[62vh] pr-1">
                        {solicitudesOrdenadas.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-lg shadow">
                                <p className="text-gray-500">No hay solicitudes pendientes con ubicación registrada</p>
                            </div>
                        ) : (
                            solicitudesOrdenadas.map((solicitud) => {
                                const persona = solicitud.persona;
                                let distancia = null;
                                if (ubicacionActual) {
                                    distancia = calcularDistancia(
                                        ubicacionActual[0], ubicacionActual[1],
                                        parseFloat(persona.latitud), parseFloat(persona.longitud)
                                    );
                                }

                                return (
                                    <div
                                        key={solicitud.id}
                                        className={`p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${solicitudSeleccionada === solicitud.id ? 'ring-2 ring-blue-500' : ''}`}
                                        onClick={() => {
                                            setSolicitudSeleccionada(solicitud.id);
                                            setCentroMapa({
                                                lat: parseFloat(persona.latitud),
                                                lng: parseFloat(persona.longitud)
                                            });
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">
                                                        {persona.primer_nombre} {persona.apellido_paterno}
                                                    </p>
                                                    {distancia && (
                                                        <span className="text-xs text-blue-600">
                                                            {distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {persona.calle} {persona.numero_exterior}, {persona.colonia}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {persona.ciudad}, {persona.estado}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    irASolicitud(solicitud.id);
                                                }}
                                                className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                            >
                                                Tomar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="lg:col-span-7">
                    <div className="p-3 mb-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm">
                        Haz clic en una solicitud para centrar el mapa en ese domicilio.
                    </div>

                    <div className="overflow-hidden bg-white border border-gray-300 shadow-lg rounded-xl">
                        <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[6/5]">
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={centroMapa}
                                zoom={13}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: true,
                                }}
                            >
                                {ubicacionActual && (
                                    <>
                                        <Marker
                                            position={ubicacionActual}
                                            icon={{
                                                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                            }}
                                            title="Tu ubicación"
                                            onClick={() => setInfoWindowAbierto('actual')}
                                        />
                                        {infoWindowAbierto === 'actual' && (
                                            <InfoWindow
                                                position={ubicacionActual}
                                                onCloseClick={() => setInfoWindowAbierto(null)}
                                            >
                                                <div className="text-center">
                                                    <p className="font-bold text-green-600">Tu ubicación</p>
                                                    <p className="text-xs">Estás aquí</p>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </>
                                )}

                                {solicitudesOrdenadas.map((solicitud) => {
                                    const persona = solicitud.persona;
                                    const lat = parseFloat(persona.latitud);
                                    const lng = parseFloat(persona.longitud);

                                    let distancia = null;
                                    if (ubicacionActual) {
                                        distancia = calcularDistancia(
                                            ubicacionActual.lat, ubicacionActual.lng,
                                            lat, lng
                                        );
                                    }

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
                                                    <div className="min-w-[220px]">
                                                        <p className="font-bold text-gray-900">
                                                            {persona.primer_nombre} {persona.apellido_paterno}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            {persona.calle} {persona.numero_exterior}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {persona.colonia}, {persona.ciudad}
                                                        </p>
                                                        {distancia && (
                                                            <p className="mt-1 text-xs font-medium text-blue-600">
                                                                A {distancia.toFixed(1)} km de ti
                                                            </p>
                                                        )}
                                                        <button
                                                            onClick={() => irASolicitud(solicitud.id)}
                                                            className="w-full px-2 py-1 mt-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                                        >
                                                            Ver detalles y tomar
                                                        </button>
                                                    </div>
                                                </InfoWindow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </GoogleMap>
                        </div>
                    </div>

                    <div className="p-3 mt-3 bg-gray-100 rounded-lg">
                        <h3 className="mb-2 text-xs font-semibold text-gray-700">Leyenda</h3>
                        <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Tu ubicación</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Solicitud pendiente</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </TabletLayout>
    );
}