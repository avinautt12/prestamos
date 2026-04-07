import React, { useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const FIELD_LABELS = {
    dia_corte: 'Día de corte',
    hora_corte: 'Hora de corte',
    frecuencia_pago_dias: 'Frecuencia de pago (días)',
    plazo_pago_dias: 'Plazo de pago (días)',
    linea_credito_default: 'Línea de crédito inicial',
    seguro_tabuladores_json: 'Seguro por tabuladores',
    porcentaje_comision_apertura: 'Comisión de apertura (%)',
    multa_incumplimiento_monto: 'Multa por incumplimiento',
    factor_divisor_puntos: 'Factor divisor puntos',
    multiplicador_puntos: 'Multiplicador puntos',
    valor_punto_mxn: 'Valor del punto (MXN)',
    porcentaje_comision: 'Comisión (%)',
    porcentaje_comision_empresa: 'Comisión empresa (%)',
    porcentaje_interes_quincenal: 'Interés quincenal (%)',
    numero_quincenas: 'Plazo (quincenas)',
};

const EVENT_LABELS = {
    SUCURSAL: 'Configuración de sucursal',
    CATEGORIA: 'Categoría',
    PRODUCTO: 'Producto',
};

const DEFAULT_SEGURO_TABULADORES = [
    { desde: 0, hasta: 5000, monto: 50 },
    { desde: 5001, hasta: 15000, monto: 100 },
    { desde: 15001, hasta: null, monto: 150 },
];

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

export default function Configuraciones({ sucursal, configuracionSucursal, categorias, productos, historialCambios = [] }) {
    const formSucursal = useForm({
        dia_corte: configuracionSucursal?.dia_corte ?? '',
        hora_corte: configuracionSucursal?.hora_corte ?? '',
        frecuencia_pago_dias: configuracionSucursal?.frecuencia_pago_dias ?? 14,
        plazo_pago_dias: configuracionSucursal?.plazo_pago_dias ?? 15,
        linea_credito_default: configuracionSucursal?.linea_credito_default ?? 0,
        seguro_tabuladores_json: JSON.stringify(configuracionSucursal?.seguro_tabuladores_json ?? DEFAULT_SEGURO_TABULADORES, null, 2),
        porcentaje_comision_apertura: configuracionSucursal?.porcentaje_comision_apertura ?? 10,
        porcentaje_interes_quincenal: configuracionSucursal?.porcentaje_interes_quincenal ?? 5,
        multa_incumplimiento_monto: configuracionSucursal?.multa_incumplimiento_monto ?? 300,
        factor_divisor_puntos: configuracionSucursal?.factor_divisor_puntos ?? 1200,
        multiplicador_puntos: configuracionSucursal?.multiplicador_puntos ?? 3,
        valor_punto_mxn: configuracionSucursal?.valor_punto_mxn ?? 2,
    });

    const categoriasMap = useMemo(() => {
        const map = {};
        (categorias || []).forEach((cat) => {
            map[cat.id] = String(cat.porcentaje_comision ?? '0');
        });
        return map;
    }, [categorias]);

    const productosMap = useMemo(() => {
        const map = {};
        (productos || []).forEach((producto) => {
            map[producto.id] = {
                porcentaje_comision_empresa: String(producto.porcentaje_comision_empresa ?? '0'),
                porcentaje_interes_quincenal: String(producto.porcentaje_interes_quincenal ?? '0'),
                numero_quincenas: String(producto.numero_quincenas ?? '12'),
            };
        });
        return map;
    }, [productos]);

    const [categoriaValues, setCategoriaValues] = React.useState(categoriasMap);
    const [productoValues, setProductoValues] = React.useState(productosMap);

    React.useEffect(() => {
        setCategoriaValues(categoriasMap);
    }, [categoriasMap]);

    React.useEffect(() => {
        setProductoValues(productosMap);
    }, [productosMap]);

    const guardarConfiguracionSucursal = (event) => {
        event.preventDefault();
        formSucursal.put(route('gerente.configuraciones.sucursal.update'));
    };

    const guardarCategoria = (categoriaId) => {
        router.put(
            route('gerente.configuraciones.categorias.update', categoriaId),
            {
                porcentaje_comision: categoriaValues[categoriaId],
            },
            {
                preserveScroll: true,
            }
        );
    };

    const guardarProducto = (productoId) => {
        router.put(
            route('gerente.configuraciones.productos.update', productoId),
            {
                porcentaje_comision_empresa: productoValues[productoId]?.porcentaje_comision_empresa,
                porcentaje_interes_quincenal: productoValues[productoId]?.porcentaje_interes_quincenal,
                numero_quincenas: productoValues[productoId]?.numero_quincenas,
            },
            {
                preserveScroll: true,
            }
        );
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

    const parseSeguroTabuladores = () => {
        try {
            return JSON.parse(formSucursal.data.seguro_tabuladores_json || '[]');
        } catch (_error) {
            return [];
        }
    };

    const renderCambios = (data) => {
        const entries = Object.entries(data || {});

        if (entries.length === 0) {
            return <p className="text-xs text-gray-500 mt-1">Sin datos.</p>;
        }

        return (
            <div className="space-y-1 mt-1">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-gray-600">{FIELD_LABELS[key] || key}</span>
                        <span className="text-gray-900 font-medium text-right">{formatearValor(key, value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AdminLayout title="Configuraciones Variables">
            <Head title="Configuraciones Variables" />

            <div className="fin-card mb-4">
                <h2 className="fin-title">Parámetros variables del negocio</h2>
                <p className="fin-subtitle mt-1">
                    Ajusta fecha de corte, categorías, comisiones, intereses quincenales, línea de crédito base, frecuencia y plazo de pago.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Sucursal activa: <span className="font-semibold">{sucursal?.nombre || 'Sin sucursal asignada'}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <form className="fin-card" onSubmit={guardarConfiguracionSucursal}>
                    <h3 className="font-semibold text-gray-900">1) Configuración por sucursal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                            <label className="text-sm text-gray-700">Fecha de corte (día del mes)</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="fin-input mt-1"
                                value={formSucursal.data.dia_corte}
                                onChange={(e) => formSucursal.setData('dia_corte', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-700">Hora de corte</label>
                            <input
                                type="time"
                                className="fin-input mt-1"
                                value={formSucursal.data.hora_corte}
                                onChange={(e) => formSucursal.setData('hora_corte', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-700">Frecuencia de pago (días)</label>
                            <input
                                type="number"
                                min="1"
                                max="90"
                                className="fin-input mt-1"
                                value={formSucursal.data.frecuencia_pago_dias}
                                onChange={(e) => formSucursal.setData('frecuencia_pago_dias', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-700">Plazo de pago (días)</label>
                            <input
                                type="number"
                                min="1"
                                max="180"
                                className="fin-input mt-1"
                                value={formSucursal.data.plazo_pago_dias}
                                onChange={(e) => formSucursal.setData('plazo_pago_dias', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-700">Línea de crédito inicial sugerida</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="fin-input mt-1"
                                value={formSucursal.data.linea_credito_default}
                                onChange={(e) => formSucursal.setData('linea_credito_default', e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-700">Seguro por tabulador (JSON)</label>
                            <textarea
                                rows={6}
                                className="fin-input mt-1 font-mono text-xs"
                                value={formSucursal.data.seguro_tabuladores_json}
                                onChange={(e) => formSucursal.setData('seguro_tabuladores_json', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ejemplo: <span className="font-mono">[{'{'}"desde":0,"hasta":5000,"monto":50{'}'}]</span></p>
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Comisión de apertura (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.0001"
                                className="fin-input mt-1"
                                value={formSucursal.data.porcentaje_comision_apertura}
                                onChange={(e) => formSucursal.setData('porcentaje_comision_apertura', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Interés quincenal (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.0001"
                                className="fin-input mt-1"
                                value={formSucursal.data.porcentaje_interes_quincenal}
                                onChange={(e) => formSucursal.setData('porcentaje_interes_quincenal', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Multa por incumplimiento</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="fin-input mt-1"
                                value={formSucursal.data.multa_incumplimiento_monto}
                                onChange={(e) => formSucursal.setData('multa_incumplimiento_monto', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Factor divisor puntos</label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                className="fin-input mt-1"
                                value={formSucursal.data.factor_divisor_puntos}
                                onChange={(e) => formSucursal.setData('factor_divisor_puntos', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Multiplicador puntos</label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                className="fin-input mt-1"
                                value={formSucursal.data.multiplicador_puntos}
                                onChange={(e) => formSucursal.setData('multiplicador_puntos', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Valor del punto (MXN)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="fin-input mt-1"
                                value={formSucursal.data.valor_punto_mxn}
                                onChange={(e) => formSucursal.setData('valor_punto_mxn', e.target.value)}
                            />
                        </div>
                    </div>
                    <button type="submit" className="fin-btn-primary mt-4" disabled={formSucursal.processing}>
                        Guardar configuración de sucursal
                    </button>
                </form>

                <div className="fin-card">
                    <h3 className="font-semibold text-gray-900">2) Categorías (porcentajes)</h3>
                    <div className="space-y-3 mt-3">
                        {(categorias || []).map((categoria) => (
                            <div key={categoria.id} className="border border-gray-200 rounded-lg p-3">
                                <p className="text-sm font-semibold text-gray-900">{categoria.nombre}</p>
                                <p className="text-xs text-gray-500 mb-2">Código: {categoria.codigo}</p>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-600">Porcentaje de comisión</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.0001"
                                            className="fin-input mt-1"
                                            value={categoriaValues[categoria.id] ?? ''}
                                            onChange={(e) =>
                                                setCategoriaValues((prev) => ({
                                                    ...prev,
                                                    [categoria.id]: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="fin-btn-secondary"
                                        onClick={() => guardarCategoria(categoria.id)}
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fin-card mt-4">
                <h3 className="font-semibold text-gray-900">3) Productos (comisiones, intereses y plazos)</h3>
                <div className="space-y-3 mt-3">
                    {(productos || []).map((producto) => (
                        <div key={producto.id} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-gray-900">{producto.nombre}</p>
                            <p className="text-xs text-gray-500 mb-2">Código: {producto.codigo}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-gray-600">Comisión empresa (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.0001"
                                        className="fin-input mt-1"
                                        value={productoValues[producto.id]?.porcentaje_comision_empresa ?? ''}
                                        onChange={(e) =>
                                            setProductoValues((prev) => ({
                                                ...prev,
                                                [producto.id]: {
                                                    ...prev[producto.id],
                                                    porcentaje_comision_empresa: e.target.value,
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
                                        className="fin-input mt-1"
                                        value={productoValues[producto.id]?.porcentaje_interes_quincenal ?? ''}
                                        onChange={(e) =>
                                            setProductoValues((prev) => ({
                                                ...prev,
                                                [producto.id]: {
                                                    ...prev[producto.id],
                                                    porcentaje_interes_quincenal: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Plazo (quincenas)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="72"
                                        className="fin-input mt-1"
                                        value={productoValues[producto.id]?.numero_quincenas ?? ''}
                                        onChange={(e) =>
                                            setProductoValues((prev) => ({
                                                ...prev,
                                                [producto.id]: {
                                                    ...prev[producto.id],
                                                    numero_quincenas: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className="fin-btn-secondary mt-3"
                                onClick={() => guardarProducto(producto.id)}
                            >
                                Guardar producto
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fin-card mt-4">
                <h3 className="font-semibold text-gray-900">4) Historial reciente de cambios</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Últimos movimientos de configuración aplicados en tu sucursal.
                </p>

                {historialCambios.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-3">Aún no hay cambios registrados.</p>
                ) : (
                    <div className="space-y-3 mt-3">
                        {historialCambios.map((cambio) => {
                            const actor =
                                cambio.actualizado_por?.nombre_completo ||
                                cambio.actualizado_por?.nombre_usuario ||
                                'Sistema';

                            return (
                                <div key={cambio.id} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {EVENT_LABELS[cambio.tipo_evento] || cambio.tipo_evento}
                                            {cambio.referencia_id ? ` #${cambio.referencia_id}` : ''}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatearFechaServidor(cambio.creado_en)}
                                        </p>
                                    </div>

                                    <p className="text-xs text-gray-600 mt-1">Actualizó: {actor}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <div className="bg-gray-50 rounded p-2">
                                            <p className="text-xs font-semibold text-gray-700">Antes</p>
                                            {renderCambios(cambio.cambios_antes_json)}
                                        </div>
                                        <div className="bg-green-50 rounded p-2">
                                            <p className="text-xs font-semibold text-green-700">Después</p>
                                            {renderCambios(cambio.cambios_despues_json)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
