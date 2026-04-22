import React, { useState, useEffect } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
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

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function Show({ solicitud }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [infoWindowAbierto, setInfoWindowAbierto] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [observaciones, setObservaciones] = useState('');
    const [checklist, setChecklist] = useState({
        domicilio_correcto: null,
        persona_identificada: null,
        vehiculos_visibles: null,
        documentos_validos: null,
    });
    const [ubicacionActual, setUbicacionActual] = useState(null);
    const [distancia, setDistancia] = useState(null);
    const [errorGPS, setErrorGPS] = useState(null);
    const [errors, setErrors] = useState({});
    const [fotoFachada, setFotoFachada] = useState(null);
    const [fotoIneConPersona, setFotoIneConPersona] = useState(null);
    const [fotoComprobante, setFotoComprobante] = useState(null);
    const [evidenciasExtra, setEvidenciasExtra] = useState([]);
    const [justificaciones, setJustificaciones] = useState({
        domicilio_correcto: '',
        persona_identificada: '',
        vehiculos_visibles: '',
        documentos_validos: '',
    });

    const persona = solicitud.persona;
    const domicilioLat = persona.latitud ? parseFloat(persona.latitud) : null;
    const domicilioLng = persona.longitud ? parseFloat(persona.longitud) : null;
    const tieneMapa = domicilioLat !== null && domicilioLng !== null;
    const centroMapa = ubicacionActual
        ? { lat: ubicacionActual.lat, lng: ubicacionActual.lng }
        : tieneMapa
            ? { lat: domicilioLat, lng: domicilioLng }
            : { lat: 19.4326, lng: -99.1332 };

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

                    // Calcular distancia si hay coordenadas del domicilio
                    if (domicilioLat !== null && domicilioLng !== null) {
                        const dist = calcularDistancia(
                            domicilioLat,
                            domicilioLng,
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
    }, [persona.latitud, persona.longitud, isLoaded]);

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
        const newErrors = {};

        if (!resultado) {
            newErrors.resultado = 'Debes seleccionar un resultado (Verificada o Rechazada)';
            setErrors(newErrors);
            return;
        }

        if (resultado === 'RECHAZADA') {
            if (!observaciones.trim()) {
                newErrors.observaciones = 'Debes proporcionar un motivo de rechazo';
            } else if (observaciones.trim().length < 20) {
                newErrors.observaciones = 'El motivo de rechazo debe tener al menos 20 caracteres';
            }
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        }

        // Verificar que el checklist tenga valores asignados
        const valuesChequeo = Object.values(checklist);
        const tieneSinMarcar = valuesChequeo.some(v => v === null);
        if (tieneSinMarcar) {
            newErrors.checklist = 'Debes marcar todos los puntos del checklist';
            setErrors(newErrors);
            return;
        }

        // Si marca algo como NO, debe justificar en el campo específico
        const itemsMarcadosNo = Object.entries(checklist).filter(([key, value]) => value === false);
        for (const [key] of itemsMarcadosNo) {
            if (!justificaciones[key]?.trim()) {
                newErrors[`justificacion_${key}`] = `Indica por qué no en: ${key}`;
            }
        }
        if (Object.keys(newErrors).some(k => k.startsWith('justificacion_'))) {
            setErrors(newErrors);
            return;
        }

        // Solo requiere fotos si el resultado es VERIFICADA
        if (resultado === 'VERIFICADA' && (!fotoFachada || !fotoIneConPersona || !fotoComprobante)) {
            newErrors.fotos = 'Debes cargar al menos la evidencia fotográfica básica (INE, comprobante y fachada)';
            setErrors(newErrors);
            return;
        }

        // Si está muy lejos, solo permitir si rechazas
        if (resultado === 'VERIFICADA' && distancia !== null && distancia > 100) {
            newErrors.gps = `Estás a ${Math.round(distancia)} metros del domicilio. La distancia máxima permitida es 100 metros.`;
            setErrors(newErrors);
            return;
        }

        if (!ubicacionActual) {
            newErrors.gps = 'Esperando obtener tu ubicación GPS. Por favor espera.';
            setErrors(newErrors);
            return;
        }

        setErrors({});

        if (confirm(`¿Estás seguro de marcar esta solicitud como ${resultado === 'VERIFICADA' ? 'VERIFICADA' : 'RECHAZADA'}?`)) {
            setEnviando(true);

            const data = {
                resultado: resultado,
                observaciones: observaciones,
                latitud_verificacion: ubicacionActual.lat,
                longitud_verificacion: ubicacionActual.lng,
                fecha_visita: new Date().toISOString(),
                checklist: checklist,
                justificaciones: justificaciones,
                foto_fachada: fotoFachada,
                foto_ine_con_persona: fotoIneConPersona,
                foto_comprobante: fotoComprobante,
            };

            evidenciasExtra.forEach((ev, index) => {
                if (ev.archivo) {
                    data[`evidencia_extra_${index + 1}`] = ev.archivo;
                    data[`evidencia_extra_${index + 1}_descripcion`] = ev.descripcion;
                }
            });

            router.post(route('verificador.solicitudes.verificar', solicitud.id), data, {
                forceFormData: true,
                onSuccess: () => setEnviando(false),
                onError: (err) => {
                    console.error(err);
                    setErrors(err);
                    setEnviando(false);
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
    const estaVerificada = solicitud.estado === 'VERIFICADA' || solicitud.estado === 'RECHAZADA';
    const datosFamiliares = solicitud.datos_familiares || {};
    const afiliaciones = Array.isArray(solicitud.afiliaciones) ? solicitud.afiliaciones : [];
    const vehiculos = Array.isArray(solicitud.vehiculos) ? solicitud.vehiculos : [];

    useEffect(() => {
        if (verificacion) {
            setResultado(verificacion.resultado);
            setObservaciones(verificacion.observaciones || '');
            
            if (verificacion.checklist) {
                const cl = verificacion.checklist;
                const parseBool = (val) => {
                    if (val === true || val === '1' || val === 1) return true;
                    if (val === false || val === '0' || val === 0 || val === 'false') return false;
                    return null;
                };
                setChecklist({
                    domicilio_correcto: parseBool(cl.domicilio_correcto ?? cl.domicilio),
                    persona_identificada: parseBool(cl.persona_identificada ?? cl.identidad),
                    vehiculos_visibles: parseBool(cl.vehiculos_visibles ?? cl.referencias),
                    documentos_validos: parseBool(cl.documentos_validos),
                });
            }
            
            if (verificacion.justificaciones) {
                const jus = verificacion.justificaciones;
                const parseStr = (val) => {
                    if (val === null || val === 'null' || val === undefined) return '';
                    return String(val);
                };
                setJustificaciones({
                    domicilio_correcto: parseStr(jus.domicilio_correcto ?? jus.domicilio),
                    persona_identificada: parseStr(jus.persona_identificada ?? jus.identidad),
                    vehiculos_visibles: parseStr(jus.vehiculos_visibles ?? jus.referencias),
                    documentos_validos: parseStr(jus.documentos_validos),
                });
            }
        }
    }, [verificacion]);

    return (
        <TabletLayout title="Verificar Solicitud">
            <Head title={`Verificar - ${persona.primer_nombre} ${persona.apellido_paterno}`} />

            <div className="max-w-6xl mx-auto tablet-form">

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900">
                        {estaVerificada ? 'Detalle de Verificación' : 'Verificación en Campo'}
                    </h1>
                    {estaVerificada && (
                        <span className={`inline-block px-2 py-1 mt-1 text-xs font-medium rounded-full ${solicitud.estado === 'VERIFICADA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {solicitud.estado}
                        </span>
                    )}
                </div>

                {/* Errores */}
                {Object.keys(errors).length > 0 && (
                    <div className="p-3 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                        <ul className="list-disc list-inside">
                            {Object.entries(errors).map(([key, msg]) => (
                                <li key={key}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {!estaVerificada && (
                    <>
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
                                            Distancia:
                                        </span>
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
                    </>
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
                                            <p className="font-medium">{afiliacion.empresa || afiliacion.nombre || afiliacion.institucion || 'Afiliación'}</p>
                                            <p className="text-xs text-gray-500">{afiliacion.antiguedad ? `${afiliacion.antiguedad} ` : ''}{afiliacion.tipo || afiliacion.cargo || ''}{afiliacion.limite_credito ? ` · Límite: $${afiliacion.limite_credito}` : ''}</p>
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
                                            <p className="text-xs text-gray-500">{vehiculo.anio || ''} {vehiculo.placas ? ` · ${vehiculo.placas}` : ''}</p>
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
                        </div>

                        {tieneMapa && (
                            <div className="overflow-hidden bg-white border border-gray-200 rounded-xl lg:col-span-7">
                                <div className="h-64 sm:h-72">
                                    {isLoaded && (
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={centroMapa}
                                            zoom={17}
                                            options={{
                                                streetViewControl: false,
                                                mapTypeControl: false,
                                                fullscreenControl: false,
                                            }}
                                        >
                                            <Marker
                                                position={{ lat: domicilioLat, lng: domicilioLng }}
                                                icon={{
                                                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                                }}
                                                onClick={() => setInfoWindowAbierto('domicilio')}
                                            >
                                                {infoWindowAbierto === 'domicilio' && (
                                                    <InfoWindow onCloseClick={() => setInfoWindowAbierto(null)}>
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-gray-900">Domicilio registrado</p>
                                                            <p className="text-gray-600">{persona.calle} {persona.numero_exterior}</p>
                                                            <p className="text-gray-600">{persona.colonia}, {persona.ciudad}</p>
                                                        </div>
                                                    </InfoWindow>
                                                )}
                                            </Marker>

                                            {ubicacionActual && (
                                                <Marker
                                                    position={{ lat: ubicacionActual.lat, lng: ubicacionActual.lng }}
                                                    icon={{
                                                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                                    }}
                                                    onClick={() => setInfoWindowAbierto('actual')}
                                                >
                                                    {infoWindowAbierto === 'actual' && (
                                                        <InfoWindow onCloseClick={() => setInfoWindowAbierto(null)}>
                                                            <div className="text-sm text-center">
                                                                <p className="font-semibold text-green-700">Tu ubicación actual</p>
                                                                <p className="text-gray-600">Punto donde estás verificando</p>
                                                            </div>
                                                        </InfoWindow>
                                                    )}
                                                </Marker>
                                            )}
                                        </GoogleMap>
                                    )}
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
                    <div className="space-y-4">
                        {[
                            { key: 'domicilio_correcto', label: 'La persona vive en el domicilio registrado' },
                            { key: 'persona_identificada', label: 'La persona fue identificada con INE' },
                            { key: 'vehiculos_visibles', label: 'Los vehículos declarados están presentes' },
                            { key: 'documentos_validos', label: 'Los documentos presentados son válidos' },
                        ].map((item) => {
                            const valor = checklist[item.key];
                            const esSi = valor === true;
                            const esNo = valor === false;
                            return (
                            <div key={item.key} className="p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        {estaVerificada && (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${esSi ? 'bg-green-100 text-green-800' : esNo ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-600'}`}>
                                                {esSi ? 'Sí' : esNo ? 'No' : 'Sin marcar'}
                                            </span>
                                        )}
                                        {!estaVerificada && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setChecklist({ ...checklist, [item.key]: true });
                                                        setJustificaciones({ ...justificaciones, [item.key]: '' });
                                                    }}
                                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${esSi ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                                >
                                                    Sí
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setChecklist({ ...checklist, [item.key]: false })}
                                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${esNo ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                                >
                                                    No
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {esNo && (
                                    <div className="mt-2">
                                        {estaVerificada ? (
                                            <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                                <span className="font-medium">¿Por qué no?:</span> {justificaciones[item.key] || 'Sin justificación'}
                                            </p>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="¿Por qué no?"
                                                value={justificaciones[item.key] || ''}
                                                onChange={(e) => setJustificaciones({ ...justificaciones, [item.key]: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                            );
                        })}
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

                        {verificacion.evidencias_extras && verificacion.evidencias_extras.length > 0 && (
                            <div className="mt-4">
                                <h3 className="mb-2 text-sm font-semibold text-gray-800">Evidencias Adicionales</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {verificacion.evidencias_extras.map((ev, index) => (
                                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700">{ev.descripcion || `Evidencia ${index + 1}`}</p>
                                            {ev.url && (
                                                <a href={ev.url} target="_blank" rel="noreferrer">
                                                    <img src={ev.url} alt={ev.descripcion} className="object-cover w-full h-40 mt-2" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!estaVerificada && (
                    <>
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
                                        capture="environment"
                                        onChange={(e) => setFotoFachada(e.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">INE con persona <span className="text-red-600">*</span></label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setFotoIneConPersona(e.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Comprobante de domicilio <span className="text-red-600">*</span></label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setFotoComprobante(e.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEvidenciasExtra([...evidenciasExtra, { descripcion: '', archivo: null }])}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    + Agregar más evidencia
                                </button>
                            </div>

                            {evidenciasExtra.length > 0 && (
                                <div className="mt-3 space-y-3">
                                    {evidenciasExtra.map((ev, index) => (
                                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Evidencia adicional {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const n = [...evidenciasExtra];
                                                        n.splice(index, 1);
                                                        setEvidenciasExtra(n);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Descripción (ej: Foto del negocio, Vecinos, etc.)"
                                                value={ev.descripcion}
                                                onChange={(e) => {
                                                    const n = [...evidenciasExtra];
                                                    n[index].descripcion = e.target.value;
                                                    setEvidenciasExtra(n);
                                                }}
                                                className="block w-full mb-2 text-sm border border-gray-300 rounded-md px-3 py-2"
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) => {
                                                    const n = [...evidenciasExtra];
                                                    n[index].archivo = e.target.files?.[0] ?? null;
                                                    setEvidenciasExtra(n);
                                                }}
                                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Resultado de Verificación */}
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faTrophy} className="text-gray-700" />
                        Resultado de la Verificación
                    </h2>

                    {estaVerificada ? (
                        <div className={`flex items-center justify-center py-3 text-sm font-medium rounded-lg ${solicitud.estado === 'VERIFICADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={solicitud.estado === 'VERIFICADA' ? faCircleCheck : faCircleXmark} />
                                {solicitud.estado === 'VERIFICADA' ? 'Solicitud Verificada' : 'Solicitud Rechazada'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setResultado('VERIFICADA')}
                                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${resultado === 'VERIFICADA' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCircleCheck} />
                                    Verificada
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setResultado('RECHAZADA')}
                                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${resultado === 'RECHAZADA' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCircleXmark} />
                                    Rechazada
                                </span>
                            </button>
                        </div>
                    )}

                    {observaciones && (
                        <div className="mt-3">
                            <label className="block mb-1 text-sm font-medium text-gray-700">Observaciones:</label>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{observaciones}</p>
                        </div>
                    )}

                    {!estaVerificada && (
                        <div>
                            <textarea
                                rows="3"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Observaciones adicionales (opcional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    )}
                </div>

                {/* Botón de envío */}
                <div className="flex gap-3">
                    <button
                        onClick={() => router.get(route('verificador.validaciones'))}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        {estaVerificada ? 'Volver a Mis Validaciones' : 'Cancelar'}
                    </button>
                    {!estaVerificada && (
                        <button
                            onClick={handleVerificar}
                            disabled={enviando}
                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {enviando ? 'Procesando...' : 'Finalizar Verificación'}
                        </button>
                    )}
                </div>
            </div>
        </TabletLayout>
    );
}