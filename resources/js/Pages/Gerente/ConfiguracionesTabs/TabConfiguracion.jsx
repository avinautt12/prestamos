import React from 'react';

export default function TabConfiguracion({
    formSucursal,
    guardarConfiguracionSucursal,
    seguroTabuladores,
    agregarTabuladorSeguro,
    eliminarTabuladorSeguro,
    actualizarTabuladorSeguro,
    formatearTabuladorSeguro,
    erroresTabuladores,
    guardandoSucursal,
}) {
    return (
        <form className="space-y-4 fin-card" onSubmit={guardarConfiguracionSucursal}>
            <div>
                <h3 className="font-semibold text-gray-900">1) Configuración por sucursal</h3>
                <p className="mt-1 text-xs text-gray-500">Aquí ajustas reglas base, seguro y valores operativos de la sucursal.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                    <label className="text-sm text-gray-700">Fecha de corte (día del mes)</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="mt-1 fin-input"
                        value={formSucursal.data.dia_corte}
                        onChange={(e) => formSucursal.setData('dia_corte', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700">Hora de corte</label>
                    <input
                        type="time"
                        className="mt-1 fin-input"
                        value={formSucursal.data.hora_corte}
                        onChange={(e) => formSucursal.setData('hora_corte', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700">Frecuencia de pago (días)</label>
                    <input
                        type="number"
                        min="1"
                        max="90"
                        className="mt-1 fin-input"
                        value={formSucursal.data.frecuencia_pago_dias}
                        onChange={(e) => formSucursal.setData('frecuencia_pago_dias', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700">Plazo de pago (días)</label>
                    <input
                        type="number"
                        min="1"
                        max="180"
                        className="mt-1 fin-input"
                        value={formSucursal.data.plazo_pago_dias}
                        onChange={(e) => formSucursal.setData('plazo_pago_dias', e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-700">Línea de crédito inicial sugerida</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 fin-input"
                        value={formSucursal.data.linea_credito_default}
                        onChange={(e) => formSucursal.setData('linea_credito_default', e.target.value)}
                    />
                </div>

                <div className="col-span-2 p-4 border rounded-xl border-emerald-200 bg-emerald-50/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-900">Seguro por tabuladores</label>
                            <p className="mt-1 text-xs text-gray-600">
                                Configura rangos simples. El sistema usará el primer rango que coincida con el monto solicitado.
                            </p>
                        </div>
                        <button type="button" className="fin-btn-secondary" onClick={agregarTabuladorSeguro}>
                            Agregar rango
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-4 md:grid-cols-3">
                        {seguroTabuladores.map((tabulador, index) => (
                            <div key={tabulador.id} className="p-3 bg-white border rounded-lg border-emerald-200">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="text-xs font-semibold tracking-wide uppercase text-emerald-700">Rango {index + 1}</p>
                                    <button
                                        type="button"
                                        className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400"
                                        onClick={() => eliminarTabuladorSeguro(tabulador.id)}
                                        disabled={seguroTabuladores.length <= 1}
                                    >
                                        Quitar
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-600">Desde</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={tabulador.desde}
                                            onChange={(e) => actualizarTabuladorSeguro(tabulador.id, 'desde', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Hasta</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Sin tope"
                                            className="mt-1 fin-input"
                                            value={tabulador.hasta}
                                            onChange={(e) => actualizarTabuladorSeguro(tabulador.id, 'hasta', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Monto</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="mt-1 fin-input"
                                            value={tabulador.monto}
                                            onChange={(e) => actualizarTabuladorSeguro(tabulador.id, 'monto', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-gray-600">
                                    {formatearTabuladorSeguro(tabulador)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm text-gray-700">Comisión de apertura (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.0001"
                        className="mt-1 fin-input"
                        value={formSucursal.data.porcentaje_comision_apertura}
                        onChange={(e) => formSucursal.setData('porcentaje_comision_apertura', e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700">Interés quincenal (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.0001"
                        className="mt-1 fin-input"
                        value={formSucursal.data.porcentaje_interes_quincenal}
                        onChange={(e) => formSucursal.setData('porcentaje_interes_quincenal', e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700">Multa por incumplimiento</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 fin-input"
                        value={formSucursal.data.multa_incumplimiento_monto}
                        onChange={(e) => formSucursal.setData('multa_incumplimiento_monto', e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700">Factor divisor puntos</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        className="mt-1 fin-input"
                        value={formSucursal.data.factor_divisor_puntos}
                        onChange={(e) => formSucursal.setData('factor_divisor_puntos', e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700">Multiplicador puntos</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        className="mt-1 fin-input"
                        value={formSucursal.data.multiplicador_puntos}
                        onChange={(e) => formSucursal.setData('multiplicador_puntos', e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700">Valor del punto (MXN)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 fin-input"
                        value={formSucursal.data.valor_punto_mxn}
                        onChange={(e) => formSucursal.setData('valor_punto_mxn', e.target.value)}
                    />
                </div>
            </div>
            {erroresTabuladores.length > 0 && (
                <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm font-semibold text-red-700">Revisa los tabuladores antes de guardar:</p>
                    <ul className="mt-2 space-y-1 text-xs text-red-700">
                        {erroresTabuladores.map((error) => (
                            <li key={error}>- {error}</li>
                        ))}
                    </ul>
                </div>
            )}
            <button type="submit" className="mt-4 fin-btn-primary" disabled={guardandoSucursal || erroresTabuladores.length > 0}>
                {guardandoSucursal
                    ? 'Guardando configuración...'
                    : erroresTabuladores.length > 0
                        ? 'Corrige tabuladores para guardar'
                        : 'Guardar configuración de sucursal'}
            </button>
        </form>
    );
}
