<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PagoDistribuidora extends Model
{
    protected $table = 'pagos_distribuidora';

    public $timestamps = false;

    protected $fillable = [
        'relacion_corte_id',
        'distribuidora_id',
        'cuenta_banco_empresa_id',
        'monto',
        'metodo_pago',
        'referencia_reportada',
        'fecha_pago',
        'estado',
        'observaciones',
        'desglose_vales',
        'desglose_aplicado'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
        'creado_en' => 'datetime',
        'desglose_vales' => 'array',
        'desglose_aplicado' => 'boolean'
    ];

    public const METODO_TRANSFERENCIA = 'TRANSFERENCIA';
    public const METODO_DEPOSITO = 'DEPOSITO';
    public const METODO_OTRO = 'OTRO';

    public const ESTADO_REPORTADO = 'REPORTADO';
    public const ESTADO_DETECTADO = 'DETECTADO';
    public const ESTADO_CONCILIADO = 'CONCILIADO';
    public const ESTADO_RECHAZADO = 'RECHAZADO';

    // Relaciones
    public function relacionCorte(): BelongsTo
    {
        return $this->belongsTo(RelacionCorte::class, 'relacion_corte_id');
    }

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function cuentaEmpresa(): BelongsTo
    {
        return $this->belongsTo(CuentaBancaria::class, 'cuenta_banco_empresa_id');
    }

    public function conciliacion(): HasOne
    {
        return $this->hasOne(Conciliacion::class, 'pago_distribuidora_id');
    }
}
