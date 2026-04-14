import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TabConfiguracion from './ConfiguracionesTabs/TabConfiguracion';
import TabCategorias from './ConfiguracionesTabs/TabCategorias';
import TabProductos from './ConfiguracionesTabs/TabProductos';
import TabHistorial from './ConfiguracionesTabs/TabHistorial';

const FIELD_LABELS = {
    dia_corte: 'Día de corte',
    hora_corte: 'Hora de corte',
    seguro_tabuladores_json: 'Seguro por tabuladores',
    factor_divisor_puntos: 'Factor divisor puntos',
    multiplicador_puntos: 'Multiplicador puntos',
    valor_punto_mxn: 'Valor del punto (MXN)',
    monto_principal: 'Monto a prestar',
    monto_seguro: 'Seguro ($)',
    porcentaje_comision: 'Comisión (%)',
    porcentaje_comision_empresa: 'Comisión empresa (%)',
    porcentaje_interes_quincenal: 'Interés quincenal (%)',
    numero_quincenas: 'Número de quincenas',
};

const EVENT_LABELS = {
    SUCURSAL: 'Configuración de sucursal',
    CATEGORIA: 'Categoría',
    PRODUCTO: 'Producto',
};

const normalizarTexto = (valor) =>
    String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const normalizarNumeroInput = (valor, fallback = '') => {
    if (valor === null || valor === undefined || valor === '') {
        return fallback;
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return fallback;
    }

    return Number.isInteger(numero) ? String(numero) : String(numero).replace(/\.0+$/, '');
};



const formatearFechaServidor = (value) => {
    if (!value) {
        return 'Sin fecha';
    }

    const text = String(value).replace('T', ' ');
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?/);

    if (match) {
        const [, year, month, day, hour, minute, second] = match;
        return `${day}/${month}/${year}, ${hour}:${minute}:${second || '00'}`;
    }

    return String(value);
};

const obtenerPagina = (items, pagina, porPagina) => {
    const inicio = (pagina - 1) * porPagina;
    return items.slice(inicio, inicio + porPagina);
};

export default function Configuraciones({ sucursal, configuracionSucursal, categorias, productos = [], historialCambios = [] }) {
    const { errors } = usePage().props;
    const {
        sucursales = [],
        esAdmin = false,
        puedeEditar = false,
        soloLecturaProductos = false,
        routePrefix = 'gerente',
        sucursalSeleccionadaId = null,
    } = usePage().props;
    const CATEGORIAS_POR_PAGINA = 6;
    const HISTORIAL_POR_PAGINA = 8;

    const formSucursal = useForm({
        dia_corte: configuracionSucursal?.dia_corte ?? '',
        factor_divisor_puntos: configuracionSucursal?.factor_divisor_puntos ?? 1200,
        multiplicador_puntos: configuracionSucursal?.multiplicador_puntos ?? 3,
        valor_punto_mxn: configuracionSucursal?.valor_punto_mxn ?? 2,
        sucursal_id: sucursalSeleccionadaId ?? sucursal?.id ?? '',
    });

    const categoriasMap = React.useMemo(() => {
        const map = {};
        (categorias || []).forEach((cat) => {
            map[cat.id] = {
                nombre: cat.nombre ?? '',
                porcentaje_comision: normalizarNumeroInput(cat.porcentaje_comision, '0'),
            };
        });
        return map;
    }, [categorias]);

    const productosMap = React.useMemo(() => {
        const map = {};
        (productos || []).forEach((producto) => {
            map[producto.id] = {
                monto_principal: normalizarNumeroInput(producto.monto_principal, '0'),
                monto_seguro: normalizarNumeroInput(producto.monto_seguro, '0'),
                porcentaje_comision_empresa: normalizarNumeroInput(producto.porcentaje_comision_empresa, '0'),
                porcentaje_interes_quincenal: normalizarNumeroInput(producto.porcentaje_interes_quincenal, '0'),
                numero_quincenas: normalizarNumeroInput(producto.numero_quincenas, '12'),
            };
        });
        return map;
    }, [productos]);

    const categoriasActivas = React.useMemo(
        () => (categorias || []).filter((categoria) => Boolean(categoria.activo)),
        [categorias]
    );

    const categoriasInactivas = React.useMemo(
        () => (categorias || []).filter((categoria) => !Boolean(categoria.activo)),
        [categorias]
    );

    const [categoriaValues, setCategoriaValues] = React.useState(categoriasMap);
    const [productoValues, setProductoValues] = React.useState(productosMap);
    const [guardandoSucursal, setGuardandoSucursal] = React.useState(false);
    const [tabActiva, setTabActiva] = React.useState(soloLecturaProductos ? 'productos' : 'sucursal');
    const [sucursalActivaId, setSucursalActivaId] = React.useState(sucursalSeleccionadaId ?? sucursal?.id ?? '');
    const [paginaActivas, setPaginaActivas] = React.useState(1);
    const [paginaInactivas, setPaginaInactivas] = React.useState(1);
    const [paginaHistorial, setPaginaHistorial] = React.useState(1);
    const [cambioSeleccionado, setCambioSeleccionado] = React.useState(null);
    const [busquedaCategorias, setBusquedaCategorias] = React.useState('');
    const [busquedaHistorial, setBusquedaHistorial] = React.useState('');
    const [ordenCategorias, setOrdenCategorias] = React.useState({ campo: 'nombre', direccion: 'asc' });
    const [ordenHistorial, setOrdenHistorial] = React.useState({ campo: 'creado_en', direccion: 'desc' });
    const [accionesCategoria, setAccionesCategoria] = React.useState({});
    const [accionesProducto, setAccionesProducto] = React.useState({});

    const nuevaCategoriaForm = useForm({
        nombre: '',
        porcentaje_comision: '',
        sucursal_id: sucursalSeleccionadaId ?? sucursal?.id ?? '',
    });

    const nuevoProductoForm = useForm({
        nombre: '',
        monto_principal: '',
        numero_quincenas: '',
        porcentaje_comision_empresa: '',
        monto_seguro: '',
        porcentaje_interes_quincenal: '',
        sucursal_id: sucursalSeleccionadaId ?? sucursal?.id ?? '',
    });

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const raw = window.localStorage.getItem(`configuraciones-${routePrefix}-v2`);
            if (!raw) {
                return;
            }

            const estado = JSON.parse(raw);
            if (typeof estado.tabActiva === 'string') {
                setTabActiva(estado.tabActiva);
            }
            if (typeof estado.busquedaCategorias === 'string') {
                setBusquedaCategorias(estado.busquedaCategorias);
            }
            if (typeof estado.busquedaHistorial === 'string') {
                setBusquedaHistorial(estado.busquedaHistorial);
            }
            if (estado.ordenCategorias?.campo && estado.ordenCategorias?.direccion) {
                setOrdenCategorias(estado.ordenCategorias);
            }
            if (estado.ordenHistorial?.campo && estado.ordenHistorial?.direccion) {
                setOrdenHistorial(estado.ordenHistorial);
            }
        } catch (_error) {
            // Sin bloqueo si localStorage está corrupto.
        }
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            `configuraciones-${routePrefix}-v2`,
            JSON.stringify({
                tabActiva,
                busquedaCategorias,
                busquedaHistorial,
                ordenCategorias,
                ordenHistorial,
            })
        );
    }, [tabActiva, busquedaCategorias, busquedaHistorial, ordenCategorias, ordenHistorial, routePrefix]);

    React.useEffect(() => {
        if (soloLecturaProductos && tabActiva !== 'productos') {
            setTabActiva('productos');
        }
    }, [soloLecturaProductos, tabActiva]);

    React.useEffect(() => {
        setSucursalActivaId(sucursalSeleccionadaId ?? sucursal?.id ?? '');
        formSucursal.setData('sucursal_id', sucursalSeleccionadaId ?? sucursal?.id ?? '');
        nuevaCategoriaForm.setData('sucursal_id', sucursalSeleccionadaId ?? sucursal?.id ?? '');
        nuevoProductoForm.setData('sucursal_id', sucursalSeleccionadaId ?? sucursal?.id ?? '');
    }, [sucursalSeleccionadaId, sucursal?.id]);

    const cambiarSucursal = (sucursalId) => {
        setSucursalActivaId(sucursalId);
        formSucursal.setData('sucursal_id', sucursalId || '');
        nuevaCategoriaForm.setData('sucursal_id', sucursalId || '');
        nuevoProductoForm.setData('sucursal_id', sucursalId || '');

        if (!esAdmin) {
            return;
        }

        router.get(route(`${routePrefix}.configuraciones`), {
            sucursal_id: sucursalId || undefined,
        }, {
            preserveScroll: true,
        });
    };

    React.useEffect(() => {
        setCategoriaValues(categoriasMap);
    }, [categoriasMap]);

    React.useEffect(() => {
        setProductoValues(productosMap);
    }, [productosMap]);



    const filtroCategorias = normalizarTexto(busquedaCategorias);
    const categoriasActivasFiltradas = React.useMemo(() => {
        if (!filtroCategorias) {
            return categoriasActivas;
        }

        return categoriasActivas.filter((categoria) => {
            const nombre = normalizarTexto(categoria.nombre);
            const codigo = normalizarTexto(categoria.codigo);

            return nombre.includes(filtroCategorias) || codigo.includes(filtroCategorias);
        });
    }, [categoriasActivas, filtroCategorias]);

    const categoriasInactivasFiltradas = React.useMemo(() => {
        if (!filtroCategorias) {
            return categoriasInactivas;
        }

        return categoriasInactivas.filter((categoria) => {
            const nombre = normalizarTexto(categoria.nombre);
            const codigo = normalizarTexto(categoria.codigo);

            return nombre.includes(filtroCategorias) || codigo.includes(filtroCategorias);
        });
    }, [categoriasInactivas, filtroCategorias]);

    const filtroHistorial = normalizarTexto(busquedaHistorial);
    const historialFiltrado = React.useMemo(() => {
        if (!filtroHistorial) {
            return historialCambios;
        }

        return historialCambios.filter((cambio) => {
            const etiquetaEvento = normalizarTexto(EVENT_LABELS[cambio.tipo_evento] || cambio.tipo_evento);
            const referencia = normalizarTexto(cambio.referencia_id ? `#${cambio.referencia_id}` : '');
            const actor = normalizarTexto(
                cambio.actualizado_por?.nombre_completo ||
                cambio.actualizado_por?.nombre_usuario ||
                'Sistema'
            );

            return (
                etiquetaEvento.includes(filtroHistorial) ||
                referencia.includes(filtroHistorial) ||
                actor.includes(filtroHistorial)
            );
        });
    }, [historialCambios, filtroHistorial]);

    const categoriasActivasOrdenadas = React.useMemo(() => {
        const lista = [...categoriasActivasFiltradas];

        lista.sort((a, b) => {
            const direccion = ordenCategorias.direccion === 'asc' ? 1 : -1;

            if (ordenCategorias.campo === 'codigo') {
                return normalizarTexto(a.codigo).localeCompare(normalizarTexto(b.codigo)) * direccion;
            }

            if (ordenCategorias.campo === 'porcentaje_comision') {
                return (Number(a.porcentaje_comision ?? 0) - Number(b.porcentaje_comision ?? 0)) * direccion;
            }

            return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre)) * direccion;
        });

        return lista;
    }, [categoriasActivasFiltradas, ordenCategorias]);

    const categoriasInactivasOrdenadas = React.useMemo(() => {
        const lista = [...categoriasInactivasFiltradas];

        lista.sort((a, b) => {
            const direccion = ordenCategorias.direccion === 'asc' ? 1 : -1;

            if (ordenCategorias.campo === 'codigo') {
                return normalizarTexto(a.codigo).localeCompare(normalizarTexto(b.codigo)) * direccion;
            }

            if (ordenCategorias.campo === 'porcentaje_comision') {
                return (Number(a.porcentaje_comision ?? 0) - Number(b.porcentaje_comision ?? 0)) * direccion;
            }

            return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre)) * direccion;
        });

        return lista;
    }, [categoriasInactivasFiltradas, ordenCategorias]);

    const historialOrdenado = React.useMemo(() => {
        const lista = [...historialFiltrado];

        lista.sort((a, b) => {
            const direccion = ordenHistorial.direccion === 'asc' ? 1 : -1;

            if (ordenHistorial.campo === 'tipo_evento') {
                return normalizarTexto(EVENT_LABELS[a.tipo_evento] || a.tipo_evento)
                    .localeCompare(normalizarTexto(EVENT_LABELS[b.tipo_evento] || b.tipo_evento)) * direccion;
            }

            if (ordenHistorial.campo === 'referencia_id') {
                return (Number(a.referencia_id ?? 0) - Number(b.referencia_id ?? 0)) * direccion;
            }

            if (ordenHistorial.campo === 'usuario') {
                const actorA = a.actualizado_por?.nombre_completo || a.actualizado_por?.nombre_usuario || 'Sistema';
                const actorB = b.actualizado_por?.nombre_completo || b.actualizado_por?.nombre_usuario || 'Sistema';
                return normalizarTexto(actorA).localeCompare(normalizarTexto(actorB)) * direccion;
            }

            return normalizarTexto(a.creado_en).localeCompare(normalizarTexto(b.creado_en)) * direccion;
        });

        return lista;
    }, [historialFiltrado, ordenHistorial]);

    const totalPaginasActivas = Math.max(1, Math.ceil(categoriasActivasOrdenadas.length / CATEGORIAS_POR_PAGINA));
    const totalPaginasInactivas = Math.max(1, Math.ceil(categoriasInactivasOrdenadas.length / CATEGORIAS_POR_PAGINA));
    const totalPaginasHistorial = Math.max(1, Math.ceil(historialOrdenado.length / HISTORIAL_POR_PAGINA));

    React.useEffect(() => {
        setPaginaActivas(1);
        setPaginaInactivas(1);
    }, [busquedaCategorias]);

    React.useEffect(() => {
        setPaginaHistorial(1);
    }, [busquedaHistorial]);

    React.useEffect(() => {
        if (paginaActivas > totalPaginasActivas) {
            setPaginaActivas(totalPaginasActivas);
        }
    }, [paginaActivas, totalPaginasActivas]);

    React.useEffect(() => {
        if (paginaInactivas > totalPaginasInactivas) {
            setPaginaInactivas(totalPaginasInactivas);
        }
    }, [paginaInactivas, totalPaginasInactivas]);

    React.useEffect(() => {
        if (paginaHistorial > totalPaginasHistorial) {
            setPaginaHistorial(totalPaginasHistorial);
        }
    }, [paginaHistorial, totalPaginasHistorial]);

    const categoriasActivasPagina = React.useMemo(
        () => obtenerPagina(categoriasActivasOrdenadas, paginaActivas, CATEGORIAS_POR_PAGINA),
        [categoriasActivasOrdenadas, paginaActivas]
    );

    const categoriasInactivasPagina = React.useMemo(
        () => obtenerPagina(categoriasInactivasOrdenadas, paginaInactivas, CATEGORIAS_POR_PAGINA),
        [categoriasInactivasOrdenadas, paginaInactivas]
    );

    const historialPagina = React.useMemo(
        () => obtenerPagina(historialOrdenado, paginaHistorial, HISTORIAL_POR_PAGINA),
        [historialOrdenado, paginaHistorial]
    );

    const alternarOrden = (setter, campo) => {
        setter((prev) => ({
            campo,
            direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc',
        }));
    };

    const marcarAccionCategoria = (categoriaId, texto) => {
        setAccionesCategoria((prev) => ({
            ...prev,
            [categoriaId]: texto,
        }));
    };

    const limpiarAccionCategoria = (categoriaId) => {
        setAccionesCategoria((prev) => {
            const next = { ...prev };
            delete next[categoriaId];
            return next;
        });
    };

    const marcarAccionProducto = (productoId, texto) => {
        setAccionesProducto((prev) => ({
            ...prev,
            [productoId]: texto,
        }));
    };

    const limpiarAccionProducto = (productoId) => {
        setAccionesProducto((prev) => {
            const next = { ...prev };
            delete next[productoId];
            return next;
        });
    };

    const guardarConfiguracionSucursal = (event) => {
        event.preventDefault();

        formSucursal.put(route(`${routePrefix}.configuraciones.sucursal.update`), {
            preserveScroll: true,
            onStart: () => setGuardandoSucursal(true),
            onFinish: () => setGuardandoSucursal(false),
        });
    };



    const guardarCategoria = (categoriaId) => {
        router.put(
            route(`${routePrefix}.configuraciones.categorias.update`, categoriaId),
            {
                nombre: categoriaValues[categoriaId]?.nombre,
                porcentaje_comision: categoriaValues[categoriaId]?.porcentaje_comision,
                sucursal_id: sucursalActivaId || undefined,
            },
            {
                preserveScroll: true,
                onStart: () => marcarAccionCategoria(categoriaId, 'Guardando...'),
                onFinish: () => limpiarAccionCategoria(categoriaId),
            }
        );
    };

    const crearCategoria = (event) => {
        event.preventDefault();
        nuevaCategoriaForm.post(route(`${routePrefix}.configuraciones.categorias.store`), {
            preserveScroll: true,
            onSuccess: () => {
                nuevaCategoriaForm.reset();
            },
        });
    };

    const crearProducto = (event) => {
        event.preventDefault();
        nuevoProductoForm.post(route(`${routePrefix}.configuraciones.productos.store`), {
            preserveScroll: true,
            onSuccess: () => {
                nuevoProductoForm.reset();
            },
        });
    };

    const inactivarCategoria = (categoriaId) => {
        if (!window.confirm('La categoría pasará a la sección de inactivas. ¿Deseas continuar?')) {
            return;
        }

        router.put(route(`${routePrefix}.configuraciones.categorias.inactivar`, categoriaId), { sucursal_id: sucursalActivaId || undefined }, {
            preserveScroll: true,
            onStart: () => marcarAccionCategoria(categoriaId, 'Inactivando...'),
            onFinish: () => limpiarAccionCategoria(categoriaId),
        });
    };

    const activarCategoria = (categoriaId) => {
        router.put(route(`${routePrefix}.configuraciones.categorias.activar`, categoriaId), { sucursal_id: sucursalActivaId || undefined }, {
            preserveScroll: true,
            onStart: () => marcarAccionCategoria(categoriaId, 'Activando...'),
            onFinish: () => limpiarAccionCategoria(categoriaId),
        });
    };

    const eliminarCategoria = (categoriaId) => {
        if (!window.confirm('Esta acción eliminará la categoría (soft delete). ¿Deseas continuar?')) {
            return;
        }

        router.delete(route(`${routePrefix}.configuraciones.categorias.delete`, categoriaId), {
            data: { sucursal_id: sucursalActivaId || undefined },
            preserveScroll: true,
            onStart: () => marcarAccionCategoria(categoriaId, 'Eliminando...'),
            onFinish: () => limpiarAccionCategoria(categoriaId),
        });
    };

    const guardarProducto = (productoId) => {
        router.put(
            route(`${routePrefix}.configuraciones.productos.update`, productoId),
            {
                monto_principal: productoValues[productoId]?.monto_principal,
                monto_seguro: productoValues[productoId]?.monto_seguro,
                porcentaje_comision_empresa: productoValues[productoId]?.porcentaje_comision_empresa,
                porcentaje_interes_quincenal: productoValues[productoId]?.porcentaje_interes_quincenal,
                numero_quincenas: productoValues[productoId]?.numero_quincenas,
                sucursal_id: sucursalActivaId || undefined,
            },
            {
                preserveScroll: true,
                onStart: () => marcarAccionProducto(productoId, 'Guardando...'),
                onFinish: () => limpiarAccionProducto(productoId),
            }
        );
    };

    const activarProducto = (productoId) => {
        router.put(route(`${routePrefix}.configuraciones.productos.activar`, productoId), { sucursal_id: sucursalActivaId || undefined }, {
            preserveScroll: true,
            onStart: () => marcarAccionProducto(productoId, 'Activando...'),
            onFinish: () => limpiarAccionProducto(productoId),
        });
    };

    const inactivarProducto = (productoId) => {
        router.put(route(`${routePrefix}.configuraciones.productos.inactivar`, productoId), { sucursal_id: sucursalActivaId || undefined }, {
            preserveScroll: true,
            onStart: () => marcarAccionProducto(productoId, 'Inactivando...'),
            onFinish: () => limpiarAccionProducto(productoId),
        });
    };

    const eliminarProducto = (productoId) => {
        if (!window.confirm('El producto se archivará con soft delete. ¿Deseas continuar?')) {
            return;
        }

        router.delete(route(`${routePrefix}.configuraciones.productos.delete`, productoId), {
            data: { sucursal_id: sucursalActivaId || undefined },
            preserveScroll: true,
            onStart: () => marcarAccionProducto(productoId, 'Eliminando...'),
            onFinish: () => limpiarAccionProducto(productoId),
        });
    };

    const restaurarProducto = (productoId) => {
        router.post(route(`${routePrefix}.configuraciones.productos.restaurar`, productoId), { sucursal_id: sucursalActivaId || undefined }, {
            preserveScroll: true,
            onStart: () => marcarAccionProducto(productoId, 'Restaurando...'),
            onFinish: () => limpiarAccionProducto(productoId),
        });
    };

    const formatearValor = (key, value) => {
        if (value === null || value === undefined || value === '') {
            return 'Sin valor';
        }

        if (Array.isArray(value)) {
            return value
                .map((item) => {
                    const desde = item.desde ?? 0;
                    const hasta = item.hasta ?? 'sin tope';
                    return `${desde} - ${hasta}: $${item.monto ?? 0}`;
                })
                .join(' | ');
        }

        if (key.includes('porcentaje')) {
            return `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 4 })}%`;
        }

        if (key === 'linea_credito_default') {
            return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return String(value);
    };

    const renderCambios = (data) => {
        const entries = Object.entries(data || {});

        if (entries.length === 0) {
            return <p className="mt-1 text-xs text-gray-500">Sin datos.</p>;
        }

        return (
            <div className="mt-1 space-y-1">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-gray-600">{FIELD_LABELS[key] || key}</span>
                        <span className="font-medium text-right text-gray-900">{formatearValor(key, value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AdminLayout title="Configuraciones Variables">
            <Head title="Configuraciones Variables" />

            <div className="mb-4 fin-card">
                <h2 className="fin-title">Parámetros variables del negocio</h2>
                <p className="mt-1 fin-subtitle">
                    {puedeEditar
                        ? 'Como Admin, los cambios se aplican automáticamente en todas las sucursales activas.'
                        : 'Consulta el catálogo de productos vigente para la operación comercial.'}
                </p>
                {esAdmin ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>
                            Ámbito: <span className="font-semibold text-gray-900">Global</span>
                        </span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Aplica a todas las sucursales activas
                        </span>
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-gray-600">
                        Sucursal activa: <span className="font-semibold">{sucursal?.nombre || 'Sin sucursal asignada'}</span>
                    </p>
                )}
            </div>

            <div className="mb-4 fin-card">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'sucursal', label: 'Sucursal' },
                        { id: 'categorias', label: `Categorías (${categorias.length})` },
                        { id: 'productos', label: `Productos (${productos.length})` },
                        { id: 'historial', label: `Historial (${historialCambios.length})` },
                    ]
                        .filter((tab) => (soloLecturaProductos ? tab.id === 'productos' : true))
                        .map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setTabActiva(tab.id)}
                                className={`px-4 py-2 text-sm rounded-lg border transition ${tabActiva === tab.id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                </div>
            </div>

            {tabActiva === 'sucursal' && !soloLecturaProductos && (
                <TabConfiguracion
                    formSucursal={formSucursal}
                    guardarConfiguracionSucursal={guardarConfiguracionSucursal}
                    guardandoSucursal={guardandoSucursal}
                    generalError={errors?.general}
                    esAdmin={esAdmin}
                />
            )}

            {tabActiva === 'categorias' && !soloLecturaProductos && (
                <TabCategorias
                    nuevaCategoriaForm={nuevaCategoriaForm}
                    crearCategoria={crearCategoria}
                    busquedaCategorias={busquedaCategorias}
                    setBusquedaCategorias={setBusquedaCategorias}
                    categoriasActivasFiltradas={categoriasActivasFiltradas}
                    categoriasInactivasFiltradas={categoriasInactivasFiltradas}
                    categorias={categorias}
                    categoriasActivasPagina={categoriasActivasPagina}
                    categoriasInactivasPagina={categoriasInactivasPagina}
                    categoriaValues={categoriaValues}
                    setCategoriaValues={setCategoriaValues}
                    guardarCategoria={guardarCategoria}
                    inactivarCategoria={inactivarCategoria}
                    eliminarCategoria={eliminarCategoria}
                    activarCategoria={activarCategoria}
                    accionesCategoria={accionesCategoria}
                    paginaActivas={paginaActivas}
                    totalPaginasActivas={totalPaginasActivas}
                    setPaginaActivas={setPaginaActivas}
                    paginaInactivas={paginaInactivas}
                    totalPaginasInactivas={totalPaginasInactivas}
                    setPaginaInactivas={setPaginaInactivas}
                    ordenCategorias={ordenCategorias}
                    alternarOrdenCategorias={(campo) => alternarOrden(setOrdenCategorias, campo)}
                />
            )}

            {tabActiva === 'historial' && !soloLecturaProductos && (
                <TabHistorial
                    historialFiltrado={historialFiltrado}
                    historialCambios={historialCambios}
                    busquedaHistorial={busquedaHistorial}
                    setBusquedaHistorial={setBusquedaHistorial}
                    historialPagina={historialPagina}
                    EVENT_LABELS={EVENT_LABELS}
                    formatearFechaServidor={formatearFechaServidor}
                    setCambioSeleccionado={setCambioSeleccionado}
                    paginaHistorial={paginaHistorial}
                    totalPaginasHistorial={totalPaginasHistorial}
                    setPaginaHistorial={setPaginaHistorial}
                    ordenHistorial={ordenHistorial}
                    alternarOrdenHistorial={(campo) => alternarOrden(setOrdenHistorial, campo)}
                />
            )}

            {tabActiva === 'productos' && (
                <TabProductos
                    productos={productos}
                    productoValues={productoValues}
                    setProductoValues={setProductoValues}
                    guardarProducto={guardarProducto}
                    activarProducto={activarProducto}
                    inactivarProducto={inactivarProducto}
                    eliminarProducto={eliminarProducto}
                    restaurarProducto={restaurarProducto}
                    accionesProducto={accionesProducto}
                    nuevoProductoForm={nuevoProductoForm}
                    crearProducto={crearProducto}
                    soloLectura={soloLecturaProductos}
                />
            )}

            {cambioSeleccionado && (
                <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setCambioSeleccionado(null)}>
                    <div
                        className="absolute top-0 right-0 w-full h-full max-w-xl p-4 overflow-y-auto bg-white shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">Detalle del cambio</h4>
                            <button type="button" className="fin-btn-secondary" onClick={() => setCambioSeleccionado(null)}>Cerrar</button>
                        </div>

                        <div className="mb-4 space-y-2 text-sm">
                            <p><span className="text-gray-500">Fecha:</span> {formatearFechaServidor(cambioSeleccionado.creado_en)}</p>
                            <p>
                                <span className="text-gray-500">Tipo:</span> {EVENT_LABELS[cambioSeleccionado.tipo_evento] || cambioSeleccionado.tipo_evento}
                                {cambioSeleccionado.referencia_id ? ` #${cambioSeleccionado.referencia_id}` : ''}
                            </p>
                            <p>
                                <span className="text-gray-500">Usuario:</span>{' '}
                                {cambioSeleccionado.actualizado_por?.nombre_completo || cambioSeleccionado.actualizado_por?.nombre_usuario || 'Sistema'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-3 rounded bg-gray-50">
                                <p className="text-xs font-semibold text-gray-700">Antes</p>
                                {renderCambios(cambioSeleccionado.cambios_antes_json)}
                            </div>
                            <div className="p-3 rounded bg-green-50">
                                <p className="text-xs font-semibold text-green-700">Después</p>
                                {renderCambios(cambioSeleccionado.cambios_despues_json)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
