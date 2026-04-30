import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import TabletLayout from '@/Layouts/TabletLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleXmark,
    faCircleCheck,
    faSearch,
    faScaleBalanced,
    faClockRotateLeft,
    faCashRegister,
} from '@fortawesome/free-solid-svg-icons';

function ConciliarModal({ pago, movimientos, open, onClose }) {
    const [conciliando, setConciliando] = useState(false);
    const conciliaForm = useForm({
        movimiento_bancario_id: '',
        estado: 'CONCILIADA',
        observaciones: '',
    });

    useMemo(() => {
        if (!pago || !open) return;
        conciliaForm.clearErrors();
        conciliaForm.setData({
            movimiento_bancario_id: '',
            estado: 'CONCILIADA',
            observaciones: '',
        });
    }, [pago?.id, open]);

    if (!open || !pago) return null;

    const montoPago = Number(pago.monto || 0);
    const movimientoMatches = (movimientos || []).filter(m => Math.abs(Number(m.monto) - montoPago) < 0.01);

    const handleConciliar = (e) => {
        e?.preventDefault();
        if (!conciliaForm.data.movimiento_bancario_id || conciliando) return;
        setConciliando(true);
        conciliaForm.post(route('cajera.conciliaciones.partidas.conciliar', pago.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                router.reload({ only: ['pagos'] });
            },
            onError: (errors) => {
                const msg = errors?.general || Object.values(errors || {})[0] || 'Error al conciliar';
                window.alert(msg);
            },
            onFinish: () => setConciliando(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Vale</p>
                        <p className="text-base font-bold text-gray-900">{pago.vale_numero}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400">
                        <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Cliente</p>
                            <p className="font-medium">{pago.cliente_nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Distribuidora</p>
                            <p className="font-medium">{pago.distribuidora_nombre}</p>
                        </div>
                    </div>

                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                        <p className="text-xs text-amber-600">Monto reportado</p>
                        <p className="font-bold text-amber-700">${Number(pago.monto).toFixed(2)}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-2">Seleccionar movimiento bancario</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {movimientoMatches.length === 0 ? (
                                <p className="text-xs text-gray-400">No hay movimientos con monto similar</p>
                            ) : (
                                movimientoMatches.map((mov) => (
                                    <button
                                        key={mov.id}
                                        onClick={() => conciliaForm.setData('movimiento_bancario_id', String(mov.id))}
                                        className={`w-full p-2 text-left border rounded-lg text-xs ${
                                            conciliaForm.data.movimiento_bancario_id === String(mov.id)
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium">{mov.referencia || mov.folio}</span>
                                            <span className="font-bold">${Number(mov.monto).toFixed(2)}</span>
                                        </div>
                                        <p className="text-gray-500">{mov.fecha_movimiento}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={conciliaForm.data.estado === 'CONCILIADA'}
                                onChange={() => conciliaForm.setData('estado', 'CONCILIADA')}
                            />
                            <span className="text-xs">Conciliar</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={conciliaForm.data.estado === 'CON_DIFERENCIA'}
                                onChange={() => conciliaForm.setData('estado', 'CON_DIFERENCIA')}
                            />
                            <span className="text-xs">Con diferencia</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={conciliaForm.data.estado === 'RECHAZADA'}
                                onChange={() => conciliaForm.setData('estado', 'RECHAZADA')}
                            />
                            <span className="text-xs">Rechazar</span>
                        </label>
                    </div>

                    <form onSubmit={handleConciliar} className="space-y-3">
                        <div>
                            <textarea
                                value={conciliaForm.data.observaciones}
                                onChange={(e) => conciliaForm.setData('observaciones', e.target.value)}
                                placeholder="Observaciones (opcional)"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                                rows={2}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!conciliaForm.data.movimiento_bancario_id || conciliando}
                            className="w-full py-2.5 text-sm font-bold text-white bg-green-700 rounded-lg disabled:opacity-50"
                        >
                            {conciliando ? 'Conciliando...' : 'Confirmar conciliación'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ConciliacionPartidas({ pagos = [], filtros = {} }) {
    const [busqueda, setBusqueda] = useState(filtros?.q || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

    const handleSelectPago = (pago) => {
        if (pago.estado !== 'REPORTADO' && pago.estado !== 'DETECTADO') return;
        setPagoSeleccionado(pago);
        setModalOpen(true);
    };

    const aplicarFiltros = () => {
        router.get(route('cajera.conciliaciones.partidas'), { q: busqueda }, { preserveState: true });
    };

    const pagosFiltrados = useMemo(() => {
        if (!busqueda) return pagos;
        const term = busqueda.toLowerCase();
        return pagos.filter(p =>
            (p.vale_numero || '').toLowerCase().includes(term) ||
            (p.cliente_nombre || '').toLowerCase().includes(term) ||
            (p.distribuidora_nombre || '').toLowerCase().includes(term) ||
            (p.referencia_reportada || '').toLowerCase().includes(term)
        );
    }, [pagos, busqueda]);

    const stats = useMemo(() => ({
        total: pagos.length,
        pendientes: pagos.filter(p => p.estado === 'REPORTADO' || p.estado === 'DETECTADO').length,
        conciliados: pagos.filter(p => p.estado === 'CONCILIADO').length,
    }), [pagos]);

    return (
        <TabletLayout title="Conciliar Vales">
            <Head title="Conciliar por Vale" />

            <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold">{stats.total}</p>
                        <p className="text-[10px] text-gray-500">Total</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-amber-600">{stats.pendientes}</p>
                        <p className="text-[10px] text-gray-500">Pendientes</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                        <p className="text-lg font-bold text-green-600">{stats.conciliados}</p>
                        <p className="text-[10px] text-gray-500">Conciliados</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl"
                        placeholder="Buscar vale, cliente o distribuidora..."
                        onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                    />
                    <button onClick={aplicarFiltros} className="px-4 py-2.5 bg-green-700 text-white rounded-xl">
                        <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                    </button>
                </div>

                {!pagosFiltrados.length ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No hay pagos reportados por vales individuales.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pagosFiltrados.map((pago) => {
                            const estado = pago.estado;
                            let badgeClass = 'bg-gray-100 text-gray-700';
                            if (estado === 'REPORTADO' || estado === 'DETECTADO') {
                                badgeClass = 'bg-amber-100 text-amber-700';
                            } else if (estado === 'CONCILIADO') {
                                badgeClass = 'bg-green-100 text-green-700';
                            } else if (estado === 'RECHAZADO') {
                                badgeClass = 'bg-red-100 text-red-700';
                            }

                            return (
                                <button
                                    key={pago.id}
                                    onClick={() => handleSelectPago(pago)}
                                    disabled={estado !== 'REPORTADO' && estado !== 'DETECTADO'}
                                    className="w-full p-3 text-left bg-white border border-gray-200 rounded-xl disabled:opacity-60"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-900">{pago.vale_numero}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {pago.cliente_nombre} · {pago.distribuidora_nombre}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">${Number(pago.monto).toFixed(2)}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                                                {estado}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[10px] text-gray-500">
                                        {pago.referencia_reportada} · {pago.fecha_pago}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}

                <ConciliarModal
                    pago={pagoSeleccionado}
                    movimientos={[]}
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            </div>
        </TabletLayout>
    );
}