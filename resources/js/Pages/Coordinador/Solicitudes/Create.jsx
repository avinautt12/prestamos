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
} from '@fortawesome/free-solid-svg-icons';


// Componentes de pestañas
const TabButton = ({ active, index, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-center transition-colors rounded-lg ${active
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
        primer_nombre: 0,
        segundo_nombre: 0,
        apellido_paterno: 0,
        apellido_materno: 0,
        sexo: 0,
        fecha_nacimiento: 0,
        curp: 0,
        rfc: 0,
        telefono_personal: 0,
        telefono_celular: 0,
        correo_electronico: 0,
        calle: 2,
        numero_exterior: 2,
        numero_interior: 2,
        colonia: 2,
        ciudad: 2,
        estado: 2,
        codigo_postal: 2,
        latitud: 2,
        longitud: 2,
        afiliaciones: 3,
        vehiculos: 4,
        ine_frente: 5,
        ine_reverso: 5,
        comprobante_domicilio: 5,
        reporte_buro: 5,
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
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileCirclePlus} className="text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Editar Solicitud' : 'Nueva Pre-solicitud'}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500">Completa todos los campos requeridos</p>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-4 md:grid-cols-3 lg:grid-cols-6">
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
                <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="tablet-panel">
                    {errors.error && (
                        <div className="p-3 mx-4 mt-4 text-sm text-red-700 border border-red-200 rounded-md bg-red-50">
                            {errors.error}
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && !errors.error && (
                        <div className="p-3 mx-4 mt-4 text-sm text-yellow-800 border border-yellow-200 rounded-md bg-yellow-50">
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
                    <div className="flex justify-between p-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab(activeTab - 1)}
                            disabled={activeTab === 0}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 0
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
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
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
async function geocodeEstructurado({ street = '', city = '', state = '' }) {
    const streetValue = normalize(street);
    const cityValue = normalize(city);
    const stateValue = normalize(state);

    if (!cityValue && !stateValue && !streetValue) {
        return null;
    }

    const params = new URLSearchParams({
        format: 'json',
        country: 'Mexico',
        limit: '1',
        addressdetails: '1',
    });

    if (streetValue) params.set('street', streetValue);
    if (cityValue) params.set('city', cityValue);
    if (stateValue) params.set('state', stateValue);

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const resultados = await response.json();

    if (!Array.isArray(resultados) || resultados.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(resultados[0].lat),
        lng: parseFloat(resultados[0].lon),
    };
}

async function geocodeAproximadoPorColonia({ colonia = '', ciudad = '', estado = '' }) {
    const q = normalize(`${colonia}, ${ciudad}, ${estado}, Mexico`);
    if (!q) {
        return null;
    }

    const params = new URLSearchParams({
        format: 'json',
        q,
        limit: '1',
        countrycodes: 'mx',
        addressdetails: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const resultados = await response.json();

    if (!Array.isArray(resultados) || resultados.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(resultados[0].lat),
        lng: parseFloat(resultados[0].lon),
    };
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

    const handlePositionChange = (position) => {
        setData('latitud', position.lat);
        setData('longitud', position.lng);
    };

    const buscarUbicacionEnMapa = async () => {
        const calle = normalize(data.calle);
        const numero = normalize(data.numero_exterior);
        const colonia = normalize(data.colonia);
        const ciudad = normalize(data.ciudad);
        const estado = normalize(data.estado);

        const intentos = [
            {
                nombre: 'intento 1',
                payload: { street: `${calle} ${numero}`, city: ciudad, state: estado },
            },
            {
                nombre: 'intento 2',
                payload: { street: calle, city: ciudad, state: estado },
            },
            {
                nombre: 'intento 3',
                payload: { city: ciudad, state: estado },
            },
        ];

        if (!estado || !ciudad) {
            setMensajeMapa('Completa al menos ciudad y estado para ubicar en mapa.');
            return;
        }

        try {
            setSincronizandoMapa(true);
            setMensajeMapa('');

            let resultado = null;
            let intentoExitoso = '';

            for (const intento of intentos) {
                const r = await geocodeEstructurado(intento.payload);
                if (r && Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
                    resultado = r;
                    intentoExitoso = intento.nombre;
                    break;
                }
            }

            if (!resultado && colonia) {
                const aproximado = await geocodeAproximadoPorColonia({ colonia, ciudad, estado });
                if (aproximado && Number.isFinite(aproximado.lat) && Number.isFinite(aproximado.lng)) {
                    resultado = aproximado;
                    intentoExitoso = 'fallback aproximado por colonia';
                }
            }

            if (!resultado || !Number.isFinite(resultado.lat) || !Number.isFinite(resultado.lng)) {
                setMensajeMapa('No se pudo ubicar esa direccion. Revisa los datos y vuelve a intentar.');
                return;
            }

            setData('latitud', resultado.lat);
            setData('longitud', resultado.lng);
            const esAproximado = intentoExitoso.includes('aproximado');
            setMensajeMapa(
                esAproximado
                    ? `Ubicacion localizada (${intentoExitoso}). Es una aproximacion; ajusta el pin manualmente para precision.`
                    : `Ubicacion localizada en mapa (${intentoExitoso}). Puedes mover el pin para ajustar con precision.`
            );
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
                Primero captura la direccion manualmente.
                Luego ubica en el mapa y ajusta solo latitud/longitud con el pin.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Estado <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.estado}
                        onChange={e => setData('estado', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Municipio / Ciudad <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.ciudad}
                        onChange={e => setData('ciudad', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Colonia <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.colonia}
                        onChange={e => setData('colonia', e.target.value)}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
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

                <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={data.codigo_postal}
                        onChange={e => setData('codigo_postal', e.target.value)}
                        maxLength="5"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                    {errors.codigo_postal && <p className="text-xs text-red-600">{errors.codigo_postal}</p>}
                </div>

                <div className="col-span-2">
                    <button
                        type="button"
                        onClick={buscarUbicacionEnMapa}
                        disabled={sincronizandoMapa}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {sincronizandoMapa ? 'Buscando ubicacion...' : 'Ubicar direccion en el mapa'}
                    </button>
                    {mensajeMapa && <p className="mt-2 text-xs text-gray-600">{mensajeMapa}</p>}
                </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="mb-2 text-sm text-gray-600">
                    Este mapa solo sirve para corroborar y ajustar el punto exacto del domicilio.
                    Mover el pin no cambia la direccion escrita; solo actualiza latitud y longitud internas.
                </p>
                <div className="max-w-4xl mx-auto">
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
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Finalizar Solicitud</h2>

            <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Documentos obligatorios</h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">INE frente <span className="text-red-600">*</span></label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDocumentoChange('ine_frente', e.target.files?.[0], true)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        {isEditing && data.ine_frente_path && !data.ine_frente && (
                            <p className="mt-1 text-xs text-gray-500">Ya cargado previamente</p>
                        )}
                        {errors.ine_frente && <p className="mt-1 text-xs text-red-600">{errors.ine_frente}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">INE reverso <span className="text-red-600">*</span></label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDocumentoChange('ine_reverso', e.target.files?.[0], true)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        {isEditing && data.ine_reverso_path && !data.ine_reverso && (
                            <p className="mt-1 text-xs text-gray-500">Ya cargado previamente</p>
                        )}
                        {errors.ine_reverso && <p className="mt-1 text-xs text-red-600">{errors.ine_reverso}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Comprobante de domicilio <span className="text-red-600">*</span></label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentoChange('comprobante_domicilio', e.target.files?.[0], true)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        {isEditing && data.comprobante_domicilio_path && !data.comprobante_domicilio && (
                            <p className="mt-1 text-xs text-gray-500">Ya cargado previamente</p>
                        )}
                        {errors.comprobante_domicilio && <p className="mt-1 text-xs text-red-600">{errors.comprobante_domicilio}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reporte de buró <span className="text-red-600">*</span></label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentoChange('reporte_buro', e.target.files?.[0], true)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        {isEditing && data.reporte_buro_path && !data.reporte_buro && (
                            <p className="mt-1 text-xs text-gray-500">Ya cargado previamente</p>
                        )}
                        {errors.reporte_buro && <p className="mt-1 text-xs text-red-600">{errors.reporte_buro}</p>}
                    </div>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                    Las imágenes se optimizan automáticamente antes del envío para reducir uso de datos en tablet.
                </p>
            </div>

            {/* Resumen existente */}
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
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
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