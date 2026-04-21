<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SugerenciaIncrementoCredito extends Model
{
    protected $table = 'sugerencias_incremento_credito';

    public $timestamps = false;

    protected $fillable = [
        'distribuidora_id',
        'score',
        'incremento_sugerido',
        'motivo_json',
        'estado',
        'aprobada_por_usuario_id',
        'rechazada_por_usuario_id',
        'decidido_en',
    ];

    protected $casts = [
        'score' => 'integer',
        'incremento_sugerido' => 'decimal:2',
        'creado_en' => 'datetime',
        'decidido_en' => 'datetime',
    ];

    public const ESTADO_PENDIENTE = 'PENDIENTE';
    public const ESTADO_APROBADA = 'APROBADA';
    public const ESTADO_RECHAZADA = 'RECHAZADA';

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function aprobadaPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'aprobada_por_usuario_id');
    }

    public function rechazadaPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'rechazada_por_usuario_id');
    }
}