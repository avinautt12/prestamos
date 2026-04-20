<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vale extends Model
{
    protected $table = 'vales';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'numero_vale',
        'distribuidora_id',
        'cliente_id',
        'producto_financiero_id',
        'sucursal_id',
        'creado_por_usuario_id',
        'aprobado_por_usuario_id',
        'estado',
        'monto',
        'porcentaje_comision_empresa_snap',
        'monto_comision_empresa',
        'monto_seguro_snap',
        'porcentaje_interes_snap',
        'monto_interes',
        'porcentaje_ganancia_dist_snap',
        'monto_ganancia_distribuidora',
        'monto_multa_snap',
        'monto_total_deuda',
        'monto_quincenal',
        'quincenas_totales',
        'pagos_realizados',
        'saldo_actual',
        'referencia_transferencia',
        'fecha_emision',
        'fecha_transferencia',
        'fecha_limite_pago',
        'fecha_inicio_pago_anticipado',
        'fecha_fin_pago_anticipado',
        'motivo_reclamo',
        'cancelado',
        'cancelado_en',
        'notas'
    ];

    protected $casts = [
        // Montos en decimal:2 para preservar exactitud al centavo (BCMath-friendly).
        // Porcentajes en decimal:4 para soportar centesimas de punto porcentual.
        'porcentaje_comision_empresa_snap'  => 'decimal:4',
        'monto_comision_empresa'            => 'decimal:2',
        'monto_seguro_snap'                 => 'decimal:2',
        'porcentaje_interes_snap'           => 'decimal:4',
        'monto_interes'                     => 'decimal:2',
        'porcentaje_ganancia_dist_snap'     => 'decimal:4',
        'monto_ganancia_distribuidora'      => 'decimal:2',
        'monto_multa_snap'                  => 'decimal:2',
        'monto_total_deuda'                 => 'decimal:2',
        'monto_quincenal'                   => 'decimal:2',
        'saldo_actual'                      => 'decimal:2',
        'cancelado'                         => 'boolean',
        'fecha_emision'                     => 'datetime',
        'fecha_transferencia'               => 'datetime',
        'fecha_limite_pago'                 => 'date',
        'fecha_inicio_pago_anticipado'      => 'date',
        'fecha_fin_pago_anticipado'         => 'date',
        'cancelado_en'                      => 'datetime',
        'creado_en'                         => 'datetime',
        'actualizado_en'                    => 'datetime',
    ];

    public const ESTADO_BORRADOR    = 'BORRADOR';
    public const ESTADO_APROBADO    = 'APROBADO';
    public const ESTADO_TRANSFERIDO = 'TRANSFERIDO';
    public const ESTADO_ACTIVO      = 'ACTIVO';
    public const ESTADO_PAGO_PARCIAL = 'PAGO_PARCIAL';
    public const ESTADO_PAGADO      = 'PAGADO';
    public const ESTADO_LIQUIDADO   = 'LIQUIDADO';
    public const ESTADO_MOROSO      = 'MOROSO';
    public const ESTADO_RECLAMADO   = 'RECLAMADO';
    public const ESTADO_CANCELADO   = 'CANCELADO';
    public const ESTADO_REVERSADO   = 'REVERSADO';

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function productoFinanciero(): BelongsTo
    {
        return $this->belongsTo(ProductoFinanciero::class, 'producto_financiero_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por_usuario_id');
    }

    public function aprobador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'aprobado_por_usuario_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(PagoCliente::class, 'vale_id');
    }

    public function partidasRelacionCorte(): HasMany
    {
        return $this->hasMany(PartidaRelacionCorte::class, 'vale_id');
    }

    public function movimientosPuntos(): HasMany
    {
        return $this->hasMany(MovimientoPunto::class, 'vale_id');
    }
}