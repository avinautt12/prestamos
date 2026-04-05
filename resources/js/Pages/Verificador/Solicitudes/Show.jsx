import React, { useState, useEffect } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTriangleExclamation,
    faLocationDot,
    faUser,
    faHouse,
    faCircleCheck,
    faCircleXmark,
    faClipboardCheck,
    faTrophy,
} from '@fortawesome/free-solid-svg-icons';

const ubicacionActualIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapController({ center, zoom = 17 }) {
    const map = useMap();

    useEffect(() => {
        if (center && center.length === 2) {
            map.flyTo(center, zoom);
        }
    }, [center, map, zoom]);

    return null;
}

export default function Show({ solicitud }) {
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [observaciones, setObservaciones] = useState('');
    const [checklist, setChecklist] = useState({
        domicilio_correcto: false,
        persona_identificada: false,
        vehiculos_visibles: false,
        documentos_validos: false,
    });
    const [ubicacionActual, setUbicacionActual] = useState(null);
    const [distancia, setDistancia] = useState(null);
    const [errorGPS, setErrorGPS] = useState(null);
    const [fotoFachada, setFotoFachada] = useState(null);
    const [fotoIneConPersona, setFotoIneConPersona] = useState(null);
    const [fotoComprobante, setFotoComprobante] = useState(null);

    const persona = solicitud.persona;
    const domicilioLat = persona.latitud ? parseFloat(persona.latitud) : null;
    const domicilioLng = persona.longitud ? parseFloat(persona.longitud) : null;
    const tieneMapa = domicilioLat !== null && domicilioLng !== null;
    const centroMapa = ubicacionActual
        ? [ubicacionActual.lat, ubicacionActual.lng]
        : tieneMapa
            ? [domicilioLat, domicilioLng]
            : [19.4326, -99.1332];

    // Obtener ubicación actual del verificador al cargar
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const ubicacion = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUbicacionActual(ubicacion);

                    // Calcular distancia si hay coordenadas del domicilio
                    if (persona.latitud && persona.longitud) {
                        const dist = calcularDistancia(
                            persona.latitud,
                            persona.longitud,
                            ubicacion.lat,
                            ubicacion.lng
                        );
                        setDistancia(dist);

                        // Alerta si está lejos (más de 100 metros)
                        if (dist > 100) {
                            setErrorGPS(`Estás a ${Math.round(dist)} metros del domicilio registrado. Asegúrate de estar en la ubicación correcta.`);
                        } else {
                            setErrorGPS(null);
                        }
                    }
                },
                (error) => {
                    console.error('Error de geolocalización:', error);
                    setErrorGPS('No se pudo obtener tu ubicación. Activa el GPS para continuar.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                }
            );
        } else {
            setErrorGPS('Tu dispositivo no soporta geolocalización');
        }
    }, [persona.latitud, persona.longitud]);

    // Calcular distancia entre dos puntos (fórmula de Haversine)
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // metros
    };

    const handleVerificar = () => {
        if (!resultado) {
            alert('Debes seleccionar un resultado (Verificada o Rechazada)');
            return;
        }

        if (resultado === 'RECHAZADA' && !observaciones.trim()) {
            alert('Debes proporcionar un motivo de rechazo');
            return;
        }

        if (resultado === 'RECHAZADA' && observaciones.trim().length < 20) {
            alert('El motivo de rechazo debe tener al menos 20 caracteres');
            return;
        }

        // Verificar que el checklist esté completo si es VERIFICADA
        if (resultado === 'VERIFICADA') {
            const checklistCompleto = Object.values(checklist).every(v => v === true);
            if (!checklistCompleto) {
                alert('Debes marcar todos los puntos del checklist antes de verificar');
                return;
            }

            if (!fotoFachada || !fotoIneConPersona || !fotoComprobante) {
                alert('Debes cargar toda la evidencia fotográfica antes de verificar');
                return;
            }
        }

        if (!ubicacionActual) {
            alert('Esperando obtener tu ubicación GPS. Por favor espera.');
            return;
        }

        if (confirm(`¿Estás seguro de marcar esta solicitud como ${resultado === 'VERIFICADA' ? 'VERIFICADA' : 'RECHAZADA'}?`)) {
            setEnviando(true);

            const data = {
                resultado: resultado,
                observaciones: observaciones,
                latitud_verificacion: ubicacionActual.lat,
                longitud_verificacion: ubicacionActual.lng,
                fecha_visita: new Date().toISOString(),
                checklist: checklist,
                foto_fachada: fotoFachada,
                foto_ine_con_persona: fotoIneConPersona,
                foto_comprobante: fotoComprobante,
            };

            router.post(route('verificador.solicitudes.verificar', solicitud.id), data, {
                forceFormData: true,
                onSuccess: () => setEnviando(false),
                onError: (errors) => {
                    console.error(errors);
                    setEnviando(false);
                    alert('Error al procesar la verificación');
                }
            });
        }
    };

    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
    };

    const formatBirthDate = (date) => {
        if (!date) return 'No disponible';

        const datePart = String(date).slice(0, 10);
        const [year, month, day] = datePart.split('-').map(Number);

        if (year && month && day) {
            return format(new Date(year, month - 1, day), "dd 'de' MMMM 'de' yyyy", { locale: es });
        }

        return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
    };

    const verificacion = solicitud.verificacion;
    const datosFamiliares = solicitud.datos_familiares || {};
    const afiliaciones = Array.isArray(solicitud.afiliaciones) ? solicitud.afiliaciones : [];
    const vehiculos = Array.isArray(solicitud.vehiculos) ? solicitud.vehiculos : [];

    return (
        <TabletLayout title="Verificar Solicitud">
            <Head title={`Verificar - ${persona.primer_nombre} ${persona.apellido_paterno}`} />

            <div className="max-w-6xl mx-auto tablet-form">

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900">Verificación en Campo</h1>
                    <p className="text-sm text-gray-500">ID Solicitud: #{solicitud.id}</p>
                </div>

                {/* Alerta de GPS */}
                {errorGPS && (
                    <div className="p-3 mb-4 text-sm text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
                            <span>{errorGPS}</span>
                        </div>
                    </div>
                )}

                {/* Información de ubicación */}
                {ubicacionActual && !errorGPS && (
                    <div className="p-3 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <FontAwesomeIcon icon={faLocationDot} />
                                    Tu ubicación actual:
                                </span>
                                <p className="mt-1 font-mono text-xs">
                                    Lat: {ubicacionActual.lat.toFixed(6)}, Lng: {ubicacionActual.lng.toFixed(6)}
                                </p>
                            </div>
                            {distancia && (
                                <div className={`text-right ${distancia <= 100 ? 'text-green-700' : 'text-red-700'}`}>
                                    <span className="font-medium">Distancia al domicilio:</span>
                                    <p className="text-lg font-bold">{Math.round(distancia)} m</p>
                                    {distancia <= 100 ? (
                                        <p className="inline-flex items-center gap-1 text-xs">
                                            <FontAwesomeIcon icon={faCircleCheck} />
                                            Estás dentro del rango permitido
                                        </p>
                                    ) : (
                                        <p className="inline-flex items-center gap-1 text-xs">
                                            <FontAwesomeIcon icon={faTriangleExclamation} />
                                            Estás lejos del domicilio registrado
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Datos del Solicitante */}
                <div className="p-4 mb-4 bg-white rounded-lg shadow">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                        Datos del Prospecto
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="col-span-2">
                            <span className="text-gray-500">Nombre completo:</span>
                            <p className="font-medium">
                                {persona.primer_nombre} {persona.segundo_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">CURP:</span>
                            <p className="font-mono text-sm">{persona.curp || 'No registrado'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">RFC:</span>
                            <p className="font-mono text-sm">{persona.rfc || 'No registrado'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Teléfono:</span>
                            <p className="font-medium">{persona.telefono_celular || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Fecha nacimiento:</span>
                            <p>{formatBirthDate(persona.fecha_nacimiento)}</p>
                        </div>
                    </div>
                </div>

                {/* Expediente capturado por Coordinador */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Expediente del Prospecto</h2>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <h3 className="mb-2 text-sm font-semibold text-gray-800">Familiares</h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><span className="text-gray-500">Cónyuge:</span> {datosFamiliares?.conyuge?.nombre || 'No registrado'}</p>
                                <p><span className="text-gray-500">Teléfono:</span> {datosFamiliares?.conyuge?.telefono || 'No registrado'}</p>
                                <p><span className="text-gray-500">Ocupación:</span> {datosFamiliares?.conyuge?.ocupacion || 'No registrada'}</p>
                                <div>
                                    <p className="text-gray-500">Hijos:</p>
                                    {Array.isArray(datosFamiliares?.hijos) && datosFamiliares.hijos.length > 0 ? (
                                        <ul className="mt-1 space-y-1 list-disc list-inside">
                                            {datosFamiliares.hijos.map((hijo, index) => (
                                                <li key={index}>{hijo.nombre || 'Sin nombre'}{hijo.edad ? `, ${hijo.edad} años` : ''}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-700">Sin hijos registrados</p>
                                    )}
                                </div>
                                <p><span className="text-gray-500">Madre:</span> {datosFamiliares?.padres?.madre?.nombre || 'No registrada'}</p>
                                <p><span className="text-gray-500">Padre:</span> {datosFamiliares?.padres?.padre?.nombre || 'No registrado'}</p>
                            </div>
                        </div>

                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <h3 className="mb-2 text-sm font-semibold text-gray-800">Afiliaciones</h3>
                            {afiliaciones.length > 0 ? (
                                <ul className="space-y-2 text-sm text-gray-700">
                                    {afiliaciones.map((afiliacion, index) => (
                                        <li key={index} className="p-2 bg-white border border-gray-200 rounded-md">
                                            <p className="font-medium">{afiliacion.nombre || afiliacion.institucion || 'Afiliación'}</p>
                                            <p className="text-xs text-gray-500">{afiliacion.tipo || 'Sin tipo'}{afiliacion.cargo ? ` · ${afiliacion.cargo}` : ''}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-700">No hay afiliaciones registradas.</p>
                            )}
                        </div>

                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <h3 className="mb-2 text-sm font-semibold text-gray-800">Vehículos</h3>
                            {vehiculos.length > 0 ? (
                                <ul className="space-y-2 text-sm text-gray-700">
                                    {vehiculos.map((vehiculo, index) => (
                                        <li key={index} className="p-2 bg-white border border-gray-200 rounded-md">
                                            <p className="font-medium">{vehiculo.marca || 'Marca no registrada'} {vehiculo.modelo || ''}</p>
                                            <p className="text-xs text-gray-500">{vehiculo.tipo || 'Tipo no registrado'}{vehiculo.placas ? ` · ${vehiculo.placas}` : ''}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-700">No hay vehículos registrados.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Domicilio a verificar */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="space-y-2 text-sm lg:col-span-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <FontAwesomeIcon icon={faHouse} className="text-gray-700" />
                                Domicilio a Verificar
                            </h2>
                            <p><span className="text-gray-500">Dirección:</span> {persona.calle} {persona.numero_exterior}, {persona.colonia}</p>
                            <p><span className="text-gray-500">Ciudad:</span> {persona.ciudad}, {persona.estado}</p>
                            <p><span className="text-gray-500">Código Postal:</span> {persona.codigo_postal}</p>
                            {persona.latitud && persona.longitud && (
                                <p className="font-mono text-xs text-gray-500">
                                    Coordenadas registradas: {persona.latitud}, {persona.longitud}
                                </p>
                            )}
                        </div>

                        {tieneMapa && (
                            <div className="overflow-hidden bg-white border border-gray-200 rounded-xl lg:col-span-7">
                                <div className="h-64 sm:h-72">
                                    <MapContainer
                                        center={centroMapa}
                                        zoom={17}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <MapController center={centroMapa} />
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        <Marker position={[domicilioLat, domicilioLng]}>
                                            <Popup>
                                                <div className="text-sm">
                                                    <p className="font-semibold text-gray-900">Domicilio registrado</p>
                                                    <p className="text-gray-600">{persona.calle} {persona.numero_exterior}</p>
                                                    <p className="text-gray-600">{persona.colonia}, {persona.ciudad}</p>
                                                </div>
                                            </Popup>
                                        </Marker>

                                        {ubicacionActual && (
                                            <Marker position={[ubicacionActual.lat, ubicacionActual.lng]} icon={ubicacionActualIcon}>
                                                <Popup>
                                                    <div className="text-sm text-center">
                                                        <p className="font-semibold text-green-700">Tu ubicación actual</p>
                                                        <p className="text-gray-600">Punto donde estás verificando</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Checklist de Validación */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-gray-700" />
                        Checklist de Validación
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={checklist.domicilio_correcto}
                                onChange={(e) => setChecklist({ ...checklist, domicilio_correcto: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">La persona vive en el domicilio registrado <span className="text-red-600">*</span></span>
                        </label>

                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={checklist.persona_identificada}
                                onChange={(e) => setChecklist({ ...checklist, persona_identificada: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">La persona fue identificada con INE/IFE <span className="text-red-600">*</span></span>
                        </label>

                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={checklist.vehiculos_visibles}
                                onChange={(e) => setChecklist({ ...checklist, vehiculos_visibles: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Los vehículos declarados están presentes <span className="text-red-600">*</span></span>
                        </label>

                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={checklist.documentos_validos}
                                onChange={(e) => setChecklist({ ...checklist, documentos_validos: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Los documentos presentados son válidos <span className="text-red-600">*</span></span>
                        </label>
                    </div>
                </div>

                {verificacion && (
                    <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                            <FontAwesomeIcon icon={faHouse} className="text-gray-700" />
                            Evidencia Guardada
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                                { label: 'Fachada', url: verificacion.foto_fachada_url },
                                { label: 'INE con persona', url: verificacion.foto_ine_con_persona_url },
                                { label: 'Comprobante de domicilio', url: verificacion.foto_comprobante_url },
                            ].map((evidencia) => (
                                <div key={evidencia.label} className="overflow-hidden border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                        {evidencia.label}
                                    </div>
                                    {evidencia.url ? (
                                        <a href={evidencia.url} target="_blank" rel="noreferrer">
                                            <img src={evidencia.url} alt={evidencia.label} className="object-cover w-full h-56" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-center h-56 text-sm text-gray-400">
                                            Sin evidencia cargada
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evidencia Fotográfica */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Evidencia Fotográfica</h2>
                    <p className="mb-3 text-sm text-gray-600">
                        Para marcar una solicitud como verificada, debes adjuntar las 3 evidencias.
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Foto de fachada <span className="text-red-600">*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFotoFachada(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">INE con persona <span className="text-red-600">*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFotoIneConPersona(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Comprobante de domicilio <span className="text-red-600">*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFotoComprobante(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Resultado de Verificación */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faTrophy} className="text-gray-700" />
                        Resultado de la Verificación
                    </h2>

                    <div className="flex gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setResultado('VERIFICADA')}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${resultado === 'VERIFICADA'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faCircleCheck} />
                                Verificada
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setResultado('RECHAZADA')}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${resultado === 'RECHAZADA'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faCircleXmark} />
                                Rechazada
                            </span>
                        </button>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Observaciones {resultado === 'RECHAZADA' && <span className="text-red-600">*</span>}
                        </label>
                        <textarea
                            rows="4"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder={resultado === 'RECHAZADA'
                                ? "Explica detalladamente el motivo del rechazo (mínimo 20 caracteres)..."
                                : "Observaciones adicionales (opcional)"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Botón de envío */}
                <div className="flex gap-3">
                    <button
                        onClick={() => router.get(route('verificador.solicitudes.index'))}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleVerificar}
                        disabled={enviando}
                        className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {enviando ? 'Procesando...' : 'Finalizar Verificación'}
                    </button>
                </div>
            </div>
        </TabletLayout>
    );
}