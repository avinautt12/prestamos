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

export default function Show({ solicitud, categorias, configuracionSucursal }) {
    const afiliacionesArray = Array.isArray(solicitud.afiliaciones) ? solicitud.afiliaciones : [];
    const vehiculosArray = Array.isArray(solicitud.vehiculos) ? solicitud.vehiculos : [];
    const limiteSugerido = solicitud.limite_credito_solicitado
        ? Number(solicitud.limite_credito_solicitado)
        : Number(configuracionSucursal?.linea_credito_default || 0) > 0
            ? Number(configuracionSucursal?.linea_credito_default)
            : '';

    const aprobarForm = useForm({
        limite_credito: limiteSugerido,
        categoria_id: '',
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

    const checklist = solicitud.verificacion?.checklist || {};

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
                <div className="xl:col-span-2 space-y-4">
                    <div className="fin-card">
                        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                            Datos del Prospecto
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                            <p><span className="text-gray-500">Nombre:</span> {solicitud.persona?.primer_nombre} {solicitud.persona?.apellido_paterno} {solicitud.persona?.apellido_materno}</p>
                            <p><span className="text-gray-500">CURP:</span> {solicitud.persona?.curp || 'N/A'}</p>
                            <p><span className="text-gray-500">RFC:</span> {solicitud.persona?.rfc || 'N/A'}</p>
                            <p><span className="text-gray-500">Teléfono celular:</span> {solicitud.persona?.telefono_celular || 'N/A'}</p>
                            <p><span className="text-gray-500">Teléfono fijo:</span> {solicitud.persona?.telefono_personal || 'N/A'}</p>
                            <p><span className="text-gray-500">Fecha de nacimiento:</span> {formatBirthDate(solicitud.persona?.fecha_nacimiento)}</p>
                        </div>
                    </div>

                    <div className="fin-card">
                        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faHouse} className="text-gray-700" />
                            Domicilio
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                            <p><span className="text-gray-500">Dirección:</span> {solicitud.persona?.calle} {solicitud.persona?.numero_exterior}, {solicitud.persona?.colonia}</p>
                            <p><span className="text-gray-500">Ciudad / Estado:</span> {solicitud.persona?.ciudad}, {solicitud.persona?.estado}</p>
                            <p><span className="text-gray-500">Código Postal:</span> {solicitud.persona?.codigo_postal || 'N/A'}</p>
                            <p><span className="text-gray-500">Fecha verificación:</span> {formatDateTime(solicitud.revisada_en)}</p>
                        </div>
                    </div>

                    {solicitud.datos_familiares && (
                        <div className="fin-card">
                            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faUsers} className="text-gray-700" />
                                Datos Familiares
                            </h2>
                            <div className="mt-3 text-sm space-y-2">
                                <p><span className="text-gray-500">Madre:</span> {solicitud.datos_familiares?.padres?.madre?.nombre || 'N/A'}</p>
                                <p><span className="text-gray-500">Padre:</span> {solicitud.datos_familiares?.padres?.padre?.nombre || 'N/A'}</p>
                                <p><span className="text-gray-500">Cónyuge:</span> {solicitud.datos_familiares?.conyuge?.nombre || 'No registrado'}</p>
                            </div>
                        </div>
                    )}

                    {afiliacionesArray.length > 0 && (
                        <div className="fin-card">
                            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faBriefcase} className="text-gray-700" />
                                Referencias Laborales
                            </h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {afiliacionesArray.map((afiliacion, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-2">
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
                            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faCarSide} className="text-gray-700" />
                                Vehículos Declarados
                            </h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {vehiculosArray.map((vehiculo, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-2">
                                        <p><span className="text-gray-500">Marca:</span> {vehiculo.marca || 'N/A'}</p>
                                        <p><span className="text-gray-500">Modelo:</span> {vehiculo.modelo || 'N/A'}</p>
                                        <p><span className="text-gray-500">Placas:</span> {vehiculo.placas || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="fin-card">
                        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faClipboardCheck} className="text-gray-700" />
                            Dictamen del Verificador
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                            <p><span className="text-gray-500">Resultado:</span> {solicitud.verificacion?.resultado || 'N/A'}</p>
                            <p><span className="text-gray-500">Distancia:</span> {solicitud.verificacion?.distancia_metros ? `${Math.round(solicitud.verificacion.distancia_metros)} m` : 'N/A'}</p>
                            <p className="md:col-span-2"><span className="text-gray-500">Observaciones:</span> {solicitud.verificacion?.observaciones || 'Sin observaciones'}</p>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p>{checklist.domicilio_correcto ? '✓' : '✗'} Domicilio correcto</p>
                            <p>{checklist.persona_identificada ? '✓' : '✗'} Persona identificada</p>
                            <p>{checklist.vehiculos_visibles ? '✓' : '✗'} Vehículos visibles</p>
                            <p>{checklist.documentos_validos ? '✓' : '✗'} Documentos válidos</p>
                        </div>
                    </div>

                    <div className="fin-card">
                        <h2 className="text-lg font-semibold mb-3">Evidencia del Verificador</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Fachada', url: solicitud.verificacion?.foto_fachada_url },
                                { label: 'INE con persona', url: solicitud.verificacion?.foto_ine_con_persona_url },
                                { label: 'Comprobante', url: solicitud.verificacion?.foto_comprobante_url },
                            ].map((evidencia) => (
                                <div key={evidencia.label} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">{evidencia.label}</div>
                                    {evidencia.url ? (
                                        <a href={evidencia.url} target="_blank" rel="noreferrer">
                                            <img src={evidencia.url} alt={evidencia.label} className="w-full h-52 object-cover" />
                                        </a>
                                    ) : (
                                        <div className="h-52 flex items-center justify-center text-sm text-gray-400">Sin evidencia</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="fin-card">
                        <h2 className="text-lg font-semibold mb-3">Documentos del Coordinador</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'INE Frente', url: solicitud.ine_frente_url },
                                { label: 'INE Reverso', url: solicitud.ine_reverso_url },
                                { label: 'Comprobante de Domicilio', url: solicitud.comprobante_domicilio_url },
                                { label: 'Reporte de Buró', url: solicitud.reporte_buro_url },
                            ].map((doc) => {
                                const esPdf = (doc.url || '').toLowerCase().includes('.pdf');
                                return (
                                    <div key={doc.label} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">{doc.label}</div>
                                        {!doc.url && (
                                            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sin documento</div>
                                        )}
                                        {doc.url && esPdf && (
                                            <div className="h-48 flex items-center justify-center">
                                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800">Abrir PDF</a>
                                            </div>
                                        )}
                                        {doc.url && !esPdf && (
                                            <a href={doc.url} target="_blank" rel="noreferrer">
                                                <img src={doc.url} alt={doc.label} className="w-full h-48 object-cover" />
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
                        <h3 className="text-lg font-semibold text-green-700 inline-flex items-center gap-2">
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
                                    className="fin-input mt-1"
                                />
                                {aprobarForm.errors.limite_credito && <p className="text-xs text-red-600 mt-1">{aprobarForm.errors.limite_credito}</p>}
                            </div>

                            {/* CAMPO 2: Buró de Crédito */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Resultado Buró de Crédito <span className="text-red-600">*</span></label>
                                <select
                                    value={aprobarForm.data.resultado_buro}
                                    onChange={(event) => aprobarForm.setData('resultado_buro', event.target.value)}
                                    className="fin-input mt-1"
                                >
                                    <option value="">Selecciona el dictamen</option>
                                    <option value="Apto / Excelente historial">Apto / Excelente historial</option>
                                    <option value="Apto / Buen historial">Apto / Buen historial</option>
                                    <option value="Apto / Sin historial previo">Apto / Sin historial previo</option>
                                    <option value="Riesgo Medio / Aprobado por excepción">Riesgo Medio / Aprobado por excepción</option>
                                </select>
                                {aprobarForm.errors.resultado_buro && <p className="text-xs text-red-600 mt-1">{aprobarForm.errors.resultado_buro}</p>}
                            </div>

                            {/* CAMPO 3: Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categoría <span className="text-red-600">*</span></label>
                                <select
                                    value={aprobarForm.data.categoria_id}
                                    onChange={(event) => aprobarForm.setData('categoria_id', event.target.value)}
                                    className="fin-input mt-1"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id} value={categoria.id}>
                                            {categoria.nombre} ({categoria.porcentaje_comision}% comisión)
                                        </option>
                                    ))}
                                </select>
                                {aprobarForm.errors.categoria_id && <p className="text-xs text-red-600 mt-1">{aprobarForm.errors.categoria_id}</p>}
                            </div>

                            {aprobarForm.errors.general && <p className="text-xs text-red-600">{aprobarForm.errors.general}</p>}
                            {aprobarForm.errors.security && <p className="text-xs text-red-600">{aprobarForm.errors.security}</p>}

                            <button type="submit" disabled={aprobarForm.processing} className="fin-btn-primary w-full">
                                {aprobarForm.processing ? 'Aprobando...' : 'Aprobar solicitud'}
                            </button>
                        </form>
                    </div>

                    <div className="fin-card">
                        <h3 className="text-lg font-semibold text-red-700 inline-flex items-center gap-2">
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
                                    className="fin-input mt-1"
                                />
                                {rechazarForm.errors.motivo_rechazo && <p className="text-xs text-red-600 mt-1">{rechazarForm.errors.motivo_rechazo}</p>}
                                {rechazarForm.errors.security && <p className="text-xs text-red-600 mt-1">{rechazarForm.errors.security}</p>}
                            </div>

                            <button type="submit" disabled={rechazarForm.processing} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700">
                                {rechazarForm.processing ? 'Rechazando...' : 'Rechazar solicitud'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
