import React, { useState, useEffect } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMap,
    faTriangleExclamation,
    faLocationDot,
    faArrowRotateRight,
} from '@fortawesome/free-solid-svg-icons';

// Solución para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono para la ubicación actual del verificador (verde)
const ubicacionActualIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Componente para centrar el mapa en una ubicación
function MapController({ center, zoom = 13 }) {
    const map = useMap();
    useEffect(() => {
        if (center && center.length === 2) {
            map.flyTo(center, zoom);
        }
    }, [center, map, zoom]);
    return null;
}

export default function MapaRuta({ solicitudes }) {
    const [ubicacionActual, setUbicacionActual] = useState(null);
    const [cargandoGPS, setCargandoGPS] = useState(true);
    const [errorGPS, setErrorGPS] = useState(null);
    const [centroMapa, setCentroMapa] = useState([19.4326, -99.1332]); // CDMX por defecto
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

    // Obtener ubicación actual del verificador al cargar
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const ubicacion = [position.coords.latitude, position.coords.longitude];
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
    }, []);

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
                ubicacionActual[0], ubicacionActual[1],
                parseFloat(a.persona.latitud), parseFloat(a.persona.longitud)
            );
            const distB = calcularDistancia(
                ubicacionActual[0], ubicacionActual[1],
                parseFloat(b.persona.latitud), parseFloat(b.persona.longitud)
            );
            return distA - distB;
        });
    }

    const irASolicitud = (id) => {
        router.get(route('verificador.solicitudes.show', id));
    };

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
                <div className="p-3 mb-4 text-sm text-blue-800 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Obteniendo tu ubicación...</span>
                    </div>
                </div>
            )}

            {errorGPS && (
                <div className="p-3 mb-4 text-sm text-yellow-800 bg-yellow-50 rounded-lg">
                    <span className="inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        {errorGPS}
                    </span>
                </div>
            )}

            {ubicacionActual && !errorGPS && !cargandoGPS && (
                <div className="p-3 mb-4 text-sm text-green-800 bg-green-50 rounded-lg">
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
                                            setUbicacionActual([position.coords.latitude, position.coords.longitude]);
                                            setCentroMapa([position.coords.latitude, position.coords.longitude]);
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
                                            setCentroMapa([parseFloat(persona.latitud), parseFloat(persona.longitud)]);
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

                    <div className="overflow-hidden bg-white border border-gray-300 rounded-xl shadow-lg">
                        <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[6/5]">
                            <MapContainer
                                center={centroMapa}
                                zoom={12}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={true}
                            >
                                <MapController center={centroMapa} />

                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {ubicacionActual && (
                                    <Marker
                                        position={ubicacionActual}
                                        icon={ubicacionActualIcon}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold text-green-600">Tu ubicación</p>
                                                <p className="text-xs">Estás aquí</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {solicitudesOrdenadas.map((solicitud) => {
                                    const persona = solicitud.persona;
                                    const lat = parseFloat(persona.latitud);
                                    const lng = parseFloat(persona.longitud);

                                    let distancia = null;
                                    if (ubicacionActual) {
                                        distancia = calcularDistancia(
                                            ubicacionActual[0], ubicacionActual[1],
                                            lat, lng
                                        );
                                    }

                                    return (
                                        <Marker
                                            key={solicitud.id}
                                            position={[lat, lng]}
                                        >
                                            <Popup>
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
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
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