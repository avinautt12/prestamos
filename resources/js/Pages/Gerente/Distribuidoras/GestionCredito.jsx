import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TablaUsuariosAdminEstilo from '@/Components/TablaUsuariosAdminEstilo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faPlus,
    faMinus,
    faClock,
    faCheck,
    faXmark,
    faChartLine,
    faEdit,
    faLayerGroup,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

export default function GestionCredito({ distribuidoras, filters, configuracion, categorias = [], securityPolicy = {} }) {
    const { flash = {} } = usePage().props;
    const requiresVpn = securityPolicy?.requires_vpn ?? false;
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ limite_credito: '', justificacion: '' });
    const [errors, setErrors] = useState({});
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [selectedCategoriaDist, setSelectedCategoriaDist] = useState(null);
    const [categoriaForm, setCategoriaForm] = useState({ categoria_id: '', motivo: '' });
    const [categoriaErrors, setCategoriaErrors] = useState({});

    const runFilter = (next = {}) => {
        router.get(route('gerente.credito.index'), {
            search: next.search ?? filters.search ?? '',
            estado: next.estado ?? filters.estado ?? '',
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e) => runFilter({ search: e.target.value });
    const handleEstado = (e) => runFilter({ estado: e.target.value });

    const openModal = (distribuidora) => {
        setSelectedId(distribuidora.id);
        setForm({ limite_credito: String(distribuidora.limite_credito), justificacion: '' });
        setErrors({});
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route('gerente.credito.update', selectedId), {
            limite_credito: form.limite_credito,
            justificacion: form.justificacion,
        }, {
            onError: (errs) => setErrors(errs),
            onSuccess: () => {
                setShowModal(false);
                setSelectedId(null);
            },
        });
    };

    const openCategoriaModal = (distribuidora) => {
        setSelectedCategoriaDist(distribuidora);
        setCategoriaForm({
            categoria_id: String(distribuidora.categoria_id || ''),
            motivo: '',
        });
        setCategoriaErrors({});
        setShowCategoriaModal(true);
    };

    const handleSubmitCategoria = (e) => {
        e.preventDefault();
        router.put(route('gerente.distribuidoras.categoria.update', selectedCategoriaDist.id), {
            categoria_id: categoriaForm.categoria_id,
            motivo: categoriaForm.motivo,
        }, {
            onError: (errs) => setCategoriaErrors(errs),
            onSuccess: () => {
                setShowCategoriaModal(false);
                setSelectedCategoriaDist(null);
            },
        });
    };

    return (
        <AdminLayout title="Gestión de Crédito">
            <Head title="Gestión de Crédito" />

            <div className="mb-4 fin-card">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="fin-title">Gestión de Crédito</h2>
                        <p className="mt-1 fin-subtitle">
                            Administra el límite de crédito de tus distribuidoras activas.
                        </p>
                    </div>
                    <Link
                        href={route('gerente.credito.sugerencias')}
                        className="flex items-center gap-2 fin-btn-secondary"
                    >
                        <FontAwesomeIcon icon={faChartLine} />
                        Sugerencias
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Buscar</label>
                        <input
                            type="text"
                            defaultValue={filters.search || ''}
                            onChange={handleSearch}
                            placeholder="Nombre o número de distribuidora"
                            className="mt-1 fin-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                            value={filters.estado || ''}
                            onChange={handleEstado}
                            className="mt-1 fin-input"
                        >
                            <option value="">Todos</option>
                            <option value="ACTIVA">Activa</option>
                            <option value="MOROSA">Morosa</option>
</select>
                    </div>
                </div>

                {requiresVpn && (
                    <div className="p-3 mt-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                        <p>
                            <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
                            <strong>VPN requerida:</strong> Los cambios de límite de crédito y categoría están bloqueados. Conéctate a la VPN WireGuard para continuar.
                        </p>
                    </div>
                )}

                {configuracion?.umbral_incremento_auto && (
                    <div className="p-3 mt-4 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                        <p>
                            <strong>Umbral automático:</strong> ${Number(configuracion.umbral_incremento_auto).toLocaleString('es-MX')}
                        </p>
                        <p className="mt-1">
                            Incrementos menores a este monto pueden aplicarse automáticamente.
                        </p>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto border shadow-sm bg-white/95 border-slate-200 rounded-2xl">
                <table className="min-w-full text-sm">
                    <thead className="text-slate-600 bg-slate-50">
                        <tr>
                            <th className="px-2 py-2 text-left">Distribuidora</th>
                            <th className="px-2 py-2 text-left">Categoría</th>
                            <th className="px-2 py-2 text-left">Estado</th>
                            <th className="px-2 py-2 text-left">Límite Crédito</th>
                            <th className="px-2 py-2 text-left">Disponible</th>
                            <th className="px-2 py-2 text-left">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {distribuidoras.data.length === 0 && (
                            <tr>
                                <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                                    No hay distribuidoras activas para gestionar crédito.
                                </td>
                            </tr>
                        )}
                        {distribuidoras.data.map((dist) => (
                            <tr key={dist.id} className="border-t border-slate-100">
                                <td className="px-2 py-2 font-medium text-slate-800">
                                    <div>{dist.persona?.primer_nombre} {dist.persona?.apellido_paterno} {dist.persona?.apellido_materno}</div>
                                    <div className="text-xs text-gray-500">{dist.numero_distribuidora}</div>
                                </td>
                                <td className="px-2 py-2">
                                    <span className="inline-flex px-2 py-0.5 text-xs font-medium border rounded bg-slate-50 border-slate-200 text-slate-700">
                                        {dist.categoria?.nombre || 'Sin categoría'}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium border rounded ${dist.estado === 'ACTIVA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        {dist.estado}
                                    </span>
                                </td>
                                <td className="px-2 py-2 font-medium">
                                    ${Number(dist.limite_credito).toLocaleString('es-MX')}
                                </td>
                                <td className={`px-2 py-2 ${dist.credito_disponible < dist.limite_credito * 0.2 ? 'text-red-600 font-medium' : ''}`}>
                                    ${Number(dist.credito_disponible).toLocaleString('es-MX')}
                                </td>
                                <td className="px-2 py-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openModal(dist)}
                                            disabled={requiresVpn}
                                            className={`px-2 py-1 text-xs border rounded bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 ${requiresVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={requiresVpn ? "Requiere conexión VPN WireGuard" : "Modificar límite de crédito"}
                                        >
                                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                                            Crédito
                                        </button>
                                        <button
                                            onClick={() => openCategoriaModal(dist)}
                                            disabled={requiresVpn}
                                            className={`px-2 py-1 text-xs border rounded bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 ${requiresVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={requiresVpn ? "Requiere conexión VPN WireGuard" : "Cambiar categoría (aumento/bajada)"}
                                        >
                                            <FontAwesomeIcon icon={faLayerGroup} className="mr-1" />
                                            Categoría
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>



            {distribuidoras.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                    <p className="text-sm text-slate-600">
                        Mostrando {distribuidoras.from || 0} a {distribuidoras.to || 0} de {distribuidoras.total || 0} distribuidoras
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="fin-btn-secondary"
                            onClick={() => distribuidoras.prev_page_url && router.get(distribuidoras.prev_page_url)}
                            disabled={!distribuidoras.prev_page_url}
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 text-sm border rounded-lg border-slate-200 text-slate-700">
                            Página {distribuidoras.current_page || 1} de {distribuidoras.last_page || 1}
                        </span>
                        <button
                            type="button"
                            className="fin-btn-secondary"
                            onClick={() => distribuidoras.next_page_url && router.get(distribuidoras.next_page_url)}
                            disabled={!distribuidoras.next_page_url}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {showCategoriaModal && selectedCategoriaDist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
                        <h3 className="mb-1 text-lg font-semibold">Cambiar Categoría</h3>
                        <p className="mb-4 text-sm text-slate-600">
                            {selectedCategoriaDist.persona?.primer_nombre} {selectedCategoriaDist.persona?.apellido_paterno} — <span className="text-slate-500">Actual:</span> <strong>{selectedCategoriaDist.categoria?.nombre || 'Sin categoría'}</strong>
                        </p>

                        <form onSubmit={handleSubmitCategoria}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nueva categoría <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={categoriaForm.categoria_id}
                                    onChange={(e) => setCategoriaForm({ ...categoriaForm, categoria_id: e.target.value })}
                                    className="mt-1 fin-input"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nombre} ({cat.porcentaje_comision}% comisión)
                                        </option>
                                    ))}
                                </select>
                                {categoriaErrors.categoria_id && (
                                    <p className="mt-1 text-xs text-red-600">{categoriaErrors.categoria_id}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Motivo del cambio <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    value={categoriaForm.motivo}
                                    onChange={(e) => setCategoriaForm({ ...categoriaForm, motivo: e.target.value })}
                                    placeholder="Explica el aumento o bajada de categoría (mínimo 10 caracteres)..."
                                    className="mt-1 fin-input"
                                    rows={3}
                                />
                                {categoriaErrors.motivo && (
                                    <p className="mt-1 text-xs text-red-600">{categoriaErrors.motivo}</p>
                                )}
                            </div>

                            {categoriaErrors.security && (
                                <p className="mb-2 text-xs text-red-600">{categoriaErrors.security}</p>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoriaModal(false)}
                                    className="fin-btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="fin-btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">Modificar Límite de Crédito</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nuevo límite de crédito
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.limite_credito}
                                    onChange={(e) => setForm({ ...form, limite_credito: e.target.value })}
                                    className="mt-1 fin-input"
                                />
                                {errors.limite_credito && (
                                    <p className="mt-1 text-xs text-red-600">{errors.limite_credito}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Justificación <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    value={form.justificacion}
                                    onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
                                    placeholder="Razón del cambio de crédito..."
                                    className="mt-1 fin-input"
                                    rows={3}
                                />
                                {errors.justificacion && (
                                    <p className="mt-1 text-xs text-red-600">{errors.justificacion}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="fin-btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="fin-btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}