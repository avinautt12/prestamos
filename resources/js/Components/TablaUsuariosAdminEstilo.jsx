import React from 'react';

export default function TablaUsuariosAdminEstilo({ usuarios = [] }) {
    return (
        <div className="overflow-x-auto border shadow-sm bg-white/95 border-slate-200 rounded-2xl mt-8">
            <table className="min-w-full text-sm">
                <thead className="text-slate-600 bg-slate-50">
                    <tr>
                        <th className="px-2 py-2 text-left">Usuario</th>
                        <th className="px-2 py-2 text-left">Nombre</th>
                        <th className="px-2 py-2 text-left">Rol</th>
                        <th className="px-2 py-2 text-left">Sucursal</th>
                        <th className="px-2 py-2 text-left">Estado</th>
                        <th className="px-2 py-2 text-left">Activación</th>
                        <th className="px-2 py-2 text-left">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.length === 0 && (
                        <tr>
                            <td className="px-3 py-8 text-center text-slate-500" colSpan={7}>
                                No hay usuarios para mostrar.
                            </td>
                        </tr>
                    )}
                    {usuarios.map((usuario) => {
                        const rolActual = usuario?.roles?.[0] || null;
                        const estadoActivacion = usuario?.activacion_estado || 'NO_REQUIERE';
                        const badgeActivacion = {
                            ACTIVADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
                            EXPIRADA: 'bg-rose-50 text-rose-700 border-rose-200',
                            NO_REQUIERE: 'bg-slate-50 text-slate-600 border-slate-200',
                        };
                        return (
                            <tr key={usuario.id} className="border-t border-slate-100">
                                <td className="px-2 py-2 font-medium text-slate-800">{usuario.nombre_usuario}</td>
                                <td className="px-2 py-2 text-slate-700">{usuario.persona?.primer_nombre} {usuario.persona?.apellido_paterno}</td>
                                <td className="px-2 py-2">
                                    <span className="inline-flex px-2 py-0.5 text-xs font-medium border rounded bg-slate-50 border-slate-200 text-slate-700">
                                        {rolActual?.nombre || 'Sin rol'}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    {rolActual?.codigo === 'ADMIN' ? (
                                        <span className="text-xs text-slate-500">Todas</span>
                                    ) : (
                                        <span className="text-xs text-slate-700">
                                            {usuario.sucursal_actual_nombre || 'Sin sucursal'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium border rounded ${usuario.activo
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium border rounded ${badgeActivacion[estadoActivacion] || badgeActivacion.NO_REQUIERE}`}>
                                        {estadoActivacion === 'ACTIVADA' ? 'Activada' : estadoActivacion === 'PENDIENTE' ? 'Pendiente' : estadoActivacion === 'EXPIRADA' ? 'Expirada' : 'No requerida'}
                                    </span>
                                    {usuario?.activacion_expira_en && estadoActivacion !== 'ACTIVADA' && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Vence: {new Date(usuario.activacion_expira_en).toLocaleString('es-MX')}
                                        </p>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        <button type="button" className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">Desactivar</button>
                                        {rolActual?.codigo === 'DISTRIBUIDORA' && (
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                            >
                                                Reenviar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                        >
                                            Rol
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
