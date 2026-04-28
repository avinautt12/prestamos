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
    soloLectura = false,
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
        <div className="space-y-8 bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#1FA62D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            3) Catálogo de Productos
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
                            Configura las condiciones de crédito: montos, plazos (quincenas), seguros y tasas operativas.
                        </p>
                    </div>
                    {!soloLectura && (
                        <button
                            type="button"
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                expandirFormulario 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                : 'bg-[#1FA62D] text-white hover:bg-[#1B9229] shadow-sm'
                            }`}
                            onClick={() => setExpandirFormulario(!expandirFormulario)}
                        >
                            {expandirFormulario ? (
                                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Cancelar</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Nuevo Producto</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {expandirFormulario && !soloLectura && (
                <div className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-100 shadow-sm animate-fin-fade-up">
                    <h4 className="text-sm font-bold tracking-widest text-emerald-800 uppercase mb-5 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Definir nuevo esquema
                    </h4>
                    <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={crearProducto}>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Identificación</label>
                            <input
                                type="text"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                placeholder="Nombre descriptivo"
                                value={nuevoProductoForm.data.nombre}
                                onChange={(e) => nuevoProductoForm.setData('nombre', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Capital base ($)</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                placeholder="Ej: 15000"
                                value={nuevoProductoForm.data.monto_principal}
                                onChange={(e) => nuevoProductoForm.setData('monto_principal', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Plazo (Quincenas)</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                placeholder="Ej: 12"
                                value={nuevoProductoForm.data.numero_quincenas}
                                onChange={(e) => nuevoProductoForm.setData('numero_quincenas', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Apertura (%)</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                value={nuevoProductoForm.data.porcentaje_comision_empresa}
                                onChange={(e) => nuevoProductoForm.setData('porcentaje_comision_empresa', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seguro fijo ($)</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                value={nuevoProductoForm.data.monto_seguro}
                                onChange={(e) => nuevoProductoForm.setData('monto_seguro', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Interés (%)</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                value={nuevoProductoForm.data.porcentaje_interes_quincenal}
                                onChange={(e) => nuevoProductoForm.setData('porcentaje_interes_quincenal', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-[#1FA62D] text-white font-bold rounded-lg hover:bg-[#1B9229] transition-colors shadow-md shadow-emerald-900/20" disabled={nuevoProductoForm.processing}>
                                {nuevoProductoForm.processing ? 'Procesando...' : 'Dar de alta producto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="search"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="Buscar por nombre o clave..."
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                        />
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                        Catálogo: <span className="text-slate-900">{productosFiltrados.length} productos financieros</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {productosPagina.map((producto) => {
                        const abierto = expandidoId === producto.id;
                        const values = productoValues[producto.id] || {};
                        const estado = obtenerEstadoProducto(producto);
                        const eliminado = Boolean(producto.deleted_at);

                        return (
                            <div key={producto.id} className={`group bg-white border rounded-xl overflow-hidden transition-all duration-200 ${abierto ? 'ring-2 ring-emerald-500/20 border-emerald-200 shadow-lg' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shrink-0">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0L21 21H3L4.382 5.984m16.854 0L15 21H9L4.382 5.984" /></svg>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{producto.nombre}</h5>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-mono text-slate-400">{producto.codigo}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-xs font-bold text-slate-600">Clave: {formatearClaveOperativa(producto)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${estado.clase}`}>
                                            {estado.texto}
                                        </span>
                                    </div>

                                    {!abierto || eliminado ? (
                                        <div className="mt-5 grid grid-cols-4 gap-2">
                                            <div className="text-center p-2 rounded-lg bg-slate-50">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Monto</p>
                                                <p className="text-sm font-bold text-slate-800">${Math.round(producto.monto_principal).toLocaleString()}</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-slate-50">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Plazo</p>
                                                <p className="text-sm font-bold text-slate-800">{producto.numero_quincenas} Q</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-slate-50">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Tasa</p>
                                                <p className="text-sm font-bold text-emerald-600">{producto.porcentaje_interes_quincenal}%</p>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                {!eliminado && !soloLectura && (
                                                    <button onClick={() => setExpandidoId(producto.id)} className="w-8 h-8 rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                )}
                                                {eliminado && !soloLectura && (
                                                    <button onClick={() => restaurarProducto(producto.id)} className="text-xs font-bold text-emerald-600 hover:underline">Restaurar</button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-6 space-y-4 animate-fin-fade-up">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Monto base ($)</label>
                                                    <input type="number" className="block w-full border-slate-200 rounded-md sm:text-sm py-1.5" value={values.monto_principal ?? ''} onChange={e => setProductoValues(prev => ({...prev, [producto.id]: {...(prev[producto.id]||{}), monto_principal: e.target.value}}))} />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Apertura (%)</label>
                                                    <input type="number" className="block w-full border-slate-200 rounded-md sm:text-sm py-1.5" value={values.porcentaje_comision_empresa ?? ''} onChange={e => setProductoValues(prev => ({...prev, [producto.id]: {...(prev[producto.id]||{}), porcentaje_comision_empresa: e.target.value}}))} />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Seguro ($)</label>
                                                    <input type="number" className="block w-full border-slate-200 rounded-md sm:text-sm py-1.5" value={values.monto_seguro ?? ''} onChange={e => setProductoValues(prev => ({...prev, [producto.id]: {...(prev[producto.id]||{}), monto_seguro: e.target.value}}))} />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Interés (%)</label>
                                                    <input type="number" className="block w-full border-slate-200 rounded-md sm:text-sm py-1.5" value={values.porcentaje_interes_quincenal ?? ''} onChange={e => setProductoValues(prev => ({...prev, [producto.id]: {...(prev[producto.id]||{}), porcentaje_interes_quincenal: e.target.value}}))} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <button onClick={() => setExpandidoId(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cerrar editor</button>
                                                <div className="flex gap-2">
                                                    <button onClick={() => eliminarProducto(producto.id)} className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100">Eliminar</button>
                                                    <button onClick={() => (producto.activo ? inactivarProducto(producto.id) : activarProducto(producto.id))} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">{producto.activo ? 'Inactivar' : 'Activar'}</button>
                                                    <button onClick={() => guardarProducto(producto.id)} className="px-4 py-1.5 text-xs font-bold text-white bg-[#1FA62D] hover:bg-[#1B9229] rounded-lg transition-colors shadow-sm">Actualizar</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {productosFiltrados.length > PRODUCTOS_POR_PAGINA && (
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6">
                        <button onClick={() => cambiarPagina(pagina - 1)} disabled={pagina === 1} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all">Anterior</button>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Página {pagina} de {totalPaginas}</span>
                        <button onClick={() => cambiarPagina(pagina + 1)} disabled={pagina === totalPaginas} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all">Siguiente</button>
                    </div>
                )}
            </div>
        </div>
    );
}
