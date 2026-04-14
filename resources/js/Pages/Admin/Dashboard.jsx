import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faChartColumn,
    faUsersGear,
    faArrowRight,
    faShieldHalved,
    faDatabase,
    faScrewdriverWrench,
    faCircleNodes,
    faGlobe,
    faMoneyBillTrendUp,
} from '@fortawesome/free-solid-svg-icons';

function ExecutiveCard({ label, value, icon, tone }) {
    return (
        <div className="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{label}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{Number(value).toLocaleString('es-MX')}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone}`}>
                        <FontAwesomeIcon icon={icon} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Shortcut({ title, description, href, icon, tone }) {
    return (
        <Link href={href} className={`group rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${tone}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-lg font-semibold">{title}</p>
                    <p className="mt-1 text-sm opacity-90">{description}</p>
                </div>
                <FontAwesomeIcon icon={icon} className="mt-1 text-lg opacity-80" />
            </div>
            <div className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-slate-700 transition group-hover:gap-3">
                Ir al módulo
                <FontAwesomeIcon icon={faArrowRight} />
            </div>
        </Link>
    );
}

export default function Dashboard({ resumen }) {
    const cards = [
        { label: 'Sucursales activas', value: resumen?.sucursales_activas ?? 0, icon: faBuilding, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
        { label: 'Solicitudes totales', value: resumen?.solicitudes_totales ?? 0, icon: faCircleNodes, tone: 'border-blue-200 bg-blue-50 text-blue-700' },
        { label: 'Solicitudes por decidir', value: resumen?.solicitudes_pendientes ?? 0, icon: faChartColumn, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
        { label: 'Distribuidoras activas', value: resumen?.distribuidoras_activas ?? 0, icon: faUsersGear, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        { label: 'Vales activos', value: resumen?.vales_activos ?? 0, icon: faMoneyBillTrendUp, tone: 'border-teal-200 bg-teal-50 text-teal-700' },
    ];

    return (
        <AdminLayout title="Panel Admin">
            <Head title="Admin Dashboard" />

            <div className="p-6 mb-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase">Gobierno central</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Dirección ejecutiva del sistema</h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-3xl">
                            Vista de control para el dueño: usuarios, roles, configuraciones globales, catálogo de productos y métricas consolidadas.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                            Admin global
                        </span>
                        <span className="inline-flex items-center px-3 py-2 text-xs font-semibold border rounded-full border-slate-200 bg-slate-50 text-slate-700">
                            Multi-sucursal
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-6 md:grid-cols-3">
                    <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Sucursales activas</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(resumen?.sucursales_activas ?? 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Operación total</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(resumen?.solicitudes_totales ?? 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Control inmediato</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">Usuarios, catálogo y reglas</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 xl:grid-cols-5">
                {cards.map((card) => (
                    <ExecutiveCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Accesos ejecutivos</h3>
                            <p className="text-sm text-slate-500">Módulos centrales con más peso operativo y de control.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Shortcut
                            title="Reportes globales"
                            description="KPIs consolidados, filtros por sucursal y periodo."
                            href={route('admin.reportes')}
                            icon={faChartColumn}
                            tone="from-blue-50 to-indigo-50 border-blue-200 text-blue-900"
                        />
                        <Shortcut
                            title="Usuarios y roles"
                            description="Alta, desactivación y reasignación de accesos."
                            href={route('admin.usuarios.index')}
                            icon={faUsersGear}
                            tone="from-emerald-50 to-green-50 border-emerald-200 text-emerald-900"
                        />
                        <Shortcut
                            title="Configuraciones globales"
                            description="Productos, categorías y parámetros por sucursal."
                            href={route('admin.configuraciones')}
                            icon={faScrewdriverWrench}
                            tone="from-amber-50 to-orange-50 border-amber-200 text-amber-900"
                        />
                        <Shortcut
                            title="Catálogo y reglas"
                            description="Control del catálogo base que ve toda la red."
                            href={route('admin.configuraciones')}
                            icon={faDatabase}
                            tone="from-slate-50 to-slate-100 border-slate-200 text-slate-900"
                        />
                    </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                            <FontAwesomeIcon icon={faShieldHalved} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Resumen de control</h3>
                            <p className="text-sm text-slate-500">Lectura rápida para la toma de decisiones.</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-4 border rounded-2xl border-slate-200 bg-slate-50">
                            <span className="text-slate-700">Solicitudes por decidir</span>
                            <span className="font-semibold text-slate-900">{Number(resumen?.solicitudes_pendientes ?? 0).toLocaleString('es-MX')}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-2xl border-emerald-200 bg-emerald-50/70">
                            <span className="text-slate-700">Distribuidoras activas</span>
                            <span className="font-semibold text-emerald-800">{Number(resumen?.distribuidoras_activas ?? 0).toLocaleString('es-MX')}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-2xl border-teal-200 bg-teal-50/70">
                            <span className="text-slate-700">Vales activos</span>
                            <span className="font-semibold text-teal-800">{Number(resumen?.vales_activos ?? 0).toLocaleString('es-MX')}</span>
                        </div>
                        <div className="p-4 border rounded-2xl border-blue-200 bg-blue-50/70">
                            <p className="text-slate-500">Mensaje del sistema</p>
                            <p className="mt-1 font-semibold text-slate-900">Admin central: todo cambia aquí y se replica por sucursal.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
