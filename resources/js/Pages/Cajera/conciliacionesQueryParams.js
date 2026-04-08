export function buildConciliacionesQuery(state, options = {}) {
    const params = new URLSearchParams();

    if ((state.mov_q || '').trim() !== '') params.set('mov_q', state.mov_q.trim());
    if ((state.mov_fecha || '').trim() !== '') params.set('mov_fecha', state.mov_fecha.trim());
    if ((state.rel_q || '').trim() !== '') params.set('rel_q', state.rel_q.trim());
    if ((state.rel_estado || 'TODAS') !== 'TODAS') params.set('rel_estado', state.rel_estado);

    if ((state.hist_q || '').trim() !== '') params.set('hist_q', state.hist_q.trim());
    if ((state.hist_estado || 'TODOS') !== 'TODOS') params.set('hist_estado', state.hist_estado);
    if ((state.hist_desde || '').trim() !== '') params.set('hist_desde', state.hist_desde.trim());
    if ((state.hist_hasta || '').trim() !== '') params.set('hist_hasta', state.hist_hasta.trim());

    if (Number.isInteger(options.page) && options.page > 1) {
        params.set('hist_page', String(options.page));
    }

    return params.toString();
}

export function buildHistorialExportQuery(state, format = 'csv') {
    const params = new URLSearchParams();

    if ((state.hist_q || '').trim() !== '') params.set('hist_q', state.hist_q.trim());
    if ((state.hist_estado || 'TODOS') !== 'TODOS') params.set('hist_estado', state.hist_estado);
    if ((state.hist_desde || '').trim() !== '') params.set('hist_desde', state.hist_desde.trim());
    if ((state.hist_hasta || '').trim() !== '') params.set('hist_hasta', state.hist_hasta.trim());
    params.set('format', format);

    return params.toString();
}
