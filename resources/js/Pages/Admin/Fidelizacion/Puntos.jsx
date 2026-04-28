import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';

export default function Puntos({ 
    distribuidoras, 
    filtros, 
    sucursales, 
    configPuntos,
    routePrefix = 'admin'
}) {
    const routes = {
        index: `${routePrefix}.fidelizacion.index`,
        movimientos: `${routePrefix}.fidelizacion.movimientos`,
        ajustar: `${routePrefix}.fidelizacion.ajustar`,
    };

    const [modalAjuste, setModalAjuste] = useState({ isOpen: false, dist: null });
    const { data, setData, post, processing, reset, errors } = useForm({
        puntos: '',
        motivo: '',
        tipo: 'AJUSTE_MANUAL',
    });

    const buscar = (e) => {
        if (e.key === 'Enter') {
            router.get(route(routes.index), { ...filtros, q: e.target.value }, { preserveState: true });
        }
    };

    const filtrarSucursal = (id) => {
        router.get(route(routes.index), { ...filtros, sucursal_id: id });
    };

    const abrirAjuste = (dist) => {
        setModalAjuste({ isOpen: true, dist });
    };

    const cerrarAjuste = () => {
        setModalAjuste({ isOpen: false, dist: null });
        reset();
    };

    const guardarAjuste = (e) => {
        e.preventDefault();
        post(route(routes.ajustar, modalAjuste.dist.id), {
            onSuccess: () => cerrarAjuste(),
        });
    };

    return (
        <AdminLayout title="Fidelización y Puntos">
            <Head title="Fidelización - Puntos" />

            <div className="space-y-6">
                {/* Banner Resumen Config */}
                <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Configuración de Fidelización</h2>
                            <p className="text-sm text-slate-500">Reglas vigentes para la generación y canje de puntos.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:flex md:gap-8">
                            <div className="text-center">
                                <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400">Factor Base</span>
                                <span className="text-lg font-bold text-emerald-600">${Number(configPuntos.factor_divisor_puntos).toLocaleString()}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400">Puntos x Bloque</span>
                                <span className="text-lg font-bold text-emerald-600">{configPuntos.multiplicador_puntos} pts</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400">Valor Punto</span>
                                <span className="text-lg font-bold text-blue-600">${Number(configPuntos.valor_punto_mxn).toFixed(2)}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400">Castigo Mora</span>
                                <span className="text-lg font-bold text-rose-600">{Number(configPuntos.castigo_pct_atraso).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros y Buscador */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 max-w-md gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                        <div className="flex items-center pl-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar distribuidora..."
                            className="w-full border-none focus:ring-0 text-sm py-2"
                            defaultValue={filtros.q}
                            onKeyDown={buscar}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="text-sm border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            value={filtros.sucursal_id}
                            onChange={(e) => filtrarSucursal(e.target.value)}
                        >
                            <option value="">Todas las sucursales</option>
                            {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabla de Distribuidoras */}
                <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500">Distribuidora</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500">Sucursal</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500 text-right">Puntos Actuales</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500 text-right">Valor Estimado</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {distribuidoras.data.map((dist) => (
                                <tr key={dist.id} className="transition-colors hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{dist.persona.primer_nombre} {dist.persona.apellido_paterno}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                            {dist.sucursal?.nombre || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-bold text-slate-900">
                                            {Number(dist.puntos_actuales).toLocaleString()}
                                        </span>
                                        <span className="ml-1 text-xs font-medium text-slate-400">pts</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-semibold text-emerald-600">
                                            ${(dist.puntos_actuales * configPuntos.valor_punto_mxn).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={route(routes.movimientos, dist.id)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold transition-all rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
                                            >
                                                Ver Bitácora
                                            </Link>
                                            <button
                                                onClick={() => abrirAjuste(dist)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold transition-all rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100"
                                            >
                                                Ajuste Manual
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {distribuidoras.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        {distribuidoras.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                                    link.active 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Ajuste Manual */}
            <Modal show={modalAjuste.isOpen} onClose={cerrarAjuste} maxWidth="md">
                <form onSubmit={guardarAjuste} className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Ajuste Manual de Puntos</h3>
                            <p className="text-sm text-slate-500">{modalAjuste.dist?.persona.nombre_completo}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-slate-700">Tipo de ajuste</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData('tipo', 'AJUSTE_MANUAL')}
                                    className={`py-2 text-sm font-medium border rounded-xl transition-all ${
                                        data.tipo === 'AJUSTE_MANUAL' 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                            : 'bg-white border-slate-200 text-slate-600'
                                    }`}
                                >
                                    Ajuste (+) o (-)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('tipo', 'REVERSO')}
                                    className={`py-2 text-sm font-medium border rounded-xl transition-all ${
                                        data.tipo === 'REVERSO' 
                                            ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' 
                                            : 'bg-white border-slate-200 text-slate-600'
                                    }`}
                                >
                                    Reverso de error
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-semibold text-slate-700">Cantidad de puntos</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Ej: 100 o -50"
                                    className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                    value={data.puntos}
                                    onChange={(e) => setData('puntos', e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">PTS</div>
                            </div>
                            {errors.puntos && <p className="mt-1 text-xs text-rose-600">{errors.puntos}</p>}
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-semibold text-slate-700">Motivo del ajuste</label>
                            <textarea
                                rows="3"
                                placeholder="Describe el porqué del ajuste..."
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                value={data.motivo}
                                onChange={(e) => setData('motivo', e.target.value)}
                            />
                            {errors.motivo && <p className="mt-1 text-xs text-rose-600">{errors.motivo}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={cerrarAjuste}
                            className="px-6 py-2 text-sm font-bold transition-all text-slate-600 hover:text-slate-900"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-8 py-2 text-sm font-bold text-white transition-all bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50"
                        >
                            {processing ? 'Procesando...' : 'Aplicar Ajuste'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
