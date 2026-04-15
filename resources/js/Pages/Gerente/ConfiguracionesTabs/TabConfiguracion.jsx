import React from 'react';

export default function TabConfiguracion({
    formSucursal,
    guardarConfiguracionSucursal,
    guardandoSucursal,
    generalError,
    esAdmin = false,
}) {
    return (
        <form className="space-y-4 fin-card" onSubmit={guardarConfiguracionSucursal}>
            <div>
                <h3 className="font-semibold text-gray-900">
                    {esAdmin ? '1) Configuración global' : '1) Configuración por sucursal'}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                    {esAdmin
                        ? 'Aquí ajustas corte, seguro y reglas de puntos que se sincronizan en todas las sucursales activas.'
                        : 'Aquí ajustas corte, seguro y reglas de puntos de la sucursal.'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                    <label className="text-sm text-gray-700">Primera fecha de corte (día del mes)</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="mt-1 fin-input"
                        value={formSucursal.data.dia_corte}
                        onChange={(e) => formSucursal.setData('dia_corte', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">La segunda fecha se calcula automáticamente sumando 15 días.</p>
                    {formSucursal.errors?.dia_corte && (
                        <p className="mt-1 text-xs text-red-600">{formSucursal.errors.dia_corte}</p>
                    )}
                </div>
                <div>
                    <label className="text-sm text-gray-700">Plazo de pago (días)</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="mt-1 fin-input"
                        value={formSucursal.data.plazo_pago_dias}
                        onChange={(e) => formSucursal.setData('plazo_pago_dias', e.target.value)}
                    />
                    {formSucursal.errors?.plazo_pago_dias && (
                        <p className="mt-1 text-xs text-red-600">{formSucursal.errors.plazo_pago_dias}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm text-gray-700">Hora de corte</label>
                    <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        Fija para todas las sucursales: <span className="font-semibold">18:00</span>
                    </div>
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
                    {formSucursal.errors?.factor_divisor_puntos && (
                        <p className="mt-1 text-xs text-red-600">{formSucursal.errors.factor_divisor_puntos}</p>
                    )}
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
                    {formSucursal.errors?.multiplicador_puntos && (
                        <p className="mt-1 text-xs text-red-600">{formSucursal.errors.multiplicador_puntos}</p>
                    )}
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
                    {formSucursal.errors?.valor_punto_mxn && (
                        <p className="mt-1 text-xs text-red-600">{formSucursal.errors.valor_punto_mxn}</p>
                    )}
                </div>
            </div>
            {generalError && (
                <div className="px-3 py-2 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                    {generalError}
                </div>
            )}
            <button type="submit" className="mt-4 fin-btn-primary" disabled={guardandoSucursal}>
                {guardandoSucursal ? 'Guardando configuración...' : (esAdmin ? 'Guardar configuración global' : 'Guardar configuración de sucursal')}
            </button>
        </form>
    );
}
