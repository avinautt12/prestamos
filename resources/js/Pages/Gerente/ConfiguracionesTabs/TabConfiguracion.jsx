import React from 'react';

export default function TabConfiguracion({
    formSucursal,
    guardarConfiguracionSucursal,
    guardandoSucursal,
    generalError,
    esAdmin = false,
    soloLectura = false,
}) {
    return (
        <form className="space-y-8 bg-white border border-slate-200 rounded-xl shadow-sm p-8" onSubmit={guardarConfiguracionSucursal}>
            <div className="border-b border-slate-100 pb-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1FA62D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    1) Configuración global
                </h3>
                <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
                    {esAdmin
                        ? 'Establece las directrices operativas fundamentales, parámetros de cobranza y sistema de puntos para la red comercial.'
                        : 'Establece las directrices operativas locales, parámetros de cobranza y sistema de puntos de la sucursal activa.'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                {/* Sección Operación de Cortes */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/60 shadow-sm">
                    <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-5 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Ciclo Operativo
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Día inicial de corte</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={formSucursal.data.dia_corte}
                                onChange={(e) => formSucursal.setData('dia_corte', e.target.value)}
                                disabled={soloLectura}
                            />
                            <p className="mt-1 text-[11px] text-slate-400 font-medium">Sincroniza quincenas automáticamente.</p>
                            {formSucursal.errors?.dia_corte && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.dia_corte}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Plazo de pago (días)</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={formSucursal.data.plazo_pago_dias}
                                onChange={(e) => formSucursal.setData('plazo_pago_dias', e.target.value)}
                                disabled={soloLectura}
                            />
                            {formSucursal.errors?.plazo_pago_dias && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.plazo_pago_dias}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Horario límite (Corte)</label>
                            <input
                                type="time"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={formSucursal.data.hora_corte}
                                onChange={(e) => formSucursal.setData('hora_corte', e.target.value)}
                                disabled={soloLectura}
                            />
                            {formSucursal.errors?.hora_corte && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.hora_corte}</p>}
                        </div>
                    </div>
                </div>

                {/* Sección Reglas Financieras */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/60 shadow-sm">
                    <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-5 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Estructura Financiera
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                Comisión de apertura
                                <span className="text-slate-400">%</span>
                            </label>
                            <input
                                type="number"
                                min="0" max="100" step="0.01"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={formSucursal.data.porcentaje_comision_apertura}
                                onChange={(e) => formSucursal.setData('porcentaje_comision_apertura', e.target.value)}
                                disabled={soloLectura}
                            />
                            {formSucursal.errors?.porcentaje_comision_apertura && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.porcentaje_comision_apertura}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                Interés quincenal
                                <span className="text-slate-400">%</span>
                            </label>
                            <input
                                type="number"
                                min="0" max="100" step="0.01"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={formSucursal.data.porcentaje_interes_quincenal}
                                onChange={(e) => formSucursal.setData('porcentaje_interes_quincenal', e.target.value)}
                                disabled={soloLectura}
                            />
                            {formSucursal.errors?.porcentaje_interes_quincenal && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.porcentaje_interes_quincenal}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                Multa por impago
                                <span className="text-slate-400">MXN</span>
                            </label>
                            <input
                                type="number"
                                min="0" step="1"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-red-700 disabled:bg-slate-50 disabled:opacity-60"
                                value={formSucursal.data.multa_incumplimiento_monto}
                                onChange={(e) => formSucursal.setData('multa_incumplimiento_monto', e.target.value)}
                                disabled={soloLectura}
                            />
                            <p className="mt-1 text-[11px] text-slate-400 font-medium">Cargo fijo directo al capital deudor.</p>
                            {formSucursal.errors?.multa_incumplimiento_monto && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.multa_incumplimiento_monto}</p>}
                        </div>
                    </div>
                </div>

                {/* Sección Puntos y Penalizaciones */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/60 shadow-sm">
                    <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-5 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        Fidelización y Castigos
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Divisor (MXN)</label>
                                <input
                                    type="number" min="1" step="1"
                                    className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    value={formSucursal.data.factor_divisor_puntos}
                                    onChange={(e) => formSucursal.setData('factor_divisor_puntos', e.target.value)}
                                    disabled={soloLectura}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Puntos Otorgados</label>
                                <input
                                    type="number" min="1" step="1"
                                    className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    value={formSucursal.data.multiplicador_puntos}
                                    onChange={(e) => formSucursal.setData('multiplicador_puntos', e.target.value)}
                                    disabled={soloLectura}
                                />
                            </div>
                        </div>
                        {formSucursal.errors?.factor_divisor_puntos && <p className="text-xs text-red-600 font-medium">{formSucursal.errors.factor_divisor_puntos}</p>}
                        
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                Valor de canje (1 pt)
                                <span className="text-slate-400">MXN</span>
                            </label>
                            <input
                                type="number" min="0" step="0.01"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#1FA62D] focus:ring-[#1FA62D] sm:text-sm text-emerald-700 font-medium disabled:bg-slate-50 disabled:opacity-60"
                                value={formSucursal.data.valor_punto_mxn}
                                onChange={(e) => formSucursal.setData('valor_punto_mxn', e.target.value)}
                                disabled={soloLectura}
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                Castigo por mora
                                <span className="text-slate-400">% Puntos</span>
                            </label>
                            <input
                                type="number" min="0" max="100" step="0.01"
                                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-red-700 disabled:bg-slate-50 disabled:opacity-60"
                                value={formSucursal.data.castigo_pct_atraso}
                                onChange={(e) => formSucursal.setData('castigo_pct_atraso', e.target.value)}
                                disabled={soloLectura}
                            />
                            <p className="mt-1 text-[11px] text-slate-400 font-medium">Merma del saldo de puntos acumulados.</p>
                            {formSucursal.errors?.castigo_pct_atraso && <p className="mt-1 text-xs text-red-600 font-medium">{formSucursal.errors.castigo_pct_atraso}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {generalError && (
                <div className="flex items-center gap-3 p-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {generalError}
                </div>
            )}

            <div className="flex items-center justify-end pt-5 border-t border-slate-100">
                <button 
                    type="submit" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-[#1FA62D] border border-transparent rounded-lg shadow-sm hover:bg-[#1B9229] focus:outline-none focus:ring-2 focus:ring-[#1FA62D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={guardandoSucursal || soloLectura}
                >
                    {guardandoSucursal ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Aplicando configuración...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {esAdmin ? 'Aprobar directrices globales' : 'Actualizar directrices'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
