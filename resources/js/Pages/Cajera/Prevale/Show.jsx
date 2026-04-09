import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, 
    faCheckCircle, 
    faTimesCircle, 
    faUser, 
    faIdCard,
    faShop,
    faTriangleExclamation,
    faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';

export default function Show({ vale }) {
    // 1. EXTRACCIÓN DE DATOS
    const { errors: serverErrors } = usePage().props; // Para capturar errores de BD o validación
    const cp = vale.cliente?.persona || {}; // Cliente Persona
    const dp = vale.distribuidora?.persona || {}; // Distribuidora Persona
    const distribuidora = vale.distribuidora || {};
    const cliente = vale.cliente || {}; // Datos de cuenta bancaria
    
    // Aseguramos matemática correcta para evitar colores rojos erróneos
    const creditoDisponible = parseFloat(distribuidora.credito_disponible) || 0;
    const montoPréstamo = parseFloat(vale.producto_financiero?.monto_principal || vale.monto_principal) || 0;
    const tieneCreditoSuficiente = creditoDisponible >= montoPréstamo;

    // 2. LÓGICA DE DETECCIÓN DE RIESGOS
    const coincidenciaPaterno = cp.apellido_paterno?.toLowerCase() === dp.apellido_paterno?.toLowerCase();
    const coincidenciaMaterno = cp.apellido_materno?.toLowerCase() === dp.apellido_materno?.toLowerCase() && cp.apellido_materno;
    const tieneMismosApellidos = coincidenciaPaterno || coincidenciaMaterno;
    
    const direccionCliente = `${cp.calle || ''} ${cp.numero_exterior || ''}`.trim().toLowerCase();
    const direccionDist = `${dp.calle || ''} ${dp.numero_exterior || ''}`.trim().toLowerCase();
    const mismaDireccion = direccionCliente !== '' && direccionCliente === direccionDist;
    
    const mismoTelefono = (cp.telefono_celular && cp.telefono_celular === dp.telefono_celular);
    const mismoCorreo = (cp.correo_electronico && cp.correo_electronico.toLowerCase() === dp.correo_electronico?.toLowerCase());

    const titularCuenta = cliente.cuenta_titular || "No registrado"; 
    const posiblePrestanombre = titularCuenta !== "No registrado" && 
                                (!titularCuenta.toLowerCase().includes(cp.primer_nombre?.toLowerCase()) || 
                                 !titularCuenta.toLowerCase().includes(cp.apellido_paterno?.toLowerCase()));

    // Formatear Fecha y Calcular Edad
    const formatFecha = (fecha) => fecha ? fecha.split('T')[0] : 'N/A';
    const calcularEdad = (fecha) => {
        if (!fecha) return 'N/A';
        const hoy = new Date();
        const nac = new Date(fecha.split('T')[0]);
        let edad = hoy.getFullYear() - nac.getFullYear();
        if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
        return edad;
    };
    const edadCliente = calcularEdad(cp.fecha_nacimiento);

    // 3. ESTADOS Y FORMULARIOS
    const [showRechazar, setShowRechazar] = useState(false);

    const formAprobar = useForm({
        check_identidad: false, 
        check_domicilio: false, 
        check_biometria: false, 
        check_pld: false,       
        check_parentesco: false,
    });

    const formRechazar = useForm({
        motivo_rechazo: '',
    });

    const puedeAprobar = formAprobar.data.check_identidad && formAprobar.data.check_domicilio && 
                         formAprobar.data.check_biometria && formAprobar.data.check_pld && formAprobar.data.check_parentesco;

    const handleAprobar = (e) => {
        e.preventDefault();
        if(!puedeAprobar) return;
        formAprobar.post(route('cajera.prevale.aprobar', vale.id));
    };

    const handleRechazar = (e) => {
        e.preventDefault();
        formRechazar.post(route('cajera.prevale.rechazar', vale.id), { onSuccess: () => setShowRechazar(false) });
    };

    return (
        <TabletLayout title={`${vale.numero_vale} - Verificación`}>
            <Head title={`Prevale ${vale.numero_vale}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* --- HEADER Y MONTO --- */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-4">
                            <Link href={route('cajera.prevale.index')} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-gray-800">Verificación de Prevale</h2>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{vale.numero_vale}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Plazo: <b>{vale.quincenas_totales} quincenas</b> | Producto: {vale.producto_financiero?.nombre || 'Estándar'}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-right md:border-l border-gray-200 md:pl-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto a Fondear</p>
                            <p className="text-4xl font-black text-green-600">${montoPréstamo.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* --- ALERTAS AUTOMÁTICAS DE RIESGO --- */}
                    {(tieneMismosApellidos || mismaDireccion || mismoTelefono || mismoCorreo || posiblePrestanombre) && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl flex gap-4 shadow-sm items-start">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500 mt-1 text-xl" />
                            <div>
                                <h3 className="text-red-800 font-bold text-lg">Banderas de Riesgo Detectadas</h3>
                                <ul className="list-disc ml-5 mt-2 text-sm text-red-700 font-medium space-y-1">
                                    {tieneMismosApellidos && <li>Coincidencia de apellidos (Posible parentesco).</li>}
                                    {mismaDireccion && <li>Ambas partes registran el mismo domicilio físico.</li>}
                                    {mismoTelefono && <li>El cliente tiene el mismo número celular que la distribuidora.</li>}
                                    {mismoCorreo && <li>El cliente usa el mismo correo electrónico que la distribuidora.</li>}
                                    {posiblePrestanombre && <li>Riesgo PLD: El titular de la cuenta no coincide con el cliente.</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* --- TARJETAS: CLIENTE VS DISTRIBUIDORA --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* TARJETA CLIENTE FINAL */}
                        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                            <div className="bg-blue-50 px-5 py-4 border-b border-blue-200 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                                <h3 className="font-bold text-blue-900">Datos del Cliente Final (Solicitante)</h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Nombre Completo</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {cp.primer_nombre} {cp.segundo_nombre} <span className={tieneMismosApellidos ? "bg-orange-200 px-1 rounded" : ""}>{cp.apellido_paterno} {cp.apellido_materno}</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">CURP</p>
                                        <p className="font-medium text-gray-900">{cp.curp || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">SEXO Y EDAD</p>
                                        <p className={`font-medium ${edadCliente < 18 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                            {cp.sexo || 'N/A'} - {edadCliente} años
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-bold mb-1">DIRECCIÓN REGISTRADA</p>
                                        <p className={`font-medium text-gray-900 ${mismaDireccion ? "bg-orange-200 px-1 rounded inline-block" : ""}`}>
                                            {cp.calle || '#'} {cp.numero_exterior || ''}, Col. {cp.colonia || ''}, C.P. {cp.codigo_postal || ''} <br/>
                                            {cp.ciudad || ''}, {cp.estado_direccion || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">TELÉFONO</p>
                                        <p className={`font-medium ${mismoTelefono ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{cp.telefono_celular || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">CORREO</p>
                                        <p className={`font-medium ${mismoCorreo ? 'text-red-600 font-bold' : 'text-gray-900'} truncate`} title={cp.correo_electronico}>
                                            {cp.correo_electronico || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TARJETA DISTRIBUIDORA */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div className="bg-purple-50 px-5 py-4 border-b border-purple-200 flex items-center gap-3">
                                <FontAwesomeIcon icon={faShop} className="text-purple-600" />
                                <h3 className="font-bold text-purple-900">Datos de la Distribuidora (Aval)</h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Nombre Completo</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {dp.primer_nombre} {dp.segundo_nombre} <span className={tieneMismosApellidos ? "bg-orange-200 px-1 rounded" : ""}>{dp.apellido_paterno} {dp.apellido_materno}</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">CÓDIGO</p>
                                        <p className="font-medium text-gray-900">{distribuidora.numero_distribuidora || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">CRÉDITO DISPONIBLE</p>
                                        <p className={`font-bold ${tieneCreditoSuficiente ? 'text-green-600' : 'text-red-600'}`}>
                                            ${creditoDisponible.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-bold mb-1">DIRECCIÓN REGISTRADA</p>
                                        <p className={`font-medium text-gray-900 ${mismaDireccion ? "bg-orange-200 px-1 rounded inline-block" : ""}`}>
                                            {dp.calle || '#'} {dp.numero_exterior || ''}, Col. {dp.colonia || ''}, C.P. {dp.codigo_postal || ''} <br/>
                                            {dp.ciudad || ''}, {dp.estado_direccion || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">TELÉFONO</p>
                                        <p className={`font-medium ${mismoTelefono ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{dp.telefono_celular || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">CORREO</p>
                                        <p className={`font-medium ${mismoCorreo ? 'text-red-600 font-bold' : 'text-gray-900'} truncate`} title={dp.correo_electronico}>
                                            {dp.correo_electronico || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- NUEVA SECCIÓN: DATOS BANCARIOS (BIEN VISIBLES) --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                            <FontAwesomeIcon icon={faBuildingColumns} className="text-gray-700" />
                            <h3 className="font-bold text-gray-800">Datos de Dispersión (Cuenta a Transferir)</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div className="md:col-span-2">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Titular de la Cuenta</p>
                                <p className={`text-xl font-bold ${posiblePrestanombre ? 'text-red-600' : 'text-gray-900'}`}>{titularCuenta}</p>
                                {posiblePrestanombre && <p className="text-xs text-red-500 mt-1 font-semibold">⚠️ El titular no coincide con el solicitante.</p>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Institución y CLABE</p>
                                <p className="font-bold text-gray-800 mb-1">{cliente.cuenta_banco || 'Banco No Registrado'}</p>
                                <p className="text-lg font-mono text-blue-700 tracking-widest">{cliente.cuenta_clabe || 'Sin CLABE'}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- EVIDENCIA FOTOGRÁFICA (Ajustado para URLs de Digital Ocean) --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                            <FontAwesomeIcon icon={faIdCard} className="text-gray-600" />
                            <h3 className="font-bold text-gray-800">Evidencia Fotográfica</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="group">
                                <p className="text-xs text-gray-500 mb-2 font-bold uppercase text-center">INE Frente</p>
                                <div className="h-48 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
                                    {cliente.ine_frente_url ? (
                                        <img src={cliente.ine_frente_url} alt="INE Frente" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-400">Sin Imagen</span>
                                    )}
                                </div>
                            </div>
                            <div className="group">
                                <p className="text-xs text-gray-500 mb-2 font-bold uppercase text-center">INE Reverso</p>
                                <div className="h-48 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
                                    {cliente.ine_reverso_url ? (
                                        <img src={cliente.ine_reverso_url} alt="INE Reverso" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-400">Sin Imagen</span>
                                    )}
                                </div>
                            </div>
                            <div className="group">
                                <p className="text-xs text-blue-600 mb-2 font-bold uppercase text-center">Prueba de Vida (Selfie)</p>
                                <div className="h-48 flex items-center justify-center bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 overflow-hidden">
                                    {cliente.selfie_url ? (
                                        <img src={cliente.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-medium text-blue-400">Sin Selfie</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CHECKLIST ESTRICTO Y ACCIONES --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-800 overflow-hidden mb-10">
                        <div className="bg-gray-800 p-4">
                            <h4 className="font-bold text-white text-center tracking-widest uppercase text-sm">Checklist de Auditoría Obligatorio</h4>
                        </div>
                        <div className="p-6 flex flex-col xl:flex-row justify-between gap-8">
                            
                            <div className="w-full xl:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer" 
                                        checked={formAprobar.data.check_identidad} onChange={e => formAprobar.setData('check_identidad', e.target.checked)} />
                                    <span className="text-sm text-gray-700 leading-tight">Los datos capturados (Nombre, CURP) coinciden con la foto del INE.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer" 
                                        checked={formAprobar.data.check_domicilio} onChange={e => formAprobar.setData('check_domicilio', e.target.checked)} />
                                    <span className="text-sm text-gray-700 leading-tight">La dirección física es válida y no es la misma que la distribuidora.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer" 
                                        checked={formAprobar.data.check_biometria} onChange={e => formAprobar.setData('check_biometria', e.target.checked)} />
                                    <span className="text-sm text-gray-700 leading-tight">El rostro en la <b>Selfie</b> coincide con la fotografía del INE.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer" 
                                        checked={formAprobar.data.check_pld} onChange={e => formAprobar.setData('check_pld', e.target.checked)} />
                                    <span className="text-sm text-gray-700 leading-tight">Revisión PLD: El <b>Titular de la Cuenta</b> bancaria es válido.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group col-span-1 sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mt-2">
                                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer" 
                                        checked={formAprobar.data.check_parentesco} onChange={e => formAprobar.setData('check_parentesco', e.target.checked)} />
                                    <span className="text-sm text-gray-900 font-bold leading-tight">Declaro bajo mi responsabilidad que NO existe parentesco directo ni fraude.</span>
                                </label>
                            </div>

                            <div className="w-full xl:w-1/3 flex flex-col justify-end gap-3 border-t xl:border-t-0 xl:border-l border-gray-200 pt-6 xl:pt-0 xl:pl-6">
                                <button onClick={() => setShowRechazar(true)} className="w-full py-3 bg-white text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    <FontAwesomeIcon icon={faTimesCircle} /> Rechazar Prevale
                                </button>
                                <button onClick={handleAprobar} disabled={!tieneCreditoSuficiente || !puedeAprobar || formAprobar.processing}
                                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md
                                        ${(tieneCreditoSuficiente && puedeAprobar) ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} /> {formAprobar.processing ? 'Procesando...' : 'Aprobar y Fondeo'}
                                </button>

                                {/* VISUALIZACIÓN DE ERRORES DEL SERVIDOR */}
                                {serverErrors.error && (
                                    <p className="text-xs text-red-600 font-black text-center mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                        ⚠️ {serverErrors.error}
                                    </p>
                                )}

                                {!tieneCreditoSuficiente && <p className="text-xs text-red-500 text-center font-bold mt-1">Crédito de distribuidora insuficiente</p>}
                                {!puedeAprobar && tieneCreditoSuficiente && <p className="text-xs text-gray-400 text-center mt-1">Completa el checklist para aprobar</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODAL: RECHAZAR */}
            {showRechazar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 transform transition-all">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-600 text-xl" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Rechazar Prevale</h3>
                        <p className="text-sm text-gray-500 mb-5">Ingresa el motivo por el cual este vale no procede. Esta acción bloqueará al cliente.</p>
                        
                        <form onSubmit={handleRechazar}>
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Motivo de Rechazo *</label>
                                <textarea 
                                    required
                                    rows="4"
                                    value={formRechazar.data.motivo_rechazo}
                                    onChange={e => formRechazar.setData('motivo_rechazo', e.target.value)}
                                    className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 bg-gray-50" 
                                    placeholder="Ej. Se detectó parentesco directo, Identificación falsa, etc."
                                />
                                {formRechazar.errors.motivo_rechazo && <p className="text-red-500 text-xs mt-1 font-semibold">{formRechazar.errors.motivo_rechazo}</p>}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowRechazar(false)} className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-bold transition-colors">Cancelar</button>
                                <button type="submit" disabled={formRechazar.processing} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-colors">Confirmar Rechazo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </TabletLayout>
    );
}   