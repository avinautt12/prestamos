import React, { useEffect, useMemo, useState } from 'react';

const PRODUCTOS_POR_PAGINA = 4;

const normalizarTexto = (valor) =>
    String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const formatearClaveOperativa = (producto) => {
    const quincenas = Number(producto?.numero_quincenas || 0);
    const monto = Number(producto?.monto_principal || 0);

    if (!quincenas || !monto) {
        return 'Sin clave operativa';
    }

    return `${quincenas}-${Math.round(monto / 1000)}`;
};

export default function TabProductos({
    productos,
    productoValues,
    setProductoValues,
    guardarProducto,
    activarProducto,
    inactivarProducto,
    eliminarProducto,
    restaurarProducto,
    accionesProducto,
    nuevoProductoForm,
    crearProducto,
}) {
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [expandidoId, setExpandidoId] = useState(null);
    const [expandirFormulario, setExpandirFormulario] = useState(false);

    const productosFiltrados = useMemo(() => {
        const termino = normalizarTexto(busqueda);
        const lista = [...(productos || [])];

        if (!termino) {
            return lista;
        }

        return lista.filter((producto) => {
            const nombre = normalizarTexto(producto.nombre);
            const codigo = normalizarTexto(producto.codigo);
            const clave = normalizarTexto(formatearClaveOperativa(producto));

            return nombre.includes(termino) || codigo.includes(termino) || clave.includes(termino);
        });
    }, [busqueda, productos]);

    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));

    useEffect(() => {
        setPagina(1);
        setExpandidoId(null);
    }, [busqueda]);

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    const productosPagina = useMemo(() => {
        const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA;
        return productosFiltrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
    }, [pagina, productosFiltrados]);

    const obtenerEstadoProducto = (producto) => {
        if (producto.deleted_at) {
            return { texto: 'Eliminado', clase: 'bg-red-100 text-red-700 border-red-200' };
        }

        if (producto.activo) {
            return { texto: 'Activo', clase: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        }

        return { texto: 'Inactivo', clase: 'bg-amber-100 text-amber-700 border-amber-200' };
    };

    const cambiarPagina = (nuevaPagina) => {
        setPagina(Math.min(Math.max(nuevaPagina, 1), totalPaginas));
    };

    return (
        <div className="space-y-4 fin-card">
            <div>
                <h3 className="font-semibold text-gray-900">3) Productos financieros</h3>
                <p className="mt-1 text-xs text-gray-500">Configura monto y quincenas del producto (ejemplo operativo: 7-15 = 7 quincenas y $15,000).</p>
            </div>

            <div className="flex flex-col gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-900">Buscador rápido</p>
                    <p className="text-xs text-gray-500">Filtra por nombre, código o clave operativa.</p>
                </div>
                <div className="w-full md:max-w-sm">
                    <input
                        type="search"
                        className="fin-input"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    className="fin-btn-primary"
                    onClick={() => setExpandirFormulario(!expandirFormulario)}
                >
                    {expandirFormulario ? '✕ Cancelar' : '+ Nuevo producto'}
                </button>
            </div>

            {expandirFormulario && (
                <form className="p-4 border-2 border-emerald-300 rounded-lg bg-emerald-50" onSubmit={crearProducto}>
                    <p className="mb-3 text-sm font-semibold text-gray-900">Agregar nuevo producto</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <label className="text-xs text-gray-600">Nombre del producto</label>
                            <input
                                type="text"
                                className="mt-1 fin-input"
                                placeholder="Ej: Préstamo 12/18000"
                                value={nuevoProductoForm.data.nombre}
                                onChange={(e) => nuevoProductoForm.setData('nombre', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Monto a prestar</label>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                className="mt-1 fin-input"
                                placeholder="Ej: 18000"
                                value={nuevoProductoForm.data.monto_principal}
                                onChange={(e) => nuevoProductoForm.setData('monto_principal', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Quincenas</label>
                            <input
                                type="number"
                                min="1"
                                max="72"
                                step="1"
                                className="mt-1 fin-input"
                                placeholder="Ej: 12"
                                value={nuevoProductoForm.data.numero_quincenas}
                                onChange={(e) => nuevoProductoForm.setData('numero_quincenas', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Comisión %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="mt-1 fin-input"
                                placeholder="Ej: 5"
                                value={nuevoProductoForm.data.porcentaje_comision_empresa}
                                onChange={(e) => nuevoProductoForm.setData('porcentaje_comision_empresa', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Seguro ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1 fin-input"
                                placeholder="Ej: 150"
                                value={nuevoProductoForm.data.monto_seguro}
                                onChange={(e) => nuevoProductoForm.setData('monto_seguro', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Interés quincenal %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="mt-1 fin-input"
                                placeholder="Ej: 5"
                                value={nuevoProductoForm.data.porcentaje_interes_quincenal}
                                onChange={(e) => nuevoProductoForm.setData('porcentaje_interes_quincenal', e.target.value)}
                            />
                        </div>
                    </div>
                    <button type="submit" className="mt-3 fin-btn-primary" disabled={nuevoProductoForm.processing}>
                        {nuevoProductoForm.processing ? 'Agregando...' : 'Crear producto'}
                    </button>
                </form>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{productosFiltrados.length} producto(s) encontrado(s)</span>
                <span>Mostrando {productosPagina.length} por página</span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {productosPagina.map((producto) => {
                    const abierto = expandidoId === producto.id;
                    const values = productoValues[producto.id] || {};
                    const estado = obtenerEstadoProducto(producto);
                    const eliminado = Boolean(producto.deleted_at);

                    return (
                        <div key={producto.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{producto.nombre}</p>
                                    <p className="text-xs text-gray-500">Código: {producto.codigo}</p>
                                    <p className="mt-1 text-xs text-gray-500">Clave operativa: <span className="font-semibold text-gray-700">{formatearClaveOperativa(producto)}</span></p>
                                    <span className={`inline-flex items-center px-2 py-1 mt-2 text-[11px] font-semibold rounded-full border ${estado.clase}`}>
                                        {estado.texto}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {!eliminado ? (
                                        <button
                                            type="button"
                                            className="px-3 py-2 text-xs fin-btn-secondary"
                                            onClick={() => setExpandidoId(abierto ? null : producto.id)}
                                        >
                                            {abierto ? 'Ocultar' : 'Editar'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="px-3 py-2 text-xs fin-btn-secondary"
                                            onClick={() => restaurarProducto(producto.id)}
                                            disabled={Boolean(accionesProducto[producto.id])}
                                        >
                                            {accionesProducto[producto.id] || 'Restaurar'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!abierto || eliminado ? (
                                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                                    <div className="p-2 rounded bg-gray-50">
                                        <p className="text-gray-500">Monto</p>
                                        <p className="font-semibold text-gray-900">${Number(values.monto_principal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="p-2 rounded bg-gray-50">
                                        <p className="text-gray-500">Quincenas</p>
                                        <p className="font-semibold text-gray-900">{values.numero_quincenas || '-'}</p>
                                    </div>
                                    <div className="p-2 rounded bg-gray-50">
                                        <p className="text-gray-500">Comisión</p>
                                        <p className="font-semibold text-gray-900">{values.porcentaje_comision_empresa || '-'}%</p>
                                    </div>
                                    <div className="p-2 rounded bg-gray-50">
                                        <p className="text-gray-500">Seguro</p>
                                        <p className="font-semibold text-gray-900">${Number(values.monto_seguro || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="text-xs text-gray-600">Monto a prestar</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={values.monto_principal ?? ''}
                                            onChange={(event) =>
                                                setProductoValues((prev) => ({
                                                    ...prev,
                                                    [producto.id]: {
                                                        ...(prev[producto.id] || {}),
                                                        monto_principal: event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-600">Comisión de Apertura (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={values.porcentaje_comision_empresa ?? ''}
                                            onChange={(event) =>
                                                setProductoValues((prev) => ({
                                                    ...prev,
                                                    [producto.id]: {
                                                        ...(prev[producto.id] || {}),
                                                        porcentaje_comision_empresa: event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-600">Seguro ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={values.monto_seguro ?? ''}
                                            onChange={(event) =>
                                                setProductoValues((prev) => ({
                                                    ...prev,
                                                    [producto.id]: {
                                                        ...(prev[producto.id] || {}),
                                                        monto_seguro: event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-600">Interés Quincenal (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={values.porcentaje_interes_quincenal ?? ''}
                                            onChange={(event) =>
                                                setProductoValues((prev) => ({
                                                    ...prev,
                                                    [producto.id]: {
                                                        ...(prev[producto.id] || {}),
                                                        porcentaje_interes_quincenal: event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-600">Número de quincenas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="72"
                                            step="1"
                                            className="mt-1 fin-input"
                                            value={values.numero_quincenas ?? ''}
                                            onChange={(event) =>
                                                setProductoValues((prev) => ({
                                                    ...prev,
                                                    [producto.id]: {
                                                        ...(prev[producto.id] || {}),
                                                        numero_quincenas: event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {abierto && !eliminado && (
                                <div className="flex justify-end mt-3">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="fin-btn-secondary"
                                            onClick={() => guardarProducto(producto.id)}
                                            disabled={Boolean(accionesProducto[producto.id])}
                                        >
                                            {accionesProducto[producto.id] || 'Guardar producto'}
                                        </button>
                                        <button
                                            type="button"
                                            className="fin-btn-secondary"
                                            onClick={() => (producto.activo ? inactivarProducto(producto.id) : activarProducto(producto.id))}
                                            disabled={Boolean(accionesProducto[producto.id])}
                                        >
                                            {accionesProducto[producto.id] || (producto.activo ? 'Inactivar' : 'Activar')}
                                        </button>
                                        <button
                                            type="button"
                                            className="text-red-600 border-red-200 fin-btn-secondary"
                                            onClick={() => eliminarProducto(producto.id)}
                                            disabled={Boolean(accionesProducto[producto.id])}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {productosFiltrados.length === 0 && (
                <p className="text-sm text-gray-500">No hay productos que coincidan con tu búsqueda.</p>
            )}

            {productosFiltrados.length > PRODUCTOS_POR_PAGINA && (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                    <button
                        type="button"
                        className="fin-btn-secondary"
                        onClick={() => cambiarPagina(pagina - 1)}
                        disabled={pagina === 1}
                    >
                        Anterior
                    </button>

                    <p className="text-xs text-gray-500">
                        Página {pagina} de {totalPaginas}
                    </p>

                    <button
                        type="button"
                        className="fin-btn-secondary"
                        onClick={() => cambiarPagina(pagina + 1)}
                        disabled={pagina === totalPaginas}
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}
