import React, { useMemo, useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, useForm } from '@inertiajs/react';
import MapaUbicacion from '@/Components/MapaUbicacion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileCirclePlus,
    faLocationDot,
    faTriangleExclamation,
    faArrowLeft,
    faArrowRight,
    faFloppyDisk,
    faPaperPlane,
    faPlus,
    faTrash,
    faCircleInfo,
    faUser,
    faCarSide,
    faCamera,
    faFileUpload,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

// Componentes de pestañas
const TabButton = ({ active, index, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center w-full gap-2 px-3 py-3 text-sm font-medium text-center transition-colors rounded-xl ${active
            ? 'text-blue-700 bg-blue-50 border border-blue-200'
            : 'text-gray-600 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50'
            }`}
    >
        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {index + 1}
        </span>
        {children}
    </button>
);

export default function Create({ sucursal, usuario, solicitud, formData, isEditing = false }) {
    const [activeTab, setActiveTab] = useState(0);

    const fieldTabMap = useMemo(() => ({
        primer_nombre: 0, segundo_nombre: 0, apellido_paterno: 0, apellido_materno: 0,
        sexo: 0, fecha_nacimiento: 0, curp: 0, rfc: 0, telefono_personal: 0, telefono_celular: 0, correo_electronico: 0,
        calle: 2, numero_exterior: 2, numero_interior: 2, colonia: 2, ciudad: 2, estado: 2, codigo_postal: 2, latitud: 2, longitud: 2,
        afiliaciones: 3, vehiculos: 4,
        ine_frente: 5, ine_reverso: 5, comprobante_domicilio: 5, reporte_buro: 5,
    }), []);

    const comprimirImagen = (file, maxDimension = 1600, quality = 0.82) => new Promise((resolve) => {
        if (!file || !file.type?.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                if (width > height && width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else if (height >= width && height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                if (!context) {
                    resolve(file);
                    return;
                }

                context.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }

                    const nombreBase = (file.name || 'imagen').replace(/\.[^/.]+$/, '');
                    resolve(new File([blob], `${nombreBase}.jpg`, { type: 'image/jpeg' }));
                }, 'image/jpeg', quality);
            };

            img.onerror = () => resolve(file);
            img.src = event.target?.result;
        };

        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });

    const parseMaybeJson = (value, fallback) => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }

        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return fallback;
            }
        }

        return value;
    };

    const initialData = useMemo(() => ({
        primer_nombre: formData?.primer_nombre ?? '',
        segundo_nombre: formData?.segundo_nombre ?? '',
        apellido_paterno: formData?.apellido_paterno ?? '',
        apellido_materno: formData?.apellido_materno ?? '',
        sexo: formData?.sexo ?? '',
        fecha_nacimiento: formData?.fecha_nacimiento ?? '',
        curp: formData?.curp ?? '',
        rfc: formData?.rfc ?? '',
        telefono_personal: formData?.telefono_personal ?? '',
        telefono_celular: formData?.telefono_celular ?? '',
        correo_electronico: formData?.correo_electronico ?? '',
        limite_credito_solicitado: 0,
        familiares: parseMaybeJson(formData?.familiares, {
            conyuge: {
                nombre: '',
                telefono: '',
                ocupacion: ''
            },
            hijos: [],
            padres: {
                madre: { nombre: '', telefono: '' },
                padre: { nombre: '', telefono: '' }
            }
        }),
        calle: formData?.calle ?? '',
        numero_exterior: formData?.numero_exterior ?? '',
        numero_interior: formData?.numero_interior ?? '',
        colonia: formData?.colonia ?? '',
        ciudad: formData?.ciudad ?? '',
        estado: formData?.estado ?? '',
        codigo_postal: formData?.codigo_postal ?? '',
        latitud: formData?.latitud ?? null,
        longitud: formData?.longitud ?? null,
        afiliaciones: parseMaybeJson(formData?.afiliaciones, []),
        vehiculos: parseMaybeJson(formData?.vehiculos, []),
        observaciones: formData?.observaciones ?? '',
        ine_frente: null,
        ine_reverso: null,
        comprobante_domicilio: null,
        reporte_buro: null,
        ine_frente_path: formData?.ine_frente_path ?? null,
        ine_reverso_path: formData?.ine_reverso_path ?? null,
        comprobante_domicilio_path: formData?.comprobante_domicilio_path ?? null,
        reporte_buro_path: formData?.reporte_buro_path ?? null,
    }), [formData]);

    // Configuración del formulario
    const { data, setData, post, put, processing, errors } = useForm({
        ...initialData
    });

    const handleDocumentoChange = async (field, file, optimizar = true) => {
        if (!file) {
            setData(field, null);
            return;
        }

        const archivoFinal = optimizar ? await comprimirImagen(file) : file;
        setData(field, archivoFinal);
    };

    // Manejadores para cada pestaña
    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEditing && solicitud) {
            put(route('coordinador.solicitudes.update', solicitud.id), {
                forceFormData: true,
                onError: (submitErrors) => {
                    const firstErrorKey = Object.keys(submitErrors || {})[0];
                    const errorTab = fieldTabMap[firstErrorKey];
                    if (typeof errorTab === 'number') {
                        setActiveTab(errorTab);
                    }
                }
            });
        } else {
            post(route('coordinador.solicitudes.store'), {
                forceFormData: true,
                onError: (submitErrors) => {
                    const firstErrorKey = Object.keys(submitErrors || {})[0];
                    const errorTab = fieldTabMap[firstErrorKey];
                    if (typeof errorTab === 'number') {
                        setActiveTab(errorTab);
                    }
                }
            });
        }
    };

    // Funciones helpers
    const addHijo = () => {
        setData('familiares', {
            ...data.familiares,
            hijos: [
                ...data.familiares.hijos,
                { nombre: '', edad: '', telefono: '', ocupacion: '' }
            ]
        });
    };

    const removeHijo = (index) => {
        const nuevosHijos = [...data.familiares.hijos];
        nuevosHijos.splice(index, 1);
        setData('familiares', {
            ...data.familiares,
            hijos: nuevosHijos
        });
    };

    const updateHijo = (index, field, value) => {
        const nuevosHijos = [...data.familiares.hijos];
        nuevosHijos[index][field] = value;
        setData('familiares', {
            ...data.familiares,
            hijos: nuevosHijos
        });
    };

    const updateFamiliares = (updater) => {
        setData('familiares', updater(data.familiares));
    };

    const addAfiliacion = () => {
        setData('afiliaciones', [
            ...data.afiliaciones,
            { empresa: '', antiguedad: '', limite_credito: '' }
        ]);
    };

    const removeAfiliacion = (index) => {
        const nuevas = [...data.afiliaciones];
        nuevas.splice(index, 1);
        setData('afiliaciones', nuevas);
    };

    const addVehiculo = () => {
        setData('vehiculos', [
            ...data.vehiculos,
            { marca: '', modelo: '', placas: '', anio: '' }
        ]);
    };

    const removeVehiculo = (index) => {
        const nuevos = [...data.vehiculos];
        nuevos.splice(index, 1);
        setData('vehiculos', nuevos);
    };

    const tabs = [
        { name: 'Datos Personales', component: DatosPersonalesTab },
        { name: 'Datos Familiares', component: DatosFamiliaresTab },
        { name: 'Domicilio', component: DomicilioTab },
        { name: 'Referencias', component: ReferenciasTab },
        { name: 'Vehículos', component: VehiculosTab },
        { name: 'Documentos y Finalizar', component: FinalizarTab }
    ];

    const ActiveTabComponent = tabs[activeTab].component;

    const handleFormKeyDown = (e) => {
        if (activeTab !== tabs.length - 1) {
            return;
        }

        if (e.key !== 'Enter') {
            return;
        }

        const target = e.target;
        if (target?.tagName === 'TEXTAREA') {
            return;
        }

        e.preventDefault();
    };

    return (
        <TabletLayout title="Nueva Solicitud">
            <Head title="Nueva Solicitud" />

            <div className="max-w-6xl mx-auto tablet-form">
                <div className="mb-4 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between md:p-5">
                        <div className="flex items-start gap-3">
                            <div className="inline-flex items-center justify-center text-blue-600 w-11 h-11 rounded-xl bg-blue-50">
                                <FontAwesomeIcon icon={faFileCirclePlus} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {isEditing ? 'Editar Solicitud' : 'Nueva Pre-solicitud'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">Completa todos los campos requeridos</p>
                                <p className="mt-2 text-xs text-gray-500">
                                    Sucursal: <span className="font-medium text-gray-700">{sucursal?.nombre || 'No asignada'}</span> ·
                                    Coordinador: <span className="font-medium text-gray-700">{usuario?.persona?.primer_nombre} {usuario?.persona?.apellido_paterno}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky z-20 mb-4 border border-gray-200 shadow-sm top-3 rounded-2xl bg-white/95 backdrop-blur">
                    <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-3 lg:grid-cols-6">
                        {tabs.map((tab, index) => (
                            <TabButton
                                key={index}
                                index={index}
                                active={activeTab === index}
                                onClick={() => setActiveTab(index)}
                            >
                                {tab.name}
                            </TabButton>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                            style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">Paso {activeTab + 1} de {tabs.length}</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="overflow-hidden bg-white border border-gray-200 shadow-sm tablet-panel rounded-2xl">
                    {errors.error && (
                        <div className="p-3 mx-4 mt-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                            {errors.error}
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && !errors.error && (
                        <div className="p-3 mx-4 mt-4 text-sm text-yellow-800 border border-yellow-200 rounded-xl bg-yellow-50">
                            Hay campos pendientes o con formato incorrecto. Te llevamos automáticamente a la pestaña con el primer error.
                        </div>
                    )}

                    <ActiveTabComponent
                        data={data}
                        setData={setData}
                        updateFamiliares={updateFamiliares}
                        errors={errors}
                        addHijo={addHijo}
                        removeHijo={removeHijo}
                        updateHijo={updateHijo}
                        addAfiliacion={addAfiliacion}
                        removeAfiliacion={removeAfiliacion}
                        addVehiculo={addVehiculo}
                        removeVehiculo={removeVehiculo}
                        handleDocumentoChange={handleDocumentoChange}
                        isEditing={isEditing}
                    />

                    {/* Botones de navegación */}
                    <div className="flex flex-col gap-3 p-4 border-t border-gray-200 md:flex-row md:items-center md:justify-between">
                        <button
                            type="button"
                            onClick={() => setActiveTab(activeTab - 1)}
                            disabled={activeTab === 0}
                            className={`px-4 py-3 text-sm font-medium rounded-xl md:py-2 ${activeTab === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Anterior
                            </span>
                        </button>

                        {activeTab < tabs.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab(activeTab + 1)}
                                className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 md:py-2"
                            >
                                <span className="inline-flex items-center gap-2">
                                    Siguiente
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 md:py-2"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FontAwesomeIcon icon={processing ? faCircleInfo : (isEditing ? faFloppyDisk : faPaperPlane)} className={processing ? 'animate-pulse' : ''} />
                                    {processing ? 'Guardando...' : (isEditing ? 'Actualizar Solicitud' : 'Finalizar Solicitud')}
                                </span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </TabletLayout>
    );
}

// ============================================
// PESTAÑA 0: DATOS PERSONALES
// ============================================
function DatosPersonalesTab({ data, setData, errors }) {
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Datos Personales del Interesado</h2>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Primer Nombre <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.primer_nombre}
                        onChange={e => setData('primer_nombre', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.primer_nombre && <p className="text-xs text-red-600">{errors.primer_nombre}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Segundo Nombre</label>
                    <input
                        type="text"
                        value={data.segundo_nombre}
                        onChange={e => setData('segundo_nombre', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido Paterno <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.apellido_paterno}
                        onChange={e => setData('apellido_paterno', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.apellido_paterno && <p className="text-xs text-red-600">{errors.apellido_paterno}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido Materno <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.apellido_materno}
                        onChange={e => setData('apellido_materno', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.apellido_materno && <p className="text-xs text-red-600">{errors.apellido_materno}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Sexo <span className="text-red-600">*</span></label>
                    <select
                        value={data.sexo}
                        onChange={e => setData('sexo', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="OTRO">Otro</option>
                    </select>
                    {errors.sexo && <p className="text-xs text-red-600">{errors.sexo}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento <span className="text-red-600">*</span></label>
                    <input
                        type="date"
                        value={data.fecha_nacimiento}
                        onChange={e => setData('fecha_nacimiento', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.fecha_nacimiento && <p className="text-xs text-red-600">{errors.fecha_nacimiento}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">CURP <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.curp}
                        onChange={e => setData('curp', e.target.value.toUpperCase())}
                        maxLength="18"
                        className="w-full px-3 py-2 mt-1 uppercase border border-gray-300 rounded-md"
                    />
                    {errors.curp && <p className="text-xs text-red-600">{errors.curp}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">RFC <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.rfc}
                        onChange={e => setData('rfc', e.target.value.toUpperCase())}
                        maxLength="13"
                        className="w-full px-3 py-2 mt-1 uppercase border border-gray-300 rounded-md"
                    />
                    {errors.rfc && <p className="text-xs text-red-600">{errors.rfc}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono Personal</label>
                    <input
                        type="tel"
                        value={data.telefono_personal}
                        onChange={e => setData('telefono_personal', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono Celular <span className="text-red-600">*</span></label>
                    <input
                        type="tel"
                        value={data.telefono_celular}
                        onChange={e => setData('telefono_celular', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.telefono_celular && <p className="text-xs text-red-600">{errors.telefono_celular}</p>}
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input
                        type="email"
                        value={data.correo_electronico}
                        onChange={e => setData('correo_electronico', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================
// PESTAÑA 1: DATOS FAMILIARES
// ============================================
function DatosFamiliaresTab({ data, updateFamiliares, addHijo, removeHijo, updateHijo }) {
    return (
        <div className="p-4 space-y-6">
            <h2 className="text-lg font-semibold">Datos Familiares</h2>

            {/* Cónyuge */}
            <div className="p-3 border rounded-lg">
                <h3 className="mb-2 font-medium">Cónyuge / Pareja</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600">Nombre Completo</label>
                        <input
                            type="text"
                            value={data.familiares.conyuge.nombre}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                conyuge: {
                                    ...prev.conyuge,
                                    nombre: e.target.value
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">Teléfono</label>
                        <input
                            type="tel"
                            value={data.familiares.conyuge.telefono}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                conyuge: {
                                    ...prev.conyuge,
                                    telefono: e.target.value
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-600">Ocupación</label>
                        <input
                            type="text"
                            value={data.familiares.conyuge.ocupacion}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                conyuge: {
                                    ...prev.conyuge,
                                    ocupacion: e.target.value
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Padres */}
            <div className="p-3 border rounded-lg">
                <h3 className="mb-2 font-medium">Padres</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600">Madre</label>
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={data.familiares.padres.madre.nombre}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                padres: {
                                    ...prev.padres,
                                    madre: {
                                        ...prev.padres.madre,
                                        nombre: e.target.value
                                    }
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        <input
                            type="tel"
                            placeholder="Teléfono"
                            value={data.familiares.padres.madre.telefono}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                padres: {
                                    ...prev.padres,
                                    madre: {
                                        ...prev.padres.madre,
                                        telefono: e.target.value
                                    }
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">Padre</label>
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={data.familiares.padres.padre.nombre}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                padres: {
                                    ...prev.padres,
                                    padre: {
                                        ...prev.padres.padre,
                                        nombre: e.target.value
                                    }
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        <input
                            type="tel"
                            placeholder="Teléfono"
                            value={data.familiares.padres.padre.telefono}
                            onChange={e => updateFamiliares((prev) => ({
                                ...prev,
                                padres: {
                                    ...prev.padres,
                                    padre: {
                                        ...prev.padres.padre,
                                        telefono: e.target.value
                                    }
                                }
                            }))}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Hijos */}
            <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Hijos</h3>
                    <button
                        type="button"
                        onClick={addHijo}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Agregar Hijo
                    </button>
                </div>

                {data.familiares.hijos.length === 0 ? (
                    <p className="py-2 text-sm text-center text-gray-400">No hay hijos registrados</p>
                ) : (
                    data.familiares.hijos.map((hijo, index) => (
                        <div key={index} className="pt-2 mt-2 border-t">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Hijo {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeHijo(index)}
                                    className="text-xs text-red-600"
                                >
                                    Eliminar
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={hijo.nombre}
                                    onChange={e => updateHijo(index, 'nombre', e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <input
                                    type="number"
                                    placeholder="Edad"
                                    value={hijo.edad}
                                    onChange={e => updateHijo(index, 'edad', e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono"
                                    value={hijo.telefono}
                                    onChange={e => updateHijo(index, 'telefono', e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Ocupación"
                                    value={hijo.ocupacion}
                                    onChange={e => updateHijo(index, 'ocupacion', e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// PESTAÑA 2: DOMICILIO CON MAPA INTERACTIVO
// ============================================
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

async function geocodeGoogleMaps(direccionCompleta) {
    if (!direccionCompleta) return null;

    const params = new URLSearchParams({
        address: direccionCompleta,
        key: GOOGLE_MAPS_API_KEY,
        region: 'mx' // Obliga a Google a dar prioridad a resultados en México
    });

    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        }
        return null;
    } catch (error) {
        console.error("Error con Google Geocoding:", error);
        return null;
    }
}

function normalize(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function DomicilioTab({ data, setData, errors }) {
    const [sincronizandoMapa, setSincronizandoMapa] = useState(false);
    const [mensajeMapa, setMensajeMapa] = useState('');
    
    const [buscandoCp, setBuscandoCp] = useState(false);
    const [coloniasDisponibles, setColoniasDisponibles] = useState([]);

    const handlePositionChange = (position) => {
        setData('latitud', position.lat);
        setData('longitud', position.lng);
    };

    const buscarPorCP = async (cpStr) => {
        if (cpStr.length !== 5) return;
        
        setBuscandoCp(true);
        try {
            const res = await fetch(`https://blackisp.tech/api/cp/get/${cpStr}`);
            if (!res.ok) throw new Error('CP no encontrado');
            
            const info = await res.json();

            setData(prev => ({
                ...prev,
                estado: info.estado,
                ciudad: info.municipio,
                colonia: info.colonias[0] || '' 
            }));
            setColoniasDisponibles(info.colonias);
        } catch (error) {
            console.log("No se pudo obtener el CP de la API pública.");
            setColoniasDisponibles([]);
        } finally {
            setBuscandoCp(false);
        }
    };

    const handleCpChange = (e) => {
        const cp = e.target.value.replace(/\D/g, ''); 
        setData('codigo_postal', cp);
        
        if (cp.length === 5) {
            buscarPorCP(cp);
        } else {
            setColoniasDisponibles([]); 
        }
    };

    const buscarUbicacionEnMapa = async () => {
        const calle = normalize(data.calle);
        const numero = normalize(data.numero_exterior);
        const colonia = normalize(data.colonia);
        const ciudad = normalize(data.ciudad);
        const estado = normalize(data.estado);

        if (!estado || !ciudad) {
            setMensajeMapa('Completa al menos ciudad y estado para ubicar en mapa.');
            return;
        }

        try {
            setSincronizandoMapa(true);
            setMensajeMapa('');

            const direccionCompleta = `${calle} ${numero}, ${colonia}, ${ciudad}, ${estado}, Mexico`;
            const resultado = await geocodeGoogleMaps(direccionCompleta);

            if (!resultado) {
                setMensajeMapa('No se pudo ubicar esa direccion. Revisa los datos e intenta de nuevo.');
                return;
            }

            setData('latitud', resultado.lat);
            setData('longitud', resultado.lng);
            setMensajeMapa('¡Ubicación localizada con Google Maps! Mueve el pin para ajuste fino.');

        } catch (error) {
            console.error('Error al buscar ubicacion en mapa:', error);
            setMensajeMapa('Ocurrio un error al buscar la ubicacion. Intenta nuevamente.');
        } finally {
            setSincronizandoMapa(false);
        }
    };

    const initialPosition = useMemo(() => {
        const tieneLat = data.latitud !== null && data.latitud !== '';
        const tieneLng = data.longitud !== null && data.longitud !== '';
        if (!tieneLat || !tieneLng) return null;

        const lat = parseFloat(data.latitud);
        const lng = parseFloat(data.longitud);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return [lat, lng];
    }, [data.latitud, data.longitud]);

    return (
        <div className="p-4 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FontAwesomeIcon icon={faLocationDot} className="text-blue-600" />
                Domicilio
            </h2>
            <p className="text-xs text-gray-500">
                Teclea el Código Postal para autocompletar el Estado y Municipio.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Código Postal <span className="text-red-600">*</span>
                        {buscandoCp && <span className="ml-2 text-xs font-bold text-blue-600 animate-pulse">Buscando...</span>}
                    </label>
                    <input
                        type="text"
                        value={data.codigo_postal}
                        onChange={handleCpChange}
                        maxLength="5"
                        placeholder="Ej. 27000"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.codigo_postal && <p className="text-xs text-red-600">{errors.codigo_postal}</p>}
                </div>

                <div className="hidden md:block"></div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Estado <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.estado}
                        onChange={e => setData('estado', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-gray-50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Municipio / Ciudad <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.ciudad}
                        onChange={e => setData('ciudad', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-gray-50"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Colonia <span className="text-red-600">*</span></label>
                    {coloniasDisponibles.length > 0 ? (
                        <select
                            value={data.colonia}
                            onChange={e => setData('colonia', e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-blue-50"
                        >
                            {coloniasDisponibles.map((col, idx) => (
                                <option key={idx} value={col}>{col}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={data.colonia}
                            onChange={e => setData('colonia', e.target.value)}
                            placeholder="Escribe la colonia..."
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    )}
                    {errors.colonia && <p className="text-xs text-red-600">{errors.colonia}</p>}
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Calle <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.calle}
                        onChange={e => setData('calle', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.calle && <p className="text-xs text-red-600">{errors.calle}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Número Exterior <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.numero_exterior}
                        onChange={e => setData('numero_exterior', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Número Interior</label>
                    <input
                        type="text"
                        value={data.numero_interior}
                        onChange={e => setData('numero_interior', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="col-span-2 pt-2">
                    <button
                        type="button"
                        onClick={buscarUbicacionEnMapa}
                        disabled={sincronizandoMapa}
                        className="w-full px-4 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {sincronizandoMapa ? 'Buscando con Google...' : 'Ubicar dirección exacta en el mapa'}
                    </button>
                    {mensajeMapa && <p className="mt-2 text-xs font-medium text-green-700">{mensajeMapa}</p>}
                </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="mb-2 text-sm text-gray-600">
                    Mueve el pin en caso de que la ubicación automática necesite un ajuste fino.
                </p>
                <div className="max-w-4xl mx-auto rounded-lg overflow-hidden border border-gray-300">
                    <MapaUbicacion
                        initialPosition={initialPosition}
                        onPositionChange={handlePositionChange}
                        height="300px"
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================
// PESTAÑA 3: REFERENCIAS LABORALES
// ============================================
function ReferenciasTab({ data, setData, addAfiliacion, removeAfiliacion }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Referencias Laborales / Afiliaciones</h2>
                <button
                    type="button"
                    onClick={addAfiliacion}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Agregar
                </button>
            </div>

            {data.afiliaciones.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No hay referencias laborales registradas</p>
            ) : (
                data.afiliaciones.map((afiliacion, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">Referencia {index + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeAfiliacion(index)}
                                className="inline-flex items-center gap-1 text-xs text-red-600"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                Eliminar
                            </button>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Nombre de la empresa"
                                value={afiliacion.empresa}
                                onChange={e => {
                                    const nuevas = [...data.afiliaciones];
                                    nuevas[index].empresa = e.target.value;
                                    setData('afiliaciones', nuevas);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Antigüedad (meses)"
                                    value={afiliacion.antiguedad}
                                    onChange={e => {
                                        const nuevas = [...data.afiliaciones];
                                        nuevas[index].antiguedad = e.target.value;
                                        setData('afiliaciones', nuevas);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <input
                                    type="number"
                                    placeholder="Límite de crédito"
                                    value={afiliacion.limite_credito}
                                    onChange={e => {
                                        const nuevas = [...data.afiliaciones];
                                        nuevas[index].limite_credito = e.target.value;
                                        setData('afiliaciones', nuevas);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ============================================
// PESTAÑA 4: VEHÍCULOS
// ============================================
function VehiculosTab({ data, setData, addVehiculo, removeVehiculo }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Vehículos</h2>
                <button
                    type="button"
                    onClick={addVehiculo}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md"
                >
                    <FontAwesomeIcon icon={faCarSide} />
                    Agregar Vehículo
                </button>
            </div>

            {data.vehiculos.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No hay vehículos registrados</p>
            ) : (
                data.vehiculos.map((vehiculo, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">Vehículo {index + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeVehiculo(index)}
                                className="inline-flex items-center gap-1 text-xs text-red-600"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                Eliminar
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Marca"
                                value={vehiculo.marca}
                                onChange={e => {
                                    const nuevos = [...data.vehiculos];
                                    nuevos[index].marca = e.target.value;
                                    setData('vehiculos', nuevos);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Modelo"
                                value={vehiculo.modelo}
                                onChange={e => {
                                    const nuevos = [...data.vehiculos];
                                    nuevos[index].modelo = e.target.value;
                                    setData('vehiculos', nuevos);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Placas"
                                value={vehiculo.placas}
                                onChange={e => {
                                    const nuevos = [...data.vehiculos];
                                    nuevos[index].placas = e.target.value;
                                    setData('vehiculos', nuevos);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Año"
                                value={vehiculo.anio}
                                onChange={e => {
                                    const nuevos = [...data.vehiculos];
                                    nuevos[index].anio = e.target.value;
                                    setData('vehiculos', nuevos);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ============================================
// PESTAÑA 5: FINALIZAR
// ============================================
function FinalizarTab({ data, errors, handleDocumentoChange, isEditing }) {

    // Componente interno reutilizable para cada caja de documento
    const DocumentCard = ({ id, label, accept, capture, fieldName, error, path, file }) => {
        const hasFile = file || (isEditing && path);
        const fileName = file?.name || (isEditing && path ? 'Archivo guardado previamente' : 'Captura pendiente.');

        return (
            <div className={`p-4 rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-blue-100 bg-blue-50/30'}`}>
                <label className="block mb-3 text-sm font-semibold text-gray-800">
                    {label} <span className="text-red-600">*</span>
                </label>
                
                <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium transition-colors bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 text-gray-700">
                        <FontAwesomeIcon icon={faCamera} className="text-lg" />
                        Tomar Foto
                        <input
                            type="file"
                            accept="image/*"
                            capture={capture}
                            className="hidden" 
                            onChange={(e) => handleDocumentoChange(fieldName, e.target.files?.[0], true)}
                        />
                    </label>

                    <label className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium transition-colors bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 text-gray-700">
                        <FontAwesomeIcon icon={faFileUpload} className="text-lg" />
                        Subir Archivo
                        <input
                            type="file"
                            accept={accept}
                            className="hidden" 
                            onChange={(e) => handleDocumentoChange(fieldName, e.target.files?.[0], true)}
                        />
                    </label>
                </div>

                <div className="mt-3 text-xs">
                    {hasFile ? (
                        <span className="flex items-center gap-1 font-medium text-green-700">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Listo: <span className="truncate max-w-[150px] inline-block align-bottom">{fileName}</span>
                        </span>
                    ) : (
                        <span className="text-gray-500">{fileName}</span>
                    )}
                </div>
                
                {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Finalizar Solicitud</h2>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="mb-4 text-sm font-semibold text-gray-800">Documentos obligatorios</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <DocumentCard
                        id="ine_frente"
                        fieldName="ine_frente"
                        label="INE frente"
                        accept="image/*"
                        capture="environment"
                        error={errors.ine_frente}
                        path={data.ine_frente_path}
                        file={data.ine_frente}
                    />

                    <DocumentCard
                        id="ine_reverso"
                        fieldName="ine_reverso"
                        label="INE reverso"
                        accept="image/*"
                        capture="environment"
                        error={errors.ine_reverso}
                        path={data.ine_reverso_path}
                        file={data.ine_reverso}
                    />

                    <DocumentCard
                        id="comprobante_domicilio"
                        fieldName="comprobante_domicilio"
                        label="Comprobante de domicilio"
                        accept="image/*,.pdf"
                        error={errors.comprobante_domicilio}
                        path={data.comprobante_domicilio_path}
                        file={data.comprobante_domicilio}
                    />

                    <DocumentCard
                        id="reporte_buro"
                        fieldName="reporte_buro"
                        label="Reporte de buró"
                        accept="image/*,.pdf"
                        error={errors.reporte_buro}
                        path={data.reporte_buro_path}
                        file={data.reporte_buro}
                    />
                </div>

                <p className="mt-4 text-xs text-gray-500">
                    Las imágenes se optimizan automáticamente antes del envío para reducir uso de datos en tablet.
                </p>
            </div>

            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="mb-2 font-medium text-blue-800">Resumen de la solicitud</h3>
                <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Solicitante:</span> {data.primer_nombre} {data.apellido_paterno}</p>
                    <p><span className="font-medium">CURP:</span> {data.curp || 'No registrado'}</p>
                    <p><span className="font-medium">Teléfono:</span> {data.telefono_celular}</p>
                    <p><span className="font-medium">Domicilio:</span> {data.calle} {data.numero_exterior}, {data.colonia}</p>
                    <p><span className="font-medium">Categoría inicial:</span> Cobre (3%)</p>
                    <p><span className="font-medium">Límite crédito:</span> Se define en Gerencia</p>
                    <p><span className="font-medium">Vehículos:</span> {data.vehiculos.length}</p>
                    <p><span className="font-medium">Referencias:</span> {data.afiliaciones.length}</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones adicionales</label>
                <textarea
                    rows="4"
                    value={data.observaciones}
                    onChange={e => setData('observaciones', e.target.value)}
                    placeholder="Agrega cualquier observación importante sobre el prospecto..."
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                />
            </div>

            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="flex items-start gap-2 text-sm text-yellow-800">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                    <span>
                        Al finalizar, la solicitud será enviada al Verificador para su análisis.
                        Asegúrate de que todos los campos obligatorios estén completos.
                    </span>
                </p>
            </div>
        </div>
    );
}