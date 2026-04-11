import React, { useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import TabletLayout from '@/Layouts/TabletLayout';
import { buildConciliacionesQuery, buildHistorialExportQuery } from './conciliacionesQueryParams';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleXmark,
    faCircleCheck,
    faCloudArrowUp,
    faClockRotateLeft,
    faFileImport,
    faFolderOpen,
    faLink,
    faMoneyBillWave,
    faRotate,
    faScaleBalanced,
    faSpinner,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

export default function Conciliaciones({ resumen, alertas, filtros, movimientosPendientes, relacionesPendientes, historialConciliaciones, historialMeta, ventanaCorte }) {
    const { flash } = usePage().props;
    const importResult = flash?.import_result || null;
    const uploadForm = useForm({
        archivo: null,
    });

    const manualForm = useForm({
        movimiento_bancario_id: '',
        relacion_corte_id: '',
        estado: 'CON_DIFERENCIA',
        observaciones: '',
    });

    const [filtroReferencia, setFiltroReferencia] = useState('');
    const [filtroMovimientos, setFiltroMovimientos] = useState(filtros?.mov_q || '');
    const [filtroFechaMov, setFiltroFechaMov] = useState(filtros?.mov_fecha || '');
    const [filtroRelaciones, setFiltroRelaciones] = useState(filtros?.rel_q || '');
    const [filtroEstadoRelacion, setFiltroEstadoRelacion] = useState(filtros?.rel_estado || 'TODAS');
    const [movimientoSeleccionadoId, setMovimientoSeleccionadoId] = useState('');
    const [filtroHistorialQ, setFiltroHistorialQ] = useState(filtros?.hist_q || '');
    const [filtroHistorialEstado, setFiltroHistorialEstado] = useState(filtros?.hist_estado || 'TODOS');
    const [filtroHistorialDesde, setFiltroHistorialDesde] = useState(filtros?.hist_desde || '');
    const [filtroHistorialHasta, setFiltroHistorialHasta] = useState(filtros?.hist_hasta || '');
    const [paginaMovimientos, setPaginaMovimientos] = useState(1);
    const [paginaRelaciones, setPaginaRelaciones] = useState(1);
    const [tabActiva, setTabActiva] = useState('manual');
    const [estadoAplicacion, setEstadoAplicacion] = useState({ tipo: '', mensaje: '' });

    const MOVIMIENTOS_POR_PAGINA = 8;
    const RELACIONES_POR_PAGINA = 8;
    const relacionSeleccionada = useMemo(
        () => relacionesPendientes.find((relacion) => String(relacion.id) === String(manualForm.data.relacion_corte_id)),
        [relacionesPendientes, manualForm.data.relacion_corte_id]
    );

    const movimientoSeleccionado = useMemo(
        () => movimientosPendientes.find((mov) => String(mov.id) === String(movimientoSeleccionadoId)),
        [movimientosPendientes, movimientoSeleccionadoId]
    );

    const relacionesFiltradas = useMemo(() => {
        const term = filtroReferencia.trim().toLowerCase();

        if (!term) {
            return relacionesPendientes;
        }

        return relacionesPendientes.filter((relacion) => {
            const numero = (relacion.numero_relacion || '').toLowerCase();
            const referencia = (relacion.referencia_pago || '').toLowerCase();
            const distribuidora = (relacion.distribuidora?.nombre || '').toLowerCase();
            return numero.includes(term) || referencia.includes(term) || distribuidora.includes(term);
        });
    }, [filtroReferencia, relacionesPendientes]);

    const totalPaginasMovimientos = Math.max(1, Math.ceil((movimientosPendientes?.length || 0) / MOVIMIENTOS_POR_PAGINA));
    const totalPaginasRelaciones = Math.max(1, Math.ceil((relacionesFiltradas?.length || 0) / RELACIONES_POR_PAGINA));
    const totalPaginasHistorial = Math.max(1, historialMeta?.last_page || 1);
    const paginaHistorial = Math.max(1, historialMeta?.current_page || 1);

    const movimientosPagina = useMemo(() => {
        const inicio = (paginaMovimientos - 1) * MOVIMIENTOS_POR_PAGINA;
        return (movimientosPendientes || []).slice(inicio, inicio + MOVIMIENTOS_POR_PAGINA);
    }, [movimientosPendientes, paginaMovimientos]);

    const relacionesPagina = useMemo(() => {
        const inicio = (paginaRelaciones - 1) * RELACIONES_POR_PAGINA;
        return (relacionesFiltradas || []).slice(inicio, inicio + RELACIONES_POR_PAGINA);
    }, [relacionesFiltradas, paginaRelaciones]);

    const tabs = [
        { id: 'importar', label: 'Importar', icon: faFileImport },
        { id: 'manual', label: `Manual (${movimientosPendientes?.length || 0})`, icon: faScaleBalanced },
        { id: 'historial', label: `Historial (${historialMeta?.total || 0})`, icon: faClockRotateLeft },
    ];

    const estadoFiltros = useMemo(() => ({
        mov_q: filtroMovimientos,
        mov_fecha: filtroFechaMov,
        rel_q: filtroRelaciones,
        rel_estado: filtroEstadoRelacion,
        hist_q: filtroHistorialQ,
        hist_estado: filtroHistorialEstado,
        hist_desde: filtroHistorialDesde,
        hist_hasta: filtroHistorialHasta,
    }), [
        filtroMovimientos,
        filtroFechaMov,
        filtroRelaciones,
        filtroEstadoRelacion,
        filtroHistorialQ,
        filtroHistorialEstado,
        filtroHistorialDesde,
        filtroHistorialHasta,
    ]);

    const exportCsvUrl = useMemo(() => {
        const query = buildHistorialExportQuery(estadoFiltros, 'csv');
        return `${route('cajera.conciliaciones.exportar')}?${query}`;
    }, [estadoFiltros]);

    const exportExcelUrl = useMemo(() => {
        const query = buildHistorialExportQuery(estadoFiltros, 'xlsx');
        return `${route('cajera.conciliaciones.exportar')}?${query}`;
    }, [estadoFiltros]);

    const handleUpload = (e) => {
        e.preventDefault();

        if (!uploadForm.data.archivo) {
            uploadForm.setError('archivo', 'Selecciona un archivo primero.');
            return;
        }

        uploadForm.post(route('cajera.conciliaciones.importar'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                uploadForm.reset();
            },
        });
    };

    const aplicarFiltros = () => {
        const query = buildConciliacionesQuery(estadoFiltros);
        window.location.href = query ? `${route('cajera.conciliaciones')}?${query}` : route('cajera.conciliaciones');
    };

    const aplicarFiltrosHistorial = () => {
        const query = buildConciliacionesQuery(estadoFiltros);
        window.location.href = query ? `${route('cajera.conciliaciones')}?${query}` : route('cajera.conciliaciones');
    };

    const irPaginaHistorial = (page) => {
        const query = buildConciliacionesQuery(estadoFiltros, { page });
        window.location.href = query ? `${route('cajera.conciliaciones')}?${query}` : route('cajera.conciliaciones');
    };

    const aplicarManual = () => {
        if (manualForm.processing) {
            return;
        }

        if (!movimientoSeleccionadoId) {
            manualForm.setError('movimiento_bancario_id', 'Primero selecciona un movimiento bancario.');
            return;
        }

        if (!manualForm.data.relacion_corte_id) {
            manualForm.setError('relacion_corte_id', 'Primero selecciona una relación candidata.');
            return;
        }

        manualForm.transform((data) => ({
            ...data,
            movimiento_bancario_id: Number(movimientoSeleccionadoId),
        }));

        manualForm.post(route('cajera.conciliaciones.manual'), {
            preserveScroll: true,
            onStart: () => {
                setEstadoAplicacion({ tipo: 'info', mensaje: 'Aplicando conciliación manual...' });
            },
            onSuccess: () => {
                manualForm.reset('movimiento_bancario_id', 'observaciones');
                manualForm.clearErrors();
                setMovimientoSeleccionadoId('');
                setEstadoAplicacion({ tipo: 'success', mensaje: 'Conciliación aplicada correctamente.' });
            },
            onError: () => {
                setEstadoAplicacion({ tipo: 'error', mensaje: 'No se pudo aplicar la conciliación. Revisa los errores mostrados.' });
            },
            onFinish: () => {
                manualForm.transform((data) => data);
            },
        });
    };

    const formatImportDate = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '-';

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return raw;
        }

        const jpMatches = [...raw.matchAll(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/g)];
        if (jpMatches.length > 0) {
            const last = jpMatches[jpMatches.length - 1];
            const y = last[1];
            const m = String(last[2]).padStart(2, '0');
            const d = String(last[3]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        return raw.replace(/[年月]/g, '-').replace(/日/g, '').replace(/--+/g, '-');
    };

    const formatImportAmount = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return value ?? '-';
        }

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numeric);
    };

    return (
        <TabletLayout title="Conciliaciones de Relaciones">
            <Head title="Conciliaciones" />

            <div className="py-4 space-y-6">
                {(flash?.message || flash?.error) && (
                    <section className={`rounded-xl border px-4 py-4 text-sm ${flash?.error
                        ? 'border-red-300 bg-red-50 text-red-800 shadow-md'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-md'
                        }`}>
                        <div className="flex items-start gap-3">
                            <FontAwesomeIcon
                                icon={flash?.error ? faTriangleExclamation : faCircleCheck}
                                className={`text-xl mt-0.5 ${flash?.error ? 'text-red-600' : 'text-emerald-600'}`}
                            />
                            <div>
                                <p className={`font-bold ${flash?.error ? 'text-red-900' : 'text-emerald-900'}`}>
                                    {flash?.error ? flash.error : 'Importacion completada correctamente.'}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                    <h2 className="text-xl font-bold text-gray-900">Conciliaciones Bancarias</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Flujo operativo para importar movimientos, conciliarlos y revisar historial con un esquema limpio por pestañas.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4 xl:grid-cols-4">
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700">
                                <FontAwesomeIcon icon={faRotate} fixedWidth />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Mov. pendientes</p>
                                <p className="text-lg font-bold leading-tight text-gray-900">{resumen?.movimientos_pendientes ?? 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700">
                                <FontAwesomeIcon icon={faLink} fixedWidth />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Rel. pendientes</p>
                                <p className="text-lg font-bold leading-tight text-gray-900">{resumen?.relaciones_pendientes ?? 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700">
                                <FontAwesomeIcon icon={faScaleBalanced} fixedWidth />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Conciliadas hoy</p>
                                <p className="text-lg font-bold leading-tight text-gray-900">{resumen?.conciliadas_hoy ?? 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700">
                                <FontAwesomeIcon icon={faMoneyBillWave} fixedWidth />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Monto hoy</p>
                                <p className="text-lg font-bold leading-tight text-gray-900">${Number(resumen?.monto_conciliado_hoy ?? 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {Array.isArray(alertas) && alertas.length > 0 && (
                    <section className="space-y-2">
                        {alertas.map((alerta, idx) => (
                            <div
                                key={`${alerta.nivel}-${idx}`}
                                className={`rounded-lg border px-3 py-2 text-sm ${alerta.nivel === 'danger'
                                    ? 'border-red-300 bg-red-50 text-red-800'
                                    : 'border-amber-300 bg-amber-50 text-amber-800'
                                    }`}
                            >
                                {alerta.mensaje}
                            </div>
                        ))}
                    </section>
                )}

                <section className="p-3 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setTabActiva(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition ${tabActiva === tab.id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <FontAwesomeIcon icon={tab.icon} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                {tabActiva === 'importar' && (
                    <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <FontAwesomeIcon icon={faFileImport} className="text-lg text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800">Carga de archivo bancario (Excel o CSV)</h2>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">
                            Este proceso lee el archivo bancario y aplica conciliación automática exacta por referencia + monto.
                            Lo que no coincida de forma exacta pasa a revisión manual.
                        </p>

                        {/* Simular archivo bancario - ventanas de corte de Charly */}
                        {(() => {
                            const fueraDeVentana = ventanaCorte?.ventana === 'FUERA';
                            const bgClass = fueraDeVentana ? 'border-gray-300 bg-gray-50' : 'border-amber-200 bg-amber-50';
                            const titleClass = fueraDeVentana ? 'text-gray-700' : 'text-amber-900';
                            const subClass = fueraDeVentana ? 'text-gray-500' : 'text-amber-700';
                            const badgeLabel = ventanaCorte?.ventana === 'PRINCIPAL' ? 'Ventana principal'
                                : ventanaCorte?.ventana === 'TARDIOS' ? 'Ventana tardíos'
                                : 'Fuera de ventana';
                            const badgeClass = ventanaCorte?.ventana === 'PRINCIPAL' ? 'bg-green-100 text-green-800'
                                : ventanaCorte?.ventana === 'TARDIOS' ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-200 text-gray-700';

                            return (
                                <div className={`flex items-center justify-between gap-3 p-3 mb-4 border rounded-lg ${bgClass}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-semibold ${titleClass}`}>¿Sin archivo del banco?</p>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${badgeClass}`}>{badgeLabel}</span>
                                        </div>
                                        <p className={`text-xs ${subClass} mt-1`}>
                                            {ventanaCorte?.mensaje || 'Genera un Excel simulado con los pagos reportados para probar la conciliación.'}
                                        </p>
                                    </div>
                                    {fueraDeVentana ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="px-4 py-2 text-xs font-semibold text-white bg-gray-400 rounded-lg cursor-not-allowed whitespace-nowrap"
                                        >
                                            Descarga no disponible
                                        </button>
                                    ) : (
                                        <a
                                            href={route('cajera.conciliaciones.simular-archivo')}
                                            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                                        >
                                            Descargar Excel
                                        </a>
                                    )}
                                </div>
                            );
                        })()}

                        <form onSubmit={handleUpload} className="space-y-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                                        Selecciona tu archivo bancario
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.txt"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            uploadForm.clearErrors('archivo');
                                            if (file) {
                                                // Validación client-side: tamaño max 10 MB
                                                const maxSize = 10 * 1024 * 1024;
                                                if (file.size > maxSize) {
                                                    uploadForm.setError('archivo', `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo permitido: 10 MB.`);
                                                    uploadForm.setData('archivo', null);
                                                    e.target.value = '';
                                                    return;
                                                }
                                                // Validación client-side: extensión
                                                const ext = file.name.split('.').pop()?.toLowerCase();
                                                if (!['xlsx', 'xls', 'csv', 'txt'].includes(ext)) {
                                                    uploadForm.setError('archivo', `Extensión no permitida (.${ext}). Usa .xlsx, .xls, .csv o .txt`);
                                                    uploadForm.setData('archivo', null);
                                                    e.target.value = '';
                                                    return;
                                                }
                                            }
                                            uploadForm.setData('archivo', file);
                                        }}
                                        disabled={uploadForm.processing}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploadForm.processing || !uploadForm.data.archivo}
                                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${uploadForm.processing
                                        ? 'bg-emerald-500 text-white animate-pulse'
                                        : uploadForm.data.archivo
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-gray-300 text-gray-500'
                                        } disabled:cursor-not-allowed`}
                                >
                                    <FontAwesomeIcon
                                        icon={uploadForm.processing ? faSpinner : faCloudArrowUp}
                                        className={uploadForm.processing ? 'animate-spin' : ''}
                                    />
                                    {uploadForm.processing ? 'Procesando...' : 'Importar y conciliar'}
                                </button>
                            </div>

                            {uploadForm.data.archivo && (
                                <div className="flex items-start gap-2 p-3 text-sm border rounded-lg text-emerald-800 border-emerald-200 bg-emerald-50">
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-lg mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Archivo seleccionado:</p>
                                        <p>{uploadForm.data.archivo.name}</p>
                                        <p className="mt-1 text-xs text-emerald-700">Tamaño: {(uploadForm.data.archivo.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                            )}

                            {uploadForm.errors.archivo && (
                                <div className="flex items-start gap-2 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                                    <FontAwesomeIcon icon={faCircleXmark} className="text-lg mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Error al validar archivo:</p>
                                        <p>{uploadForm.errors.archivo}</p>
                                    </div>
                                </div>
                            )}
                        </form>

                        {importResult && Array.isArray(importResult.rows) && importResult.rows.length > 0 && (
                            <div className="mt-6 border border-gray-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                    <h4 className="text-base font-bold text-gray-800">Detalle de la ultima importacion</h4>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Archivo: {importResult.archivo || 'Sin nombre'} | Mostrando hasta 50 filas.
                                    </p>
                                </div>

                                <div className="overflow-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b border-gray-200">
                                                <th className="py-2 pl-4 pr-3">Fila</th>
                                                <th className="py-2 pr-3">Referencia</th>
                                                <th className="py-2 pr-3">Folio</th>
                                                <th className="py-2 pr-3">Monto</th>
                                                <th className="py-2 pr-3">Fecha</th>
                                                <th className="py-2 pr-3">Resultado</th>
                                                <th className="py-2 pr-4">Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResult.rows.map((row, idx) => {
                                                const resultado = String(row.resultado || 'PENDIENTE_MANUAL');
                                                const resultadoClass = resultado === 'CONCILIADA_AUTOMATICA'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : resultado === 'DUPLICADA'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : resultado === 'INVALIDA'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-amber-100 text-amber-800';

                                                return (
                                                    <tr key={`${row.fila || idx}-${idx}`} className="border-b border-gray-100 last:border-b-0">
                                                        <td className="py-2 pl-4 pr-3 text-gray-700">{row.fila || '-'}</td>
                                                        <td className="py-2 pr-3 text-gray-900">{row.referencia || '-'}</td>
                                                        <td className="py-2 pr-3 text-gray-900">{row.folio || '-'}</td>
                                                        <td className="py-2 pr-3 text-gray-900">{formatImportAmount(row.monto)}</td>
                                                        <td className="py-2 pr-3 text-gray-900 whitespace-nowrap">{formatImportDate(row.fecha)}</td>
                                                        <td className="py-2 pr-3">
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${resultadoClass}`}>
                                                                {resultado}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 pr-4 text-gray-700">{row.motivo || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {tabActiva === 'manual' && (
                    <>
                        <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                            <h3 className="mb-4 text-lg font-bold text-gray-800">Filtros operativos</h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <input
                                    type="text"
                                    value={filtroMovimientos}
                                    onChange={(e) => setFiltroMovimientos(e.target.value)}
                                    placeholder="Buscar movimiento (referencia, folio, pagador)"
                                    className="text-sm border-gray-300 rounded-lg"
                                />
                                <input
                                    type="date"
                                    value={filtroFechaMov}
                                    onChange={(e) => setFiltroFechaMov(e.target.value)}
                                    className="text-sm border-gray-300 rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={filtroRelaciones}
                                    onChange={(e) => setFiltroRelaciones(e.target.value)}
                                    placeholder="Buscar relación (número o referencia)"
                                    className="text-sm border-gray-300 rounded-lg"
                                />
                                <select
                                    value={filtroEstadoRelacion}
                                    onChange={(e) => setFiltroEstadoRelacion(e.target.value)}
                                    className="text-sm border-gray-300 rounded-lg"
                                >
                                    <option value="TODAS">Todas las relaciones</option>
                                    <option value="GENERADA">Generada</option>
                                    <option value="PARCIAL">Parcial</option>
                                    <option value="VENCIDA">Vencida</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={aplicarFiltros}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Aplicar filtros
                                </button>
                                <a
                                    href={route('cajera.conciliaciones')}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Limpiar
                                </a>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                            <div className="p-4 bg-white border border-gray-200 shadow-sm xl:col-span-3 rounded-xl sm:p-6">
                                <h3 className="mb-3 text-lg font-bold text-gray-800">Movimientos pendientes de conciliación manual</h3>
                                <div className="grid grid-cols-1 gap-2 mb-4 text-xs md:grid-cols-3">
                                    <div className={`rounded-lg border px-3 py-2 ${movimientoSeleccionado ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                                        <p className="font-semibold tracking-wide uppercase">Paso 1</p>
                                        <p>Selecciona un movimiento</p>
                                    </div>
                                    <div className={`rounded-lg border px-3 py-2 ${relacionSeleccionada ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                                        <p className="font-semibold tracking-wide uppercase">Paso 2</p>
                                        <p>Selecciona una relación</p>
                                    </div>
                                    <div className="px-3 py-2 text-gray-500 bg-white border border-gray-200 rounded-lg">
                                        <p className="font-semibold tracking-wide uppercase">Paso 3</p>
                                        <p>Confirma y aplica</p>
                                    </div>
                                </div>

                                <div className="p-3 mb-4 border rounded-lg border-emerald-200 bg-emerald-50">
                                    <p className="mb-1 text-xs font-semibold tracking-wide uppercase text-emerald-700">Panel de acción manual</p>
                                    <div className="grid grid-cols-1 gap-2 mb-2 text-sm md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500">Movimiento seleccionado</p>
                                            <p className="font-semibold text-gray-900">
                                                {movimientoSeleccionado
                                                    ? `#${movimientoSeleccionado.id} | Ref: ${movimientoSeleccionado.referencia || 'Sin referencia'} | Folio: ${movimientoSeleccionado.folio || 'N/A'}`
                                                    : 'Ninguno seleccionado'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Monto movimiento</p>
                                            <p className="font-semibold text-gray-900">
                                                {movimientoSeleccionado ? `$${Number(movimientoSeleccionado.monto || 0).toFixed(2)}` : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 mb-2 text-sm md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500">Relación seleccionada</p>
                                            <p className="font-semibold text-gray-900">
                                                {relacionSeleccionada
                                                    ? `${relacionSeleccionada.numero_relacion} | Ref: ${relacionSeleccionada.referencia_pago || 'Sin referencia'}`
                                                    : 'Ninguna seleccionada'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Monto esperado</p>
                                            <p className="font-semibold text-gray-900">
                                                {relacionSeleccionada ? `$${Number(relacionSeleccionada.total_a_pagar || 0).toFixed(2)}` : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                        <select
                                            value={manualForm.data.estado}
                                            onChange={(e) => manualForm.setData('estado', e.target.value)}
                                            className="text-sm border-gray-300 rounded-lg"
                                        >
                                            <option value="CON_DIFERENCIA">Conciliar con diferencia</option>
                                            <option value="RECHAZADA">Marcar como rechazada</option>
                                            <option value="CONCILIADA">Forzar conciliada exacta</option>
                                        </select>

                                        <input
                                            type="text"
                                            value={manualForm.data.observaciones}
                                            onChange={(e) => manualForm.setData('observaciones', e.target.value.slice(0, 500))}
                                            placeholder="Observación para la aplicación manual (máx. 500)"
                                            maxLength={500}
                                            className={`flex-1 text-sm rounded-lg ${manualForm.data.observaciones.length > 500 ? 'border-red-400' : 'border-gray-300'}`}
                                        />

                                        <button
                                            type="button"
                                            onClick={aplicarManual}
                                            disabled={manualForm.processing || !movimientoSeleccionado || !relacionSeleccionada || manualForm.data.observaciones.length > 500}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            <FontAwesomeIcon icon={faScaleBalanced} />
                                            {manualForm.processing ? 'Aplicando...' : 'Aplicar conciliación'}
                                        </button>
                                    </div>

                                    {estadoAplicacion.mensaje && (
                                        <div className={`mt-2 text-sm rounded px-3 py-2 border ${estadoAplicacion.tipo === 'success'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : estadoAplicacion.tipo === 'error'
                                                ? 'bg-red-50 border-red-200 text-red-800'
                                                : 'bg-blue-50 border-blue-200 text-blue-800'
                                            }`}>
                                            {estadoAplicacion.mensaje}
                                        </div>
                                    )}

                                    {(manualForm.errors.movimiento_bancario_id || manualForm.errors.relacion_corte_id || manualForm.errors.estado) && (
                                        <div className="mt-2 space-y-1 text-sm text-red-600">
                                            {manualForm.errors.movimiento_bancario_id && <p>{manualForm.errors.movimiento_bancario_id}</p>}
                                            {manualForm.errors.relacion_corte_id && <p>{manualForm.errors.relacion_corte_id}</p>}
                                            {manualForm.errors.estado && <p>{manualForm.errors.estado}</p>}
                                        </div>
                                    )}
                                </div>

                                {movimientosPendientes?.length === 0 ? (
                                    <div className="p-4 text-sm rounded-lg bg-emerald-50 text-emerald-800">
                                        No hay movimientos pendientes en este momento.
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                                        {movimientosPagina.map((movimiento) => (
                                            <article
                                                key={movimiento.id}
                                                className={`border rounded-lg p-3 ${String(movimientoSeleccionadoId) === String(movimiento.id) ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'}`}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">Movimiento #{movimiento.id}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {movimiento.fecha_movimiento} {movimiento.hora_movimiento ? `| ${movimiento.hora_movimiento}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">${Number(movimiento.monto || 0).toFixed(2)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMovimientoSeleccionadoId(String(movimiento.id));
                                                                manualForm.clearErrors('movimiento_bancario_id');
                                                            }}
                                                            className={`mt-1 px-2 py-1 rounded text-xs font-semibold ${String(movimientoSeleccionadoId) === String(movimiento.id) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                        >
                                                            {String(movimientoSeleccionadoId) === String(movimiento.id) ? 'Seleccionado' : 'Seleccionar'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 mt-3 text-sm md:grid-cols-2">
                                                    <Dato label="Referencia" value={movimiento.referencia || 'Sin referencia'} />
                                                    <Dato label="Folio" value={movimiento.folio || 'Sin folio'} />
                                                    <Dato label="Tipo" value={movimiento.tipo_movimiento || 'No especificado'} />
                                                    <Dato label="Pagador" value={movimiento.nombre_pagador || 'No especificado'} />
                                                </div>

                                                {movimiento.concepto_raw && (
                                                    <p className="p-2 mt-2 text-xs text-gray-600 border border-gray-100 rounded bg-gray-50">
                                                        <span className="font-semibold">Concepto:</span> {movimiento.concepto_raw}
                                                    </p>
                                                )}

                                            </article>
                                        ))}
                                    </div>
                                )}

                                <PaginacionSimple
                                    pagina={paginaMovimientos}
                                    totalPaginas={totalPaginasMovimientos}
                                    onCambiar={setPaginaMovimientos}
                                    etiqueta="movimientos"
                                />
                            </div>

                            <div className="p-4 bg-white border border-gray-200 shadow-sm xl:col-span-2 rounded-xl sm:p-6">
                                <h3 className="mb-3 text-lg font-bold text-gray-800">Relaciones candidatas</h3>
                                <input
                                    type="text"
                                    value={filtroReferencia}
                                    onChange={(e) => {
                                        setFiltroReferencia(e.target.value);
                                        setPaginaRelaciones(1);
                                    }}
                                    placeholder="Buscar por referencia, número o distribuidora"
                                    className="w-full mb-4 text-sm border-gray-300 rounded-lg"
                                />

                                <p className="mb-3 text-sm text-gray-500">
                                    Selecciona una relación para usarla al aplicar conciliación manual.
                                </p>

                                <div className="space-y-2 max-h-[36rem] overflow-auto pr-1">
                                    {relacionesFiltradas.length === 0 ? (
                                        <div className="flex items-start gap-2 p-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                                            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                                            No se encontraron relaciones con ese filtro.
                                        </div>
                                    ) : (
                                        relacionesPagina.map((relacion) => {
                                            const selected = String(manualForm.data.relacion_corte_id) === String(relacion.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={relacion.id}
                                                    onClick={() => {
                                                        manualForm.setData('relacion_corte_id', String(relacion.id));
                                                        manualForm.clearErrors('relacion_corte_id');
                                                    }}
                                                    className={`w-full text-left border rounded-lg p-3 transition-colors ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    <p className="font-semibold text-gray-900">{relacion.numero_relacion}</p>
                                                    <p className="text-xs text-gray-600">Ref: {relacion.referencia_pago || 'Sin referencia'}</p>
                                                    <p className="text-xs text-gray-600">Distribuidora: {relacion.distribuidora?.nombre || 'Sin nombre'}</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-900">Esperado: ${Number(relacion.total_a_pagar || 0).toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">Estado: {relacion.estado}</p>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <PaginacionSimple
                                    pagina={paginaRelaciones}
                                    totalPaginas={totalPaginasRelaciones}
                                    onCambiar={setPaginaRelaciones}
                                    etiqueta="relaciones"
                                />
                            </div>
                        </section>
                    </>
                )}

                {tabActiva === 'historial' && (
                    <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <h3 className="text-lg font-bold text-gray-800">Historial reciente de conciliaciones</h3>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={exportExcelUrl}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <FontAwesomeIcon icon={faCloudArrowUp} />
                                        Exportar Excel
                                    </a>
                                    <a
                                        href={exportCsvUrl}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                    >
                                        <FontAwesomeIcon icon={faCloudArrowUp} />
                                        Exportar CSV
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                                <input
                                    type="text"
                                    value={filtroHistorialQ}
                                    onChange={(e) => setFiltroHistorialQ(e.target.value)}
                                    placeholder="Buscar por relación, referencia, folio, estado o usuario"
                                    className="text-sm border-gray-300 rounded-lg xl:col-span-2"
                                />
                                <select
                                    value={filtroHistorialEstado}
                                    onChange={(e) => setFiltroHistorialEstado(e.target.value)}
                                    className="text-sm border-gray-300 rounded-lg"
                                >
                                    <option value="TODOS">Todos los estados</option>
                                    <option value="CONCILIADA">CONCILIADA</option>
                                    <option value="CON_DIFERENCIA">CON_DIFERENCIA</option>
                                    <option value="RECHAZADA">RECHAZADA</option>
                                </select>
                                <input
                                    type="date"
                                    value={filtroHistorialDesde}
                                    onChange={(e) => setFiltroHistorialDesde(e.target.value)}
                                    className="text-sm border-gray-300 rounded-lg"
                                />
                                <input
                                    type="date"
                                    value={filtroHistorialHasta}
                                    onChange={(e) => setFiltroHistorialHasta(e.target.value)}
                                    className="text-sm border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={aplicarFiltrosHistorial}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Aplicar filtros
                                </button>
                                <a
                                    href={route('cajera.conciliaciones')}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Limpiar
                                </a>
                            </div>
                        </div>
                        {historialConciliaciones?.length === 0 ? (
                            <p className="text-sm text-gray-500">Aún no hay conciliaciones registradas.</p>
                        ) : (
                            <div className="overflow-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-200">
                                            <th className="py-2 pr-3">Fecha</th>
                                            <th className="py-2 pr-3">Relación</th>
                                            <th className="py-2 pr-3">Ref / Folio</th>
                                            <th className="py-2 pr-3">Monto</th>
                                            <th className="py-2 pr-3">Diferencia</th>
                                            <th className="py-2 pr-3">Estado</th>
                                            <th className="py-2 pr-3">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialConciliaciones.map((item) => (
                                            <tr key={item.id} className="align-top border-b border-gray-100">
                                                <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{item.conciliado_en || '-'}</td>
                                                <td className="py-2 pr-3 text-gray-800">
                                                    <p className="font-semibold">{item.relacion?.numero_relacion || '-'}</p>
                                                    <p className="text-xs text-gray-500">{item.relacion?.referencia_pago || 'Sin referencia'}</p>
                                                </td>
                                                <td className="py-2 pr-3 text-gray-700">
                                                    <p>{item.movimiento?.referencia || 'Sin referencia'}</p>
                                                    <p className="text-xs text-gray-500">Folio: {item.movimiento?.folio || 'N/A'}</p>
                                                </td>
                                                <td className="py-2 pr-3 font-semibold text-gray-900">${Number(item.monto_conciliado || 0).toFixed(2)}</td>
                                                <td className="py-2 pr-3 text-gray-700">${Number(item.diferencia_monto || 0).toFixed(2)}</td>
                                                <td className="py-2 pr-3">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.estado === 'CONCILIADA'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : item.estado === 'CON_DIFERENCIA'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {item.estado}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3 text-gray-700">{item.usuario || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <PaginacionSimple
                                    pagina={paginaHistorial}
                                    totalPaginas={totalPaginasHistorial}
                                    onCambiar={irPaginaHistorial}
                                    etiqueta="historial"
                                />
                            </div>
                        )}
                    </section>
                )}
            </div>
        </TabletLayout>
    );
}

function Dato({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-gray-900 break-all">{value}</p>
        </div>
    );
}

function PaginacionSimple({ pagina, totalPaginas, onCambiar, etiqueta }) {
    if (totalPaginas <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-2 mt-3 text-xs text-gray-600">
            <span>{`Pagina ${pagina} de ${totalPaginas} (${etiqueta})`}</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onCambiar(Math.max(1, pagina - 1))}
                    disabled={pagina <= 1}
                    className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Anterior
                </button>
                <button
                    type="button"
                    onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
                    disabled={pagina >= totalPaginas}
                    className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}