import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatNumber } from './utils';

export default function Puntos({ distribuidora, resumen, relacionesPendientes = [] }) {
    const { errors } = usePage().props;
    const [modalCanje, setModalCanje] = useState(false);
    const [canje, setCanje] = useState({ relacion_corte_id: '', puntos_a_canjear: '' });
    const [canjeando, setCanjeando] = useState(false);

    useEffect(() => {
        const unsubscribe = router.on('start', () => setModalCanje(false));
        return unsubscribe;
    }, []);

    const valorPorPunto = resumen.valor_estimado || 2;
    const puedeCanjear = resumen.saldo_actual >= 2 && relacionesPendientes.length > 0;
    const puntosNum = parseInt(canje.puntos_a_canjear, 10) || 0;

    const confirmarCanje = () => {
        if (canjeando || !canje.relacion_corte_id || puntosNum < 2) return;
        setCanjeando(true);
        router.post(route('distribuidora.puntos.canjear'), canje, {
            onSuccess: () => { setModalCanje(false); setCanje({ relacion_corte_id: '', puntos_a_canjear: '' }); },
            onFinish: () => setCanjeando(false),
        });
    };

    if (!distribuidora) {
        return (
            <DistribuidoraLayout title="Puntos" subtitle="No disponible">
                <Head title="Puntos" />
                <div className="p-8 text-center text-gray-500">Sin distribuidora.</div>
            </DistribuidoraLayout>
        );
    }

    return (
        <DistribuidoraLayout title="Mis puntos" subtitle={`${resumen.saldo_actual} pts`}>
            <Head title="Puntos" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white/20">
                                <FontAwesomeIcon icon={faCoins} className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wider text-green-100">Puntos disponibles</p>
                                <p className="text-4xl font-bold mt-1">{formatNumber(resumen.saldo_actual)}</p>
                                <p className="text-lg text-green-100 mt-1">= {formatCurrency(resumen.saldo_actual * valorPorPunto)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <p className="text-sm text-gray-500 mb-3">Resumen</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Ganados</span>
                                <span className="text-lg font-bold text-green-600">+{formatNumber(resumen.positivos)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Canjeados</span>
                                <span className="text-lg font-bold text-gray-900">-{formatNumber(resumen.negativos)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-sm font-semibold text-gray-700">Movimientos</span>
                                <span className="text-sm font-bold text-gray-900">{formatNumber(resumen.movimientos)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {puedeCanjear ? (
                    <button onClick={() => setModalCanje(true)} className="flex items-center justify-center gap-3 w-full py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-colors">
                        <FontAwesomeIcon icon={faGift} className="w-6 h-6" />
                        Canjear puntos
                    </button>
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                        {resumen.saldo_actual < 2 ? 'Mínimo 2 puntos para canjear' : 'Sin deudas pendientes'}
                    </div>
                )}

                {(errors?.general || errors?.puntos_a_canjear) && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-base text-red-600">
                        {errors.general || errors.puntos_a_canjear}
                    </div>
                )}

                {modalCanje && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalCanje(false)}>
                        <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Canjear puntos</h2>
                                <button onClick={() => setModalCanje(false)} className="p-2 text-gray-400 hover:text-gray-600">
                                    <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 mb-2 block">Aplicar a relación</label>
                                    <select value={canje.relacion_corte_id} onChange={(e) => setCanje((p) => ({ ...p, relacion_corte_id: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg">
                                        <option value="">Selecciona un corte</option>
                                        {relacionesPendientes.map((r) => (
                                            <option key={r.id} value={r.id}>#{r.numero_relacion} - {formatCurrency(r.total_a_pagar)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 mb-2 block">Puntos a canjear (mín 2)</label>
                                    <input type="number" value={canje.puntos_a_canjear} onChange={(e) => setCanje((p) => ({ ...p, puntos_a_canjear: e.target.value }))} className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg" placeholder="Ej. 50" />
                                </div>
                                {puntosNum >= 2 && (
                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                        <p className="text-lg font-bold text-green-700">{puntosNum} pts = {formatCurrency(puntosNum * valorPorPunto)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModalCanje(false)} className="flex-1 py-3 text-base font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                                <button onClick={confirmarCanje} disabled={canjeando || !canje.relacion_corte_id || puntosNum < 2} className="flex-1 py-3 text-base font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {canjeando ? 'Canjeando...' : 'Confirmar canje'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}