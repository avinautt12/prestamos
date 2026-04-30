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
    soloLectura = false,
}) {
    return (
        <div className="space-y-8 bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="border-b border-slate-100 pb-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1FA62D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    2) Niveles y Categorías
                </h3>
                <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
                    Administra los niveles operativos de las distribuidoras y sus márgenes de utilidad base para el cálculo de comisiones.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel de Creación */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/60 shadow-sm sticky top-4">
                        <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-5 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Nuevo Nivel
                        </h4>
                        <form className="space-y-4" onSubmit={crearCategoria}>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Nombre del nivel</label>
                                <input
                                    type="text"
                                    className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    placeholder="Ej: Oro, Diamante..."
                                    value={nuevaCategoriaForm.data.nombre}
                                    onChange={(e) => nuevaCategoriaForm.setData('nombre', e.target.value)}
                                    disabled={soloLectura}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                    Comisión Base
                                    <span className="text-slate-400">%</span>
                                </label>
                                <input
                                    type="number"
                                    min="0" max="100" step="0.0001"
                                    className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    placeholder="0.00"
                                    value={nuevaCategoriaForm.data.porcentaje_comision}
                                    onChange={(e) => nuevaCategoriaForm.setData('porcentaje_comision', e.target.value)}
                                    disabled={soloLectura}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-[#1FA62D] border border-transparent rounded-lg shadow-sm hover:bg-[#1B9229] focus:outline-none focus:ring-2 focus:ring-[#1FA62D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                                disabled={nuevaCategoriaForm.processing || soloLectura}
                            >
                                {nuevaCategoriaForm.processing ? 'Registrando...' : soloLectura ? 'Bloqueado por VPN' : 'Registrar Nivel'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Listado Principal */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                placeholder="Filtrar categorías..."
                                value={busquedaCategorias}
                                onChange={(event) => setBusquedaCategorias(event.target.value)}
                            />
                        </div>
                        <p className="text-xs font-medium text-slate-400">
                            Total: <span className="text-slate-900">{categorias.length} niveles registrados</span>
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Categorías Activas */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Niveles Activos</p>
                            </div>
                            <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <BotonOrdenable campo="codigo" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>Código</BotonOrdenable>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <BotonOrdenable campo="nombre" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>Nombre</BotonOrdenable>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <BotonOrdenable campo="porcentaje_comision" orden={ordenCategorias} onOrdenar={alternarOrdenCategorias}>Comisión (%)</BotonOrdenable>
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {categoriasActivasPagina.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No se encontraron niveles activos.</td>
                                            </tr>
                                        ) : (
                                            categoriasActivasPagina.map((categoria) => (
                                                <tr key={categoria.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{categoria.codigo}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            className="block w-full border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-1 disabled:bg-slate-50 disabled:text-slate-500"
                                                            value={categoriaValues[categoria.id]?.nombre ?? categoria.nombre}
                                                            onChange={(e) => setCategoriaValues(prev => ({...prev, [categoria.id]: {...(prev[categoria.id]||{}), nombre: e.target.value, porcentaje_comision: prev[categoria.id]?.porcentaje_comision ?? String(categoria.porcentaje_comision ?? '0')}}))}
                                                            disabled={soloLectura}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 w-40">
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            className="block w-full border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-1 disabled:bg-slate-50 disabled:text-slate-500"
                                                            value={categoriaValues[categoria.id]?.porcentaje_comision ?? String(categoria.porcentaje_comision ?? '0')}
                                                            onChange={(e) => setCategoriaValues(prev => ({...prev, [categoria.id]: {...(prev[categoria.id]||{}), nombre: prev[categoria.id]?.nombre ?? categoria.nombre, porcentaje_comision: e.target.value}}))}
                                                            disabled={soloLectura}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => guardarCategoria(categoria.id)}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={soloLectura ? "Bloqueado por VPN" : "Guardar cambios"}
                                                                disabled={Boolean(accionesCategoria[categoria.id]) || soloLectura}
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => inactivarCategoria(categoria.id)}
                                                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={soloLectura ? "Bloqueado por VPN" : "Inactivar nivel"}
                                                                disabled={Boolean(accionesCategoria[categoria.id]) || soloLectura}
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => eliminarCategoria(categoria.id)}
                                                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={soloLectura ? "Bloqueado por VPN" : "Eliminar permanentemente"}
                                                                disabled={Boolean(accionesCategoria[categoria.id]) || soloLectura}
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
                                    <ControlesPaginacion
                                        pagina={paginaActivas}
                                        totalPaginas={totalPaginasActivas}
                                        onAnterior={() => setPaginaActivas((prev) => Math.max(1, prev - 1))}
                                        onSiguiente={() => setPaginaActivas((prev) => Math.min(totalPaginasActivas, prev + 1))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categorías Inactivas */}
                        {categoriasInactivasFiltradas.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Archivo / Inactivos</p>
                                </div>
                                <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm opacity-75">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {categoriasInactivasPagina.map((categoria) => (
                                                <tr key={categoria.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-mono text-slate-400">{categoria.codigo}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">{categoria.nombre}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => activarCategoria(categoria.id)} 
                                                                className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
                                                                disabled={Boolean(accionesCategoria[categoria.id]) || soloLectura}
                                                            >
                                                                Reactivar
                                                            </button>
                                                            <button 
                                                                onClick={() => eliminarCategoria(categoria.id)} 
                                                                className="text-xs font-bold text-red-400 hover:underline disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
                                                                disabled={Boolean(accionesCategoria[categoria.id]) || soloLectura}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
