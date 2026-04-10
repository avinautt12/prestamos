import React from 'react';

export default function TabConfiguracion({
    formSucursal,
    guardarConfiguracionSucursal,
    guardandoSucursal,
}) {
    return (
        <form className="space-y-4 fin-card" onSubmit={guardarConfiguracionSucursal}>
            <div>
                <h3 className="font-semibold text-gray-900">1) Configuración por sucursal</h3>
                <p className="mt-1 text-xs text-gray-500">Aquí ajustas corte, seguro y reglas de puntos de la sucursal.</p>
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
            <button type="submit" className="mt-4 fin-btn-primary" disabled={guardandoSucursal}>
                {guardandoSucursal ? 'Guardando configuración...' : 'Guardar configuración de sucursal'}
            </button>
        </form>
    );
}
