import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileLines,
    faMagnifyingGlass,
    faCircleCheck,
    faTrophy,
    faCircleXmark,
    faStore,
    faUser,
    faUsers,
    faLocationDot,
    faBriefcase,
    faCarSide,
    faClock,
    faClipboard,
} from '@fortawesome/free-solid-svg-icons';

export default function Show({ solicitud, edit_url }) {
    const [enviando, setEnviando] = useState(false);

    const estadoConfig = {
        'PRE': { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: faFileLines },
        'EN_REVISION': { label: 'En Verificación', color: 'bg-yellow-100 text-yellow-800', icon: faMagnifyingGlass },
        'VERIFICADA': { label: 'Verificada', color: 'bg-blue-100 text-blue-800', icon: faCircleCheck },
        'APROBADA': { label: 'Activa', color: 'bg-green-100 text-green-800', icon: faTrophy },
        'RECHAZADA': { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: faCircleXmark },
        'POSIBLE_DISTRIBUIDORA': { label: 'Posible Distribuidora', color: 'bg-purple-100 text-purple-800', icon: faStore }
    };

    const estadoInfo = estadoConfig[solicitud.estado] || { label: solicitud.estado, color: 'bg-gray-100 text-gray-800', icon: faClipboard };
    const persona = solicitud.persona;

    const handleEnviarVerificacion = () => {
        if (confirm('¿Estás seguro de enviar esta solicitud a verificación? No podrás modificarla después.')) {
            setEnviando(true);
            router.post(route('coordinador.solicitudes.enviar-verificacion', solicitud.id), {}, {
                onSuccess: () => setEnviando(false),
                onError: () => setEnviando(false)
            });
        }
    };

    const handleEditar = () => {
        router.get(edit_url);
    };

    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
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

    return (
        <TabletLayout title="Detalle de Solicitud">
            <Head title={`Solicitud - ${persona.primer_nombre} ${persona.apellido_paterno}`} />

            {/* Header con acciones */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Detalle de Solicitud</h1>
                    <p className="text-sm text-gray-500">ID: #{solicitud.id}</p>
                </div>
                <div className="flex gap-2">
                    {solicitud.estado === 'PRE' && (
                        <>
                            <button
                                onClick={handleEditar}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Editar
                            </button>
                            <button
                                onClick={handleEnviarVerificacion}
                                disabled={enviando}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {enviando ? 'Enviando...' : 'Enviar a Verificación'}
                            </button>
                        </>
                    )}
                    {solicitud.estado === 'RECHAZADA' && (
                        <button
                            onClick={handleEditar}
                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                        >
                            Corregir y Reenviar
                        </button>
                    )}
                </div>
            </div>

            {/* Estado */}
            <div className={`mb-4 p-3 rounded-lg ${estadoInfo.color}`}>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={estadoInfo.icon} className="text-xl" />
                    <span className="font-medium">Estado: {estadoInfo.label}</span>
                </div>
                {solicitud.verificacion?.observaciones && solicitud.estado === 'RECHAZADA' && (
                    <div className="p-2 mt-2 bg-red-100 rounded">
                        <p className="text-sm font-medium text-red-800">Motivo del rechazo:</p>
                        <p className="text-sm text-red-700">{solicitud.verificacion.observaciones}</p>
                    </div>
                )}
            </div>

            {verificacion && (
                <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                        <FontAwesomeIcon icon={faClipboard} className="text-gray-700" />
                        Evidencia de Verificación
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

            <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                    <FontAwesomeIcon icon={faClipboard} className="text-gray-700" />
                    Documentos de Pre-solicitud
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                        { label: 'INE frente', url: solicitud.ine_frente_url },
                        { label: 'INE reverso', url: solicitud.ine_reverso_url },
                        { label: 'Comprobante de domicilio', url: solicitud.comprobante_domicilio_url },
                        { label: 'Reporte de buró', url: solicitud.reporte_buro_url },
                    ].map((doc) => {
                        const esPdf = (doc.url || '').toLowerCase().includes('.pdf');

                        return (
                            <div key={doc.label} className="overflow-hidden border border-gray-200 rounded-lg">
                                <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                    {doc.label}
                                </div>

                                {!doc.url && (
                                    <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                                        Sin documento cargado
                                    </div>
                                )}

                                {doc.url && esPdf && (
                                    <div className="flex items-center justify-center h-48">
                                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                            Abrir PDF
                                        </a>
                                    </div>
                                )}

                                {doc.url && !esPdf && (
                                    <a href={doc.url} target="_blank" rel="noreferrer">
                                        <img src={doc.url} alt={doc.label} className="object-cover w-full h-48" />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Datos Personales */}
            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                    Datos Personales
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-500">Nombre completo:</span>
                        <p className="font-medium">
                            {persona.primer_nombre} {persona.segundo_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Sexo:</span>
                        <p className="font-medium">{persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : 'Otro'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fecha de nacimiento:</span>
                        <p className="font-medium">{formatBirthDate(persona.fecha_nacimiento)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Edad:</span>
                        <p className="font-medium">
                            {persona.fecha_nacimiento ? new Date().getFullYear() - new Date(persona.fecha_nacimiento).getFullYear() : 'N/A'} años
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
                        <span className="text-gray-500">Teléfono personal:</span>
                        <p className="font-medium">{persona.telefono_personal || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Teléfono celular:</span>
                        <p className="font-medium">{persona.telefono_celular || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                        <span className="text-gray-500">Correo electrónico:</span>
                        <p className="font-medium">{persona.correo_electronico || 'No registrado'}</p>
                    </div>
                </div>
            </div>

            {/* Datos Familiares */}
            {solicitud.datos_familiares && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faUsers} className="text-gray-700" />
                        Datos Familiares
                    </h2>

                    {/* Cónyuge */}
                    {solicitud.datos_familiares.conyuge?.nombre && (
                        <div className="mb-3">
                            <h3 className="font-medium text-gray-700">Cónyuge/Pareja</h3>
                            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                                <p><span className="text-gray-500">Nombre:</span> {solicitud.datos_familiares.conyuge.nombre}</p>
                                <p><span className="text-gray-500">Teléfono:</span> {solicitud.datos_familiares.conyuge.telefono || 'N/A'}</p>
                                <p className="col-span-2"><span className="text-gray-500">Ocupación:</span> {solicitud.datos_familiares.conyuge.ocupacion || 'N/A'}</p>
                            </div>
                        </div>
                    )}

                    {/* Padres */}
                    {(solicitud.datos_familiares.padres?.madre?.nombre || solicitud.datos_familiares.padres?.padre?.nombre) && (
                        <div className="mb-3">
                            <h3 className="font-medium text-gray-700">Padres</h3>
                            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                                {solicitud.datos_familiares.padres.madre?.nombre && (
                                    <div>
                                        <span className="text-gray-500">Madre:</span>
                                        <p>{solicitud.datos_familiares.padres.madre.nombre}</p>
                                        {solicitud.datos_familiares.padres.madre.telefono && (
                                            <p className="text-xs text-gray-500">Tel: {solicitud.datos_familiares.padres.madre.telefono}</p>
                                        )}
                                    </div>
                                )}
                                {solicitud.datos_familiares.padres.padre?.nombre && (
                                    <div>
                                        <span className="text-gray-500">Padre:</span>
                                        <p>{solicitud.datos_familiares.padres.padre.nombre}</p>
                                        {solicitud.datos_familiares.padres.padre.telefono && (
                                            <p className="text-xs text-gray-500">Tel: {solicitud.datos_familiares.padres.padre.telefono}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hijos */}
                    {solicitud.datos_familiares.hijos?.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-700">Hijos ({solicitud.datos_familiares.hijos.length})</h3>
                            <div className="mt-1 space-y-2">
                                {solicitud.datos_familiares.hijos.map((hijo, index) => (
                                    <div key={index} className="pl-2 text-sm border-l-2 border-blue-200">
                                        <p><span className="text-gray-500">Nombre:</span> {hijo.nombre}</p>
                                        <p><span className="text-gray-500">Edad:</span> {hijo.edad} años</p>
                                        {hijo.telefono && <p><span className="text-gray-500">Teléfono:</span> {hijo.telefono}</p>}
                                        {hijo.ocupacion && <p><span className="text-gray-500">Ocupación:</span> {hijo.ocupacion}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Domicilio */}
            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faLocationDot} className="text-gray-700" />
                    Domicilio
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                        <span className="text-gray-500">Dirección:</span>
                        <p className="font-medium">
                            {persona.calle} {persona.numero_exterior}
                            {persona.numero_interior && ` Int. ${persona.numero_interior}`}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Colonia:</span>
                        <p>{persona.colonia}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Código Postal:</span>
                        <p>{persona.codigo_postal}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Ciudad:</span>
                        <p>{persona.ciudad}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Estado:</span>
                        <p>{persona.estado}</p>
                    </div>
                    {persona.latitud && persona.longitud && (
                        <div className="col-span-2">
                            <span className="text-gray-500">Ubicación GPS:</span>
                            <p className="font-mono text-xs">
                                Lat: {persona.latitud}, Lng: {persona.longitud}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Referencias Laborales */}
            {solicitud.afiliaciones && solicitud.afiliaciones.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faBriefcase} className="text-gray-700" />
                        Referencias Laborales
                    </h2>
                    <div className="space-y-2">
                        {solicitud.afiliaciones.map((ref, index) => (
                            <div key={index} className="pb-2 border-b border-gray-100">
                                <p className="font-medium">{ref.empresa}</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-gray-500">Antigüedad:</span> {ref.antiguedad} meses</p>
                                    <p><span className="text-gray-500">Límite de crédito:</span> ${ref.limite_credito?.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehículos */}
            {solicitud.vehiculos && solicitud.vehiculos.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faCarSide} className="text-gray-700" />
                        Vehículos
                    </h2>
                    <div className="space-y-2">
                        {solicitud.vehiculos.map((vehiculo, index) => (
                            <div key={index} className="pb-2 border-b border-gray-100">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-gray-500">Marca:</span> {vehiculo.marca}</p>
                                    <p><span className="text-gray-500">Modelo:</span> {vehiculo.modelo}</p>
                                    <p><span className="text-gray-500">Placas:</span> {vehiculo.placas}</p>
                                    {vehiculo.anio && <p><span className="text-gray-500">Año:</span> {vehiculo.anio}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Información de envío */}
            <div className="p-4 mb-4 rounded-lg bg-gray-50">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faClock} className="text-gray-700" />
                    Información de Envío
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-gray-500">Creada por:</span>
                        <p>{solicitud.capturador?.nombre_usuario || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fecha creación:</span>
                        <p>{formatDate(solicitud.creado_en)}</p>
                    </div>
                    {solicitud.enviada_en && (
                        <>
                            <div>
                                <span className="text-gray-500">Enviada a verificación:</span>
                                <p>{formatDate(solicitud.enviada_en)}</p>
                            </div>
                            {solicitud.revisada_en && (
                                <div>
                                    <span className="text-gray-500">Fecha revisión:</span>
                                    <p>{formatDate(solicitud.revisada_en)}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </TabletLayout>
    );
}