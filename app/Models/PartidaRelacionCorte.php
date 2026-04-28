<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartidaRelacionCorte extends Model
{
    protected $table = 'partidas_relacion_corte';

    public $timestamps = false;

    protected $fillable = [
        'relacion_corte_id',
        'vale_id',
        'cliente_id',
        'nombre_producto_snapshot',
        'pagos_realizados',
        'pagos_totales',
        'es_atraso',
        'numero_quincena',
        'quincenas_atrasadas_acumuladas',
        'monto_comision',
        'monto_pago',
        'monto_recargo',
        'monto_total_linea',
        'monto_pagado_previo',
        'corte_origen_id',
        'relacion_origen_id',
    ];

    protected $casts = [
        'monto_comision' => 'decimal:2',
        'monto_pago' => 'decimal:2',
        'monto_recargo' => 'decimal:2',
        'monto_total_linea' => 'decimal:2',
        'monto_pagado_previo' => 'decimal:2',
        'es_atraso' => 'boolean',
        'numero_quincena' => 'integer',
        'quincenas_atrasadas_acumuladas' => 'integer',
        'creado_en' => 'datetime'
    ];

    public function relacionCorte(): BelongsTo
    {
        return $this->belongsTo(RelacionCorte::class, 'relacion_corte_id');
    }

    public function vale(): BelongsTo
    {
        return $this->belongsTo(Vale::class, 'vale_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function corteOrigen(): BelongsTo
    {
        return $this->belongsTo(Corte::class, 'corte_origen_id');
    }

    public function relacionOrigen(): BelongsTo
    {
        return $this->belongsTo(RelacionCorte::class, 'relacion_origen_id');
    }

    public function scopeAtrasos(Builder $query): Builder
    {
        return $query->where('es_atraso', true);
    }

    public function scopeNormales(Builder $query): Builder
    {
        return $query->where('es_atraso', false);
    }
}
