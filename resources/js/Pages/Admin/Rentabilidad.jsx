import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Rentabilidad({ datos, filtros, resumen_global }) {
    const [fechas, setFechas] = useState({
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
    });

    const aplicarFiltro = () => {
        router.get(route('admin.rentabilidad'), fechas, { preserveState: true });
    };

    return (
        <AdminLayout title="Análisis de Rentabilidad por Sucursal">
            <Head title="Admin - Rentabilidad" />

            <div className="space-y-6">
                {/* Filtros de Fecha */}
                <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                    <div className="flex flex-col items-end gap-4 md:flex-row">
                        <div className="w-full md:flex-1">
                            <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">Fecha Desde</label>
                            <input
                                type="date"
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                value={fechas.fecha_desde}
                                onChange={(e) => setFechas({ ...fechas, fecha_desde: e.target.value })}
                            />
                        </div>
                        <div className="w-full md:flex-1">
                            <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">Fecha Hasta</label>
                            <input
                                type="date"
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                value={fechas.fecha_hasta}
                                onChange={(e) => setFechas({ ...fechas, fecha_hasta: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={aplicarFiltro}
                            className="w-full md:w-auto px-8 py-2 text-sm font-bold text-white transition-all bg-slate-900 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200"
                        >
                            Filtrar Análisis
                        </button>
                    </div>
                </div>

                {/* Resumen Global */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                        <span className="block text-xs font-bold tracking-wider uppercase text-slate-400">Ingresos Totales</span>
                        <div className="mt-1 text-2xl font-black text-emerald-600">
                            ${resumen_global.ingresos_totales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">(Comisiones + Recargos)</span>
                    </div>

                    <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                        <span className="block text-xs font-bold tracking-wider uppercase text-slate-400">Comisiones</span>
                        <div className="mt-1 text-2xl font-black text-blue-600">
                            ${resumen_global.comisiones_totales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                        <span className="block text-xs font-bold tracking-wider uppercase text-slate-400">Recargos (Mora)</span>
                        <div className="mt-1 text-2xl font-black text-rose-600">
                            ${resumen_global.recargos_totales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                        <span className="block text-xs font-bold tracking-wider uppercase text-slate-400">Capital Recuperado</span>
                        <div className="mt-1 text-2xl font-black text-slate-900">
                            ${resumen_global.capital_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Tabla de Sucursales */}
                <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Desglose por Sucursal</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Sucursal</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest text-right">Comisiones</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest text-right">Recargos</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest text-right">Utilidad Bruta</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest text-center">Operativa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {datos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No se encontraron datos financieros en el periodo seleccionado.</td>
                                </tr>
                            ) : (
                                datos.map((item) => (
                                    <tr key={item.sucursal_id} className="transition-colors hover:bg-slate-50/30">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900 uppercase tracking-tight">{item.sucursal_nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-semibold text-slate-600">${item.total_comisiones.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-semibold text-rose-500">${item.total_recargos.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-lg font-black text-emerald-600">
                                                ${item.ingresos_totales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{item.distribuidoras_atendidas} Distribuidoras</span>
                                                <span className="text-[10px] text-slate-400">{item.cortes_procesados} Cortes realizados</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Disclaimer */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>Nota:</strong> Este reporte calcula la rentabilidad bruta basada en comisiones y recargos generados en los cortes ejecutados dentro del rango de fechas. No incluye gastos operativos de sucursal ni provisiones por cuentas incobrables de largo plazo.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
