import React, { useMemo, useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, useForm } from '@inertiajs/react';
import MapaUbicacion from '@/Components/MapaUbicacion';
import FormInput from '@/Components/FormInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileCirclePlus, faLocationDot, faTriangleExclamation, faArrowLeft,
    faArrowRight, faFloppyDisk, faPaperPlane, faPlus, faTrash, faCircleInfo,
    faCarSide, faCamera, faFileUpload, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

<<<<<<< Updated upstream
// ============================================
// FUNCIONES DE FORMATEO (Buenas Prácticas UX)
// ============================================
const formatName = (val) => val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
const formatPhone = (val) => val.replace(/\D/g, '');
const formatAlphanumeric = (val) => val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

// ============================================
// COMPONENTES UI REUTILIZABLES
// ============================================
const TabButton = ({ active, index, onClick, hasError, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center w-full gap-2 px-3 py-3 text-sm font-medium text-center transition-colors rounded-xl ${active
            ? 'text-blue-700 bg-blue-50 border border-blue-200'
            : (hasError 
                ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100' 
                : 'text-gray-600 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50')
            }`}
    >
        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${active ? 'bg-blue-600 text-white' : (hasError ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-700')}`}>
            {index + 1}
        </span>
        {children}
        {hasError && <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500" />}
    </button>
);
=======
// Componentes de pestañas
function TabButton({ active, index, onClick, children }) {
    return (
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
}
>>>>>>> Stashed changes


// ============================================
// CONFIGURACIÓN DE MAPAS
// ============================================
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

async function geocodeGoogleMaps(direccionCompleta) {
    if (!direccionCompleta) return null;
    const params = new URLSearchParams({ address: direccionCompleta, key: GOOGLE_MAPS_API_KEY, region: 'mx' });
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            return { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng };
        }
        return null;
    } catch (error) {
        console.error("Error con Google Geocoding:", error);
        return null;
    }
}

function normalize(text) {
    return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s{2,}/g, ' ').trim();
}

// ============================================
// COMPONENTE PRINCIPAL: Create
// ============================================
export default function Create({ sucursal, usuario, solicitud, formData, isEditing = false }) {
    const [activeTab, setActiveTab] = useState(0);
    const [comprimiendo, setComprimiendo] = useState(false);

    const [tieneConyuge, setTieneConyuge] = useState(() => {
        const conyuge = parseMaybeJson(formData?.familiares, {}).conyuge;
        return !!(conyuge?.nombre || conyuge?.telefono || conyuge?.ocupacion);
    });

    const [tieneHijos, setTieneHijos] = useState(() => {
        const hijos = parseMaybeJson(formData?.familiares, {}).hijos;
        return Array.isArray(hijos) && hijos.length > 0;
    });

    const fieldTabMap = useMemo(() => ({
        primer_nombre: 0, apellido_paterno: 0, apellido_materno: 0, sexo: 0, fecha_nacimiento: 0, curp: 0, rfc: 0, telefono_celular: 0, correo_electronico: 0,
        familiares: 1, // Mapeo base para familiares
        calle: 2, numero_exterior: 2, colonia: 2, ciudad: 2, estado: 2, codigo_postal: 2,
        afiliaciones: 3,
        vehiculos: 4,
        ine_frente: 5, ine_reverso: 5, comprobante_domicilio: 5, reporte_buro: 5,
    }), []);

    const tabsWithErrors = useMemo(() => {
        const result = new Set();
        Object.keys(errors).forEach(key => {
            const rootKey = key.split('.')[0];
            const tabNumber = fieldTabMap[key] ?? fieldTabMap[rootKey];
            if (typeof tabNumber === 'number') {
                result.add(tabNumber);
            }
        });
        return result;
    }, [errors, fieldTabMap]);

    const comprimirImagen = (file, maxDimension = 1600, quality = 0.82) => new Promise((resolve) => {
        if (!file || !file.type?.startsWith('image/')) return resolve(file);
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
                if (!context) return resolve(file);
                context.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) return resolve(file);
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

    function parseMaybeJson(value, fallback) {
        if (value === null || value === undefined || value === '') return fallback;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return fallback; }
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
        limite_credito_solicitado: formData?.limite_credito_solicitado ?? 0,
        familiares: parseMaybeJson(formData?.familiares, { conyuge: { nombre: '', telefono: '', ocupacion: '' }, hijos: [], padres: { madre: { nombre: '', telefono: '' }, padre: { nombre: '', telefono: '' } } }),
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
        ine_frente: null, ine_reverso: null, comprobante_domicilio: null, reporte_buro: null,
        ine_frente_path: formData?.ine_frente_path ?? null,
        ine_reverso_path: formData?.ine_reverso_path ?? null,
        comprobante_domicilio_path: formData?.comprobante_domicilio_path ?? null,
        reporte_buro_path: formData?.reporte_buro_path ?? null,
    }), [formData]);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        ...initialData,
        _method: isEditing ? 'PUT' : 'POST'
    });

    const handleDocumentoChange = async (field, file) => {
        if (!file) return setData(field, null);
        setComprimiendo(true);
        try {
            const archivoFinal = await comprimirImagen(file);
            setData(field, archivoFinal);
        } catch (error) {
            setData(field, file);
        } finally {
            setComprimiendo(false);
        }
    };

    // ============================================
    // VALIDACIÓN ESTRICTA (Regex y Lógica de Negocio)
    // ============================================
    const validateForm = () => {
        clearErrors();
        const newErrors = {};

        // Tab 0: Personales
        if (!data.primer_nombre?.trim()) newErrors.primer_nombre = 'Requerido.';
        if (!data.apellido_paterno?.trim()) newErrors.apellido_paterno = 'Requerido.';
        if (!data.apellido_materno?.trim()) newErrors.apellido_materno = 'Requerido.';
        if (!data.sexo) newErrors.sexo = 'Selecciona una opción.';

        // Validación Edad (+18)
        if (!data.fecha_nacimiento) {
            newErrors.fecha_nacimiento = 'Fecha inválida.';
        } else {
            const birthDate = new Date(data.fecha_nacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            if (age < 18) newErrors.fecha_nacimiento = 'El solicitante debe ser mayor de 18 años.';
        }

        // Regex Oficiales México
        const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
        if (!data.curp || !curpRegex.test(data.curp)) newErrors.curp = 'Formato de CURP inválido.';

        const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
        if (!data.rfc || !rfcRegex.test(data.rfc)) newErrors.rfc = 'Formato de RFC inválido.';

        // Teléfonos
        if (!data.telefono_celular || data.telefono_celular.length !== 10) newErrors.telefono_celular = 'El celular debe tener exactamente 10 dígitos.';

        if (data.correo_electronico && !/^\S+@\S+\.\S+$/.test(data.correo_electronico)) newErrors.correo_electronico = 'Formato de correo inválido.';

        // Tab 1: Familiares
        if (tieneConyuge && (!data.familiares.conyuge?.nombre?.trim())) {
            newErrors["familiares.conyuge.nombre"] = 'El nombre del cónyuge es requerido.';
        }
        if (tieneConyuge && data.familiares.conyuge?.telefono && data.familiares.conyuge.telefono.length !== 10) {
            newErrors["familiares.conyuge.telefono"] = 'El teléfono debe tener 10 dígitos.';
        }

        if (tieneHijos && data.familiares.hijos.length > 0) {
            data.familiares.hijos.forEach((hijo, index) => {
                if (!hijo.nombre?.trim() || !hijo.edad) {
                    newErrors[`familiares.hijos.${index}.nombre`] = 'Nombre y edad obligatorios.';
                }
                if (hijo.telefono && hijo.telefono.length !== 10) {
                    newErrors[`familiares.hijos.${index}.telefono`] = '10 dígitos.';
                }
            });
        }

        if (data.familiares.padres?.madre?.telefono && data.familiares.padres.madre.telefono.length !== 10) newErrors["familiares.padres.madre.telefono"] = '10 dígitos.';
        if (data.familiares.padres?.padre?.telefono && data.familiares.padres.padre.telefono.length !== 10) newErrors["familiares.padres.padre.telefono"] = '10 dígitos.';

        // Tab 2: Domicilio
        if (!data.codigo_postal || data.codigo_postal.length !== 5) newErrors.codigo_postal = 'Deben ser 5 dígitos.';
        if (!data.estado?.trim()) newErrors.estado = 'Requerido.';
        if (!data.ciudad?.trim()) newErrors.ciudad = 'Requerido.';
        if (!data.colonia?.trim()) newErrors.colonia = 'Requerido.';
        if (!data.calle?.trim()) newErrors.calle = 'Requerido.';
        if (!data.numero_exterior?.trim()) newErrors.numero_exterior = 'Requerido.';

        // Tab 3: Referencias Laborales
        data.afiliaciones.forEach((afil, index) => {
            if (!afil.empresa?.trim() || !afil.antiguedad || !afil.limite_credito) {
                newErrors[`afiliaciones.${index}`] = 'Completa todos los campos de la referencia.';
            }
        });

        // Tab 4: Vehículos
        const currentYear = new Date().getFullYear() + 1;
        data.vehiculos.forEach((veh, index) => {
            if (!veh.marca?.trim() || !veh.modelo?.trim()) {
                newErrors[`vehiculos.${index}`] = 'Marca y modelo requeridos.';
            }
            if (veh.anio && (veh.anio < 1950 || veh.anio > currentYear)) {
                newErrors[`vehiculos.${index}`] = `El año debe ser entre 1950 y ${currentYear}.`;
            }
        });

        // Tab 5: Documentos
        if (!isEditing) {
            if (!data.ine_frente) newErrors.ine_frente = 'Foto frontal requerida.';
            if (!data.ine_reverso) newErrors.ine_reverso = 'Foto reverso requerida.';
            if (!data.comprobante_domicilio) newErrors.comprobante_domicilio = 'Comprobante requerido.';
        }

        if (Object.keys(newErrors).length > 0) {
            setError(newErrors);

            // Lógica inteligente para saltar a la pestaña correcta
            const firstErrorKey = Object.keys(newErrors)[0];
            const rootKey = firstErrorKey.split('.')[0]; // Ej. "familiares.hijos.0" -> "familiares"
            const errorTab = fieldTabMap[firstErrorKey] ?? fieldTabMap[rootKey];

            if (typeof errorTab === 'number') setActiveTab(errorTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        return true;
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) return;

        const routeName = isEditing ? 'coordinador.solicitudes.update' : 'coordinador.solicitudes.store';
        const routeParam = isEditing ? solicitud.id : undefined;

        const dataToSend = { ...data };
        if (!tieneConyuge) dataToSend.familiares.conyuge = { nombre: '', telefono: '', ocupacion: '' };
        if (!tieneHijos) dataToSend.familiares.hijos = [];

        post(route(routeName, routeParam), {
            data: dataToSend,
            forceFormData: true,
            onError: (submitErrors) => {
                const firstErrorKey = Object.keys(submitErrors || {})[0];
                const rootKey = firstErrorKey.split('.')[0];
                const errorTab = fieldTabMap[firstErrorKey] ?? fieldTabMap[rootKey];
                if (typeof errorTab === 'number') setActiveTab(errorTab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    const addHijo = () => setData('familiares', { ...data.familiares, hijos: [...data.familiares.hijos, { nombre: '', edad: '', telefono: '', ocupacion: '' }] });
    const removeHijo = (index) => { const n = [...data.familiares.hijos]; n.splice(index, 1); setData('familiares', { ...data.familiares, hijos: n }); };
    const updateHijo = (index, field, value) => { const n = [...data.familiares.hijos]; n[index][field] = value; setData('familiares', { ...data.familiares, hijos: n }); };
    const updateFamiliares = (updater) => setData('familiares', updater(data.familiares));

    const addAfiliacion = () => setData('afiliaciones', [...data.afiliaciones, { empresa: '', antiguedad: '', limite_credito: '' }]);
    const removeAfiliacion = (index) => { const n = [...data.afiliaciones]; n.splice(index, 1); setData('afiliaciones', n); };
    const updateAfiliacion = (index, field, value) => { const n = [...data.afiliaciones]; n[index][field] = value; setData('afiliaciones', n); };

    const addVehiculo = () => setData('vehiculos', [...data.vehiculos, { marca: '', modelo: '', placas: '', anio: '' }]);
    const removeVehiculo = (index) => { const n = [...data.vehiculos]; n.splice(index, 1); setData('vehiculos', n); };
    const updateVehiculo = (index, field, value) => { const n = [...data.vehiculos]; n[index][field] = value; setData('vehiculos', n); };

    const tabs = [
        { name: 'Datos Personales', component: DatosPersonalesTab },
        { name: 'Datos Familiares', component: DatosFamiliaresTab },
        { name: 'Domicilio', component: DomicilioTab },
        { name: 'Referencias', component: ReferenciasTab },
        { name: 'Vehículos', component: VehiculosTab },
        { name: 'Documentos y Finalizar', component: FinalizarTab }
    ];

    const ActiveTabComponent = tabs[activeTab].component;

    return (
        <TabletLayout title="Nueva Solicitud">
            <Head title="Nueva Solicitud" />
            <div className="max-w-6xl mx-auto tablet-form">

                <div className="mb-4 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:p-5">
                        <div className="flex items-start gap-3">
                            <div className="inline-flex items-center justify-center text-blue-600 w-11 h-11 rounded-xl bg-blue-50">
                                <FontAwesomeIcon icon={faFileCirclePlus} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Solicitud' : 'Nueva Pre-solicitud'}</h1>
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
                            <TabButton key={index} index={index} active={activeTab === index} hasError={tabsWithErrors.has(index)} onClick={() => setActiveTab(index)}>
                                {tab.name}
                            </TabButton>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="h-2 transition-all duration-300 bg-blue-600 rounded-full" style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }} />
                    </div>
                </div>

                <form onKeyDown={e => e.key === 'Enter' && e.target?.tagName !== 'TEXTAREA' && e.preventDefault()} className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 mx-4 mt-4 text-sm text-red-800 border border-red-200 rounded-xl bg-red-50">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
                            Tienes errores en las pestañas marcadas en rojo. Corrige los campos resaltados para continuar.
                        </div>
                    )}

                    <ActiveTabComponent
                        data={data} setData={setData} updateFamiliares={updateFamiliares} errors={errors}
                        addHijo={addHijo} removeHijo={removeHijo} updateHijo={updateHijo}
                        addAfiliacion={addAfiliacion} removeAfiliacion={removeAfiliacion} updateAfiliacion={updateAfiliacion}
                        addVehiculo={addVehiculo} removeVehiculo={removeVehiculo} updateVehiculo={updateVehiculo}
                        handleDocumentoChange={handleDocumentoChange} isEditing={isEditing}
                        tieneConyuge={tieneConyuge} setTieneConyuge={setTieneConyuge}
                        tieneHijos={tieneHijos} setTieneHijos={setTieneHijos}
                    />

                    <div className="flex flex-col gap-3 p-4 border-t border-gray-200 md:flex-row md:items-center md:justify-between">
                        <button type="button" onClick={() => setActiveTab(activeTab - 1)} disabled={activeTab === 0} className={`px-4 py-3 text-sm font-medium rounded-xl md:py-2 ${activeTab === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            <span className="inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faArrowLeft} /> Anterior
                            </span>
                        </button>

                        {activeTab < tabs.length - 1 ? (
                            <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 md:py-2">
                                <span className="inline-flex items-center gap-2">
                                    Siguiente <FontAwesomeIcon icon={faArrowRight} />
                                </span>
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={processing || comprimiendo} className="px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 md:py-2">
                                <span className="inline-flex items-center gap-2">
                                    <FontAwesomeIcon icon={processing || comprimiendo ? faCircleInfo : (isEditing ? faFloppyDisk : faPaperPlane)} className={processing || comprimiendo ? 'animate-pulse' : ''} />
                                    {comprimiendo ? 'Comprimiendo fotos...' : (processing ? 'Guardando...' : (isEditing ? 'Actualizar Solicitud' : 'Finalizar Solicitud'))}
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
// PESTAÑAS
// ============================================

function DatosPersonalesTab({ data, setData, errors }) {
    // Fecha máxima = hace exactamente 18 años (mayor de edad)
    const maxFecha = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })();
    const minFecha = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d.toISOString().split('T')[0]; })();

    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
    const rfcRegex  = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Datos Personales del Interesado</h2>
            <div className="grid grid-cols-2 gap-3">
                <FormInput
                    label="Primer Nombre" required error={errors.primer_nombre}
                    value={data.primer_nombre}
                    onChange={e => setData('primer_nombre', formatName(e.target.value))}
                    validate={v => !v.trim() ? 'El nombre es requerido' : null}
                />
                <FormInput
                    label="Segundo Nombre"
                    value={data.segundo_nombre}
                    onChange={e => setData('segundo_nombre', formatName(e.target.value))}
                />
                <FormInput
                    label="Apellido Paterno" required error={errors.apellido_paterno}
                    value={data.apellido_paterno}
                    onChange={e => setData('apellido_paterno', formatName(e.target.value))}
                    validate={v => !v.trim() ? 'El apellido paterno es requerido' : null}
                />
                <FormInput
                    label="Apellido Materno" required error={errors.apellido_materno}
                    value={data.apellido_materno}
                    onChange={e => setData('apellido_materno', formatName(e.target.value))}
                    validate={v => !v.trim() ? 'El apellido materno es requerido' : null}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700">Sexo <span className="text-red-600">*</span></label>
                    <select value={data.sexo} onChange={e => setData('sexo', e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md transition-colors ${errors.sexo ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-600' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}>
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="OTRO">Otro</option>
                    </select>
                    {errors.sexo && <p className="mt-1 text-xs font-medium text-red-600">{errors.sexo}</p>}
                </div>

                <FormInput
                    type="date"
                    label="Fecha Nacimiento"
                    required
                    error={errors.fecha_nacimiento}
                    value={data.fecha_nacimiento}
                    onChange={e => setData('fecha_nacimiento', e.target.value)}
                    max={maxFecha}
                    min={minFecha}
                    validate={v => {
                        if (!v) return 'La fecha es requerida';
                        if (v > maxFecha) return 'El solicitante debe ser mayor de 18 años';
                        if (v < minFecha) return 'Fecha de nacimiento no válida';
                        return null;
                    }}
                />

                <FormInput
                    label="CURP" required error={errors.curp}
                    maxLength={18}
                    value={data.curp}
                    onChange={e => setData('curp', formatAlphanumeric(e.target.value))}
                    className="uppercase"
                    validate={v => {
                        if (!v) return 'La CURP es requerida';
                        if (v.length !== 18) return `CURP incompleta (${v.length}/18)`;
                        if (!curpRegex.test(v)) return 'Formato de CURP inválido';
                        return null;
                    }}
                />
                <FormInput
                    label="RFC" required error={errors.rfc}
                    maxLength={13}
                    value={data.rfc}
                    onChange={e => setData('rfc', formatAlphanumeric(e.target.value))}
                    className="uppercase"
                    validate={v => {
                        if (!v) return 'El RFC es requerido';
                        if (v.length < 12) return `RFC incompleto (${v.length}/12)`;
                        if (!rfcRegex.test(v)) return 'Formato de RFC inválido';
                        return null;
                    }}
                />

                <FormInput
                    type="tel" label="Teléfono Celular" required maxLength={10}
                    error={errors.telefono_celular}
                    value={data.telefono_celular}
                    onChange={e => setData('telefono_celular', formatPhone(e.target.value))}
                    validate={v => {
                        if (!v) return 'El teléfono celular es requerido';
                        if (v.length !== 10) return `Debe tener 10 dígitos (${v.length}/10)`;
                        return null;
                    }}
                />
                <FormInput
                    type="email" label="Correo Electrónico"
                    error={errors.correo_electronico}
                    value={data.correo_electronico}
                    onChange={e => setData('correo_electronico', e.target.value)}
                    className="col-span-2"
                    validate={v => v && !/^\S+@\S+\.\S+$/.test(v) ? 'Formato de correo inválido' : null}
                />
            </div>
        </div>

    );
}

function DatosFamiliaresTab({ data, updateFamiliares, addHijo, removeHijo, updateHijo, errors, tieneConyuge, setTieneConyuge, tieneHijos, setTieneHijos }) {
    return (
        <div className="p-4 space-y-6">
            <h2 className="text-lg font-semibold">Datos Familiares</h2>

            {/* SECCIÓN: CÓNYUGE */}
            <div className={`p-4 border rounded-lg ${errors['familiares.conyuge.nombre'] || errors['familiares.conyuge.telefono'] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">Cónyuge / Pareja</h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm text-gray-600">{tieneConyuge ? 'Sí tiene' : 'No tiene'}</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={tieneConyuge} onChange={(e) => setTieneConyuge(e.target.checked)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${tieneConyuge ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${tieneConyuge ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>

                {tieneConyuge && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <FormInput
                            label="Nombre Completo" required error={errors['familiares.conyuge.nombre']}
                            value={data.familiares.conyuge.nombre}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, conyuge: { ...prev.conyuge, nombre: formatName(e.target.value) } }))}
                            validate={v => !v.trim() ? 'El nombre del cónyuge es requerido' : null}
                        />
                        <FormInput
                            type="tel" label="Teléfono" maxLength={10} error={errors['familiares.conyuge.telefono']}
                            value={data.familiares.conyuge.telefono}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, conyuge: { ...prev.conyuge, telefono: formatPhone(e.target.value) } }))}
                            validate={v => v && v.length !== 10 ? `Debe tener 10 dígitos (${v.length}/10)` : null}
                        />
                        <FormInput
                            label="Ocupación" className="col-span-2"
                            value={data.familiares.conyuge.ocupacion}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, conyuge: { ...prev.conyuge, ocupacion: formatName(e.target.value) } }))}
                        />
                    </div>
                )}
            </div>

            {/* SECCIÓN: PADRES */}
            <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="mb-3 font-medium text-gray-800">Padres</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600">Madre</h4>
                        <FormInput
                            placeholder="Nombre completo"
                            value={data.familiares.padres.madre.nombre}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, padres: { ...prev.padres, madre: { ...prev.padres.madre, nombre: formatName(e.target.value) } } }))}
                        />
                        <FormInput
                            type="tel" placeholder="Teléfono" maxLength={10} error={errors['familiares.padres.madre.telefono']}
                            value={data.familiares.padres.madre.telefono}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, padres: { ...prev.padres, madre: { ...prev.padres.madre, telefono: formatPhone(e.target.value) } } }))}
                            validate={v => v && v.length !== 10 ? `Debe tener 10 dígitos (${v.length}/10)` : null}
                        />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600">Padre</h4>
                        <FormInput
                            placeholder="Nombre completo"
                            value={data.familiares.padres.padre.nombre}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, padres: { ...prev.padres, padre: { ...prev.padres.padre, nombre: formatName(e.target.value) } } }))}
                        />
                        <FormInput
                            type="tel" placeholder="Teléfono" maxLength={10} error={errors['familiares.padres.padre.telefono']}
                            value={data.familiares.padres.padre.telefono}
                            onChange={e => updateFamiliares((prev) => ({ ...prev, padres: { ...prev.padres, padre: { ...prev.padres.padre, telefono: formatPhone(e.target.value) } } }))}
                            validate={v => v && v.length !== 10 ? `Debe tener 10 dígitos (${v.length}/10)` : null}
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN: HIJOS */}
            <div className={`p-4 border rounded-lg ${errors['familiares.hijos'] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">Hijos</h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm text-gray-600">{tieneHijos ? 'Sí tiene' : 'No tiene'}</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={tieneHijos} onChange={(e) => {
                                setTieneHijos(e.target.checked);
                                if (e.target.checked && data.familiares.hijos.length === 0) addHijo();
                            }} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${tieneHijos ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${tieneHijos ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>

                {tieneHijos && (
                    <div className="pt-3 border-t border-gray-100">
                        {data.familiares.hijos.map((hijo, index) => (
                            <div key={index} className="p-3 mb-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-800">Hijo {index + 1}</span>
                                    <button type="button" onClick={() => removeHijo(index)} className="text-xs font-medium text-red-600 hover:text-red-800"><FontAwesomeIcon icon={faTrash} /> Eliminar</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <FormInput
                                        placeholder="Nombre *" error={errors[`familiares.hijos.${index}.nombre`]}
                                        value={hijo.nombre}
                                        onChange={e => updateHijo(index, 'nombre', formatName(e.target.value))}
                                    />
                                    <FormInput
                                        type="number" placeholder="Edad *" min="0" max="99"
                                        value={hijo.edad}
                                        onChange={e => updateHijo(index, 'edad', e.target.value.replace(/\D/g, ''))}
                                    />
                                    <FormInput
                                        type="tel" placeholder="Teléfono" maxLength={10} error={errors[`familiares.hijos.${index}.telefono`]}
                                        value={hijo.telefono}
                                        onChange={e => updateHijo(index, 'telefono', formatPhone(e.target.value))}
                                    />
                                    <FormInput
                                        placeholder="Ocupación"
                                        value={hijo.ocupacion}
                                        onChange={e => updateHijo(index, 'ocupacion', formatName(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addHijo} className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                            <FontAwesomeIcon icon={faPlus} /> Agregar otro hijo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
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
            // Cambiamos la API muerta por Zippopotam
            const res = await fetch(`https://api.zippopotam.us/mx/${cpStr}`);
            if (!res.ok) throw new Error('CP no encontrado');

            const info = await res.json();

            // Adaptamos el formato de Zippopotam a tu estado
            const estado = info.places[0].state;
            const colonias = info.places.map(lugar => lugar["place name"]);

            setData(prev => ({
                ...prev,
                estado: estado,
                ciudad: '', // Zippopotam no separa bien municipio, dejamos que el usuario lo escriba
                colonia: colonias[0] || ''
            }));
            setColoniasDisponibles(colonias);
        } catch (error) {
            console.log("No se pudo obtener el CP de la API pública. Habilitando llenado manual.");
            setColoniasDisponibles([]);
        } finally {
            setBuscandoCp(false);
        }
    };

    const handleCpChange = (e) => {
        const cp = formatPhone(e.target.value); // Solo números
        setData('codigo_postal', cp);
        if (cp.length === 5) buscarPorCP(cp);
        else setColoniasDisponibles([]);
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
            setMensajeMapa('Ocurrio un error al buscar la ubicacion. Intenta nuevamente.');
        } finally {
            setSincronizandoMapa(false);
        }
    };

    const initialPosition = useMemo(() => {
        const lat = parseFloat(data.latitud);
        const lng = parseFloat(data.longitud);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lat, lng];
    }, [data.latitud, data.longitud]);

    return (
        <div className="p-4 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FontAwesomeIcon icon={faLocationDot} className="text-blue-600" /> Domicilio</h2>
            <p className="text-xs text-gray-500">Teclea el Código Postal para autocompletar el Estado y Municipio.</p>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Código Postal <span className="text-red-600">*</span>
                        {buscandoCp && <span className="ml-2 text-xs font-bold text-blue-600 animate-pulse">Buscando...</span>}
                    </label>
                    <input type="text" maxLength="5" value={data.codigo_postal} onChange={handleCpChange} placeholder="Ej. 27000" className={`w-full px-3 py-2 mt-1 border rounded-md transition-colors ${errors.codigo_postal ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                    {errors.codigo_postal && <p className="mt-1 text-xs text-red-600">{errors.codigo_postal}</p>}
                </div>
                <div className="hidden md:block"></div>

                <FormInput label="Estado" required error={errors.estado} value={data.estado} onChange={e => setData('estado', e.target.value)} disabled />
                <FormInput
                    label="Municipio / Ciudad" required error={errors.ciudad}
                    value={data.ciudad}
                    onChange={e => setData('ciudad', e.target.value)}
                    validate={v => !v.trim() ? 'Ciudad requerida' : null}
                />

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Colonia <span className="text-red-600">*</span></label>
                    {coloniasDisponibles.length > 0 ? (
                        <select value={data.colonia} onChange={e => setData('colonia', e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md bg-blue-50 transition-colors ${errors.colonia ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                            <option value="">Selecciona tu colonia</option>
                            {coloniasDisponibles.map((col, idx) => <option key={idx} value={col}>{col}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={data.colonia} onChange={e => setData('colonia', e.target.value)} placeholder="Escribe la colonia..." className={`w-full px-3 py-2 mt-1 border rounded-md transition-colors ${errors.colonia ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                    )}
                    {errors.colonia && <p className="mt-1 text-xs text-red-600">{errors.colonia}</p>}
                </div>

                <FormInput
                    label="Calle" required error={errors.calle}
                    value={data.calle}
                    onChange={e => setData('calle', e.target.value)}
                    className="col-span-2"
                    validate={v => !v.trim() ? 'La calle es requerida' : null}
                />
                <FormInput
                    label="Número Exterior" required error={errors.numero_exterior}
                    value={data.numero_exterior}
                    onChange={e => setData('numero_exterior', e.target.value)}
                    validate={v => !v.trim() ? 'El número exterior es requerido' : null}
                />
                <FormInput label="Número Interior" value={data.numero_interior} onChange={e => setData('numero_interior', e.target.value)} />

                <div className="col-span-2 pt-2">
                    <button type="button" onClick={buscarUbicacionEnMapa} disabled={sincronizandoMapa} className="w-full px-4 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                        {sincronizandoMapa ? 'Buscando con Google...' : 'Ubicar dirección exacta en el mapa'}
                    </button>
                    {mensajeMapa && <p className={`mt-2 text-xs font-medium ${mensajeMapa.includes('No se pudo') || mensajeMapa.includes('error') ? 'text-red-600' : 'text-green-700'}`}>{mensajeMapa}</p>}
                </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="mb-2 text-sm text-gray-600">Mueve el pin en caso de que la ubicación automática necesite un ajuste fino.</p>
                <div className="max-w-4xl mx-auto overflow-hidden border border-gray-300 rounded-lg">
                    <MapaUbicacion initialPosition={initialPosition} onPositionChange={handlePositionChange} height="300px" />
                </div>
            </div>
        </div>
    );
}

function ReferenciasTab({ data, updateAfiliacion, addAfiliacion, removeAfiliacion, errors }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Referencias Laborales / Afiliaciones</h2>
                <button type="button" onClick={addAfiliacion} className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md">
                    <FontAwesomeIcon icon={faPlus} /> Agregar
                </button>
            </div>

            {data.afiliaciones.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No hay referencias laborales registradas</p>
            ) : (
                data.afiliaciones.map((afiliacion, index) => (
                    <div key={index} className={`p-3 border rounded-lg ${errors[`afiliaciones.${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">Referencia {index + 1}</span>
                            <button type="button" onClick={() => removeAfiliacion(index)} className="inline-flex items-center gap-1 text-xs text-red-600">
                                <FontAwesomeIcon icon={faTrash} /> Eliminar
                            </button>
                        </div>
                        {errors[`afiliaciones.${index}`] && <p className="mb-2 text-xs font-medium text-red-600">{errors[`afiliaciones.${index}`]}</p>}

                        <div className="space-y-2">
                            <FormInput
                                placeholder="Nombre de la empresa"
                                value={afiliacion.empresa}
                                onChange={e => updateAfiliacion(index, 'empresa', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormInput
                                    type="number" placeholder="Antigüedad (meses)" min="0"
                                    value={afiliacion.antiguedad}
                                    onChange={e => updateAfiliacion(index, 'antiguedad', formatPhone(e.target.value))}
                                />
                                <FormInput
                                    type="number" placeholder="Límite de crédito ($)" min="0" step="0.01"
                                    value={afiliacion.limite_credito}
                                    onChange={e => updateAfiliacion(index, 'limite_credito', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function VehiculosTab({ data, updateVehiculo, addVehiculo, removeVehiculo, errors }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Vehículos</h2>
                <button type="button" onClick={addVehiculo} className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md">
                    <FontAwesomeIcon icon={faCarSide} /> Agregar Vehículo
                </button>
            </div>

            {data.vehiculos.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No hay vehículos registrados</p>
            ) : (
                data.vehiculos.map((vehiculo, index) => (
                    <div key={index} className={`p-3 border rounded-lg ${errors[`vehiculos.${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">Vehículo {index + 1}</span>
                            <button type="button" onClick={() => removeVehiculo(index)} className="inline-flex items-center gap-1 text-xs text-red-600">
                                <FontAwesomeIcon icon={faTrash} /> Eliminar
                            </button>
                        </div>
                        {errors[`vehiculos.${index}`] && <p className="mb-2 text-xs font-medium text-red-600">{errors[`vehiculos.${index}`]}</p>}

                        <div className="grid grid-cols-2 gap-2">
                            <FormInput placeholder="Marca" value={vehiculo.marca} onChange={e => updateVehiculo(index, 'marca', e.target.value)} />
                            <FormInput placeholder="Modelo" value={vehiculo.modelo} onChange={e => updateVehiculo(index, 'modelo', e.target.value)} />
                            <FormInput placeholder="Placas" value={vehiculo.placas} onChange={e => updateVehiculo(index, 'placas', formatAlphanumeric(e.target.value))} className="uppercase" />
                            <FormInput type="number" placeholder="Año" maxLength={4} value={vehiculo.anio} onChange={e => updateVehiculo(index, 'anio', formatPhone(e.target.value))} />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

<<<<<<< Updated upstream
const DocumentCard = ({ id, label, accept, capture, fieldName, error, path, file, isEditing, onFileChange }) => {
    const hasFile = file || (isEditing && path);
    const fileName = file?.name || (isEditing && path ? 'Archivo guardado' : 'Sin documento cargado');

    return (
        <div className={`p-4 rounded-xl border transition-colors ${error ? 'border-red-500 bg-red-50' : 'border-blue-100 bg-blue-50/30'}`}>
            <label className="block mb-3 text-sm font-semibold text-gray-800">{label} <span className="text-red-600">*</span></label>
            <div className="flex flex-col gap-2">
                <label htmlFor={`${id}_camera`} className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium transition-colors bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 text-gray-700">
                    <FontAwesomeIcon icon={faCamera} className="text-lg" /> Tomar Foto
                </label>
                <input id={`${id}_camera`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFileChange(fieldName, e.target.files?.[0]); e.target.value = ''; }} />

                <label htmlFor={`${id}_file`} className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium transition-colors bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 text-gray-700">
                    <FontAwesomeIcon icon={faFileUpload} className="text-lg" /> Subir Imagen
                </label>
                <input id={`${id}_file`} type="file" accept={accept} className="hidden" onChange={(e) => { onFileChange(fieldName, e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            <div className="mt-3 text-xs">
                {hasFile ? (
                    <span className="flex items-center gap-1 font-medium text-green-700">
                        <FontAwesomeIcon icon={faCheckCircle} /> Listo: <span className="truncate max-w-[150px] inline-block align-bottom">{fileName}</span>
                    </span>
                ) : (<span className="text-gray-500">{fileName}</span>)}
            </div>
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
};

function FinalizarTab({ data, setData, errors, handleDocumentoChange, isEditing }) {
    const validImageFormats = "image/jpeg, image/png";
=======
// ============================================
// PESTAÑA 5: FINALIZAR
// ============================================
// Componente externo reutilizable para cada caja de documento
function DocumentCard({ id, label, accept, capture, fieldName, error, path, file, handleDocumentoChange, isEditing }) {
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
}

function FinalizarTab({ data, errors, handleDocumentoChange, isEditing }) {
>>>>>>> Stashed changes

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Finalizar Solicitud</h2>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="mb-4 text-sm font-semibold text-gray-800">Documentos obligatorios (Solo JPG/PNG)</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
<<<<<<< Updated upstream
                    <DocumentCard id="ine_frente" fieldName="ine_frente" label="INE frente" accept={validImageFormats} error={errors.ine_frente} path={data.ine_frente_path} file={data.ine_frente} isEditing={isEditing} onFileChange={handleDocumentoChange} />
                    <DocumentCard id="ine_reverso" fieldName="ine_reverso" label="INE reverso" accept={validImageFormats} error={errors.ine_reverso} path={data.ine_reverso_path} file={data.ine_reverso} isEditing={isEditing} onFileChange={handleDocumentoChange} />
                    <DocumentCard id="comprobante_domicilio" fieldName="comprobante_domicilio" label="Comprobante de domicilio" accept={validImageFormats} error={errors.comprobante_domicilio} path={data.comprobante_domicilio_path} file={data.comprobante_domicilio} isEditing={isEditing} onFileChange={handleDocumentoChange} />
                    <DocumentCard id="reporte_buro" fieldName="reporte_buro" label="Reporte de buró" accept={validImageFormats} error={errors.reporte_buro} path={data.reporte_buro_path} file={data.reporte_buro} isEditing={isEditing} onFileChange={handleDocumentoChange} />
=======
                    <DocumentCard
                        id="ine_frente"
                        fieldName="ine_frente"
                        label="INE frente"
                        accept="image/*"
                        capture="environment"
                        error={errors.ine_frente}
                        path={data.ine_frente_path}
                        file={data.ine_frente}
                        handleDocumentoChange={handleDocumentoChange}
                        isEditing={isEditing}
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
                        handleDocumentoChange={handleDocumentoChange}
                        isEditing={isEditing}
                    />

                    <DocumentCard
                        id="comprobante_domicilio"
                        fieldName="comprobante_domicilio"
                        label="Comprobante de domicilio"
                        accept="image/*,.pdf"
                        error={errors.comprobante_domicilio}
                        path={data.comprobante_domicilio_path}
                        file={data.comprobante_domicilio}
                        handleDocumentoChange={handleDocumentoChange}
                        isEditing={isEditing}
                    />

                    <DocumentCard
                        id="reporte_buro"
                        fieldName="reporte_buro"
                        label="Reporte de buró"
                        accept="image/*,.pdf"
                        error={errors.reporte_buro}
                        path={data.reporte_buro_path}
                        file={data.reporte_buro}
                        handleDocumentoChange={handleDocumentoChange}
                        isEditing={isEditing}
                    />
>>>>>>> Stashed changes
                </div>
                <p className="mt-4 text-xs text-gray-500">Las imágenes se optimizan automáticamente antes del envío.</p>
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
                <textarea rows="4" value={data.observaciones} onChange={e => setData('observaciones', e.target.value)} placeholder="Agrega cualquier observación..." className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="flex items-start gap-2 text-sm text-yellow-800">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                    <span>Al finalizar, el sistema validará que los campos y las imágenes (JPG/PNG) estén correctos antes de enviarla.</span>
                </p>
            </div>
        </div>
    );
}