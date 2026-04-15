import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCheckCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

export default function Calendario({ fechas_programadas, dia_corte_base }) {
    return (
        <AdminLayout title="Calendario Global">
            <Head title="Calendario de Empresa" />

            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Configuración de Cortes</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Las quincenas aplican para TODAS las sucursales de la empresa automáticamente.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Días Estipulados del Mes Actual</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fechas_programadas?.map((fecha, idx) => (
                                <div key={idx} className="relative p-6 border rounded-2xl border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center text-center hover:bg-emerald-50 transition">
                                    <div className="absolute top-4 right-4 text-emerald-600">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </div>
                                    <span className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase mb-2">Quincena {idx + 1}</span>
                                    <p className="text-3xl font-bold text-slate-900">{fecha}</p>
                                    <span className="mt-2 text-sm text-slate-600">Corte global automático</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className="flex items-start gap-3 mb-4">
                            <FontAwesomeIcon icon={faCircleInfo} className="text-slate-400 mt-1" />
                            <div>
                                <h3 className="font-semibold text-slate-900">¿Cómo funciona?</h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    El corte base está configurado para efectuar el primer cierre el <strong>día {dia_corte_base}</strong> de cada mes natural.
                                </p>
                                <p className="text-sm text-slate-600 mt-3">
                                    El segundo corte se auto-calcula <strong>+15 días</strong> matemáticos después del primero.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
