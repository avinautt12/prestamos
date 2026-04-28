import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function SolicitudesPassword({ solicitudes, auth, securityPolicy = {} }) {
    const requiereVpn = securityPolicy?.requires_vpn ?? false;
    const [confirmacion, setConfirmacion] = useState({ isOpen: false, type: null, id: null });

    const openModal = (type, id = null) => {
        setConfirmacion({ isOpen: true, type, id });
    };

    const closeModal = () => {
        setConfirmacion({ isOpen: false, type: null, id: null });
    };

    const handleConfirm = () => {
        const { type, id } = confirmacion;
        
        if (type === 'aprobar_todas') {
            router.post(route(auth.user.rol_codigo === 'ADMIN' ? 'admin.solicitudes_password.aprobar_todas' : 'gerente.solicitudes_password.aprobar_todas'));
        } else if (type === 'aprobar') {
            router.post(route(auth.user.rol_codigo === 'ADMIN' ? 'admin.solicitudes_password.aprobar' : 'gerente.solicitudes_password.aprobar', id));
        } else if (type === 'rechazar') {
            router.post(route(auth.user.rol_codigo === 'ADMIN' ? 'admin.solicitudes_password.rechazar' : 'gerente.solicitudes_password.rechazar', id));
        }
        
        closeModal();
    };

    return (
        <AdminLayout title="Solicitudes de Restablecimiento de Contraseña">
            <Head title="Solicitudes de Contraseña" />

            <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="mb-4">
                    <p className="text-sm text-slate-600">
                        Aquí aparecen las peticiones de los usuarios para restablecer su contraseña. Revisa quién lo solicita y aprueba para enviarle el acceso seguro temporal a su correo.
                    </p>
                </div>

                {requiereVpn && (
                    <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fin-fade-in">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-800">Capa de seguridad administrativa activa</h4>
                            <p className="text-xs text-red-600 mt-0.5">
                                La autorización de restablecimiento de contraseñas es una acción crítica y requiere conexión a la VPN WireGuard.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mb-4">
                    {solicitudes.data.some((sol) => sol.estado === 'PENDIENTE') && (
                        <PrimaryButton 
                            onClick={() => openModal('aprobar_todas')}
                            disabled={requiereVpn}
                            className={`bg-emerald-600 hover:bg-emerald-700 ${requiereVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={requiereVpn ? "Requiere conexión VPN WireGuard" : "Aprobar todas las solicitudes"}
                        >
                            Aprobar Todas las Pendientes
                        </PrimaryButton>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                                <th className="p-3">Usuario Solicitante</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3">Fecha de Solicitud</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Vigencia</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-200">
                            {solicitudes.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-6 text-center text-slate-500">No hay solicitudes recientes.</td>
                                </tr>
                            ) : (
                                solicitudes.data.map((sol) => (
                                    <tr key={sol.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-800">
                                            {sol.usuario}
                                            <div className="text-xs font-normal text-slate-500">{sol.nombre_usuario}</div>
                                        </td>
                                        <td className="p-3 text-slate-600 capitalize">{sol.rol_usuario}</td>
                                        <td className="p-3 text-slate-600">{sol.creada_en}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                sol.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                                                sol.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-800' :
                                                sol.estado === 'EXPIRADA' ? 'bg-slate-200 text-slate-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {sol.estado}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-600 text-xs">
                                            {sol.estado === 'APROBADA' && sol.expira_en ? (
                                                <>Vence: <br/>{sol.expira_en}</>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3">
                                            {sol.estado === 'PENDIENTE' && (
                                                <div className="flex space-x-2">
                                                    <PrimaryButton 
                                                        onClick={() => openModal('aprobar', sol.id)} 
                                                        disabled={requiereVpn}
                                                        className={`!px-3 !py-1 text-xs bg-emerald-600 hover:bg-emerald-700 ${requiereVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={requiereVpn ? "Requiere conexión VPN WireGuard" : "Aprobar solicitud"}
                                                    >
                                                        Aprobar
                                                    </PrimaryButton>
                                                    <DangerButton 
                                                        onClick={() => openModal('rechazar', sol.id)} 
                                                        disabled={requiereVpn}
                                                        className={`!px-3 !py-1 text-xs ${requiereVpn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={requiereVpn ? "Requiere conexión VPN WireGuard" : "Rechazar solicitud"}
                                                    >
                                                        Rechazar
                                                    </DangerButton>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={confirmacion.isOpen} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {confirmacion.type === 'aprobar' && 'Autorizar Reseteo de Contraseña'}
                        {confirmacion.type === 'aprobar_todas' && 'Autorizar Todas las Solicitudes'}
                        {confirmacion.type === 'rechazar' && 'Rechazar Solicitud'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        {confirmacion.type === 'aprobar' && '¿Estás seguro de autorizar el reseteo de contraseña para este usuario? Se enviará un correo electrónico con un código de acceso de 10 minutos inmediatamente.'}
                        {confirmacion.type === 'aprobar_todas' && '¿Estás completamente seguro de autorizar TODAS las solicitudes pendientes en lote? Esto enviará correos de recuperación a todos estos múltiples usuarios a la vez.'}
                        {confirmacion.type === 'rechazar' && '¿Estás seguro de querer rechazar esta solicitud de restablecimiento? El usuario no recibirá el enlace.'}
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Cancelar</SecondaryButton>

                        <PrimaryButton 
                            className={`ms-3 ${confirmacion.type !== 'rechazar' ? 'bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 active:bg-emerald-900' : 'bg-red-600 hover:bg-red-700 focus:bg-red-700 active:bg-red-900'}`} 
                            onClick={handleConfirm}
                        >
                            {confirmacion.type === 'rechazar' ? 'Sí, Rechazar' : 'Sí, Autorizar'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
