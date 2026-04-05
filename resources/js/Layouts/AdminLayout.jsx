import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function AdminLayout({ children, title = 'Prestamo Fácil' }) {
    const { auth } = usePage().props;

    console.log("Datos de Auth:", auth.user);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [toasts, setToasts] = useState([]);

    const rolUsuario = auth?.user?.rol_nombre?.toUpperCase();

    const agregarToast = (titulo, mensaje) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, titulo, mensaje }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 6000);
    };

    useEffect(() => {
        const userId = auth?.user?.id;
        const sucursalId = auth?.sucursal_id;
        const rol = auth?.user?.rol_nombre;

        if (!userId || !sucursalId || !window.Echo) {
            return;
        }

        const sucursalChannel = window.Echo.private(`sucursal.${sucursalId}`);

        if (rolUsuario === 'GERENTE') {
            sucursalChannel.listen('.SolicitudListaParaAprobacion', (payload) => {
                agregarToast('Solicitud lista para aprobación', `${payload.cliente_nombre} (folio #${payload.solicitud_id})`);
            });
        }

        if (rolUsuario === 'GERENTE' || rolUsuario === 'CAJERA') {
            sucursalChannel.listen('.AlertaMorosidad', (payload) => {
                agregarToast('Alerta de morosidad', payload.cliente_nombre || 'Se detectó una cuenta morosa');
            });
        }

        return () => {
            window.Echo.leave(`sucursal.${sucursalId}`);
        };
    }, [auth?.user?.id, rolUsuario, auth?.sucursal_id]);

    const navigation = rolUsuario === 'GERENTE' ? [
        { name: 'Dashboard', href: route('gerente.dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Reportes', href: route('gerente.reportes'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { name: 'Sucursales', href: route('gerente.sucursales'), icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { name: 'Distribuidoras', href: route('gerente.distribuidoras'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
    ] : [
        { name: 'Dashboard', href: route('cajera.dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Cobros', href: route('cajera.cobros'), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Conciliaciones', href: route('cajera.conciliaciones'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { name: 'Pagos Distribuidora', href: route('cajera.pagos-distribuidora'), icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    {sidebarOpen && (
                        <ApplicationLogo className="block w-auto h-8 text-green-600 fill-current" />
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-3 py-2 transition-colors rounded hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {sidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <div className="flex items-center">
                        <div className="flex-1">
                            {sidebarOpen && (
                                <>
                                    <p className="text-sm font-semibold">
                                        {auth.user.persona?.primer_nombre} {auth.user.persona?.apellido_paterno}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{auth.user.rol_nombre}</p>
                                </>
                            )}
                        </div>
                        <Link href={route('logout')} method="post" as="button" className="text-red-600 hover:text-red-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                <div className="p-6">
                    {title && <h1 className="mb-6 text-2xl font-bold">{title}</h1>}
                    {children}
                </div>
            </main>

            <div className="fixed z-50 space-y-2 top-4 right-4">
                {toasts.map((toast) => (
                    <div key={toast.id} className="w-72 p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-800">{toast.titulo}</p>
                        <p className="mt-1 text-gray-600">{toast.mensaje}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}