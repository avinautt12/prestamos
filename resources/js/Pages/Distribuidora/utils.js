export function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

export function formatNumber(value) {
    return new Intl.NumberFormat('es-MX').format(Number(value || 0));
}

export function formatDate(value, withTime = false) {
    if (!value) {
        return 'Sin fecha';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', withTime
        ? {
            dateStyle: 'medium',
            timeStyle: 'short',
        }
        : {
            dateStyle: 'medium',
        }).format(date);
}

export function statusBadgeClass(status) {
    const normalized = (status || '').toUpperCase();

    if (['ACTIVA', 'ACTIVO', 'PAGADA', 'PAGADO', 'CONCILIADO', 'CONCILIADA', 'VERIFICADA', 'GANADO_PUNTUAL', 'GANADO_ANTICIPADO', 'HABILITADA'].includes(normalized)) {
        return 'fin-badge fin-badge-approved';
    }

    if (['GENERADA', 'PARCIAL', 'PAGO_PARCIAL', 'REPORTADO', 'DETECTADO', 'RECLAMADO', 'PENDIENTE'].includes(normalized)) {
        return 'fin-badge fin-badge-pending';
    }

    return 'fin-badge fin-badge-rejected';
}

export function fullName(first, second, last, mother) {
    return [first, second, last, mother].filter(Boolean).join(' ').trim();
}

export function signedPoints(value) {
    const numeric = Number(value || 0);
    if (numeric > 0) {
        return `+${formatNumber(numeric)}`;
    }

    return formatNumber(numeric);
}
