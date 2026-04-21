import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Reportes({ filtro, resumen, sucursales = [], cortesDisponibles = [] }) {
    const [sucursalId, setSucursalId] = React.useState(filtro?.sucursal_id ? String(filtro.sucursal_id) : '');

    const periodos = [
        { key: 'mes', label: 'Mes' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'anio', label: 'Año' },
    ];

    const aplicarSucursal = (event) => {
        event.preventDefault();
        router.get(route('admin.reportes'), {
            periodo: filtro?.periodo || 'mes',
            sucursal_id: sucursalId || undefined,
        }, {
            preserveScroll: true,
            replace: true,
        });
    };

    const tasaAprobacion = Number(resumen?.tasa_aprobacion || 0);
    const tasaRechazo = Number(resumen?.tasa_rechazo || 0);
    const indiceMorosidad = Number(resumen?.indice_morosidad || 0);

    const capitalColocado = Number(resumen?.capital_colocado || 0);
    const capitalEnRiesgo = Number(resumen?.capital_en_riesgo || 0);
    const exposicionRiesgo = capitalColocado > 0 ? ((capitalEnRiesgo / capitalColocado) * 100) : 0;

    const estadoOperacion = indiceMorosidad <= 12 && exposicionRiesgo <= 18
        ? 'Operación estable'
        : indiceMorosidad <= 20 && exposicionRiesgo <= 30
            ? 'Operación en vigilancia'
            : 'Operación en alerta';

    return (
        <AdminLayout title="Reportes Globales">
            <Head title="Reportes Globales" />

            <div className="p-6 mb-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase">Inteligencia ejecutiva</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Control de periodos y alcance</h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-3xl">Filtra KPIs globales por ventana de tiempo y sucursal para una lectura ejecutiva.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-slate-200 bg-slate-50 text-slate-700">
                            Periodos: mes, trimestre y año
                        </span>
                        <span className="inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                            Vista global
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 mt-6 lg:grid-cols-2">
                    <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Periodo</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {periodos.map((periodo) => (
                                <Link
                                    key={periodo.key}
                                    href={route('admin.reportes', { periodo: periodo.key, sucursal_id: filtro?.sucursal_id || undefined })}
                                    className={`px-3 py-2 rounded-lg border text-sm transition ${filtro?.periodo === periodo.key
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    {periodo.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Sucursal</p>
                        <form className="flex items-center gap-2 mt-3" onSubmit={aplicarSucursal}>
                            <select
                                className="w-full border rounded-lg border-slate-300 text-sm"
                                value={sucursalId}
                                onChange={(event) => setSucursalId(event.target.value)}
                            >
                                <option value="">Todas</option>
                                {sucursales.map((sucursal) => (
                                    <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                                ))}
                            </select>
                            <button type="submit" className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 border border-emerald-600 rounded-lg">
                                Aplicar
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="Solicitudes en periodo" value={resumen?.solicitudes_periodo} />
                <Metric label="Solicitudes aprobadas" value={resumen?.solicitudes_aprobadas} />
                <Metric label="Solicitudes rechazadas" value={resumen?.solicitudes_rechazadas} />
                <Metric label="Solicitudes pendientes" value={resumen?.solicitudes_pendientes} />
                <Metric label="Decisiones tomadas" value={resumen?.decisiones_tomadas} />
                <Metric label="Distribuidoras activas" value={resumen?.distribuidoras_activas} />
                <Metric label="Distribuidoras morosas" value={resumen?.distribuidoras_morosas} />
                <Metric label="Distribuidoras totales" value={resumen?.distribuidoras_totales} />
                <Metric label="Vales activos" value={resumen?.vales_activos} />
                <Metric label="Vales morosos" value={resumen?.vales_morosos} />
                <Metric label="Capital colocado" value={money(capitalColocado)} />
                <Metric label="Capital en riesgo" value={`$${Number(resumen?.capital_en_riesgo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            </div>

            <div className="grid grid-cols-1 gap-5 mt-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="p-5 border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500">Rendimiento de decisiones</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Eficiencia de aprobación y descarte</h3>

                    <div className="mt-5 space-y-4">
                        <ProgressRow
                            label="Tasa de aprobación"
                            value={tasaAprobacion}
                            color="bg-emerald-500"
                            tone="text-emerald-700"
                        />
                        <ProgressRow
                            label="Tasa de rechazo"
                            value={tasaRechazo}
                            color="bg-rose-500"
                            tone="text-rose-700"
                        />
                        <ProgressRow
                            label="Índice de morosidad"
                            value={indiceMorosidad}
                            color="bg-amber-500"
                            tone="text-amber-700"
                        />
                        <ProgressRow
                            label="Exposición de riesgo"
                            value={exposicionRiesgo}
                            color="bg-blue-500"
                            tone="text-blue-700"
                        />
                    </div>
                </div>

                <div className="p-5 border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500">Semáforo ejecutivo</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Estado general del sistema</h3>

                    <div className="p-4 mt-4 border rounded-xl border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-600">Diagnóstico</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{estadoOperacion}</p>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                        <Insight label="Capital colocado" value={money(capitalColocado)} />
                        <Insight label="Capital en riesgo" value={money(capitalEnRiesgo)} />
                        <Insight label="Exposición de riesgo" value={`${exposicionRiesgo.toFixed(2)}%`} />
                        <Insight label="Morosidad de distribuidoras" value={`${indiceMorosidad.toFixed(2)}%`} />
                    </div>
                </div>
            </div>

            <DescargaReportes sucursales={sucursales} cortesDisponibles={cortesDisponibles} />
        </AdminLayout>
    );
}

function DescargaReportes({ sucursales, cortesDisponibles }) {
    const [tipo, setTipo] = React.useState('mensual');
    const [mes, setMes] = React.useState(new Date().toISOString().slice(0, 7));
    const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
    const [corteId, setCorteId] = React.useState('');
    const [sucursalFiltro, setSucursalFiltro] = React.useState('');
    const [enviando, setEnviando] = React.useState(false);

    const paramsObj = { tipo };
    if (tipo === 'mensual') paramsObj.mes = mes;
    if (tipo === 'anual') paramsObj.anio = anio;
    if (tipo === 'corte' && corteId) paramsObj.corte_id = corteId;
    if (sucursalFiltro) paramsObj.sucursal_id = sucursalFiltro;

    const params = new URLSearchParams(paramsObj);

    const puedeDescargar =
        (tipo === 'mensual' && /^\d{4}-\d{2}$/.test(mes)) ||
        (tipo === 'anual' && /^\d{4}$/.test(anio)) ||
        (tipo === 'corte' && corteId !== '');

    const url = puedeDescargar ? `${route('admin.reportes.descargar')}?${params.toString()}` : '#';

    const enviarPorCorreo = () => {
        if (!puedeDescargar || enviando) return;
        setEnviando(true);
        router.post(route('admin.reportes.enviar'), paramsObj, {
            preserveScroll: true,
            onFinish: () => setEnviando(false),
        });
    };

    const inputCls = 'w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
    const labelCls = 'block mb-1 text-xs font-semibold tracking-wide uppercase text-slate-600';

    return (
        <div className="p-6 mt-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase">Exportación</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Descargar reportes</h2>
                    <p className="mt-2 text-sm text-slate-500 max-w-3xl">
                        Genera el Excel ejecutivo con los 4 reportes (morosos, saldo de cortes, puntos y presolicitudes) en un solo archivo.
                    </p>
                </div>
                <span className="inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 self-start">
                    5 hojas · portada + 4 reportes
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className={labelCls}>Tipo de periodo</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                        <option value="mensual">Mensual</option>
                        <option value="anual">Anual</option>
                        <option value="corte">Por corte</option>
                    </select>
                </div>

                {tipo === 'mensual' && (
                    <div>
                        <label className={labelCls}>Mes</label>
                        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputCls} />
                    </div>
                )}

                {tipo === 'anual' && (
                    <div>
                        <label className={labelCls}>Año</label>
                        <input type="number" value={anio} min="2020" max="2099" onChange={(e) => setAnio(e.target.value)} className={inputCls} />
                    </div>
                )}

                {tipo === 'corte' && (
                    <div className="md:col-span-2">
                        <label className={labelCls}>Corte</label>
                        <select value={corteId} onChange={(e) => setCorteId(e.target.value)} className={inputCls}>
                            <option value="">— Selecciona un corte —</option>
                            {cortesDisponibles.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                        {cortesDisponibles.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">No hay cortes disponibles.</p>
                        )}
                    </div>
                )}

                <div>
                    <label className={labelCls}>Sucursal (opcional)</label>
                    <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)} className={inputCls}>
                        <option value="">Todas (global)</option>
                        {sucursales.map((s) => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
                <a
                    href={url}
                    aria-disabled={!puedeDescargar}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition ${puedeDescargar ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed pointer-events-none'}`}
                >
                    Descargar Excel
                </a>
                <button
                    type="button"
                    onClick={enviarPorCorreo}
                    disabled={!puedeDescargar || enviando}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition border ${puedeDescargar && !enviando ? 'border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50' : 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'}`}
                >
                    {enviando ? 'Enviando…' : 'Enviar por correo'}
                </button>
                {!puedeDescargar && (
                    <span className="text-xs text-slate-500">Completa los filtros del periodo para habilitar las opciones.</span>
                )}
                {puedeDescargar && (
                    <span className="text-xs text-slate-500">"Enviar" llega a tu correo registrado en tu perfil.</span>
                )}
            </div>
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="p-4 border shadow-sm bg-white/95 border-slate-200 rounded-xl">
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{typeof value === 'number' ? Number(value).toLocaleString('es-MX') : value}</p>
        </div>
    );
}

function ProgressRow({ label, value, color, tone }) {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-700">{label}</p>
                <p className={`text-sm font-semibold ${tone}`}>{safeValue.toFixed(2)}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${safeValue}%` }} />
            </div>
        </div>
    );
}

function Insight({ label, value }) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg border-slate-200 bg-white">
            <span className="text-slate-600">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
        </div>
    );
}

function money(value) {
    return `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
