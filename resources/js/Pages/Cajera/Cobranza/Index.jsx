import React, { useState, useMemo } from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faCircleCheck,
    faCircleXmark,
    faExclamationTriangle,
    faLock,
    faLockOpen,
    faMagnifyingGlass,
    faMoneyBillTrendUp,
    faScaleUnbalancedFlip,
    faTriangleExclamation,
    faUserSlash,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';

export default function CobranzaIndex({ stats, distribuidoras, relacionesDetalle, filtros }) {
    const { flash } = usePage().props;
    const [expandedId, setExpandedId] = useState(null);
    const [busqueda, setBusqueda] = useState(filtros?.q || '');
    const [filtroEstado, setFiltroEstado] = useState(filtros?.estado || 'TODAS');
    const [modalBloquear, setModalBloquear] = useState(null);
    const [modalDesbloquear, setModalDesbloquear] = useState(null);

    const bloquearForm = useForm({ motivo: '' });
    const desbloquearForm = useForm({ motivo: '' });

    const statsCards = [
        {
            label: 'Monto Total Adeudado',
            value: `$${Number(stats?.total_adeudado ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: faMoneyBillTrendUp,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            borderColor: 'border-red-200',
        },
        {
            label: 'Distribuidoras con Deuda',
            value: stats?.distribuidoras_con_deuda ?? 0,
            icon: faUsers,
            iconColor: 'text-orange-600',
            iconBg: 'bg-orange-100',
            borderColor: 'border-orange-200',
        },
        {
            label: 'Cortes Vencidos',
            value: stats?.relaciones_vencidas ?? 0,
            icon: faScaleUnbalancedFlip,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100',
            borderColor: 'border-amber-200',
        },
    ];

    const aplicarFiltros = () => {
        const params = {};
        if (busqueda.trim()) params.q = busqueda.trim();
        if (filtroEstado !== 'TODAS') params.estado = filtroEstado;
        router.get(route('cajera.cobranza.index'), params, { preserveState: true });
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroEstado('TODAS');
        router.get(route('cajera.cobranza.index'));
    };

    const handleBloquear = (e) => {
        e.preventDefault();
        bloquearForm.post(route('cajera.cobranza.bloquear', modalBloquear.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalBloquear(null);
                bloquearForm.reset();
            },
        });
    };

    const handleDesbloquear = (e) => {
        e.preventDefault();
        desbloquearForm.post(route('cajera.cobranza.desbloquear', modalDesbloquear.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalDesbloquear(null);
                desbloquearForm.reset();
            },
        });
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const estadoBadge = (estado) => {
        const map = {
            'ACTIVA': 'bg-emerald-100 text-emerald-800',
            'MOROSA': 'bg-red-100 text-red-800',
            'BLOQUEADA': 'bg-gray-200 text-gray-800',
            'INACTIVA': 'bg-gray-100 text-gray-500',
        };
        return map[estado] || 'bg-gray-100 text-gray-600';
    };

    const relacionEstadoBadge = (estado) => {
        const map = {
            'VENCIDA': 'bg-red-100 text-red-800',
            'PARCIAL': 'bg-amber-100 text-amber-800',
            'GENERADA': 'bg-blue-100 text-blue-800',
        };
        return map[estado] || 'bg-gray-100 text-gray-600';
    };

    const formatMonto = (val) => {
        const num = Number(val || 0);
        return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatFecha = (val) => {
        if (!val) return '-';
        const d = new Date(val);
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const diasVencida = (fechaLimite) => {
        if (!fechaLimite) return 0;
        const hoy = new Date();
        const limite = new Date(fechaLimite);
        const diff = Math.floor((hoy - limite) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    return (
        <TabletLayout title="Módulo de Cobranza">
            <Head title="Cobranza" />

            <div className="py-4 space-y-6">
                {/* Flash messages */}
                {(flash?.message || flash?.error) && (
                    <section className={`rounded-xl border px-4 py-3 text-sm ${flash?.error
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={flash?.error ? faCircleXmark : faCircleCheck}
                                className={flash?.error ? 'text-red-600' : 'text-emerald-600'}
                            />
                            <p className="font-semibold">{flash?.error || flash?.message}</p>
                        </div>
                    </section>
                )}

                {/* Header */}
                <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Módulo de Cobranza</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Control de distribuidoras con adeudos, relaciones vencidas y gestión de bloqueos por morosidad.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                                {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Stats Cards */}
                <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                    {statsCards.map((card) => (
                        <div key={card.label} className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-sm ${card.borderColor}`}>
                            <div className={`flex items-center justify-center w-11 h-11 rounded-full ${card.iconBg} shrink-0`}>
                                <FontAwesomeIcon icon={card.icon} className={`text-lg ${card.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase truncate">{card.label}</p>
                                <p className="text-lg font-bold leading-tight text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Filtros */}
                <section className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Buscar distribuidora</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                                    placeholder="Nombre, apellido o número..."
                                    className="w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Estado</label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="w-full py-2 text-sm border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="TODAS">Todas con deuda</option>
                                <option value="ACTIVA">Activas con deuda</option>
                                <option value="MOROSA">Morosas</option>
                                <option value="BLOQUEADA">Bloqueadas</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={aplicarFiltros}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 whitespace-nowrap"
                            >
                                Buscar
                            </button>
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </section>

                {/* Tabla de distribuidoras */}
                <section className="bg-white border border-gray-200 shadow-sm rounded-xl">
                    <div className="px-4 py-3 border-b border-gray-200 sm:px-6">
                        <h3 className="text-base font-bold text-gray-800">
                            Distribuidoras con adeudos
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({distribuidoras?.total ?? 0} encontrada{(distribuidoras?.total ?? 0) !== 1 ? 's' : ''})
                            </span>
                        </h3>
                    </div>

                    {(!distribuidoras?.data || distribuidoras.data.length === 0) ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-50 rounded-full border border-gray-100">
                                <FontAwesomeIcon icon={faCircleCheck} className="text-3xl text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Sin adeudos pendientes</h3>
                            <p className="mt-1 text-sm text-gray-500">No hay distribuidoras con relaciones vencidas o pendientes de pago.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {distribuidoras.data.map((dist) => {
                                const persona = dist.persona || {};
                                const nombre = [persona.primer_nombre, persona.apellido_paterno, persona.apellido_materno].filter(Boolean).join(' ');
                                const isExpanded = expandedId === dist.id;
                                const relaciones = relacionesDetalle?.[dist.id] || [];
                                const puedeBloquear = dist.estado === 'ACTIVA' && (dist.relaciones_vencidas_count > 0);
                                const puedeDesbloquear = ['MOROSA', 'BLOQUEADA'].includes(dist.estado);

                                return (
                                    <div key={dist.id}>
                                        {/* Fila principal */}
                                        <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center">
                                            {/* Avatar + Info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`flex items-center justify-center w-11 h-11 rounded-full text-white font-bold text-lg shrink-0 ${
                                                    dist.estado === 'MOROSA' ? 'bg-red-500' :
                                                    dist.estado === 'BLOQUEADA' ? 'bg-gray-500' : 'bg-blue-500'
                                                }`}>
                                                    {(persona.primer_nombre || '#').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{nombre || 'Sin nombre'}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-500 font-mono">{dist.numero_distribuidora}</span>
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${estadoBadge(dist.estado)}`}>
                                                            {dist.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Métricas */}
                                            <div className="grid grid-cols-3 gap-4 text-center md:gap-6">
                                                <div>
                                                    <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">Vencidas</p>
                                                    <p className={`text-lg font-bold ${dist.relaciones_vencidas_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {dist.relaciones_vencidas_count || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">Parciales</p>
                                                    <p className={`text-lg font-bold ${dist.relaciones_parciales_count > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                        {dist.relaciones_parciales_count || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">Adeudo</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {formatMonto(dist.monto_total_adeudado)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {puedeBloquear && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalBloquear(dist)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                                                    >
                                                        <FontAwesomeIcon icon={faLock} />
                                                        Bloquear
                                                    </button>
                                                )}
                                                {puedeDesbloquear && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalDesbloquear(dist)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                                                    >
                                                        <FontAwesomeIcon icon={faLockOpen} />
                                                        Desbloquear
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(dist.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                                >
                                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                                    {isExpanded ? 'Ocultar' : 'Detalle'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Panel expandible — Relaciones vencidas */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 sm:px-6">
                                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                    <h4 className="mb-3 text-sm font-bold text-gray-700">
                                                        Relaciones vencidas / parciales de {nombre}
                                                    </h4>
                                                    {relaciones.length === 0 ? (
                                                        <p className="text-sm text-gray-500">No hay relaciones vencidas en este momento.</p>
                                                    ) : (
                                                        <div className="overflow-auto">
                                                            <table className="min-w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-gray-500 border-b border-gray-300">
                                                                        <th className="py-2 pr-3 font-semibold">Relación</th>
                                                                        <th className="py-2 pr-3 font-semibold">Referencia</th>
                                                                        <th className="py-2 pr-3 font-semibold">Fecha Límite</th>
                                                                        <th className="py-2 pr-3 font-semibold">Días Vencida</th>
                                                                        <th className="py-2 pr-3 font-semibold">Monto</th>
                                                                        <th className="py-2 pr-3 font-semibold">Estado</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {relaciones.map((rel) => (
                                                                        <tr key={rel.id} className="border-b border-gray-200 last:border-b-0">
                                                                            <td className="py-2 pr-3 font-semibold text-gray-900">{rel.numero_relacion}</td>
                                                                            <td className="py-2 pr-3 text-gray-700 font-mono text-xs">{rel.referencia_pago || '-'}</td>
                                                                            <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{formatFecha(rel.fecha_limite_pago)}</td>
                                                                            <td className="py-2 pr-3">
                                                                                {rel.estado === 'VENCIDA' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                                                                                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
                                                                                        {diasVencida(rel.fecha_limite_pago)} días
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-gray-400">-</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 pr-3 font-bold text-gray-900">{formatMonto(rel.total_a_pagar)}</td>
                                                                            <td className="py-2 pr-3">
                                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${relacionEstadoBadge(rel.estado)}`}>
                                                                                    {rel.estado}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Paginación */}
                    {distribuidoras?.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
                            <span className="text-xs text-gray-500">
                                Página {distribuidoras.current_page} de {distribuidoras.last_page}
                            </span>
                            <div className="flex gap-2">
                                {distribuidoras.prev_page_url && (
                                    <button
                                        type="button"
                                        onClick={() => router.get(distribuidoras.prev_page_url)}
                                        className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Anterior
                                    </button>
                                )}
                                {distribuidoras.next_page_url && (
                                    <button
                                        type="button"
                                        onClick={() => router.get(distribuidoras.next_page_url)}
                                        className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Siguiente
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal Bloquear */}
            {modalBloquear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-red-50 rounded-t-2xl">
                            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                                <FontAwesomeIcon icon={faLock} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-red-900">Bloquear distribuidora</h3>
                                <p className="text-xs text-red-700">
                                    {modalBloquear.persona?.primer_nombre} {modalBloquear.persona?.apellido_paterno} — {modalBloquear.numero_distribuidora}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleBloquear} className="p-6 space-y-4">
                            <div className="p-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                Esta acción cambiará el estado a <strong>MOROSA</strong> y desactivará la emisión de vales inmediatamente.
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-semibold text-gray-700">Motivo del bloqueo *</label>
                                <textarea
                                    value={bloquearForm.data.motivo}
                                    onChange={(e) => bloquearForm.setData('motivo', e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Ej: Relación REL-SUC-2026-003 vencida hace 15 días sin pago reportado."
                                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                                />
                                {bloquearForm.errors.motivo && (
                                    <p className="mt-1 text-xs text-red-600">{bloquearForm.errors.motivo}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalBloquear(null); bloquearForm.reset(); }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={bloquearForm.processing || !bloquearForm.data.motivo.trim()}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {bloquearForm.processing ? 'Bloqueando...' : 'Confirmar bloqueo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Desbloquear */}
            {modalDesbloquear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-emerald-50 rounded-t-2xl">
                            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
                                <FontAwesomeIcon icon={faLockOpen} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-emerald-900">Desbloquear distribuidora</h3>
                                <p className="text-xs text-emerald-700">
                                    {modalDesbloquear.persona?.primer_nombre} {modalDesbloquear.persona?.apellido_paterno} — {modalDesbloquear.numero_distribuidora}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleDesbloquear} className="p-6 space-y-4">
                            <div className="p-3 text-sm border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-800">
                                <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                                Se restaurará a estado <strong>ACTIVA</strong> y podrá emitir vales nuevamente.
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-semibold text-gray-700">Motivo de desbloqueo *</label>
                                <textarea
                                    value={desbloquearForm.data.motivo}
                                    onChange={(e) => desbloquearForm.setData('motivo', e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Ej: Distribuidora liquidó relaciones vencidas REL-SUC-2026-003 y REL-SUC-2026-004."
                                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                {desbloquearForm.errors.motivo && (
                                    <p className="mt-1 text-xs text-red-600">{desbloquearForm.errors.motivo}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalDesbloquear(null); desbloquearForm.reset(); }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={desbloquearForm.processing || !desbloquearForm.data.motivo.trim()}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {desbloquearForm.processing ? 'Desbloqueando...' : 'Confirmar desbloqueo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TabletLayout>
    );
}
