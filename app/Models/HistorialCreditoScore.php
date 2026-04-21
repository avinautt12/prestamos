<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialCreditoScore extends Model
{
    protected $table = 'historial_credito_score';

    public $timestamps = false;

    protected $fillable = [
        'distribuidora_id',
        'mes_evalucion',
        'score_base',
        'score_final',
        'factores_json',
        'incremento_sugerido',
        'auto_aplicado',
    ];

    protected $casts = [
        'score_base' => 'integer',
        'score_final' => 'decimal:2',
        'incremento_sugerido' => 'decimal:2',
        'auto_aplicado' => 'boolean',
        'creado_en' => 'datetime',
    ];

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }
}