import React from 'react';

export default function TabProductos({
    productos,
    productoValues,
    setProductoValues,
    guardarProducto,
    accionesProducto,
}) {
    return (
        <div className="space-y-4 fin-card">
            <div>
                <h3 className="font-semibold text-gray-900">3) Productos financieros</h3>
                <p className="mt-1 text-xs text-gray-500">Ajusta comisión empresa, interés quincenal y quincenas por producto.</p>
            </div>

            <div className="space-y-3">
                {(productos || []).map((producto) => (
                    <div key={producto.id} className="p-3 border border-gray-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">{producto.nombre}</p>
                        <p className="mb-2 text-xs text-gray-500">Código: {producto.codigo}</p>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div>
                                <label className="text-xs text-gray-600">Comisión empresa (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.0001"
                                    className="mt-1 fin-input"
                                    value={productoValues[producto.id]?.porcentaje_comision_empresa ?? ''}
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
                                <label className="text-xs text-gray-600">Interés quincenal (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.0001"
                                    className="mt-1 fin-input"
                                    value={productoValues[producto.id]?.porcentaje_interes_quincenal ?? ''}
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

                            <div>
                                <label className="text-xs text-gray-600">Número de quincenas</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="72"
                                    step="1"
                                    className="mt-1 fin-input"
                                    value={productoValues[producto.id]?.numero_quincenas ?? ''}
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

                        <button
                            type="button"
                            className="mt-3 fin-btn-secondary"
                            onClick={() => guardarProducto(producto.id)}
                            disabled={Boolean(accionesProducto[producto.id])}
                        >
                            {accionesProducto[producto.id] || 'Guardar producto'}
                        </button>
                    </div>
                ))}

                {(productos || []).length === 0 && (
                    <p className="text-sm text-gray-500">No hay productos activos para configurar.</p>
                )}
            </div>
        </div>
    );
}
