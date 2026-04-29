import React, { useState } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faFileInvoiceDollar,
    faHandHoldingDollar,
    faMoneyBillTransfer,
    faCircleCheck,
    faFilter,
} from '@fortawesome/free-solid-svg-icons';

const ESTADO_BADGE = {
    BORRADOR: 'bg-gray-100 text-gray-700',
    ACTIVO: 'bg-blue-100 text-blue-700',
    PAGO_PARCIAL: 'bg-amber-100 text-amber-700',
    PAGADO: 'bg-emerald-100 text-emerald-700',
    LIQUIDADO: 'bg-emerald-100 text-emerald-800 font-semibold',
    MOROSO: 'bg-red-100 text-red-700',
    RECLAMADO: 'bg-purple-100 text-purple-700',
    CANCELADO: 'bg-gray-200 text-gray-600 line-through',
    REVERSADO: 'bg-gray-200 text-gray-600',
    APROBADO: 'bg-cyan-100 text-cyan-700',
    TRANSFERIDO: 'bg-indigo-100 text-indigo-700',
};

const INTERVENCION_LABEL = {
    FERIADO: { texto: 'Feriado', color: 'bg-emerald-100 text-emerald-700', icon: faHandHoldingDollar },
    COBRO: { texto: 'Cobró', color: 'bg-blue-100 text-blue-700', icon: faMoneyBillTransfer },
    CONCILIO: { texto: 'Concilió', color: 'bg-purple-100 text-purple-700', icon: faCircleCheck },
};

const moneda = (valor) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor || 0);

const formatFecha = (fechaIso) => {
    if (!fechaIso) return '—';
    const d = new Date(fechaIso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return fechaIso;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MisValesIndex({ vales, resumen, filtros, distribuidorasOpciones, estadosOpciones }) {
    const [form, setForm] = useState({
        q: filtros.q || '',
        estado: filtros.estado || 'TODOS',
        intervencion: filtros.intervencion || 'TODOS',
        desde: filtros.desde || '',
        hasta: filtros.hasta || '',
        distribuidora: filtros.distribuidora || 'TODOS',
    });

    const aplicarFiltros = (e) => {
        e?.preventDefault();
        router.get(route('cajera.mis-vales.index'), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiarFiltros = () => {
        const vacios = {
            q: '',
            estado: 'TODOS',
            intervencion: 'TODOS',
            desde: '',
            hasta: '',
            distribuidora: 'TODOS',
        };
        setForm(vacios);
        router.get(route('cajera.mis-vales.index'), vacios, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const tieneDatos = vales?.data?.length > 0;

    return (
        <TabletLayout title="Mis Vales">
            <Head title="Mis Vales" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* Encabezado */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Mis Vales</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Vales de tu sucursal donde tuviste intervención: feriaste, cobraste o conciliaste.
                        </p>
                    </div>

                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total vales</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{resumen.total_vales}</p>
                            <p className="text-xs text-gray-400 mt-1">con tu intervención</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-100 p-4">
                            <p className="text-xs text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                                <FontAwesomeIcon icon={faHandHoldingDollar} /> Feriados
                            </p>
                            <p className="text-2xl font-bold text-emerald-900 mt-1">{resumen.total_feriados}</p>
                            <p className="text-xs text-emerald-700 mt-1">{moneda(resumen.monto_feriado)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-4">
                            <p className="text-xs text-blue-700 uppercase tracking-wide flex items-center gap-1">
                                <FontAwesomeIcon icon={faMoneyBillTransfer} /> Cobros
                            </p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{resumen.total_cobros}</p>
                            <p className="text-xs text-blue-700 mt-1">{moneda(resumen.monto_cobrado)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100 p-4">
                            <p className="text-xs text-purple-700 uppercase tracking-wide flex items-center gap-1">
                                <FontAwesomeIcon icon={faCircleCheck} /> Conciliados
                            </p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">{resumen.total_conciliados}</p>
                            <p className="text-xs text-purple-700 mt-1">vales</p>
                        </div>
                    </div>

                    {/* Filtros */}
                    <form onSubmit={aplicarFiltros} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                            <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                            Filtros
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="md:col-span-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 text-sm" />
                                </div>
                                <input
                                    type="text"
                                    value={form.q}
                                    onChange={(e) => setForm({ ...form, q: e.target.value })}
                                    placeholder="N° vale, cliente o distribuidora..."
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <select
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="TODOS">Todos los estados</option>
                                {estadosOpciones.map((e) => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>

                            <select
                                value={form.intervencion}
                                onChange={(e) => setForm({ ...form, intervencion: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="TODOS">Toda intervención</option>
                                <option value="FERIADO">Solo feriados</option>
                                <option value="COBRO">Solo cobros</option>
                                <option value="CONCILIO">Solo conciliados</option>
                            </select>

                            <select
                                value={form.distribuidora}
                                onChange={(e) => setForm({ ...form, distribuidora: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="TODOS">Todas las distribuidoras</option>
                                {distribuidorasOpciones.map((d) => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={form.desde}
                                    onChange={(e) => setForm({ ...form, desde: e.target.value })}
                                    className="block w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                                    title="Desde"
                                />
                                <input
                                    type="date"
                                    value={form.hasta}
                                    onChange={(e) => setForm({ ...form, hasta: e.target.value })}
                                    className="block w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                                    title="Hasta"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Limpiar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                            >
                                Aplicar filtros
                            </button>
                        </div>
                    </form>

                    {/* Tabla / Lista */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        {!tieneDatos ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-gray-300 text-3xl" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Sin vales con tu intervención</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Cuando feríes pre-vales, registres cobros o concilies pagos, aparecerán aquí.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vale</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distribuidora</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Intervención</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Última</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {vales.data.map((v) => (
                                            <tr key={v.id} className="hover:bg-blue-50/40 transition-colors">
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="font-mono font-semibold text-gray-900">{v.numero_vale}</div>
                                                    <div className="text-xs text-gray-400">{formatFecha(v.fecha_emision)}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{v.cliente_nombre || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{v.distribuidora_nombre || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <div className="font-semibold text-gray-900">{moneda(v.monto)}</div>
                                                    <div className="text-xs text-gray-400">Deuda {moneda(v.monto_total_deuda)}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={v.saldo_actual <= 0.01 ? 'text-emerald-600 font-semibold' : 'text-gray-900 font-medium'}>
                                                        {moneda(v.saldo_actual)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ESTADO_BADGE[v.estado] || 'bg-gray-100 text-gray-700'}`}>
                                                        {v.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {v.intervenciones.map((i) => {
                                                            const meta = INTERVENCION_LABEL[i];
                                                            if (!meta) return null;
                                                            return (
                                                                <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
                                                                    <FontAwesomeIcon icon={meta.icon} className="text-[10px]" />
                                                                    {meta.texto}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatFecha(v.fecha_intervencion)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Paginación */}
                    {tieneDatos && vales.links && (
                        <div className="mt-4 flex flex-wrap gap-1 justify-center">
                            {vales.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 text-xs rounded border ${link.active
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : link.url
                                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            : 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TabletLayout>
    );
}
