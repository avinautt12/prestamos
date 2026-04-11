import React, { useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, signedPoints, statusBadgeClass } from './utils';

export default function Puntos({ distribuidora, resumen, filtros = {}, opciones = {}, movimientos = [], relacionesPendientes = [] }) {
    const sinConfig = !distribuidora;
    const { errors } = usePage().props;

    const [form, setForm] = useState({ tipo: filtros.tipo || 'TODOS', direccion: filtros.direccion || 'TODOS', q: filtros.q || '' });
    const [filterOpen, setFilterOpen] = useState(false);
    const [modalCanje, setModalCanje] = useState(false);
    const [canje, setCanje] = useState({ relacion_corte_id: '', puntos_a_canjear: '' });
    const [canjeando, setCanjeando] = useState(false);

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(route('distribuidora.puntos'), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const empty = { tipo: 'TODOS', direccion: 'TODOS', q: '' };
        setForm(empty);
        router.get(route('distribuidora.puntos'), empty, { preserveState: true, preserveScroll: true, replace: true });
        setFilterOpen(false);
    };

    const filtrosActivos = useMemo(() => {
        let total = 0;
        if ((form.q || '').trim().length > 0) total += 1;
        if (form.tipo !== 'TODOS') total += 1;
        if (form.direccion !== 'TODOS') total += 1;
        return total;
    }, [form]);

    const relacionSeleccionada = relacionesPendientes.find((r) => Number(r.id) === Number(canje.relacion_corte_id));
    const puntosNum = parseInt(canje.puntos_a_canjear, 10) || 0;
    const valorPorPunto = resumen.valor_estimado || 2;
    const valorDescuento = (puntosNum * valorPorPunto).toFixed(2);
    const puntosMaximos = relacionSeleccionada ? Math.min(resumen.saldo_actual, Math.floor(relacionSeleccionada.total_a_pagar / valorPorPunto)) : resumen.saldo_actual;

    // Validación client-side del canje
    const canjeErrors = {
        relacion: !canje.relacion_corte_id ? 'Selecciona una relación de corte' : null,
        puntos: (() => {
            if (!canje.puntos_a_canjear) return null;
            if (isNaN(puntosNum) || puntosNum <= 0) return 'Debe ser un número mayor a cero';
            if (puntosNum < 2) return 'Mínimo 2 puntos para canjear';
            if (puntosNum > resumen.saldo_actual) return `Solo tienes ${resumen.saldo_actual} puntos disponibles`;
            if (relacionSeleccionada && puntosNum > puntosMaximos) return `Máximo ${puntosMaximos} puntos para esta relación`;
            return null;
        })(),
    };
    const canjeValido = !canjeErrors.relacion && !canjeErrors.puntos && puntosNum >= 2;

    const confirmarCanje = () => {
        if (canjeando || !canjeValido) return;
        setCanjeando(true);
        router.post(route('distribuidora.puntos.canjear'), canje, {
            onSuccess: () => { setModalCanje(false); setCanje({ relacion_corte_id: '', puntos_a_canjear: '' }); },
            onError: () => { },
            onFinish: () => setCanjeando(false),
        });
    };

    const puedeCanjear = resumen.saldo_actual >= 2 && relacionesPendientes.length > 0;

    return (
        <DistribuidoraLayout title="Puntos" subtitle="Saldo, historial y canje de puntos.">
            <Head title="Puntos" />

            {sinConfig ? (
                <div className="fin-card bg-white/95 backdrop-blur">
                    <p className="fin-title">Todavía no hay una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás tus puntos.</p>
                </div>
            ) : (
                <>
                    {/* Resumen + botón canjear */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        <div className="fin-card border-green-100 bg-green-50/50">
                            <p className="text-xs font-medium text-gray-500">Saldo</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(resumen.saldo_actual)} pts</p>
                        </div>
                        <div className="fin-card border-indigo-100 bg-indigo-50/60">
                            <p className="text-xs font-medium text-gray-500">Equivale a</p>
                            <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(resumen.saldo_actual * valorPorPunto)}</p>
                        </div>
                        <div className="fin-card border-green-100 bg-green-50/60">
                            <p className="text-xs font-medium text-gray-500">Ganados</p>
                            <p className="mt-1 text-xl font-bold text-green-600">+{formatNumber(resumen.positivos)}</p>
                        </div>
                        <div className="fin-card border-rose-100 bg-rose-50/60">
                            <p className="text-xs font-medium text-gray-500">Descontados</p>
                            <p className="mt-1 text-xl font-bold text-red-600">-{formatNumber(resumen.negativos)}</p>
                        </div>
                        <div className="flex items-center fin-card">
                            {puedeCanjear ? (
                                <button type="button" onClick={() => setModalCanje(true)} className="w-full py-3 text-sm font-bold fin-btn-primary">
                                    Canjear puntos
                                </button>
                            ) : (
                                <p className="text-xs text-gray-400 text-center w-full">
                                    {resumen.saldo_actual < 2 ? 'Sin puntos suficientes' : 'Sin deudas pendientes'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Errores */}
                    {(errors?.general || errors?.puntos_a_canjear || errors?.relacion_corte_id) && (
                        <div className="mt-4 fin-card border-red-200 bg-red-50">
                            {errors?.general && <p className="text-sm font-semibold text-red-800">{errors.general}</p>}
                            {errors?.puntos_a_canjear && <p className="text-sm text-red-800">{errors.puntos_a_canjear}</p>}
                            {errors?.relacion_corte_id && <p className="text-sm text-red-800">{errors.relacion_corte_id}</p>}
                        </div>
                    )}

                    <form onSubmit={applyFilters} className="mt-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Buscar</label>
                                <input type="text" value={form.q} onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))} className="fin-input" placeholder="Motivo o vale" />
                            </div>
                            <button
                                type="button"
                                onClick={() => setFilterOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl"
                            >
                                Filtros
                                {filtrosActivos > 0 && (
                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-700 rounded-full">
                                        {filtrosActivos}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                            <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                        </div>
                    </form>

                    {filterOpen && (
                        <div className="fin-modal-backdrop" onClick={() => setFilterOpen(false)}>
                            <div className="fin-modal-sheet max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="fin-modal-head">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Filtros de puntos</h2>
                                        <p className="mt-1 text-sm text-gray-500">Filtra por tipo y dirección del movimiento.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFilterOpen(false)}
                                        className="inline-flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-xl"
                                        aria-label="Cerrar filtros"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="fin-modal-body space-y-4">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                                        <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} className="fin-input">
                                            {(opciones.tipos || []).map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Dirección</label>
                                        <select value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} className="fin-input">
                                            <option value="TODOS">Todos</option>
                                            <option value="POSITIVOS">Solo suman</option>
                                            <option value="NEGATIVOS">Solo restan</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="fin-modal-foot flex gap-2">
                                    <button type="button" onClick={clearFilters} className="flex-1 fin-btn-secondary">Limpiar</button>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            applyFilters(event);
                                            setFilterOpen(false);
                                        }}
                                        className="flex-1 fin-btn-primary"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Historial */}
                    {!movimientos.length ? (
                        <div className="flex items-center justify-center p-12 mt-6 border-2 border-gray-200 border-dashed rounded-xl">
                            <p className="text-sm text-gray-400">No hay movimientos con ese filtro.</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-2 fin-enter">
                            {movimientos.map((mov, index) => (
                                <div key={mov.id} className="flex items-center justify-between gap-4 p-3 border rounded-xl border-gray-200 bg-white fin-interactive fin-stagger-item" style={{ animationDelay: `${Math.min(index * 30, 180)}ms` }}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${mov.puntos >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {mov.puntos >= 0 ? '+' : '-'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{mov.motivo || mov.tipo_movimiento}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(mov.fecha_movimiento, true)}
                                                {mov.vale_numero && ` · ${mov.vale_numero}`}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`flex-shrink-0 text-lg font-bold ${mov.puntos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {signedPoints(mov.puntos)} pts
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modal de canje */}
                    {modalCanje && (
                        <div className="fin-modal-backdrop" onClick={() => setModalCanje(false)}>
                            <div className="fin-modal-sheet max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="fin-modal-head">
                                    <h2 className="text-lg font-bold text-gray-900">Canjear puntos</h2>
                                    <p className="mt-1 text-sm text-gray-500">2 puntos = $1 peso de descuento en tu deuda.</p>
                                </div>
                                <div className="fin-modal-body space-y-4">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Aplicar a relación</label>
                                        <select
                                            value={canje.relacion_corte_id}
                                            onChange={(e) => setCanje((p) => ({ ...p, relacion_corte_id: e.target.value }))}
                                            className={`fin-input ${canjeErrors.relacion && canje.relacion_corte_id === '' ? '' : ''}`}
                                        >
                                            <option value="">Selecciona una relación pendiente</option>
                                            {relacionesPendientes.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.numero_relacion} — {formatCurrency(r.total_a_pagar)} ({r.estado})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Puntos a canjear (máx. {formatNumber(puntosMaximos)})</label>
                                        <input
                                            type="number"
                                            value={canje.puntos_a_canjear}
                                            onChange={(e) => setCanje((p) => ({ ...p, puntos_a_canjear: e.target.value }))}
                                            className={`fin-input ${canjeErrors.puntos ? 'border-red-400' : ''}`}
                                            placeholder="Ej. 50"
                                            min={2}
                                            max={puntosMaximos}
                                        />
                                        {canjeErrors.puntos && <p className="mt-1 text-xs text-red-600">{canjeErrors.puntos}</p>}
                                    </div>
                                    {puntosNum >= 2 && !canjeErrors.puntos && (
                                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                            <p className="text-sm text-green-800">
                                                <span className="font-bold">{formatNumber(puntosNum)} puntos</span> = <span className="font-bold">{formatCurrency(parseFloat(valorDescuento))}</span> de descuento
                                            </p>
                                            {relacionSeleccionada && (
                                                <p className="mt-1 text-xs text-green-700">
                                                    Nuevo total: {formatCurrency(Math.max(0, relacionSeleccionada.total_a_pagar - parseFloat(valorDescuento)))}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="fin-modal-foot flex justify-end gap-3">
                                    <button type="button" onClick={() => setModalCanje(false)} className="px-5 py-2 fin-btn-secondary">Cancelar</button>
                                    <button
                                        type="button"
                                        onClick={confirmarCanje}
                                        disabled={canjeando || !canjeValido}
                                        className="px-5 py-2 fin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {canjeando ? 'Canjeando...' : 'Confirmar canje'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </DistribuidoraLayout>
    );
}


