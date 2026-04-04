<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraDecisionGerente extends Model
{
    protected $table = 'bitacora_decisiones_gerente';

    public $timestamps = false;

    protected $fillable = [
        'gerente_usuario_id',
        'solicitud_id',
        'distribuidora_id',
        'tipo_evento',
        'monto_anterior',
        'monto_nuevo',
    ];

    protected $casts = [
        'monto_anterior' => 'decimal:2',
        'monto_nuevo' => 'decimal:2',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    public function gerente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'gerente_usuario_id');
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }
}
