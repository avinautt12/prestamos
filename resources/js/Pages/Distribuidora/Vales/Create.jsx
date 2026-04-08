import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatNumber, statusBadgeClass } from '../utils';

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

    const [form, setForm] = useState({
        producto_id: seleccion.producto_id || '',
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
    });

    const [enviando, setEnviando] = useState(false);
    const [modalCliente, setModalCliente] = useState(false);

    const productoSeleccionado = useMemo(
        () => (productos || []).find((item) => Number(item.id) === Number(form.producto_id)),
        [productos, form.producto_id],
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

    const limpiar = () => {
        setForm((prev) => ({ ...prev, producto_id: '' }));
        router.get(route('distribuidora.vales.create'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const confirmarPreVale = () => {
        if (enviando) return;
        setEnviando(true);
        router.post(route('distribuidora.vales.store'), form, {
            onError: () => setEnviando(false),
            onFinish: () => setEnviando(false),
        });
    };

    const clienteLleno = form.primer_nombre.trim() && form.apellido_paterno.trim();

    return (
        <DistribuidoraLayout
            title="Nuevo pre vale"
            subtitle="Selecciona el producto, registra al cliente y confirma el pre vale."
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
                        {/* Columna izquierda: producto + cliente */}
                        <div className="space-y-4 xl:col-span-2">
                            {/* Selección de producto */}
                            <div className="fin-card">
                                <h2 className="fin-title">Producto financiero</h2>
                                <div className="flex items-end gap-3 mt-3">
                                    <div className="flex-1">
                                        <select
                                            value={form.producto_id}
                                            onChange={(e) => actualizarCampo('producto_id', e.target.value)}
                                            className="fin-input"
                                        >
                                            <option value="">Selecciona un producto</option>
                                            {productos.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nombre} — {formatCurrency(p.monto_principal)}
                                                </option>
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
                                        <div>
                                            <p className="text-xs text-gray-500">Código</p>
                                            <p className="text-sm font-semibold">{productoSeleccionado.codigo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Quincenas</p>
                                            <p className="text-sm font-semibold">{productoSeleccionado.numero_quincenas}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Desembolso</p>
                                            <p className="text-sm font-semibold">{productoSeleccionado.modo_desembolso}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Multa base</p>
                                            <p className="text-sm font-semibold">{formatCurrency(productoSeleccionado.monto_multa_tardia)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cliente nuevo - resumen + botón para abrir modal */}
                            <div className="fin-card">
                                <div className="flex items-center justify-between">
                                    <h2 className="fin-title">Cliente nuevo</h2>
                                    <button
                                        type="button"
                                        onClick={() => setModalCliente(true)}
                                        className="px-4 py-2 text-sm fin-btn-primary"
                                    >
                                        {clienteLleno ? 'Editar datos' : 'Registrar cliente'}
                                    </button>
                                </div>

                                {clienteLleno ? (
                                    <div className="grid grid-cols-1 gap-3 p-3 mt-3 rounded-lg md:grid-cols-2 bg-gray-50">
                                        <div>
                                            <p className="text-xs text-gray-500">Nombre completo</p>
                                            <p className="text-sm font-semibold">
                                                {[form.primer_nombre, form.segundo_nombre, form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ')}
                                            </p>
                                        </div>
                                        {form.curp && (
                                            <div>
                                                <p className="text-xs text-gray-500">CURP</p>
                                                <p className="text-sm font-semibold">{form.curp}</p>
                                            </div>
                                        )}
                                        {form.telefono_celular && (
                                            <div>
                                                <p className="text-xs text-gray-500">Teléfono</p>
                                                <p className="text-sm font-semibold">{form.telefono_celular}</p>
                                            </div>
                                        )}
                                        {form.correo_electronico && (
                                            <div>
                                                <p className="text-xs text-gray-500">Correo</p>
                                                <p className="text-sm font-semibold">{form.correo_electronico}</p>
                                            </div>
                                        )}
                                        {(form.calle || form.colonia || form.ciudad) && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-gray-500">Dirección</p>
                                                <p className="text-sm font-semibold">
                                                    {[form.calle, form.numero_exterior, form.colonia, form.ciudad, form.estado_direccion, form.codigo_postal].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">Haz clic en "Registrar cliente" para ingresar los datos del nuevo cliente.</p>
                                )}
                                {(errors?.primer_nombre || errors?.apellido_paterno || errors?.curp || errors?.correo_electronico) && (
                                    <div className="p-3 mt-3 border rounded-lg border-red-200 bg-red-50">
                                        {errors?.primer_nombre && <p className="text-sm text-red-600">{errors.primer_nombre}</p>}
                                        {errors?.apellido_paterno && <p className="text-sm text-red-600">{errors.apellido_paterno}</p>}
                                        {errors?.curp && <p className="text-sm text-red-600">{errors.curp}</p>}
                                        {errors?.correo_electronico && <p className="text-sm text-red-600">{errors.correo_electronico}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna derecha: desglose + confirmar */}
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
                                        Se registrará al cliente y se creará el pre vale en estado borrador.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={confirmarPreVale}
                                        disabled={enviando || !clienteLleno}
                                        className="w-full mt-3 fin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {enviando ? 'Creando pre vale...' : 'Confirmar pre vale'}
                                    </button>
                                    {!clienteLleno && (
                                        <p className="mt-2 text-xs text-amber-700">Registra los datos del cliente para continuar.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal de registro de cliente */}
                    {modalCliente && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModalCliente(false)}>
                            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b rounded-t-2xl">
                                    <h2 className="text-lg font-bold text-gray-900">Datos del cliente nuevo</h2>
                                    <button type="button" onClick={() => setModalCliente(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
                                </div>
                                <div className="p-5 space-y-5">
                                    {/* Datos personales */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Datos personales</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Primer nombre *</label>
                                                <input type="text" value={form.primer_nombre} onChange={(e) => actualizarCampo('primer_nombre', e.target.value)} className="fin-input" placeholder="María" />
                                                {errors?.primer_nombre && <p className="mt-1 text-xs text-red-600">{errors.primer_nombre}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Segundo nombre</label>
                                                <input type="text" value={form.segundo_nombre} onChange={(e) => actualizarCampo('segundo_nombre', e.target.value)} className="fin-input" placeholder="Guadalupe" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Apellido paterno *</label>
                                                <input type="text" value={form.apellido_paterno} onChange={(e) => actualizarCampo('apellido_paterno', e.target.value)} className="fin-input" placeholder="López" />
                                                {errors?.apellido_paterno && <p className="mt-1 text-xs text-red-600">{errors.apellido_paterno}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Apellido materno</label>
                                                <input type="text" value={form.apellido_materno} onChange={(e) => actualizarCampo('apellido_materno', e.target.value)} className="fin-input" placeholder="García" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">CURP</label>
                                                <input type="text" value={form.curp} onChange={(e) => actualizarCampo('curp', e.target.value.toUpperCase())} className="fin-input" placeholder="LOPM850101MDFRRL09" maxLength={18} />
                                                {errors?.curp && <p className="mt-1 text-xs text-red-600">{errors.curp}</p>}
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
                                                {errors?.correo_electronico && <p className="mt-1 text-xs text-red-600">{errors.correo_electronico}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dirección */}
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
                                </div>
                                <div className="sticky bottom-0 flex justify-end gap-3 p-5 bg-white border-t rounded-b-2xl">
                                    <button type="button" onClick={() => setModalCliente(false)} className="px-6 py-2 fin-btn-secondary">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </DistribuidoraLayout>
    );
}
