import React from 'react';

function BotonOrdenable({ campo, orden, onOrdenar, children }) {
    const indicador = orden.campo === campo ? (orden.direccion === 'asc' ? '↑' : '↓') : '';

    return (
        <button type="button" className="font-semibold" onClick={() => onOrdenar(campo)}>
            {children} {indicador}
        </button>
    );
}

function ControlesPaginacion({ pagina, totalPaginas, onAnterior, onSiguiente }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <button type="button" className="fin-btn-secondary" disabled={pagina <= 1} onClick={onAnterior}>Anterior</button>
            <span className="text-xs text-gray-600">Página {pagina} de {totalPaginas}</span>
            <button type="button" className="fin-btn-secondary" disabled={pagina >= totalPaginas} onClick={onSiguiente}>Siguiente</button>
        </div>
    );
}

export default function TabCategorias({
    nuevaCategoriaForm,
    crearCategoria,
    busquedaCategorias,
    setBusquedaCategorias,
    categoriasActivasFiltradas,
    categoriasInactivasFiltradas,
    categorias,
    categoriasActivasPagina,
    categoriasInactivasPagina,
    categoriaValues,
    setCategoriaValues,
    guardarCategoria,
    inactivarCategoria,
    eliminarCategoria,
    activarCategoria,
    accionesCategoria,
    paginaActivas,
    totalPaginasActivas,
    setPaginaActivas,
    paginaInactivas,
    totalPaginasInactivas,
    setPaginaInactivas,
    ordenCategorias,
    alternarOrdenCategorias,
}) {
    return (
        <div className="space-y-4 fin-card">
            <div>
                <h3 className="font-semibold text-gray-900">2) Categorías dinámicas</h3>
                <p className="mt-1 text-xs text-gray-500">Puedes crear categorías nuevas, cambiar nombre y ajustar comisión.</p>
            </div>
            <form className="p-3 border border-gray-200 rounded-lg bg-gray-50" onSubmit={crearCategoria}>
                <p className="mb-2 text-xs font-semibold text-gray-700">Nueva categoría</p>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-2">
                    <input
                        type="text"
                        className="fin-input"
                        placeholder="Nombre de categoría"
                        value={nuevaCategoriaForm.data.nombre}
                        onChange={(e) => nuevaCategoriaForm.setData('nombre', e.target.value)}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.0001"
                        className="fin-input"
                        placeholder="Comisión %"
                        value={nuevaCategoriaForm.data.porcentaje_comision}
                        onChange={(e) => nuevaCategoriaForm.setData('porcentaje_comision', e.target.value)}
                    />
                    <button type="submit" className="fin-btn-primary" disabled={nuevaCategoriaForm.processing}>
                        {nuevaCategoriaForm.processing ? 'Agregando...' : 'Agregar'}
                    </button>
                </div>
            </form>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <input
                    type="text"
                    className="fin-input md:max-w-md"
                    placeholder="Buscar por código o nombre"
                    value={busquedaCategorias}
                    onChange={(event) => setBusquedaCategorias(event.target.value)}
                />
                <p className="text-xs text-gray-500">
                    Mostrando {categoriasActivasFiltradas.length + categoriasInactivasFiltradas.length} de {categorias.length} categorías
                </p>
            </div>

            <div className="mt-3 space-y-4">
                <div>
                    <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-emerald-700">Activas</p>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="text-gray-600 bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="codigo" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Código
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="nombre" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Nombre
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="porcentaje_comision" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Comisión (%)
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoriasActivasPagina.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-gray-500">No hay categorías activas con ese filtro.</td>
                                </tr>
                            ) : (
                                categoriasActivasPagina.map((categoria) => (
                                    <tr key={categoria.id} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-600">{categoria.codigo}</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                className="fin-input"
                                                value={categoriaValues[categoria.id]?.nombre ?? categoria.nombre}
                                                onChange={(e) =>
                                                    setCategoriaValues((prev) => ({
                                                        ...prev,
                                                        [categoria.id]: {
                                                            ...(prev[categoria.id] || {}),
                                                            nombre: e.target.value,
                                                            porcentaje_comision: prev[categoria.id]?.porcentaje_comision ?? String(categoria.porcentaje_comision ?? '0'),
                                                        },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 w-52">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.0001"
                                                className="fin-input"
                                                value={categoriaValues[categoria.id]?.porcentaje_comision ?? String(categoria.porcentaje_comision ?? '0')}
                                                onChange={(e) =>
                                                    setCategoriaValues((prev) => ({
                                                        ...prev,
                                                        [categoria.id]: {
                                                            ...(prev[categoria.id] || {}),
                                                            nombre: prev[categoria.id]?.nombre ?? categoria.nombre,
                                                            porcentaje_comision: e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" className="fin-btn-secondary" onClick={() => guardarCategoria(categoria.id)} disabled={Boolean(accionesCategoria[categoria.id])}>{accionesCategoria[categoria.id] || 'Guardar'}</button>
                                                <button type="button" className="fin-btn-secondary" onClick={() => inactivarCategoria(categoria.id)} disabled={Boolean(accionesCategoria[categoria.id])}>Inactivar</button>
                                                <button type="button" className="text-red-600 border-red-200 fin-btn-secondary" onClick={() => eliminarCategoria(categoria.id)} disabled={Boolean(accionesCategoria[categoria.id])}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <ControlesPaginacion
                    pagina={paginaActivas}
                    totalPaginas={totalPaginasActivas}
                    onAnterior={() => setPaginaActivas((prev) => Math.max(1, prev - 1))}
                    onSiguiente={() => setPaginaActivas((prev) => Math.min(totalPaginasActivas, prev + 1))}
                />

                <div className="pt-2">
                    <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-amber-700">Inactivas</p>
                </div>
                <div className="overflow-x-auto border rounded-lg border-amber-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-amber-50 text-amber-800">
                            <tr>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="codigo" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Código
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="nombre" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Nombre
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">
                                    <BotonOrdenable campo="porcentaje_comision" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>
                                        Comisión (%)
                                    </BotonOrdenable>
                                </th>
                                <th className="px-3 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoriasInactivasPagina.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-gray-500">No hay categorías inactivas con ese filtro.</td>
                                </tr>
                            ) : (
                                categoriasInactivasPagina.map((categoria) => (
                                    <tr key={categoria.id} className="border-t border-amber-100">
                                        <td className="px-3 py-2">{categoria.codigo}</td>
                                        <td className="px-3 py-2">{categoria.nombre}</td>
                                        <td className="px-3 py-2">{Number(categoria.porcentaje_comision ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 4 })}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-2">
                                                <button type="button" className="fin-btn-secondary" onClick={() => activarCategoria(categoria.id)} disabled={Boolean(accionesCategoria[categoria.id])}>{accionesCategoria[categoria.id] || 'Activar'}</button>
                                                <button type="button" className="text-red-600 border-red-200 fin-btn-secondary" onClick={() => eliminarCategoria(categoria.id)} disabled={Boolean(accionesCategoria[categoria.id])}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <ControlesPaginacion
                    pagina={paginaInactivas}
                    totalPaginas={totalPaginasInactivas}
                    onAnterior={() => setPaginaInactivas((prev) => Math.max(1, prev - 1))}
                    onSiguiente={() => setPaginaInactivas((prev) => Math.min(totalPaginasInactivas, prev + 1))}
                />
            </div>
        </div>
    );
}
