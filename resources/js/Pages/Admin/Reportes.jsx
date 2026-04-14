import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Reportes({ filtro, resumen, sucursales = [] }) {
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
        </AdminLayout>
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
