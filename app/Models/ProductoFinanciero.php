<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductoFinanciero extends Model
{
    protected $table = 'productos_financieros';

    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'numero_quincenas',
        'porcentaje_comision_empresa',
        'monto_seguro',
        'porcentaje_interes_quincenal',
        'monto_multa_tardia',
        'modo_desembolso',
        'activo'
    ];

    protected $casts = [
        'porcentaje_comision_empresa' => 'decimal:4',
        'monto_seguro' => 'decimal:2',
        'porcentaje_interes_quincenal' => 'decimal:4',
        'monto_multa_tardia' => 'decimal:2',
        'activo' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const MODO_TRANSFERENCIA = 'TRANSFERENCIA';
    public const MODO_EFECTIVO = 'EFECTIVO';
    public const MODO_MIXTO = 'MIXTO';

    // Relaciones
    public function vales(): HasMany
    {
        return $this->hasMany(Vale::class, 'producto_financiero_id');
    }
}
