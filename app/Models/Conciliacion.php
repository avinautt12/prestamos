<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Conciliacion extends Model
{
    protected $table = 'conciliaciones';

    public $timestamps = false;

    protected $fillable = [
        'pago_distribuidora_id',
        'movimiento_bancario_id',
        'conciliado_por_usuario_id',
        'conciliado_en',
        'monto_conciliado',
        'diferencia_monto',
        'estado',
        'observaciones'
    ];

    protected $casts = [
        'conciliado_en' => 'datetime',
        'monto_conciliado' => 'decimal:2',
        'diferencia_monto' => 'decimal:2'
    ];

    public const ESTADO_CONCILIADA = 'CONCILIADA';
    public const ESTADO_CON_DIFERENCIA = 'CON_DIFERENCIA';
    public const ESTADO_RECHAZADA = 'RECHAZADA';

    // Relaciones
    public function pagoDistribuidora(): BelongsTo
    {
        return $this->belongsTo(PagoDistribuidora::class, 'pago_distribuidora_id');
    }

    public function movimientoBancario(): BelongsTo
    {
        return $this->belongsTo(MovimientoBancario::class, 'movimiento_bancario_id');
    }

    public function conciliador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'conciliado_por_usuario_id');
    }
}
