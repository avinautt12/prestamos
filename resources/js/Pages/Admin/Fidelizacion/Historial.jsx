import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Historial({ distribuidora, movimientos, backRoute = 'admin.fidelizacion.index' }) {
    const getBadgeClass = (tipo) => {
        switch (tipo) {
            case 'GANADO_PUNTUAL':
            case 'GANADO_ANTICIPADO':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'PENALIZACION_ATRASO':
            case 'REVERSO':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'CANJE':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'AJUSTE_MANUAL':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <AdminLayout title="Historial de Movimientos de Puntos">
            <Head title={`Historial - ${distribuidora.nombre}`} />

            <div className="space-y-6">
                {/* Header Back Button & Summary */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route(backRoute)}
                            className="p-2 transition-all rounded-xl hover:bg-slate-100 text-slate-500"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{distribuidora.nombre}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 px-6 py-3 border-l md:border-l-0 md:border-t-0 border-slate-100">
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Disponible</span>
                            <span className="text-2xl font-black text-slate-900">
                                {Number(distribuidora.puntos_actuales).toLocaleString()}
                                <span className="ml-1 text-sm font-bold text-slate-300">PTS</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Listado de Movimientos */}
                <div className="bg-white border shadow-sm border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Bitácora Detallada</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo Movimiento</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Motivo / Concepto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Puntos</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Referencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movimientos.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No hay movimientos registrados para esta distribuidora.</td>
                                </tr>
                            ) : (
                                movimientos.data.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-700">
                                                {new Date(mov.fecha_movimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase">
                                                {new Date(mov.fecha_movimiento).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-tighter ${getBadgeClass(mov.tipo_movimiento)}`}>
                                                {mov.tipo_movimiento.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">
                                                {mov.motivo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`text-base font-black ${mov.puntos >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {mov.puntos >= 0 ? '+' : ''}{Number(mov.puntos).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">PTS</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {mov.vale && (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                                        VALE: {mov.vale.numero_vale}
                                                    </span>
                                                )}
                                                {mov.corte && (
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                                        CORTE: {new Date(mov.corte.fecha_ejecucion).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {!mov.vale && !mov.corte && (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sistema</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {movimientos.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        {movimientos.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${
                                    link.active 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
