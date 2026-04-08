import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { formatCurrency, formatDate, formatNumber, signedPoints, statusBadgeClass } from './utils';

export default function Puntos({ distribuidora, resumen, filtros = {}, opciones = {}, movimientos = [] }) {
    const sinConfig = !distribuidora;
    const [form, setForm] = useState({
        tipo: filtros.tipo || 'TODOS',
        direccion: filtros.direccion || 'TODOS',
        q: filtros.q || '',
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('distribuidora.puntos'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const empty = { tipo: 'TODOS', direccion: 'TODOS', q: '' };
        setForm(empty);
        router.get(route('distribuidora.puntos'), empty, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DistribuidoraLayout
            title="Puntos"
            subtitle="Consulta el saldo actual y el ledger histórico de movimientos que ya existen en base de datos."
        >
            <Head title="Puntos" />

            {sinConfig ? (
                <div className="fin-card">
                    <p className="fin-title">Todavía no hay una distribuidora ligada a tu acceso</p>
                    <p className="mt-2 fin-subtitle">Cuando exista el registro operativo, aquí verás tus puntos y su historial.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Saldo de puntos</p>
                            <p className="fin-stat-value">{formatNumber(resumen.saldo_actual)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Valor por punto</p>
                            <p className="fin-stat-value">{formatCurrency(resumen.valor_estimado)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Ganados visibles</p>
                            <p className="fin-stat-value text-green-700">+{formatNumber(resumen.positivos)}</p>
                        </div>
                        <div className="fin-card">
                            <p className="text-sm font-medium text-gray-600">Descuentos visibles</p>
                            <p className="fin-stat-value text-red-700">-{formatNumber(resumen.negativos)}</p>
                        </div>
                    </div>

                    <div className="mt-6 fin-card">
                        <div className="space-y-5">
                            <div className="max-w-3xl">
                                <h2 className="fin-title">Historial de movimientos</h2>
                                <p className="mt-1 fin-subtitle">
                                    Filtra por tipo, dirección o texto libre. Aquí no se recalcula: se consulta el ledger histórico.
                                </p>
                            </div>

                            <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                                <div className="xl:col-span-5">
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar</label>
                                    <input
                                        type="text"
                                        value={form.q}
                                        onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                        className="fin-input"
                                        placeholder="Motivo o vale"
                                    />
                                </div>
                                <div className="xl:col-span-3">
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Tipo</label>
                                    <select
                                        value={form.tipo}
                                        onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
                                        className="fin-input"
                                    >
                                        {(opciones.tipos || []).map((tipo) => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="xl:col-span-2">
                                    <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Dirección</label>
                                    <select
                                        value={form.direccion}
                                        onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))}
                                        className="fin-input"
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="POSITIVOS">Solo suman</option>
                                        <option value="NEGATIVOS">Solo restan</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-2 xl:self-end">
                                    <button type="submit" className="w-full fin-btn-primary">Aplicar</button>
                                    <button type="button" onClick={clearFilters} className="w-full fin-btn-secondary">Limpiar</button>
                                </div>
                            </form>
                        </div>

                        {!movimientos.length ? (
                            <p className="mt-4 text-sm text-gray-500">No hay movimientos visibles con ese filtro.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {movimientos.map((movimiento) => (
                                    <div key={movimiento.id} className="p-4 border rounded-xl border-gray-200">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{movimiento.tipo_movimiento}</p>
                                                    <span className={statusBadgeClass(movimiento.tipo_movimiento)}>{movimiento.tipo_movimiento}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">{movimiento.motivo || 'Sin motivo capturado'}</p>
                                                {movimiento.vale_numero && (
                                                    <p className="mt-1 text-sm text-gray-500">Vale relacionado: {movimiento.vale_numero}</p>
                                                )}
                                            </div>
                                            <p className={`text-2xl font-bold ${movimiento.puntos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {signedPoints(movimiento.puntos)} pts
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Fecha</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatDate(movimiento.fecha_movimiento, true)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Valor del punto</p>
                                                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(movimiento.valor_punto_snapshot)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </DistribuidoraLayout>
    );
}
