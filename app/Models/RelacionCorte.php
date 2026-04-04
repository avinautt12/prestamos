<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RelacionCorte extends Model
{
    protected $table = 'relaciones_corte';

    public $timestamps = false;

    protected $fillable = [
        'corte_id',
        'distribuidora_id',
        'numero_relacion',
        'referencia_pago',
        'fecha_limite_pago',
        'fecha_inicio_pago_anticipado',
        'fecha_fin_pago_anticipado',
        'limite_credito_snapshot',
        'credito_disponible_snapshot',
        'puntos_snapshot',
        'total_comision',
        'total_pago',
        'total_recargos',
        'total_a_pagar',
        'estado'
    ];

    protected $casts = [
        'fecha_limite_pago' => 'date',
        'fecha_inicio_pago_anticipado' => 'date',
        'fecha_fin_pago_anticipado' => 'date',
        'limite_credito_snapshot' => 'decimal:2',
        'credito_disponible_snapshot' => 'decimal:2',
        'puntos_snapshot' => 'decimal:2',
        'total_comision' => 'decimal:2',
        'total_pago' => 'decimal:2',
        'total_recargos' => 'decimal:2',
        'total_a_pagar' => 'decimal:2',
        'generada_en' => 'datetime'
    ];

    public const ESTADO_GENERADA = 'GENERADA';
    public const ESTADO_PAGADA = 'PAGADA';
    public const ESTADO_PARCIAL = 'PARCIAL';
    public const ESTADO_VENCIDA = 'VENCIDA';
    public const ESTADO_CERRADA = 'CERRADA';

    // Relaciones
    public function corte(): BelongsTo
    {
        return $this->belongsTo(Corte::class, 'corte_id');
    }

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function partidas(): HasMany
    {
        return $this->hasMany(PartidaRelacionCorte::class, 'relacion_corte_id');
    }

    public function pagosDistribuidora(): HasMany
    {
        return $this->hasMany(PagoDistribuidora::class, 'relacion_corte_id');
    }
}
