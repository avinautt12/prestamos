<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoCliente extends Model
{
    protected $table = 'pagos_cliente';

    public $timestamps = false;

    protected $fillable = [
        'vale_id',
        'cliente_id',
        'distribuidora_id',
        'cobrado_por_usuario_id',
        'fecha_pago',
        'monto',
        'metodo_pago',
        'es_parcial',
        'afecta_puntos',
        'notas'
    ];

    protected $casts = [
        'fecha_pago' => 'datetime',
        'monto' => 'decimal:2',
        'es_parcial' => 'boolean',
        'afecta_puntos' => 'boolean',
        'creado_en' => 'datetime'
    ];

    public const METODO_EFECTIVO = 'EFECTIVO';
    public const METODO_TRANSFERENCIA = 'TRANSFERENCIA';

    // Relaciones
    public function vale(): BelongsTo
    {
        return $this->belongsTo(Vale::class, 'vale_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function cobrador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cobrado_por_usuario_id');
    }

    public function movimientoPunto(): BelongsTo
    {
        return $this->belongsTo(MovimientoPunto::class, 'id', 'pago_cliente_id');
    }
}
