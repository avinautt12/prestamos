import React from 'react';
import TabletLayout from '@/Layouts/TabletLayout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faUser,
    faHouse,
    faUsers,
    faCarSide,
    faBriefcase,
    faClipboard,
    faCheckCircle,
    faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';

export default function Show({ distribuidora }) {
    const dist = distribuidora || {};
    const persona = dist.persona || {};

    const estadoColor = {
        ACTIVA: { bg: 'bg-green-100', text: 'text-green-800' },
        MOROSA: { bg: 'bg-red-100', text: 'text-red-800' },
        BLOQUEADA: { bg: 'bg-amber-100', text: 'text-amber-800' },
        INACTIVA: { bg: 'bg-gray-100', text: 'text-gray-700' },
        CANDIDATA: { bg: 'bg-blue-100', text: 'text-blue-800' },
        POSIBLE: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
        CERRADA: { bg: 'bg-slate-100', text: 'text-slate-700' },
    };

    const colores = estadoColor[dist.estado] || estadoColor.INACTIVA;

    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    };

    const formatBirthDate = (date) => {
        if (!date) return 'No disponible';

        const datePart = String(date).slice(0, 10);
        const [year, month, day] = datePart.split('-').map(Number);

        if (year && month && day) {
            return format(new Date(year, month - 1, day), "dd 'de' MMMM 'de' yyyy", { locale: es });
        }

        return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
    };

    return (
        <TabletLayout title={`Distribuidora #${dist.id}`}>
            <Head title={`Distribuidora - ${persona.primer_nombre || ''} ${persona.apellido_paterno || ''}`} />

            <div className="mb-4">
                <Link href={route('coordinador.mis-distribuidoras')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Volver a mis distribuidoras
                </Link>
            </div>

            <div className="mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${colores.bg} ${colores.text}`}>
                    {dist.estado}
                </span>
            </div>

            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                    Datos Personales
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                        <span className="text-gray-500">Nombre completo:</span>
                        <p className="font-medium">
                            {persona.primer_nombre} {persona.segundo_nombre} {persona.apellido_paterno} {persona.apellido_materno}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Sexo:</span>
                        <p className="font-medium">{persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : 'Otro'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fecha de nacimiento:</span>
                        <p className="font-medium">{formatBirthDate(persona.fecha_nacimiento)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">CURP:</span>
                        <p className="font-mono text-sm">{persona.curp || 'No registrado'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">RFC:</span>
                        <p className="font-mono text-sm">{persona.rfc || 'No registrado'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Teléfono fijo:</span>
                        <p className="font-medium">{persona.telefono_personal || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Teléfono celular:</span>
                        <p className="font-medium">{persona.telefono_celular || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faHouse} className="text-gray-700" />
                    Domicilio
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                        <span className="text-gray-500">Dirección:</span>
                        <p className="font-medium">
                            {persona.calle} {persona.numero_exterior}
                            {persona.numero_interior && ` Int. ${persona.numero_interior}`}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Colonia:</span>
                        <p>{persona.colonia}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Código Postal:</span>
                        <p>{persona.codigo_postal}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Ciudad:</span>
                        <p>{persona.ciudad}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Estado:</span>
                        <p>{persona.estado}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 mb-4 bg-white rounded-lg shadow">
                <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                    <FontAwesomeIcon icon={faClipboard} className="text-gray-700" />
                    Información de Distribuidora
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-500">No. Distribuidora:</span>
                        <p className="font-medium">{dist.numero_distribuidora || 'Sin asignar'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Categoría:</span>
                        <p className="font-medium">{dist.categoria?.nombre || 'Sin categoría'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Límite de crédito:</span>
                        <p className="font-medium text-blue-700">${Number(dist.limite_credito || 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Crédito disponible:</span>
                        <p className="font-medium text-green-700">${Number(dist.credito_disponible || 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Puntos actuales:</span>
                        <p className="font-medium">{Number(dist.puntos_actuales || 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Puede emitir vales:</span>
                        <p className="font-medium">{dist.puede_emitir_vales ? 'Sí' : 'No'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fecha activación:</span>
                        <p>{formatDate(dist.activada_en)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fecha creación:</span>
                        <p>{formatDate(dist.creado_en)}</p>
                    </div>
                </div>
            </div>

            {dist.cuentaBancaria && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow">
                    <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-gray-700" />
                        Cuenta Bancaria
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500">Banco:</span>
                            <p className="font-medium">{dist.cuentaBancaria?.banco || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">CLABE:</span>
                            <p className="font-mono text-sm">{dist.cuentaBancaria?.clave_clabe || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Número de tarjeta:</span>
                            <p className="font-mono text-sm">{dist.cuentaBancaria?.numero_tarjeta || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Titular:</span>
                            <p className="font-medium">{dist.cuentaBancaria?.nombre_titular || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
        </TabletLayout>
    );
}