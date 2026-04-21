import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTriangleExclamation,
    faMoneyBillWave,
    faUsers,
    faCalendarDays,
    faArrowRight,
    faScaleBalanced,
    faClipboardCheck,
    faRankingStar,
    faCircleCheck,
    faClock,
    faShield,
} from '@fortawesome/free-solid-svg-icons';

export default function Reportes({
    sucursal,
    resumen,
    distribuidorasMorosas,
    filtro,
    saldoCortes,
    presolicitudes,
    puntosPorDistribuidora,
    corteReferencia,
    cortesDisponibles = [],
}) {
    const periodoActivo = filtro?.periodo || 'mes';

    const periodos = [
        { key: 'mes', label: 'Mes actual' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'anio', label: 'Año' },
    ];

    const formatMoney = (value) => `$${Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
    const formatNumber = (value) => Number(value ?? 0).toLocaleString('es-MX');

    const proximoCorteTexto =
        resumen && resumen.proximo_corte && resumen.proximo_corte.fecha_programada
            ? new Date(resumen.proximo_corte.fecha_programada).toLocaleString('es-MX')
            : 'Sin corte programado';

    const totalProcesoPresolicitud = (presolicitudes?.pendientes ?? 0) + (presolicitudes?.validadas ?? 0);
    const pendientePct = totalProcesoPresolicitud > 0
        ? Math.round(((presolicitudes?.pendientes ?? 0) / totalProcesoPresolicitud) * 100)
        : 0;
    const validadaPct = totalProcesoPresolicitud > 0
        ? Math.round(((presolicitudes?.validadas ?? 0) / totalProcesoPresolicitud) * 100)
        : 0;

    const maxPuntos = Math.max(...(puntosPorDistribuidora?.map((item) => Number(item.puntos_snapshot ?? 0)) || [0]), 1);

    const cards = [
        {
            title: 'Vales morosos',
            value: resumen?.vales_morosos ?? 0,
            icon: faTriangleExclamation,
            tone: 'text-red-700',
            bg: 'bg-red-50',
        },
        {
            title: 'Capital en riesgo',
            value: `$${Number(resumen?.capital_en_riesgo ?? 0).toLocaleString('es-MX')}`,
            icon: faMoneyBillWave,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            title: 'Capital colocado',
            value: formatMoney(resumen?.capital_colocado ?? 0),
            icon: faMoneyBillWave,
            tone: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
        {
            title: 'Distribuidoras morosas',
            value: resumen?.distribuidoras_morosas ?? 0,
            icon: faUsers,
            tone: 'text-rose-700',
            bg: 'bg-rose-50',
        },
        {
            title: 'Próximo corte',
            value: proximoCorteTexto,
            icon: faCalendarDays,
            tone: 'text-blue-700',
            bg: 'bg-blue-50',
        },
        {
            title: 'Saldo de cortes',
            value: formatMoney(resumen?.saldo_cortes ?? 0),
            icon: faScaleBalanced,
            tone: 'text-indigo-700',
            bg: 'bg-indigo-50',
        },
        {
            title: 'Pre-solicitudes pendientes',
            value: resumen?.presolicitudes_pendientes ?? 0,
            icon: faClock,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            title: 'Pre-solicitudes validadas',
            value: resumen?.presolicitudes_validadas ?? 0,
            icon: faCircleCheck,
            tone: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
    ];

    return (
        <AdminLayout title="Reportes Gerenciales">
            <Head title="Reportes Gerenciales" />

            <div className="mb-5 overflow-hidden border border-blue-100 fin-card bg-gradient-to-r from-blue-50 via-white to-emerald-50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs tracking-wide text-blue-700 uppercase">Vista ejecutiva</p>
                        <h2 className="mt-1 fin-title">Reportes de sucursal: {sucursal?.nombre || 'Sin sucursal asignada'}</h2>
                        <p className="mt-1 fin-subtitle">
                            Indicadores clave para seguimiento de riesgo, corte y avance de pre-solicitudes.
                        </p>
                    </div>

                    <div className="p-3 bg-white border border-blue-100 rounded-lg">
                        <p className="text-xs text-gray-500">Próximo corte</p>
                        <p className="text-sm font-semibold text-gray-900">{proximoCorteTexto}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {periodos.map((periodo) => (
                        <Link
                            key={periodo.key}
                            href={route('gerente.reportes', { periodo: periodo.key })}
                            className={`px-3 py-1.5 text-xs rounded-full border transition ${periodoActivo === periodo.key
                                ? 'border-blue-300 bg-blue-100 text-blue-800 font-semibold'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'
                                }`}
                        >
                            {periodo.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.title} className={`fin-card ${card.bg}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-600">{card.title}</p>
                                <p className={`text-xl font-semibold ${card.tone}`}>{card.value}</p>
                            </div>
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white ${card.tone}`}>
                                <FontAwesomeIcon icon={card.icon} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 xl:grid-cols-2">
                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faShield} className="text-indigo-600" />
                        <h3 className="font-semibold">Saldo de cortes</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50">
                            <p className="text-gray-600">Relaciones abiertas</p>
                            <p className="text-xl font-semibold text-indigo-700">{formatNumber(saldoCortes?.relaciones_abiertas)}</p>
                        </div>
                        <div className="p-3 border border-blue-100 rounded-lg bg-blue-50">
                            <p className="text-gray-600">Saldo total</p>
                            <p className="text-xl font-semibold text-blue-700">{formatMoney(saldoCortes?.saldo_total)}</p>
                        </div>
                        <div className="p-3 border rounded-lg border-rose-100 bg-rose-50">
                            <p className="text-gray-600">Saldo vencido</p>
                            <p className="text-xl font-semibold text-rose-700">{formatMoney(saldoCortes?.monto_vencido)}</p>
                        </div>
                    </div>

                    <div className="p-3 mt-3 border border-gray-100 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-500">Lectura rápida</p>
                        <p className="mt-1 text-sm text-gray-700">
                            {Number(saldoCortes?.monto_vencido ?? 0) > 0
                                ? 'Existe saldo vencido que requiere seguimiento inmediato con cajera y coordinacion.'
                                : 'No hay saldo vencido en corte; mantener monitoreo preventivo.'}
                        </p>
                    </div>
                </div>

                <div className="fin-card">
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-emerald-600" />
                        <h3 className="font-semibold">Pre-solicitudes ({periodos.find(p => p.key === periodoActivo)?.label?.toLowerCase() || periodoActivo})</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Pendientes</span>
                                <span className="font-semibold text-amber-700">{formatNumber(presolicitudes?.pendientes)} ({pendientePct}%)</span>
                            </div>
                            <div className="w-full h-2 mt-1 bg-gray-100 rounded-full">
                                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pendientePct}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Validadas</span>
                                <span className="font-semibold text-emerald-700">{formatNumber(presolicitudes?.validadas)} ({validadaPct}%)</span>
                            </div>
                            <div className="w-full h-2 mt-1 bg-gray-100 rounded-full">
                                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${validadaPct}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                            <div className="p-3 rounded-lg bg-emerald-50">
                                <p className="text-gray-600">Aprobadas</p>
                                <p className="font-semibold text-emerald-700">{formatNumber(presolicitudes?.aprobadas)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-rose-50">
                                <p className="text-gray-600">Rechazadas</p>
                                <p className="font-semibold text-rose-700">{formatNumber(presolicitudes?.rechazadas)}</p>
                            </div>
                        </div>

                        <div className="p-3 border rounded-lg border-emerald-100 bg-emerald-50">
                            <p className="text-xs text-gray-600">Tasa de validación (pendiente vs validada)</p>
                            <p className="text-lg font-semibold text-emerald-700">{Number(presolicitudes?.tasa_validacion ?? 0).toLocaleString('es-MX')}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 fin-card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-900">
                        <FontAwesomeIcon icon={faRankingStar} className="text-blue-700" />
                        <h3 className="font-semibold">Puntos por distribuidora al corte</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                        Corte: {corteReferencia?.fecha_programada ? new Date(corteReferencia.fecha_programada).toLocaleString('es-MX') : 'Sin corte de referencia'}
                    </p>
                </div>

                {puntosPorDistribuidora?.length ? (
                    <div className="space-y-3">
                        {puntosPorDistribuidora.map((item) => {
                            const widthPct = Math.max(8, Math.round((Number(item.puntos_snapshot ?? 0) / maxPuntos) * 100));
                            return (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-lg">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.nombre}</p>
                                            <p className="text-xs text-gray-500">No. {item.numero_distribuidora || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-700">{formatNumber(item.puntos_snapshot)} pts</p>
                                            <p className="text-xs text-gray-500">Saldo: {formatMoney(item.saldo_relacion)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-blue-50">
                                        <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600" style={{ width: `${widthPct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay relaciones de corte con puntos para mostrar en esta sucursal.</p>
                )}
            </div>

            <div className="fin-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Distribuidoras en estatus moroso</h3>
                    <Link href={route('gerente.distribuidoras')} className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                        Ir a bandeja
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>

                {distribuidorasMorosas?.length ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {distribuidorasMorosas.slice(0, 8).map((dist) => (
                            <div key={dist.id} className="p-3 border border-red-100 rounded-lg bg-red-50">
                                <p className="font-medium text-red-900">
                                    {dist.persona?.primer_nombre} {dist.persona?.apellido_paterno} {dist.persona?.apellido_materno}
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    No. distribuidora: {dist.numero_distribuidora || 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay distribuidoras morosas registradas en tu sucursal.</p>
                )}
            </div>

            <DescargaReportes cortesDisponibles={cortesDisponibles} tieneSucursal={Boolean(sucursal)} />
        </AdminLayout>
    );
}

function DescargaReportes({ cortesDisponibles, tieneSucursal }) {
    const [tipo, setTipo] = React.useState('mensual');
    const [mes, setMes] = React.useState(new Date().toISOString().slice(0, 7));
    const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
    const [corteId, setCorteId] = React.useState('');
    const [enviando, setEnviando] = React.useState(false);

    const paramsObj = { tipo };
    if (tipo === 'mensual') paramsObj.mes = mes;
    if (tipo === 'anual') paramsObj.anio = anio;
    if (tipo === 'corte' && corteId) paramsObj.corte_id = corteId;

    const params = new URLSearchParams(paramsObj);

    const puedeDescargar = tieneSucursal && (
        (tipo === 'mensual' && /^\d{4}-\d{2}$/.test(mes)) ||
        (tipo === 'anual' && /^\d{4}$/.test(anio)) ||
        (tipo === 'corte' && corteId !== '')
    );

    const url = puedeDescargar ? `${route('gerente.reportes.descargar')}?${params.toString()}` : '#';

    const enviarPorCorreo = () => {
        if (!puedeDescargar || enviando) return;
        setEnviando(true);
        router.post(route('gerente.reportes.enviar'), paramsObj, {
            preserveScroll: true,
            onFinish: () => setEnviando(false),
        });
    };

    const inputCls = 'w-full px-3 py-2 text-sm border rounded-lg border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
    const labelCls = 'block mb-1 text-xs font-semibold tracking-wide uppercase text-gray-600';

    return (
        <div className="p-6 mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase">Exportación</p>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900">Descargar reportes</h2>
                    <p className="mt-2 text-sm text-gray-500 max-w-3xl">
                        Genera el Excel ejecutivo con los 4 reportes (morosos, saldo de cortes, puntos y presolicitudes) de tu sucursal en un solo archivo.
                    </p>
                </div>
                <span className="self-start inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                    5 hojas · portada + 4 reportes
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
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
                            <p className="mt-1 text-xs text-amber-600">No hay cortes disponibles en tu sucursal.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
                <a
                    href={url}
                    aria-disabled={!puedeDescargar}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition ${puedeDescargar ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed pointer-events-none'}`}
                >
                    Descargar Excel
                </a>
                <button
                    type="button"
                    onClick={enviarPorCorreo}
                    disabled={!puedeDescargar || enviando}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition border ${puedeDescargar && !enviando ? 'border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50' : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'}`}
                >
                    {enviando ? 'Enviando…' : 'Enviar por correo'}
                </button>
                {!tieneSucursal && (
                    <span className="text-xs text-red-600">Tu usuario no tiene una sucursal asignada.</span>
                )}
                {tieneSucursal && !puedeDescargar && (
                    <span className="text-xs text-gray-500">Completa los filtros del periodo para habilitar las opciones.</span>
                )}
                {tieneSucursal && puedeDescargar && (
                    <span className="text-xs text-gray-500">"Enviar" llega a tu correo registrado en tu perfil.</span>
                )}
            </div>
        </div>
    );
}
