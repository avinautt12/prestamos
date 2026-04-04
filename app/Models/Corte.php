<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Corte extends Model
{
    protected $table = 'cortes';

    public $timestamps = false;

    protected $fillable = [
        'sucursal_id',
        'tipo_corte',
        'dia_base_mes',
        'hora_base',
        'fecha_programada',
        'fecha_ejecucion',
        'mantener_fecha_en_inhabil',
        'estado',
        'observaciones'
    ];

    protected $casts = [
        'fecha_programada' => 'datetime',
        'fecha_ejecucion' => 'datetime',
        'mantener_fecha_en_inhabil' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const TIPO_PAGOS = 'PAGOS';
    public const TIPO_PUNTOS = 'PUNTOS';
    public const TIPO_MIXTO = 'MIXTO';

    public const ESTADO_PROGRAMADO = 'PROGRAMADO';
    public const ESTADO_EJECUTADO = 'EJECUTADO';
    public const ESTADO_CERRADO = 'CERRADO';
    public const ESTADO_REPROCESADO = 'REPROCESADO';

    // Relaciones
    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function relacionesCorte(): HasMany
    {
        return $this->hasMany(RelacionCorte::class, 'corte_id');
    }

    public function movimientosPuntos(): HasMany
    {
        return $this->hasMany(MovimientoPunto::class, 'corte_id');
    }
}
