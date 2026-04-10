import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import ClabeInput from '@/Components/ClabeInput';
import DocumentScanner from '@/Components/DocumentScanner'; // <-- IMPORTAMOS EL ESCÁNER
import { formatCurrency, formatNumber, statusBadgeClass } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCheckCircle } from '@fortawesome/free-solid-svg-icons'; // <-- Iconos para los botones

export default function Create({
    distribuidora,
    prevalidacion,
    productos = [],
    clientes = { todos: [], elegibles: [], observados: [] },
    seleccion = {},
    simulacion,
    bloqueos = [],
    puedeContinuar = false,
}) {
    const sinConfig = !distribuidora;
    const { errors } = usePage().props;

    const [modoCliente, setModoCliente] = useState('nuevo'); // 'nuevo' | 'existente'
    const [form, setForm] = useState({
        producto_id: seleccion.producto_id || '',
        cliente_id: '',
        // Datos de persona (cliente nuevo)
        primer_nombre: '',
        segundo_nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        sexo: '',
        fecha_nacimiento: '',
        curp: '',
        telefono_celular: '',
        correo_electronico: '',
        calle: '',
        numero_exterior: '',
        colonia: '',
        ciudad: '',
        estado_direccion: '',
        codigo_postal: '',
        // Fotos y cuenta bancaria
        foto_ine_frente: null,
        foto_ine_reverso: null,
        foto_selfie_ine: null,
        cuenta_banco: '',
        cuenta_clabe: '',
        cuenta_titular: '',
    });

    // --- NUEVOS ESTADOS PARA EL ESCÁNER ---
    const [scannerOpen, setScannerOpen] = useState(false);
    const [currentScanType, setCurrentScanType] = useState(''); // 'frente' | 'reverso' | 'selfie'
    // --------------------------------------

    const [enviando, setEnviando] = useState(false);
    const [modalCliente, setModalCliente] = useState(false);

    const productoSeleccionado = useMemo(
        () => (productos || []).find((item) => Number(item.id) === Number(form.producto_id)),
        [productos, form.producto_id],
    );

    const clienteExistenteSeleccionado = useMemo(
        () => (clientes.todos || []).find((c) => Number(c.id) === Number(form.cliente_id)),
        [clientes.todos, form.cliente_id],
    );

    // Auto-calcular al cambiar producto
    useEffect(() => {
        if (!form.producto_id) return;
        router.get(route('distribuidora.vales.create'), { producto_id: form.producto_id }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [form.producto_id]);

    const actualizarCampo = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const cambiarModo = (modo) => {
        setModoCliente(modo);
    };

    const limpiar = () => {
        setForm((prev) => ({ ...prev, producto_id: '' }));
        router.get(route('distribuidora.vales.create'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // --- FUNCIÓN QUE RECIBE LA IMAGEN DEL ESCÁNER ---
    const handleCapture = (file, previewUrl) => {
        if (currentScanType === 'frente') {
            actualizarCampo('foto_ine_frente', file);
        } else if (currentScanType === 'reverso') {
            actualizarCampo('foto_ine_reverso', file);
        } else if (currentScanType === 'selfie') {
            actualizarCampo('foto_selfie_ine', file);
        }
        setScannerOpen(false); 
    };
    // ------------------------------------------------

    const confirmarPreVale = () => {
        if (enviando) return;
        setEnviando(true);

        const payload = new FormData();
        payload.append('producto_id', form.producto_id);

        if (modoCliente === 'existente') {
            payload.append('cliente_id', form.cliente_id);
        } else {
            const camposTexto = [
                'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno',
                'sexo', 'fecha_nacimiento', 'curp', 'telefono_celular', 'correo_electronico',
                'calle', 'numero_exterior', 'colonia', 'ciudad', 'estado_direccion', 'codigo_postal',
                'cuenta_banco', 'cuenta_clabe', 'cuenta_titular',
            ];
            camposTexto.forEach((k) => { if (form[k]) payload.append(k, form[k]); });

            if (form.foto_ine_frente) payload.append('foto_ine_frente', form.foto_ine_frente);
            if (form.foto_ine_reverso) payload.append('foto_ine_reverso', form.foto_ine_reverso);
            if (form.foto_selfie_ine) payload.append('foto_selfie_ine', form.foto_selfie_ine);
        }

        router.post(route('distribuidora.vales.store'), payload, {
            forceFormData: true,
            onError: () => setEnviando(false),
            onFinish: () => setEnviando(false),
        });
    };

    const clienteNuevoLleno = form.primer_nombre.trim() && form.apellido_paterno.trim();
    const clienteListo = modoCliente === 'existente' ? !!form.cliente_id : clienteNuevoLleno;
    const hayElegibles = (clientes.elegibles || []).length > 0;

    return (
        <DistribuidoraLayout
            title="Nuevo pre vale"
            subtitle="Selecciona el producto, registra o selecciona al cliente y confirma el pre vale."
        >
            <Head title="Nuevo pre vale" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">No se encontró una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí podrás crear pre vales.</p>
                </div>
            ) : (
                <>
                    {/* Tarjetas de estado */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Emisión</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{prevalidacion.puede_emitir_vales ? 'Habilitada' : 'Bloqueada'}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Crédito disponible</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{prevalidacion.sin_limite ? 'Sin límite' : formatCurrency(prevalidacion.credito_disponible)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Clientes elegibles</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{formatNumber((clientes.elegibles || []).length)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-xs font-medium text-gray-500">Por conciliar</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{formatNumber(prevalidacion.pagos_pendientes_conciliar)}</p>
                        </div>
                    </div>

                    {/* Errores generales */}
                    {errors?.general && (
                        <div className="mt-4 fin-card border-red-200 bg-red-50">
                            <p className="text-sm font-semibold text-red-800">{errors.general}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-3">
                        {/* Columna izquierda */}
                        <div className="space-y-4 xl:col-span-2">
                            {/* Producto */}
                            <div className="fin-card">
                                <h2 className="fin-title">Producto financiero</h2>
                                <div className="flex items-end gap-3 mt-3">
                                    <div className="flex-1">
                                        <select value={form.producto_id} onChange={(e) => actualizarCampo('producto_id', e.target.value)} className="fin-input">
                                            <option value="">Selecciona un producto</option>
                                            {productos.map((p) => (
                                                <option key={p.id} value={p.id}>{p.nombre} — {formatCurrency(p.monto_principal)}</option>
                                            ))}
                                        </select>
                                        {errors?.producto_id && <p className="mt-1 text-sm text-red-600">{errors.producto_id}</p>}
                                    </div>
                                    {form.producto_id && (
                                        <button type="button" onClick={limpiar} className="px-4 py-2 text-sm fin-btn-secondary">Limpiar</button>
                                    )}
                                </div>
                                {productoSeleccionado && (
                                    <div className="grid grid-cols-2 gap-3 p-3 mt-3 rounded-lg md:grid-cols-4 bg-gray-50">
                                        <div><p className="text-xs text-gray-500">Código</p><p className="text-sm font-semibold">{productoSeleccionado.codigo}</p></div>
                                        <div><p className="text-xs text-gray-500">Quincenas</p><p className="text-sm font-semibold">{productoSeleccionado.numero_quincenas}</p></div>
                                        <div><p className="text-xs text-gray-500">Desembolso</p><p className="text-sm font-semibold">{productoSeleccionado.modo_desembolso}</p></div>
                                        <div><p className="text-xs text-gray-500">Multa base</p><p className="text-sm font-semibold">{formatCurrency(productoSeleccionado.monto_multa_tardia)}</p></div>
                                    </div>
                                )}
                            </div>

                            {/* Toggle Cliente nuevo / existente */}
                            <div className="fin-card">
                                <div className="flex items-center gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => cambiarModo('nuevo')}
                                        className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${modoCliente === 'nuevo' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Cliente nuevo
                                    </button>
                                    {hayElegibles && (
                                        <button
                                            type="button"
                                            onClick={() => cambiarModo('existente')}
                                            className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${modoCliente === 'existente' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            Cliente existente ({(clientes.elegibles || []).length})
                                        </button>
                                    )}
                                </div>

                                {modoCliente === 'existente' ? (
                                    <>
                                        <select value={form.cliente_id} onChange={(e) => actualizarCampo('cliente_id', e.target.value)} className="fin-input">
                                            <option value="">Selecciona un cliente</option>
                                            {(clientes.elegibles || []).map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.codigo_cliente ? `${c.codigo_cliente} · ` : ''}{c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {errors?.cliente_id && <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>}

                                        {clienteExistenteSeleccionado && (
                                            <div className="grid grid-cols-2 gap-3 p-3 mt-3 rounded-lg bg-gray-50">
                                                <div>
                                                    <p className="text-xs text-gray-500">Nombre</p>
                                                    <p className="text-sm font-semibold">{clienteExistenteSeleccionado.nombre}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Estado</p>
                                                    <span className={statusBadgeClass(clienteExistenteSeleccionado.estado_cliente)}>{clienteExistenteSeleccionado.estado_cliente}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Vales abiertos</p>
                                                    <p className="text-sm font-semibold">{formatNumber(clienteExistenteSeleccionado.vales_abiertos)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Saldo pendiente</p>
                                                    <p className="text-sm font-semibold">{formatCurrency(clienteExistenteSeleccionado.saldo_pendiente)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500">
                                                {clienteNuevoLleno
                                                    ? [form.primer_nombre, form.segundo_nombre, form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ')
                                                    : 'Registra los datos del nuevo cliente.'}
                                            </p>
                                            <button type="button" onClick={() => setModalCliente(true)} className="px-4 py-2 text-sm fin-btn-primary">
                                                {clienteNuevoLleno ? 'Editar datos' : 'Registrar cliente'}
                                            </button>
                                        </div>
                                        {clienteNuevoLleno && (
                                            <div className="grid grid-cols-2 gap-3 p-3 mt-3 rounded-lg bg-gray-50">
                                                {form.curp && <div><p className="text-xs text-gray-500">CURP</p><p className="text-sm font-semibold">{form.curp}</p></div>}
                                                {form.telefono_celular && <div><p className="text-xs text-gray-500">Teléfono</p><p className="text-sm font-semibold">{form.telefono_celular}</p></div>}
                                                {form.correo_electronico && <div><p className="text-xs text-gray-500">Correo</p><p className="text-sm font-semibold">{form.correo_electronico}</p></div>}
                                                {(form.calle || form.colonia || form.ciudad) && (
                                                    <div className="col-span-2"><p className="text-xs text-gray-500">Dirección</p><p className="text-sm font-semibold">{[form.calle, form.numero_exterior, form.colonia, form.ciudad, form.estado_direccion, form.codigo_postal].filter(Boolean).join(', ')}</p></div>
                                                )}
                                                {form.cuenta_banco && (
                                                    <div><p className="text-xs text-gray-500">Banco</p><p className="text-sm font-semibold">{form.cuenta_banco}</p></div>
                                                )}
                                                {form.cuenta_clabe && (
                                                    <div><p className="text-xs text-gray-500">CLABE</p><p className="text-sm font-semibold">{form.cuenta_clabe}</p></div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-gray-500">Documentos</p>
                                                    <p className="text-sm font-semibold">
                                                        {[form.foto_ine_frente && 'INE frente', form.foto_ine_reverso && 'INE reverso', form.foto_selfie_ine && 'Selfie'].filter(Boolean).join(', ') || 'Sin documentos'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {(errors?.primer_nombre || errors?.apellido_paterno || errors?.curp || errors?.correo_electronico || errors?.foto_ine_frente || errors?.foto_ine_reverso || errors?.foto_selfie_ine || errors?.cuenta_banco || errors?.cuenta_clabe || errors?.cuenta_titular) && (
                                            <div className="p-3 mt-3 border rounded-lg border-red-200 bg-red-50">
                                                {errors?.primer_nombre && <p className="text-sm text-red-600">{errors.primer_nombre}</p>}
                                                {errors?.apellido_paterno && <p className="text-sm text-red-600">{errors.apellido_paterno}</p>}
                                                {errors?.curp && <p className="text-sm text-red-600">{errors.curp}</p>}
                                                {errors?.correo_electronico && <p className="text-sm text-red-600">{errors.correo_electronico}</p>}
                                                {errors?.foto_ine_frente && <p className="text-sm text-red-600">{errors.foto_ine_frente}</p>}
                                                {errors?.foto_ine_reverso && <p className="text-sm text-red-600">{errors.foto_ine_reverso}</p>}
                                                {errors?.foto_selfie_ine && <p className="text-sm text-red-600">{errors.foto_selfie_ine}</p>}
                                                {errors?.cuenta_banco && <p className="text-sm text-red-600">{errors.cuenta_banco}</p>}
                                                {errors?.cuenta_clabe && <p className="text-sm text-red-600">{errors.cuenta_clabe}</p>}
                                                {errors?.cuenta_titular && <p className="text-sm text-red-600">{errors.cuenta_titular}</p>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Columna derecha */}
                        <div className="space-y-4">
                            {!!bloqueos.length && (
                                <div className="fin-card border-red-200 bg-red-50">
                                    <p className="font-semibold text-red-800">Pre vale bloqueado</p>
                                    <ul className="mt-2 space-y-1 text-sm text-red-700 list-disc list-inside">
                                        {bloqueos.map((b) => <li key={b}>{b}</li>)}
                                    </ul>
                                </div>
                            )}

                            {simulacion ? (
                                <div className="fin-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <h2 className="fin-title">Desglose del pre vale</h2>
                                        <span className={statusBadgeClass(puedeContinuar ? 'ACTIVO' : 'PAGO_PARCIAL')}>
                                            {puedeContinuar ? 'LISTO' : 'BLOQUEADO'}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Monto principal</span><span className="font-semibold">{formatCurrency(simulacion.monto_principal)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Comisión empresa</span><span className="font-semibold">{formatCurrency(simulacion.comision_empresa)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Seguro</span><span className="font-semibold">{formatCurrency(simulacion.seguro)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Interés total</span><span className="font-semibold">{formatCurrency(simulacion.interes_total)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Ganancia distribuidora</span><span className="font-semibold">{formatCurrency(simulacion.ganancia_distribuidora)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Multa base</span><span className="font-semibold">{formatCurrency(simulacion.multa_base)}</span></div>
                                        <hr className="my-2" />
                                        <div className="flex justify-between text-base"><span className="font-semibold text-gray-700">Total deuda</span><span className="font-bold">{formatCurrency(simulacion.total_deuda)}</span></div>
                                        <div className="flex justify-between text-base"><span className="font-semibold text-gray-700">Pago quincenal</span><span className="font-bold">{formatCurrency(simulacion.monto_quincenal)}</span></div>
                                        <hr className="my-2" />
                                        <div className="flex justify-between"><span className="text-gray-500">Consumo de crédito</span><span className="font-semibold">{formatCurrency(simulacion.consumo_credito)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Crédito restante</span><span className="font-semibold">{simulacion.credito_restante === null ? 'Sin límite' : formatCurrency(simulacion.credito_restante)}</span></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="fin-card">
                                    <p className="font-semibold text-gray-900">Sin desglose</p>
                                    <p className="mt-1 text-sm text-gray-500">Selecciona un producto para ver el desglose financiero.</p>
                                </div>
                            )}

                            {/* Botón confirmar */}
                            {simulacion && puedeContinuar && (
                                <div className="fin-card border-green-200 bg-green-50">
                                    <p className="text-sm text-green-700">
                                        {modoCliente === 'existente'
                                            ? 'Se creará el pre vale en estado borrador para el cliente seleccionado.'
                                            : 'Se registrará al cliente nuevo y se creará el pre vale en estado borrador.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={confirmarPreVale}
                                        disabled={enviando || !clienteListo}
                                        className="w-full mt-3 fin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {enviando ? 'Creando pre vale...' : 'Confirmar pre vale'}
                                    </button>
                                    {!clienteListo && (
                                        <p className="mt-2 text-xs text-amber-700">
                                            {modoCliente === 'existente' ? 'Selecciona un cliente para continuar.' : 'Registra los datos del cliente para continuar.'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal de registro de cliente nuevo */}
                    {modalCliente && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModalCliente(false)}>
                            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b rounded-t-2xl">
                                    <h2 className="text-lg font-bold text-gray-900">Datos del cliente nuevo</h2>
                                    <button type="button" onClick={() => setModalCliente(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
                                </div>
                                <div className="p-5 space-y-5">
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Datos personales</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Primer nombre *</label>
                                                <input type="text" value={form.primer_nombre} onChange={(e) => actualizarCampo('primer_nombre', e.target.value)} className="fin-input" placeholder="María" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Segundo nombre</label>
                                                <input type="text" value={form.segundo_nombre} onChange={(e) => actualizarCampo('segundo_nombre', e.target.value)} className="fin-input" placeholder="Guadalupe" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Apellido paterno *</label>
                                                <input type="text" value={form.apellido_paterno} onChange={(e) => actualizarCampo('apellido_paterno', e.target.value)} className="fin-input" placeholder="López" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Apellido materno</label>
                                                <input type="text" value={form.apellido_materno} onChange={(e) => actualizarCampo('apellido_materno', e.target.value)} className="fin-input" placeholder="García" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">CURP</label>
                                                <input type="text" value={form.curp} onChange={(e) => actualizarCampo('curp', e.target.value.toUpperCase())} className="fin-input" placeholder="LOPM850101MDFRRL09" maxLength={18} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Sexo</label>
                                                <select value={form.sexo} onChange={(e) => actualizarCampo('sexo', e.target.value)} className="fin-input">
                                                    <option value="">Selecciona</option>
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Femenino</option>
                                                    <option value="OTRO">Otro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Fecha de nacimiento</label>
                                                <input type="date" value={form.fecha_nacimiento} onChange={(e) => actualizarCampo('fecha_nacimiento', e.target.value)} className="fin-input" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Teléfono celular</label>
                                                <input type="tel" value={form.telefono_celular} onChange={(e) => actualizarCampo('telefono_celular', e.target.value)} className="fin-input" placeholder="5512345678" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Correo electrónico</label>
                                                <input type="email" value={form.correo_electronico} onChange={(e) => actualizarCampo('correo_electronico', e.target.value)} className="fin-input" placeholder="maria@correo.com" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Dirección</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Calle</label>
                                                <input type="text" value={form.calle} onChange={(e) => actualizarCampo('calle', e.target.value)} className="fin-input" placeholder="Av. Reforma" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Número exterior</label>
                                                <input type="text" value={form.numero_exterior} onChange={(e) => actualizarCampo('numero_exterior', e.target.value)} className="fin-input" placeholder="123" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Colonia</label>
                                                <input type="text" value={form.colonia} onChange={(e) => actualizarCampo('colonia', e.target.value)} className="fin-input" placeholder="Centro" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Ciudad</label>
                                                <input type="text" value={form.ciudad} onChange={(e) => actualizarCampo('ciudad', e.target.value)} className="fin-input" placeholder="Puebla" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Estado</label>
                                                <input type="text" value={form.estado_direccion} onChange={(e) => actualizarCampo('estado_direccion', e.target.value)} className="fin-input" placeholder="Puebla" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Código postal</label>
                                                <input type="text" value={form.codigo_postal} onChange={(e) => actualizarCampo('codigo_postal', e.target.value)} className="fin-input" placeholder="72000" maxLength={10} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documentos (fotos) CON EL NUEVO ESCÁNER */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Documentos</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">INE frente *</label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setCurrentScanType('frente'); setScannerOpen(true); }}
                                                    className={`w-full h-12 border-2 border-dashed rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${form.foto_ine_frente ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                                                >
                                                    <FontAwesomeIcon icon={form.foto_ine_frente ? faCheckCircle : faCamera} />
                                                    {form.foto_ine_frente ? 'Escaneada ✓' : 'Escanear Frente'}
                                                </button>
                                                {errors?.foto_ine_frente && <p className="mt-1 text-xs text-red-600">{errors.foto_ine_frente}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">INE reverso *</label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setCurrentScanType('reverso'); setScannerOpen(true); }}
                                                    className={`w-full h-12 border-2 border-dashed rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${form.foto_ine_reverso ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                                                >
                                                    <FontAwesomeIcon icon={form.foto_ine_reverso ? faCheckCircle : faCamera} />
                                                    {form.foto_ine_reverso ? 'Escaneada ✓' : 'Escanear Reverso'}
                                                </button>
                                                {errors?.foto_ine_reverso && <p className="mt-1 text-xs text-red-600">{errors.foto_ine_reverso}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Selfie con INE *</label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setCurrentScanType('selfie'); setScannerOpen(true); }}
                                                    className={`w-full h-12 border-2 border-dashed rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${form.foto_selfie_ine ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                                                >
                                                    <FontAwesomeIcon icon={form.foto_selfie_ine ? faCheckCircle : faCamera} />
                                                    {form.foto_selfie_ine ? 'Capturada ✓' : 'Tomar Selfie'}
                                                </button>
                                                {errors?.foto_selfie_ine && <p className="mt-1 text-xs text-red-600">{errors.foto_selfie_ine}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuenta bancaria */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Cuenta bancaria</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">CLABE interbancaria *</label>
                                                <ClabeInput
                                                    value={form.cuenta_clabe}
                                                    onChange={(val) => actualizarCampo('cuenta_clabe', val)}
                                                    onBankDetected={(banco) => actualizarCampo('cuenta_banco', banco)}
                                                    error={errors?.cuenta_clabe}
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Banco</label>
                                                <input type="text" value={form.cuenta_banco} readOnly className="fin-input bg-gray-50 cursor-not-allowed" placeholder="Se detecta automáticamente" />
                                                {errors?.cuenta_banco && <p className="mt-1 text-xs text-red-600">{errors.cuenta_banco}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Titular *</label>
                                                <input type="text" value={form.cuenta_titular} onChange={(e) => actualizarCampo('cuenta_titular', e.target.value)} className="fin-input" placeholder="Nombre del titular" />
                                                {errors?.cuenta_titular && <p className="mt-1 text-xs text-red-600">{errors.cuenta_titular}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="sticky bottom-0 p-5 bg-white border-t rounded-b-2xl">
                                    {(() => {
                                        const faltantes = [];
                                        if (!form.primer_nombre.trim()) faltantes.push('Primer nombre');
                                        if (!form.apellido_paterno.trim()) faltantes.push('Apellido paterno');
                                        if (!form.foto_ine_frente) faltantes.push('INE frente');
                                        if (!form.foto_ine_reverso) faltantes.push('INE reverso');
                                        if (!form.foto_selfie_ine) faltantes.push('Selfie con INE');
                                        if (!form.cuenta_banco.trim()) faltantes.push('Banco');
                                        if (!form.cuenta_clabe.trim()) faltantes.push('CLABE');
                                        if (!form.cuenta_titular.trim()) faltantes.push('Titular');
                                        const completo = faltantes.length === 0;

                                        return (
                                            <>
                                                {!completo && (
                                                    <p className="mb-3 text-xs text-amber-700">
                                                        Faltan: {faltantes.join(', ')}
                                                    </p>
                                                )}
                                                <div className="flex justify-end gap-3">
                                                    <button type="button" onClick={() => setModalCliente(false)} className="px-6 py-2 fin-btn-secondary">Cancelar</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalCliente(false)}
                                                        disabled={!completo}
                                                        className="px-6 py-2 fin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Confirmar datos del cliente
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* --- COMPONENTE DEL ESCÁNER MONTADO AL FINAL --- */}
            {scannerOpen && (
                <DocumentScanner 
                    title={
                        currentScanType === 'frente' ? "Escanea el Frente del INE" : 
                        currentScanType === 'reverso' ? "Escanea el Reverso del INE" : 
                        "Tómale una Selfie al cliente con su INE"
                    }
                    onCapture={handleCapture}
                    onCancel={() => setScannerOpen(false)}
                />
            )}

        </DistribuidoraLayout>
    );
}