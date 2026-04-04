<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MovimientoBancario extends Model
{
    protected $table = 'movimientos_bancarios';

    public $timestamps = false;

    protected $fillable = [
        'cuenta_banco_empresa_id',
        'referencia',
        'fecha_movimiento',
        'hora_movimiento',
        'monto',
        'tipo_movimiento',
        'folio',
        'nombre_pagador',
        'concepto_raw'
    ];

    protected $casts = [
        'fecha_movimiento' => 'date',
        'hora_movimiento' => 'string',
        'monto' => 'decimal:2',
        'creado_en' => 'datetime'
    ];

    // Relaciones
    public function cuentaEmpresa(): BelongsTo
    {
        return $this->belongsTo(CuentaBancaria::class, 'cuenta_banco_empresa_id');
    }

    public function conciliacion(): HasOne
    {
        return $this->hasOne(Conciliacion::class, 'movimiento_bancario_id');
    }
}
