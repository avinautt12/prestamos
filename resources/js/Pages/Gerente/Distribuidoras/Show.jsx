import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faUser,
    faHouse,
    faClipboardCheck,
    faCircleCheck,
    faCircleXmark,
    faUsers,
    faCarSide,
    faBriefcase,
} from '@fortawesome/free-solid-svg-icons';

export default function Show({ solicitud, categorias, configuracionSucursal, securityPolicy = {} }) {
    const requiereVpn = securityPolicy?.requires_vpn ?? false;
    const afiliacionesArray = Array.isArray(solicitud.afiliaciones) ? solicitud.afiliaciones : [];
    const vehiculosArray = Array.isArray(solicitud.vehiculos) ? solicitud.vehiculos : [];
    const limiteSugerido = solicitud.limite_credito_solicitado
        ? Number(solicitud.limite_credito_solicitado)
        : Number(configuracionSucursal?.linea_credito_default || 0) > 0
            ? Number(configuracionSucursal?.linea_credito_default)
            : '';

    const categoriaDefault = categorias[0]?.id || '';

    const aprobarForm = useForm({
        limite_credito: limiteSugerido,
        categoria_id: categoriaDefault,
        resultado_buro: '',
    });

    const rechazarForm = useForm({
        motivo_rechazo: '',
    });

    const formatDateTime = (date) => {
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

    const handleAprobar = (event) => {
        event.preventDefault();

        aprobarForm.post(route('gerente.distribuidoras.aprobar', solicitud.id));
    };

    const handleRechazar = (event) => {
        event.preventDefault();

        rechazarForm.post(route('gerente.distribuidoras.rechazar', solicitud.id));
    };

    const rawChecklist = solicitud.verificacion?.checklist || {};
    const rawJustificaciones = solicitud.verificacion?.justificaciones || {};

    const normalizeValue = (val) => {
        if (val === true || val === 'true' || val === 1 || val === '1') return true;
        if (val === false || val === 'false' || val === 0 || val === '0') return false;
        return null;
    };

    const checklist = Object.fromEntries(
        Object.entries(rawChecklist).map(([k, v]) => [k, normalizeValue(v)])
    );

    const justificaciones = Object.fromEntries(
        Object.entries(rawJustificaciones).map(([k, v]) => [k, v])
    );

    const evidenciasExtras = solicitud.verificacion?.evidencias_extras_urls || [];

    const checklistItems = [
        { key: 'domicilio_correcto', label: 'Domicilio correcto' },
        { key: 'persona_identificada', label: 'Persona identificada' },
        { key: 'vehiculos_visibles', label: 'Vehículos visibles' },
        { key: 'documentos_validos', label: 'Documentos válidos' },
    ];

    return (
        <AdminLayout title={`Expediente #${solicitud.id}`}>
            <Head title={`Expediente #${solicitud.id}`} />

            <div className="mb-4">
                <Link href={route('gerente.distribuidoras')} className="fin-btn-secondary">
                    <span className="inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Volver a bandeja
                    </span>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                    <div className="fin-card">
                        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                            <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                            Datos del Prospecto
                        </h2>
                        <div className="grid grid-cols-1 gap-3 mt-3 text-sm md:grid-cols-2">
                            <p><span className="text-gray-500">Nombre:</span> {solicitud.persona?.primer_nombre} {solicitud.persona?.apellido_paterno} {solicitud.persona?.apellido_materno}</p>
                            <p><span className="text-gray-500">CURP:</span> {solicitud.persona?.curp || 'N/A'}</p>
                            <p><span className="text-gray-500">RFC:</span> {solicitud.persona?.rfc || 'N/A'}</p>
                            <p><span className="text-gray-500">Teléfono celular:</span> {solicitud.persona?.telefono_celular || 'N/A'}</p>
                            <p><span className="text-gray-500">Teléfono fijo:</span> {solicitud.persona?.telefono_personal || 'N/A'}</p>
                            <p><span className="text-gray-500">Fecha de nacimiento:</span> {formatBirthDate(solicitud.persona?.fecha_nacimiento)}</p>
                        </div>
                    </div>

                    <div className="fin-card">
                        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                            <FontAwesomeIcon icon={faHouse} className="text-gray-700" />
                            Domicilio
                        </h2>
                        <div className="grid grid-cols-1 gap-3 mt-3 text-sm md:grid-cols-2">
                            <p><span className="text-gray-500">Dirección:</span> {solicitud.persona?.calle} {solicitud.persona?.numero_exterior}, {solicitud.persona?.colonia}</p>
                            <p><span className="text-gray-500">Ciudad / Estado:</span> {solicitud.persona?.ciudad}, {solicitud.persona?.estado}</p>
                            <p><span className="text-gray-500">Código Postal:</span> {solicitud.persona?.codigo_postal || 'N/A'}</p>
                            <p><span className="text-gray-500">Fecha verificación:</span> {formatDateTime(solicitud.revisada_en)}</p>
                        </div>
                    </div>

                    {solicitud.datos_familiares && (
                        <div className="fin-card">
                            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                                <FontAwesomeIcon icon={faUsers} className="text-gray-700" />
                                Datos Familiares
                            </h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {solicitud.datos_familiares?.conyuge?.nombre && (
                                    <div className="border-b pb-2">
                                        <p><span className="text-gray-500">Cónyuge:</span> {solicitud.datos_familiares.conyuge.nombre}</p>
                                        {solicitud.datos_familiares.conyuge.telefono && <p><span className="text-gray-500">Teléfono:</span> {solicitud.datos_familiares.conyuge.telefono}</p>}
                                        {solicitud.datos_familiares.conyuge.ocupacion && <p><span className="text-gray-500">Ocupación:</span> {solicitud.datos_familiares.conyuge.ocupacion}</p>}
                                    </div>
                                )}
                                {(solicitud.datos_familiares?.padres?.madre?.nombre || solicitud.datos_familiares?.padres?.padre?.nombre) && (
                                    <div className="border-b pb-2">
                                        <p><span className="text-gray-500">Madre:</span> {solicitud.datos_familiares?.padres?.madre?.nombre || 'N/A'}</p>
                                        <p><span className="text-gray-500">Padre:</span> {solicitud.datos_familiares?.padres?.padre?.nombre || 'N/A'}</p>
                                    </div>
                                )}
                                {solicitud.datos_familiares?.hijos?.length > 0 && (
                                    <div>
                                        <p className="font-medium text-gray-700">Hijos ({solicitud.datos_familiares.hijos.length})</p>
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

                    {requiereVpn && (
                        <div className="p-3 mt-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                            <strong>VPN requerida:</strong> Aprobar o rechazar distribuidoras requiere conexión VPN WireGuard.
                        </div>
                    )}
                </div>
                                )}
                            </div>
                        </div>
                    )}

                    {afiliacionesArray.length > 0 && (
                        <div className="fin-card">
                            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                                <FontAwesomeIcon icon={faBriefcase} className="text-gray-700" />
                                Referencias Laborales
                            </h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {afiliacionesArray.map((afiliacion, index) => (
                                    <div key={index} className="p-2 border border-gray-200 rounded-lg">
                                        <p><span className="text-gray-500">Empresa:</span> {afiliacion.empresa || 'N/A'}</p>
                                        <p><span className="text-gray-500">Antigüedad:</span> {afiliacion.antiguedad || 'N/A'} meses</p>
                                        <p><span className="text-gray-500">Límite:</span> ${Number(afiliacion.limite_credito || 0).toLocaleString('es-MX')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {vehiculosArray.length > 0 && (
                        <div className="fin-card">
                            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                                <FontAwesomeIcon icon={faCarSide} className="text-gray-700" />
                                Vehículos Declarados
                            </h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {vehiculosArray.map((vehiculo, index) => (
                                    <div key={index} className="p-2 border border-gray-200 rounded-lg">
                                        <p><span className="text-gray-500">Marca:</span> {vehiculo.marca || 'N/A'}</p>
                                        <p><span className="text-gray-500">Modelo:</span> {vehiculo.modelo || 'N/A'}</p>
                                        <p><span className="text-gray-500">Placas:</span> {vehiculo.placas || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="fin-card">
                        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                            <FontAwesomeIcon icon={faClipboardCheck} className="text-gray-700" />
                            Dictamen del Verificador
                        </h2>
                        <div className="grid grid-cols-1 gap-3 mt-3 text-sm md:grid-cols-2">
                            <p><span className="text-gray-500">Resultado:</span> {solicitud.verificacion?.resultado || 'N/A'}</p>
                            <p><span className="text-gray-500">Distancia:</span> {solicitud.verificacion?.distancia_metros ? `${Math.round(solicitud.verificacion.distancia_metros)} m` : 'N/A'}</p>
                            <p className="md:col-span-2"><span className="text-gray-500">Observaciones:</span> {solicitud.verificacion?.observaciones || 'Sin observaciones'}</p>
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                            {checklistItems.map((item) => {
                                const value = checklist[item.key];
                                const justificacion = justificaciones[item.key];
                                const isSi = value === true;
                                const isNo = value === false;

                                return (
                                    <div key={item.key} className="p-2 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {isSi && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Sí</span>}
                                            {isNo && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">No</span>}
                                            {value === null && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">N/A</span>}
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {justificacion && (
                                            <div className="p-2 mt-1 ml-10 text-xs text-gray-600 rounded bg-gray-50">
                                                <span className="font-medium">Justificación:</span> {justificacion}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="fin-card">
                        <h2 className="mb-3 text-lg font-semibold">Evidencia del Verificador</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                                { label: 'Fachada', url: solicitud.verificacion?.foto_fachada_url },
                                { label: 'INE con persona', url: solicitud.verificacion?.foto_ine_con_persona_url },
                                { label: 'Comprobante', url: solicitud.verificacion?.foto_comprobante_url },
                            ].map((evidencia) => (
                                <div key={evidencia.label} className="overflow-hidden border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">{evidencia.label}</div>
                                    {evidencia.url ? (
                                        <a href={evidencia.url} target="_blank" rel="noreferrer">
                                            <img src={evidencia.url} alt={evidencia.label} className="object-cover w-full h-52" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-center text-sm text-gray-400 h-52">Sin evidencia</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {evidenciasExtras.length > 0 && (
                            <div className="mt-4">
                                <h3 className="mb-3 font-semibold text-md">Evidencia Adicional</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {evidenciasExtras.map((evidencia, index) => (
                                        <div key={index} className="overflow-hidden border border-gray-200 rounded-lg">
                                            <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                                {evidencia.descripcion || `Evidencia ${index + 1}`}
                                            </div>
                                            {evidencia.url ? (
                                                <a href={evidencia.url} target="_blank" rel="noreferrer">
                                                    <img src={evidencia.url} alt={evidencia.descripcion} className="object-cover w-full h-52" />
                                                </a>
                                            ) : (
                                                <div className="flex items-center justify-center text-sm text-gray-400 h-52">Sin evidencia</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="fin-card">
                        <h2 className="mb-3 text-lg font-semibold">Documentos del Coordinador</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                { label: 'INE Frente', url: solicitud.ine_frente_url },
                                { label: 'INE Reverso', url: solicitud.ine_reverso_url },
                                { label: 'Comprobante de Domicilio', url: solicitud.comprobante_domicilio_url },
                                { label: 'Reporte de Buró', url: solicitud.reporte_buro_url },
                            ].map((doc) => {
                                const esPdf = (doc.url || '').toLowerCase().includes('.pdf');
                                return (
                                    <div key={doc.label} className="overflow-hidden border border-gray-200 rounded-lg">
                                        <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">{doc.label}</div>
                                        {!doc.url && (
                                            <div className="flex items-center justify-center h-48 text-sm text-gray-400">Sin documento</div>
                                        )}
                                        {doc.url && esPdf && (
                                            <div className="flex items-center justify-center h-48">
                                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800">Abrir PDF</a>
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
                </div>

                <div className="space-y-4">
                    <div className="fin-card">
                        <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-green-700">
                            <FontAwesomeIcon icon={faCircleCheck} />
                            Aprobar
                        </h3>

                        <form onSubmit={handleAprobar} className="mt-3 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Límite de crédito inicial <span className="text-red-600">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={aprobarForm.data.limite_credito}
                                    onChange={(event) => aprobarForm.setData('limite_credito', event.target.value)}
                                    className="mt-1 fin-input"
                                />
                                {aprobarForm.errors.limite_credito && <p className="mt-1 text-xs text-red-600">{aprobarForm.errors.limite_credito}</p>}
                            </div>

                            {/* CAMPO 2: Buró de Crédito */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Resultado Buró de Crédito <span className="text-red-600">*</span></label>
                                <select
                                    value={aprobarForm.data.resultado_buro}
                                    onChange={(event) => aprobarForm.setData('resultado_buro', event.target.value)}
                                    className="mt-1 fin-input"
                                >
                                    <option value="">Selecciona el dictamen</option>
                                    <option value="Apto / Excelente historial">Apto / Excelente historial</option>
                                    <option value="Apto / Buen historial">Apto / Buen historial</option>
                                    <option value="Apto / Sin historial previo">Apto / Sin historial previo</option>
                                    <option value="Riesgo Medio / Aprobado por excepción">Riesgo Medio / Aprobado por excepción</option>
                                </select>
                                {aprobarForm.errors.resultado_buro && <p className="mt-1 text-xs text-red-600">{aprobarForm.errors.resultado_buro}</p>}
                            </div>

{/* CAMPO 3: Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                <select
                                    value={aprobarForm.data.categoria_id}
                                    onChange={(event) => aprobarForm.setData('categoria_id', event.target.value)}
                                    className="mt-1 fin-input"
                                >
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id} value={categoria.id}>
                                            {categoria.nombre} ({categoria.porcentaje_comision}% comisión)
                                        </option>
                                    ))}
                                </select>
                                {aprobarForm.errors.categoria_id && <p className="mt-1 text-xs text-red-600">{aprobarForm.errors.categoria_id}</p>}
                            </div>

                            {aprobarForm.errors.general && <p className="text-xs text-red-600">{aprobarForm.errors.general}</p>}
                            {aprobarForm.errors.security && <p className="text-xs text-red-600">{aprobarForm.errors.security}</p>}

                            <button 
                                type="submit" 
                                disabled={aprobarForm.processing || requiereVpn} 
                                className={`w-full fin-btn-primary ${requiereVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={requiereVpn ? "Requiere conexión VPN WireGuard" : "Aprobar solicitud"}
                            >
                                {aprobarForm.processing ? 'Aprobando...' : 'Aprobar solicitud'}
                            </button>
                        </form>
                    </div>

                    <div className="fin-card">
                        <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-red-700">
                            <FontAwesomeIcon icon={faCircleXmark} />
                            Rechazar
                        </h3>

                        <form onSubmit={handleRechazar} className="mt-3 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Motivo del rechazo <span className="text-red-600">*</span></label>
                                <textarea
                                    rows={4}
                                    value={rechazarForm.data.motivo_rechazo}
                                    onChange={(event) => rechazarForm.setData('motivo_rechazo', event.target.value)}
                                    placeholder="Explica el motivo del rechazo (mínimo 20 caracteres)..."
                                    className="mt-1 fin-input"
                                />
                                {rechazarForm.errors.motivo_rechazo && <p className="mt-1 text-xs text-red-600">{rechazarForm.errors.motivo_rechazo}</p>}
                                {rechazarForm.errors.security && <p className="mt-1 text-xs text-red-600">{rechazarForm.errors.security}</p>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={rechazarForm.processing || requiereVpn} 
                                className={`inline-flex items-center justify-center w-full gap-2 px-4 py-3 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 ${requiereVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={requiereVpn ? "Requiere conexión VPN WireGuard" : "Rechazar solicitud"}
                            >
                                {rechazarForm.processing ? 'Rechazando...' : 'Rechazar solicitud'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
