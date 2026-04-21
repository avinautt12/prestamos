import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Usuarios({ usuarios = { data: [] }, filtros = {}, roles = [], sucursales = [] }) {
    const { flash = {}, errors = {} } = usePage().props;

    const form = useForm({
        nombre_usuario: '',
        password: '',
        primer_nombre: '',
        apellido_paterno: '',
        correo_electronico: '',
        rol_id: '',
        sucursal_id: '',
        activo: true,
    });

    const [filtroQ, setFiltroQ] = React.useState(filtros?.q || '');
    const [filtroRolId, setFiltroRolId] = React.useState(filtros?.rol_id ? String(filtros.rol_id) : '');
    const [filtroEstado, setFiltroEstado] = React.useState(filtros?.estado || 'TODOS');
    const [filtroPerPage, setFiltroPerPage] = React.useState(String(filtros?.per_page || 10));

    const crearUsuario = (event) => {
        event.preventDefault();

        form.post(route('admin.usuarios.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    };

    const cambiarRol = () => {
        if (!rolCambio.usuarioId || !rolCambio.rolId) return;
        const role = roles.find((r) => String(r.id) === String(rolCambio.rolId));
        const sucursalId = role?.codigo === 'ADMIN' ? null : (rolCambio.sucursalId || null);
        router.put(route('admin.usuarios.rol.update', rolCambio.usuarioId), {
            rol_id: rolCambio.rolId,
            sucursal_id: sucursalId,
        }, { preserveScroll: true });
        setRolCambio({ usuarioId: null, rolId: '', sucursalId: '' });
    };

    const iniciarCambioRol = (usuarioId, rolActualId, sucursalActualId) => {
        setRolCambio({ usuarioId, rolId: rolActualId || '', sucursalId: sucursalActualId || '' });
    };

    const cancelarCambioRol = () => {
        setRolCambio({ usuarioId: null, rolId: '', sucursalId: '' });
    };

    const cambiarEstado = (usuarioId, activo) => {
        router.patch(route('admin.usuarios.estado.update', usuarioId), { activo: !activo }, { preserveScroll: true });
    };

    const reenviarActivacion = (usuarioId) => {
        router.post(route('admin.usuarios.reenviar-activacion', usuarioId), {}, { preserveScroll: true });
    };

    const aplicarFiltros = (event) => {
        event.preventDefault();
        router.get(route('admin.usuarios.index'), {
            q: filtroQ || undefined,
            rol_id: filtroRolId || undefined,
            estado: filtroEstado,
            per_page: Number(filtroPerPage) || 10,
        }, {
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiarFiltros = () => {
        setFiltroQ('');
        setFiltroRolId('');
        setFiltroEstado('TODOS');
        setFiltroPerPage('10');

        router.get(route('admin.usuarios.index'), {
            estado: 'TODOS',
            per_page: 10,
        }, {
            preserveScroll: true,
            replace: true,
        });
    };

    const irAPagina = (page) => {
        if (!page) return;
        router.get(route('admin.usuarios.index'), {
            q: filtroQ || undefined,
            rol_id: filtroRolId || undefined,
            estado: filtroEstado,
            per_page: Number(filtroPerPage) || 10,
            page,
        }, {
            preserveScroll: true,
            replace: true,
        });
    };

    const [rolCambio, setRolCambio] = React.useState({ usuarioId: null, rolId: '', sucursalId: '' });

    const rolSeleccionado = roles.find((rol) => String(rol.id) === String(form.data.rol_id));
    const requiereSucursal = rolSeleccionado && rolSeleccionado.codigo !== 'ADMIN';

    return (
        <AdminLayout title="Usuarios y Roles">
            <Head title="Usuarios y Roles" />

            {flash?.success && (
                <div className="p-3 mb-4 text-sm border rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800">
                    {flash.success}
                </div>
            )}

            {flash?.message && (
                <div className="p-3 mb-4 text-sm text-blue-800 border border-blue-200 rounded-xl bg-blue-50">
                    {flash.message}
                </div>
            )}

            {flash?.activation_link && (
                <div className="p-3 mb-4 text-sm border rounded-xl border-slate-200 bg-slate-50">
                    <p className="font-semibold text-slate-700">Enlace de activacion</p>
                    {flash?.activation_expires_at && (
                        <p className="mt-1 text-xs text-slate-500">
                            Expira el {new Date(flash.activation_expires_at).toLocaleString('es-MX')}
                        </p>
                    )}
                    <div className="flex flex-col gap-2 mt-2 md:flex-row md:items-center">
                        <a href={flash.activation_link} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
                            {flash.activation_link}
                        </a>
                        <button
                            type="button"
                            className="fin-btn-secondary"
                            onClick={async () => {
                                if (navigator?.clipboard) {
                                    await navigator.clipboard.writeText(flash.activation_link);
                                }
                            }}
                        >
                            Copiar enlace
                        </button>
                    </div>
                </div>
            )}

            {(errors?.general || Object.keys(form.errors || {}).length > 0) && (
                <div className="p-3 mb-4 text-sm border rounded-xl border-rose-200 bg-rose-50 text-rose-800">
                    {errors?.general || 'Revisa los datos del formulario para continuar.'}
                </div>
            )}

            <form onSubmit={crearUsuario} className="p-5 mb-5 space-y-4 border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
                <div className="pb-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Crear usuario</h2>
                    <p className="mt-1 text-sm text-slate-500">Alta rápida con credenciales sugeridas automáticamente.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input label="Nombre" value={form.data.primer_nombre} onChange={(v) => form.setData('primer_nombre', v)} />
                    <Input label="Apellido" value={form.data.apellido_paterno} onChange={(v) => form.setData('apellido_paterno', v)} />
                    <Input label="Correo" type="email" value={form.data.correo_electronico} onChange={(v) => form.setData('correo_electronico', v)} />

                    <div>
                        <label className="block mb-1 text-sm text-slate-700">Rol</label>
                        <select className="w-full border rounded-lg border-slate-300" value={form.data.rol_id} onChange={(e) => form.setData('rol_id', e.target.value)}>
                            <option value="">Selecciona un rol</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm text-slate-700">Sucursal</label>
                        <select
                            className="w-full border rounded-lg border-slate-300"
                            value={form.data.sucursal_id}
                            onChange={(e) => form.setData('sucursal_id', e.target.value)}
                            disabled={!requiereSucursal}
                        >
                            <option value="">{requiereSucursal ? 'Selecciona sucursal' : 'No aplica para Admin'}</option>
                            {sucursales.map((sucursal) => (
                                <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 mt-4 border md:grid-cols-2 rounded-xl border-slate-200 bg-slate-50">
                    <div className="pb-2 md:col-span-2">
                        <p className="text-sm font-semibold text-slate-700">Credenciales de acceso</p>
                    </div>
                    <Input
                        label="Nombre de Usuario"
                        value={form.data.nombre_usuario}
                        onChange={(v) => form.setData('nombre_usuario', v)}
                    />
                    <Input
                        label="Contraseña Temporal"
                        type="password"
                        value={form.data.password}
                        onChange={(v) => form.setData('password', v)}
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">Nota: Admin no requiere sucursal fija.</p>
                    <button type="submit" className="fin-btn-primary" disabled={form.processing}>
                        {form.processing ? 'Guardando...' : 'Crear usuario'}
                    </button>
                </div>
            </form>

            <form onSubmit={aplicarFiltros} className="p-4 mb-4 border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Input label="Buscar" value={filtroQ} onChange={setFiltroQ} />
                    <div>
                        <label className="block mb-1 text-sm text-slate-700">Rol</label>
                        <select className="w-full border rounded-lg border-slate-300" value={filtroRolId} onChange={(e) => setFiltroRolId(e.target.value)}>
                            <option value="">Todos</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm text-slate-700">Estado</label>
                        <select className="w-full border rounded-lg border-slate-300" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                            <option value="TODOS">Todos</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm text-slate-700">Por página</label>
                        <select className="w-full border rounded-lg border-slate-300" value={filtroPerPage} onChange={(e) => setFiltroPerPage(e.target.value)}>
                            {[10, 20, 50].map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <button type="submit" className="fin-btn-primary">Aplicar filtros</button>
                    <button type="button" className="fin-btn-secondary" onClick={limpiarFiltros}>Limpiar</button>
                </div>
            </form>

            <div className="overflow-x-auto border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
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
                        {(usuarios?.data || []).map((usuario) => {
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
                                            <button type="button" className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" onClick={() => cambiarEstado(usuario.id, usuario.activo)}>
                                                {usuario.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                            {rolActual?.codigo === 'DISTRIBUIDORA' && (
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                    onClick={() => reenviarActivacion(usuario.id)}
                                                >
                                                    {estadoActivacion === 'EXPIRADA' ? 'Regen.' : 'Reenviar'}
                                                </button>
                                            )}
                                            {rolCambio.usuarioId === usuario.id ? (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <select
                                                        className="px-2 py-1 text-xs border rounded border-slate-300 w-28"
                                                        value={rolCambio.rolId}
                                                        onChange={(e) => setRolCambio(prev => ({ ...prev, rolId: e.target.value }))}
                                                    >
                                                        <option value="">Rol</option>
                                                        {roles.map((rol) => (
                                                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                                        ))}
                                                    </select>
                                                    {(() => {
                                                        const nuevoRol = roles.find(r => String(r.id) === String(rolCambio.rolId));
                                                        const requiereSuc = nuevoRol && nuevoRol.codigo !== 'ADMIN';
                                                        const tieneSucursalActual = rolCambio.sucursalId;
                                                        return requiereSuc ? (
                                                            <select
                                                                className="px-2 py-1 text-xs border rounded border-slate-300 w-36"
                                                                value={rolCambio.sucursalId}
                                                                onChange={(e) => setRolCambio(prev => ({ ...prev, sucursalId: e.target.value }))}
                                                            >
                                                                {!tieneSucursalActual && <option value="">Sucursal</option>}
                                                                {sucursales.map((s) => (
                                                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                                                ))}
                                                            </select>
                                                        ) : null;
                                                    })()}
                                                    <button type="button" className="px-2 py-1 text-xs text-white rounded bg-emerald-600 hover:bg-emerald-700" onClick={cambiarRol}>OK</button>
                                                    <button type="button" className="px-2 py-1 text-xs rounded bg-slate-200 text-slate-700 hover:bg-slate-300" onClick={cancelarCambioRol}>X</button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                    onClick={() => iniciarCambioRol(usuario.id, rolActual?.id, usuario.sucursal_actual_id)}
                                                >
                                                    Rol
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {(usuarios?.data || []).length === 0 && (
                            <tr>
                                <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                                    No hay usuarios para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="text-sm text-slate-600">
                    Mostrando {usuarios?.from || 0} a {usuarios?.to || 0} de {usuarios?.total || 0} usuarios
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="fin-btn-secondary"
                        onClick={() => irAPagina((usuarios?.current_page || 1) - 1)}
                        disabled={!usuarios?.prev_page_url}
                    >
                        Anterior
                    </button>
                    <span className="px-3 py-1 text-sm border rounded-lg border-slate-200 text-slate-700">
                        Página {usuarios?.current_page || 1} de {usuarios?.last_page || 1}
                    </span>
                    <button
                        type="button"
                        className="fin-btn-secondary"
                        onClick={() => irAPagina((usuarios?.current_page || 1) + 1)}
                        disabled={!usuarios?.next_page_url}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}

function Input({ label, value, onChange, type = 'text', readOnly = false }) {
    return (
        <div>
            <label className="block mb-1 text-sm text-slate-700">{label}</label>
            <input
                type={type}
                className={`w-full border rounded-lg border-slate-300 ${readOnly ? 'bg-slate-100 text-slate-700' : ''}`}
                value={value}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
