<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SucursalConfiguracion extends Model
{
    protected $table = 'sucursal_configuraciones';

    public $timestamps = false;

    protected $fillable = [
        'sucursal_id',
        'dia_corte',
        'hora_corte',
        'frecuencia_pago_dias',
        'plazo_pago_dias',
        'linea_credito_default',
        'seguro_tabuladores_json',
        'porcentaje_comision_apertura',
        'porcentaje_interes_quincenal',
        'multa_incumplimiento_monto',
        'factor_divisor_puntos',
        'multiplicador_puntos',
        'valor_punto_mxn',
        'categorias_config_json',
        'productos_config_json',
        'actualizado_por_usuario_id',
        'creado_en',
        'actualizado_en',
    ];

    protected $casts = [
        'dia_corte' => 'integer',
        'frecuencia_pago_dias' => 'integer',
        'plazo_pago_dias' => 'integer',
        'linea_credito_default' => 'decimal:2',
        'seguro_tabuladores_json' => 'array',
        'porcentaje_comision_apertura' => 'float',
        'porcentaje_interes_quincenal' => 'float',
        'multa_incumplimiento_monto' => 'decimal:2',
        'factor_divisor_puntos' => 'integer',
        'multiplicador_puntos' => 'integer',
        'valor_punto_mxn' => 'decimal:2',
        'categorias_config_json' => 'array',
        'productos_config_json' => 'array',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function actualizadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'actualizado_por_usuario_id');
    }

    public function cambios(): HasMany
    {
        return $this->hasMany(BitacoraConfiguracionSucursal::class, 'sucursal_configuracion_id');
    }
}
