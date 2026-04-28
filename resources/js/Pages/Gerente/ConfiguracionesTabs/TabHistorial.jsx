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

export default function TabHistorial({
    historialFiltrado,
    historialCambios,
    busquedaHistorial,
    setBusquedaHistorial,
    historialPagina,
    EVENT_LABELS,
    formatearFechaServidor,
    setCambioSeleccionado,
    paginaHistorial,
    totalPaginasHistorial,
    setPaginaHistorial,
    ordenHistorial,
    alternarOrdenHistorial,
}) {
    const hayFiltroActivo = String(busquedaHistorial || '').trim() !== '';

    return (
        <div className="space-y-8 bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="border-b border-slate-100 pb-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1FA62D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    4) Bitácora de Auditoría
                </h3>
                <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
                    Trazabilidad completa de los ajustes realizados a los parámetros del sistema y cambios en productos financieros.
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="Buscar en el historial..."
                            value={busquedaHistorial}
                            onChange={(event) => setBusquedaHistorial(event.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-xs font-medium text-slate-400">
                            Filtro: <span className="text-slate-900">{historialFiltrado.length} registros</span>
                        </p>
                        {hayFiltroActivo && (
                            <button onClick={() => setBusquedaHistorial('')} className="text-xs font-bold text-emerald-600 hover:emerald-700">Limpiar</button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <BotonOrdenable campo="creado_en" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>Fecha y Hora</BotonOrdenable>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <BotonOrdenable campo="tipo_evento" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>Evento</BotonOrdenable>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <BotonOrdenable campo="referencia_id" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>Ref.</BotonOrdenable>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <BotonOrdenable campo="usuario" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>Autor</BotonOrdenable>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {historialFiltrado.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <p className="text-sm text-slate-400">No hay registros que coincidan.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                historialPagina.map((cambio) => {
                                    const actor = cambio.actualizado_por?.nombre_completo || cambio.actualizado_por?.nombre_usuario || 'Sistema';
                                    return (
                                        <tr key={cambio.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatearFechaServidor(cambio.creado_en)}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-slate-900">{EVENT_LABELS[cambio.tipo_evento] || cambio.tipo_evento}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-slate-400">{cambio.referencia_id ? `#${cambio.referencia_id}` : '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{actor}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => setCambioSeleccionado(cambio)} className="px-3 py-1 text-xs font-bold text-[#1FA62D] hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100">Detalles</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <button onClick={() => setPaginaHistorial(prev => Math.max(1, prev - 1))} disabled={paginaHistorial === 1} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all">Anterior</button>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Página {paginaHistorial} de {totalPaginasHistorial}</span>
                    <button onClick={() => setPaginaHistorial(prev => Math.min(totalPaginasHistorial, prev + 1))} disabled={paginaHistorial === totalPaginasHistorial} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all">Siguiente</button>
                </div>
            </div>
        </div>
    );
}
