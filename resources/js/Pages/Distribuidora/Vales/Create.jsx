import React, { useMemo, useState } from 'react';
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
    });

    const [enviando, setEnviando] = useState(false);

    const productoSeleccionado = useMemo(
        () => (productos || []).find((item) => Number(item.id) === Number(form.producto_id)),
        [productos, form.producto_id],
    );

    const actualizarCampo = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const aplicarSimulacion = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.vales.create'), { producto_id: form.producto_id }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiar = () => {
        setForm({
            producto_id: '',
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

    const hayErroresPersona = !!(errors?.primer_nombre || errors?.apellido_paterno || errors?.curp || errors?.correo_electronico);

    return (
        <DistribuidoraLayout
            title="Preparar pre vale"
            subtitle="Registra los datos del cliente nuevo, selecciona el producto y confirma el pre vale."
        >
            <Head title="Preparar pre vale" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">No se encontró una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás la validación previa del pre vale.</p>
                </div>
            ) : (
                <>
                    {/* Tarjetas de prevalidación */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Puede iniciar vale</p>
                            <p className="fin-stat-value">{prevalidacion.puede_emitir_vales ? 'Sí' : 'No'}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Crédito disponible</p>
                            <p className="fin-stat-value">{prevalidacion.sin_limite ? 'Sin límite' : formatCurrency(prevalidacion.credito_disponible)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Clientes elegibles</p>
                            <p className="fin-stat-value">{formatNumber((clientes.elegibles || []).length)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Pagos por conciliar</p>
                            <p className="fin-stat-value">{formatNumber(prevalidacion.pagos_pendientes_conciliar)}</p>
                        </div>
                    </div>

                    {/* Errores generales del servidor */}
                    {errors?.general && (
                        <div className="mt-4 fin-card border-red-200 bg-red-50">
                            <p className="text-sm font-semibold text-red-800">{errors.general}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-5">
                        {/* Columna izquierda: formulario */}
                        <div className="space-y-4 xl:col-span-3">
                            {/* Selección de producto */}
                            <div className="fin-card">
                                <h2 className="fin-title">Producto financiero</h2>
                                <p className="mt-1 fin-subtitle">Selecciona el producto. El monto principal viene definido por el plan financiero.</p>

                                <form onSubmit={aplicarSimulacion} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Producto</label>
                                        <select
                                            value={form.producto_id}
                                            onChange={(e) => actualizarCampo('producto_id', e.target.value)}
                                            className="fin-input"
                                        >
                                            <option value="">Selecciona un producto</option>
                                            {productos.map((producto) => (
                                                <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                                            ))}
                                        </select>
                                        {errors?.producto_id && <p className="mt-1 text-sm text-red-600">{errors.producto_id}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="submit" className="w-full fin-btn-primary">Actualizar simulación</button>
                                        <button type="button" onClick={limpiar} className="w-full fin-btn-secondary">Limpiar</button>
                                    </div>
                                </form>
                            </div>

                            {productoSeleccionado && (
                                <div className="fin-card">
                                    <h2 className="fin-title">Producto seleccionado</h2>
                                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Producto</p>
                                            <p className="mt-1 font-semibold text-gray-900">{productoSeleccionado.nombre}</p>
                                            <p className="mt-1 text-sm text-gray-500">{productoSeleccionado.codigo} · {formatCurrency(productoSeleccionado.monto_principal)} · {productoSeleccionado.numero_quincenas} quincenas</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Desembolso</p>
                                            <p className="mt-1 font-semibold text-gray-900">{productoSeleccionado.modo_desembolso}</p>
                                            <p className="mt-1 text-sm text-gray-500">Multa base {formatCurrency(productoSeleccionado.monto_multa_tardia)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Datos del cliente nuevo */}
                            <div className={`fin-card ${hayErroresPersona ? 'border-red-200' : ''}`}>
                                <h2 className="fin-title">Datos del cliente nuevo</h2>
                                <p className="mt-1 fin-subtitle">Ingresa los datos personales del cliente que solicita el pre vale.</p>

                                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Primer nombre *</label>
                                        <input
                                            type="text"
                                            value={form.primer_nombre}
                                            onChange={(e) => actualizarCampo('primer_nombre', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. María"
                                        />
                                        {errors?.primer_nombre && <p className="mt-1 text-sm text-red-600">{errors.primer_nombre}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Segundo nombre</label>
                                        <input
                                            type="text"
                                            value={form.segundo_nombre}
                                            onChange={(e) => actualizarCampo('segundo_nombre', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. Guadalupe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Apellido paterno *</label>
                                        <input
                                            type="text"
                                            value={form.apellido_paterno}
                                            onChange={(e) => actualizarCampo('apellido_paterno', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. López"
                                        />
                                        {errors?.apellido_paterno && <p className="mt-1 text-sm text-red-600">{errors.apellido_paterno}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Apellido materno</label>
                                        <input
                                            type="text"
                                            value={form.apellido_materno}
                                            onChange={(e) => actualizarCampo('apellido_materno', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. García"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">CURP</label>
                                        <input
                                            type="text"
                                            value={form.curp}
                                            onChange={(e) => actualizarCampo('curp', e.target.value.toUpperCase())}
                                            className="fin-input"
                                            placeholder="LOPM850101MDFRRL09"
                                            maxLength={18}
                                        />
                                        {errors?.curp && <p className="mt-1 text-sm text-red-600">{errors.curp}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Sexo</label>
                                        <select
                                            value={form.sexo}
                                            onChange={(e) => actualizarCampo('sexo', e.target.value)}
                                            className="fin-input"
                                        >
                                            <option value="">Selecciona</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha de nacimiento</label>
                                        <input
                                            type="date"
                                            value={form.fecha_nacimiento}
                                            onChange={(e) => actualizarCampo('fecha_nacimiento', e.target.value)}
                                            className="fin-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Teléfono celular</label>
                                        <input
                                            type="tel"
                                            value={form.telefono_celular}
                                            onChange={(e) => actualizarCampo('telefono_celular', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. 5512345678"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Correo electrónico</label>
                                        <input
                                            type="email"
                                            value={form.correo_electronico}
                                            onChange={(e) => actualizarCampo('correo_electronico', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. maria@correo.com"
                                        />
                                        {errors?.correo_electronico && <p className="mt-1 text-sm text-red-600">{errors.correo_electronico}</p>}
                                    </div>
                                </div>

                                {/* Dirección */}
                                <h3 className="mt-6 text-sm font-semibold text-gray-700">Dirección</h3>
                                <div className="grid grid-cols-1 gap-4 mt-3 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Calle</label>
                                        <input
                                            type="text"
                                            value={form.calle}
                                            onChange={(e) => actualizarCampo('calle', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. Av. Reforma"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Número exterior</label>
                                        <input
                                            type="text"
                                            value={form.numero_exterior}
                                            onChange={(e) => actualizarCampo('numero_exterior', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. 123"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Colonia</label>
                                        <input
                                            type="text"
                                            value={form.colonia}
                                            onChange={(e) => actualizarCampo('colonia', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. Centro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Ciudad</label>
                                        <input
                                            type="text"
                                            value={form.ciudad}
                                            onChange={(e) => actualizarCampo('ciudad', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. Puebla"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Estado</label>
                                        <input
                                            type="text"
                                            value={form.estado_direccion}
                                            onChange={(e) => actualizarCampo('estado_direccion', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. Puebla"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Código postal</label>
                                        <input
                                            type="text"
                                            value={form.codigo_postal}
                                            onChange={(e) => actualizarCampo('codigo_postal', e.target.value)}
                                            className="fin-input"
                                            placeholder="Ej. 72000"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha: checklist + simulación + confirmación */}
                        <div className="space-y-4 xl:col-span-2">
                            <div className="fin-card">
                                <h2 className="fin-title">Checklist base</h2>
                                <div className="mt-4 space-y-3 text-sm text-gray-700">
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Distribuidora activa</span>
                                        <span className={statusBadgeClass(prevalidacion.estado)}>{prevalidacion.estado || 'SIN ESTADO'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Inicio de vale habilitado</span>
                                        <span className={statusBadgeClass(prevalidacion.puede_emitir_vales ? 'ACTIVO' : 'BLOQUEADO')}>
                                            {prevalidacion.puede_emitir_vales ? 'HABILITADA' : 'BLOQUEADA'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Clientes activos disponibles</span>
                                        <span className="font-semibold text-gray-900">{formatNumber(prevalidacion.clientes_activos)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl border-gray-200">
                                        <span>Opera sin límite</span>
                                        <span className="font-semibold text-gray-900">{prevalidacion.sin_limite ? 'Sí' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {!!bloqueos.length && (
                                <div className="fin-card border-red-200 bg-red-50">
                                    <p className="font-semibold text-red-800">El pre vale todavía está bloqueado</p>
                                    <ul className="mt-3 space-y-1 text-sm text-red-700 list-disc list-inside">
                                        {bloqueos.map((bloqueo) => <li key={bloqueo}>{bloqueo}</li>)}
                                    </ul>
                                </div>
                            )}

                            {simulacion ? (
                                <div className="fin-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="fin-title">Resultado de la simulación</h2>
                                            <p className="mt-1 fin-subtitle">Vista previa del cálculo con base en el producto seleccionado y la categoría actual.</p>
                                        </div>
                                        <span className={statusBadgeClass(puedeContinuar ? 'ACTIVO' : 'PAGO_PARCIAL')}>
                                            {puedeContinuar ? 'LISTA' : 'CON OBSERVACIONES'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto fijo del producto</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.monto_principal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Comisión empresa</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.comision_empresa)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Seguro</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.seguro)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Interés total</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.interes_total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Ganancia distribuidora</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.ganancia_distribuidora)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Multa base</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.multa_base)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total deuda</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(simulacion.total_deuda)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Monto quincenal</p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(simulacion.monto_quincenal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Consumo de crédito</p>
                                            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(simulacion.consumo_credito)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Crédito restante</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {simulacion.credito_restante === null ? 'Sin límite' : formatCurrency(simulacion.credito_restante)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="fin-card">
                                    <p className="font-semibold text-gray-900">Aún no hay simulación</p>
                                    <p className="mt-1 text-sm text-gray-500">Selecciona un producto y haz clic en "Actualizar simulación" para calcular el pre vale.</p>
                                </div>
                            )}

                            {/* Botón de confirmación */}
                            {simulacion && puedeContinuar && (
                                <div className="fin-card border-green-200 bg-green-50">
                                    <p className="font-semibold text-green-800">Simulación aprobada</p>
                                    <p className="mt-1 text-sm text-green-700">
                                        Al confirmar se registrará al cliente nuevo y se creará el pre vale en estado BORRADOR. Los montos se calculan en el servidor.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={confirmarPreVale}
                                        disabled={enviando || !form.primer_nombre || !form.apellido_paterno}
                                        className="w-full mt-4 fin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {enviando ? 'Creando pre vale...' : 'Confirmar y crear pre vale'}
                                    </button>
                                    {(!form.primer_nombre || !form.apellido_paterno) && (
                                        <p className="mt-2 text-xs text-amber-700">Completa al menos el nombre y apellido paterno del cliente para continuar.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
