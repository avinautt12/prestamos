import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DistribuidoraLayout from '@/Layouts/DistribuidoraLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatNumber } from './utils';

export default function Puntos({ distribuidora, resumen, relacionesPendientes = [] }) {
    const { errors } = usePage().props;
    const [modalCanje, setModalCanje] = useState(false);
    const [canje, setCanje] = useState({ relacion_corte_id: '', puntos_a_canjear: '' });
    const [canjeando, setCanjeando] = useState(false);

    // Cerrar modal al navegar (click en barra de navegación u otros links)
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

            <div className="space-y-3">
                {/* Card principal */}
                <div className="p-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-green-100">Puntos disponibles</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(resumen.saldo_actual)}</p>
                    <p className="text-sm text-green-100 mt-1">= {formatCurrency(resumen.saldo_actual * valorPorPunto)}</p>
                </div>

                {/* Botón canjear */}
                {puedeCanjear ? (
                    <button onClick={() => setModalCanje(true)} className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white rounded-xl font-medium">
                        <FontAwesomeIcon icon={faGift} className="w-5 h-5" />
                        Canjear puntos
                    </button>
                ) : (
                    <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                        {resumen.saldo_actual < 2 ? 'Mínimo 2 puntos para canjear' : 'Sin deudas pendientes'}
                    </div>
                )}

                {/* Error */}
                {(errors?.general || errors?.puntos_a_canjear) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                        {errors.general || errors.puntos_a_canjear}
                    </div>
                )}

                {/* Modal canje */}
                {modalCanje && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setModalCanje(false)}>
                        <div className="w-full max-w-md bg-white rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
                            <p className="text-base font-bold text-gray-900 mb-4">Canjear puntos</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Aplicar a</label>
                                    <select value={canje.relacion_corte_id} onChange={(e) => setCanje((p) => ({ ...p, relacion_corte_id: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg">
                                        <option value="">Selecciona corte</option>
                                        {relacionesPendientes.map((r) => (
                                            <option key={r.id} value={r.id}>#{r.numero_relacion} - {formatCurrency(r.total_a_pagar)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Puntos (mín 2)</label>
                                    <input type="number" value={canje.puntos_a_canjear} onChange={(e) => setCanje((p) => ({ ...p, puntos_a_canjear: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" placeholder="Ej. 50" />
                                </div>
                                {puntosNum >= 2 && (
                                    <div className="p-3 bg-green-50 rounded-lg text-center">
                                        <p className="text-sm font-bold text-green-700">{puntosNum} pts = {formatCurrency(puntosNum * valorPorPunto)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setModalCanje(false)} className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
                                <button onClick={confirmarCanje} disabled={canjeando || !canje.relacion_corte_id || puntosNum < 2} className="flex-1 py-3 text-sm font-medium text-white bg-green-700 rounded-lg disabled:opacity-50">
                                    {canjeando ? 'Canjeando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DistribuidoraLayout>
    );
}