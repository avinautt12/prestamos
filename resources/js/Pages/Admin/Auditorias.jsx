import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Auditorias({ auditorias, filtros, opciones }) {
    const page = usePage();
    const auth = page.props.auth;

    const [filtrosLocal, setFiltrosLocal] = useState(filtros);

    const aplicarFiltros = () => {
        const params = new URLSearchParams();
        if (filtrosLocal.tipo !== 'todos') params.set('tipo', filtrosLocal.tipo);
        if (filtrosLocal.nivel !== 'todos') params.set('nivel', filtrosLocal.nivel);
        if (filtrosLocal.modulo !== 'todos') params.set('modulo', filtrosLocal.modulo);
        if (filtrosLocal.busqueda) params.set('busqueda', filtrosLocal.busqueda);
        if (filtrosLocal.fecha_inicio) params.set('fecha_inicio', filtrosLocal.fecha_inicio);
        if (filtrosLocal.fecha_fin) params.set('fecha_fin', filtrosLocal.fecha_fin);

        const query = params.toString();
        router.get(route('admin.auditorias') + (query ? `?${query}` : ''));
    };

    const cambiarPagina = (url) => {
        if (url) router.get(url);
    };

    const limpiarFiltros = () => {
        setFiltrosLocal({
            tipo: 'todos',
            nivel: 'todos',
            modulo: 'todos',
            busqueda: '',
            fecha_inicio: '',
            fecha_fin: '',
        });
        window.location.href = route('admin.auditorias');
    };

    const getNivelClase = (nivel) => {
        const classes = {
            'INFO': 'bg-blue-100 text-blue-800',
            'WARNING': 'bg-yellow-100 text-yellow-800',
            'ERROR': 'bg-red-100 text-red-800',
            'CRITICO': 'bg-red-600 text-white',
        };
        return classes[nivel] || 'bg-gray-100 text-gray-800';
    };

    const getNivelLabel = (nivel) => {
        const labels = {
            'INFO': 'Información',
            'WARNING': 'Advertencia',
            'ERROR': 'Error',
            'CRITICO': 'Crítico',
        };
        return labels[nivel] || nivel;
    };

    const getTipoLabel = (tipo) => {
        const labels = {
            'LOGIN': 'Inicio de sesión',
            'LOGOUT': 'Cierre de sesión',
            'CREAR': 'Crear',
            'ACTUALIZAR': 'Actualizar',
            'ELIMINAR': 'Eliminar',
            'APROBAR': 'Aprobar',
            'RECHAZAR': 'Rechazar',
            'ERROR_SISTEMA': 'Error del sistema',
            'CAMBIO_CONFIG': 'Cambio de configuración',
            'CIERRE_CORTE': 'Cierre de corte',
        };
        return labels[tipo] || tipo;
    };

    return (
        <>
            <Head title="Auditorías" />
            <AdminLayout title="Auditorías">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    value={filtrosLocal.tipo}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, tipo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="todos">Todos</option>
                                    {opciones.tipos.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nivel</label>
                                <select
                                    value={filtrosLocal.nivel}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, nivel: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="todos">Todos</option>
                                    {opciones.niveles.map((n) => (
                                        <option key={n.value} value={n.value}>{n.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Módulo</label>
                                <select
                                    value={filtrosLocal.modulo}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, modulo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="todos">Todos</option>
                                    {opciones.modulos.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Búsqueda</label>
                                <input
                                    type="text"
                                    value={filtrosLocal.busqueda}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, busqueda: e.target.value })}
                                    placeholder="Buscar..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={filtrosLocal.fecha_inicio}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, fecha_inicio: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={filtrosLocal.fecha_fin}
                                    onChange={(e) => setFiltrosLocal({ ...filtrosLocal, fecha_fin: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={aplicarFiltros}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Aplicar Filtros
                            </button>
                            <button
                                onClick={limpiarFiltros}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nivel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Módulo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {auditorias.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                No hay registros de auditoría
                                            </td>
                                        </tr>
                                    ) : (
                                        auditorias.data.map((audit) => (
                                            <tr key={audit.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                    {new Date(audit.creado_en).toLocaleString('es-MX')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNivelClase(audit.nivel)}`}>
                                                        {getNivelLabel(audit.nivel)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {getTipoLabel(audit.tipo_evento)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {audit.modulo}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    <div>{audit.usuario_nombre}</div>
                                                    <div className="text-xs text-slate-400">{audit.usuario_rol}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700 max-w-md">
                                                    {audit.descripcion}
                                                    {audit.datos_extra && Object.keys(audit.datos_extra).length > 0 && (
                                                        <details className="mt-1">
                                                            <summary className="cursor-pointer text-xs text-emerald-600">
                                                                Ver datos adicionales
                                                            </summary>
                                                            <pre className="mt-1 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                                                                {JSON.stringify(audit.datos_extra, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {auditorias.last_page > 1 && (
                            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">Mostrando {auditorias.from} - {auditorias.to} de {auditorias.total}</span>
                                        <select
                                            value={auditorias.per_page || 10}
                                            onChange={(e) => {
                                                const params = new URLSearchParams(window.location.search);
                                                params.set('per_page', e.target.value);
                                                router.get(`${window.location.pathname}?${params.toString()}`);
                                            }}
                                            className="ml-2 px-2 py-1 text-sm border border-slate-300 rounded"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
<div className="flex gap-1">
                                        {auditorias.links.map((link, idx) => {
                                            let texto = link.label || '';
                                            const label = texto.toLowerCase();
                                            
                                            if (label.includes('next') || label.includes('siguiente') || label.includes('&raquo;')) {
                                                texto = 'Siguiente';
                                            } else if (label.includes('previous') || label.includes('anterior') || label.includes('&laquo;')) {
                                                texto = 'Anterior';
                                            } else if (!/^\d+$/.test(link.label || '')) {
                                                return null;
                                            }
                                            
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => cambiarPagina(link.url)}
                                                    disabled={!link.url}
                                                    className={`px-3 py-1 rounded text-sm ${link.active
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {texto}
                                                </button>
                                            );
                                        }).filter(Boolean)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}