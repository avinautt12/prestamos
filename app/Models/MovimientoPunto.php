<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoPunto extends Model
{
    protected $table = 'movimientos_puntos';

    public $timestamps = false;

    protected $fillable = [
        'distribuidora_id',
        'vale_id',
        'corte_id',
        'pago_cliente_id',
        'tipo_movimiento',
        'puntos',
        'valor_punto_snapshot',
        'motivo'
    ];

    protected $casts = [
        'puntos' => 'decimal:2',
        'valor_punto_snapshot' => 'decimal:2',
        'fecha_movimiento' => 'datetime',
        'creado_en' => 'datetime'
    ];

    public const TIPO_GANADO_ANTICIPADO = 'GANADO_ANTICIPADO';
    public const TIPO_GANADO_PUNTUAL = 'GANADO_PUNTUAL';
    public const TIPO_PENALIZACION_ATRASO = 'PENALIZACION_ATRASO';
    public const TIPO_AJUSTE_MANUAL = 'AJUSTE_MANUAL';
    public const TIPO_REVERSO = 'REVERSO';
    public const TIPO_CANJE = 'CANJE';

    // Relaciones
    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function vale(): BelongsTo
    {
        return $this->belongsTo(Vale::class, 'vale_id');
    }

    public function corte(): BelongsTo
    {
        return $this->belongsTo(Corte::class, 'corte_id');
    }

    public function pagoCliente(): BelongsTo
    {
        return $this->belongsTo(PagoCliente::class, 'pago_cliente_id');
    }
}
