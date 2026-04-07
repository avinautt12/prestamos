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
        <div className="mt-4 fin-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-gray-900">3) Historial reciente de cambios</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Últimos movimientos de configuración aplicados en tu sucursal.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-3 mb-3 md:flex-row md:items-center md:justify-between">
                <input
                    type="text"
                    className="fin-input md:max-w-md"
                    placeholder="Buscar por evento, referencia o usuario"
                    value={busquedaHistorial}
                    onChange={(event) => setBusquedaHistorial(event.target.value)}
                />
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                        Mostrando {historialFiltrado.length} de {historialCambios.length} cambios
                    </p>
                    {hayFiltroActivo && (
                        <button type="button" className="fin-btn-secondary" onClick={() => setBusquedaHistorial('')}>
                            Limpiar filtro
                        </button>
                    )}
                </div>
            </div>

            {historialFiltrado.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                    {hayFiltroActivo
                        ? 'No hay cambios para el filtro actual.'
                        : 'Aún no hay cambios registrados.'}
                </p>
            ) : (
                <div className="mt-3">
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="text-gray-600 bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        <BotonOrdenable campo="creado_en" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>
                                            Fecha
                                        </BotonOrdenable>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <BotonOrdenable campo="tipo_evento" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>
                                            Tipo
                                        </BotonOrdenable>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <BotonOrdenable campo="referencia_id" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>
                                            Referencia
                                        </BotonOrdenable>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <BotonOrdenable campo="usuario" orden={ordenHistorial} onOrdenar={alternarOrdenHistorial}>
                                            Usuario
                                        </BotonOrdenable>
                                    </th>
                                    <th className="px-3 py-2 text-left">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialPagina.map((cambio) => {
                                    const actor =
                                        cambio.actualizado_por?.nombre_completo ||
                                        cambio.actualizado_por?.nombre_usuario ||
                                        'Sistema';

                                    return (
                                        <tr key={cambio.id} className="border-t border-gray-100">
                                            <td className="px-3 py-2 text-gray-600">{formatearFechaServidor(cambio.creado_en)}</td>
                                            <td className="px-3 py-2 font-medium text-gray-900">
                                                {EVENT_LABELS[cambio.tipo_evento] || cambio.tipo_evento}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{cambio.referencia_id ? `#${cambio.referencia_id}` : '-'}</td>
                                            <td className="px-3 py-2 text-gray-600">{actor}</td>
                                            <td className="px-3 py-2">
                                                <button type="button" className="fin-btn-secondary" onClick={() => setCambioSeleccionado(cambio)}>Ver</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3">
                        <ControlesPaginacion
                            pagina={paginaHistorial}
                            totalPaginas={totalPaginasHistorial}
                            onAnterior={() => setPaginaHistorial((prev) => Math.max(1, prev - 1))}
                            onSiguiente={() => setPaginaHistorial((prev) => Math.min(totalPaginasHistorial, prev + 1))}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
