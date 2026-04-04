<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartidaRelacionCorte extends Model
{
    protected $table = 'partidas_relacion_corte';

    public $timestamps = false;

    protected $fillable = [
        'relacion_corte_id',
        'vale_id',
        'cliente_id',
        'nombre_producto_snapshot',
        'pagos_realizados',
        'pagos_totales',
        'monto_comision',
        'monto_pago',
        'monto_recargo',
        'monto_total_linea'
    ];

    protected $casts = [
        'monto_comision' => 'decimal:2',
        'monto_pago' => 'decimal:2',
        'monto_recargo' => 'decimal:2',
        'monto_total_linea' => 'decimal:2',
        'creado_en' => 'datetime'
    ];

    // Relaciones
    public function relacionCorte(): BelongsTo
    {
        return $this->belongsTo(RelacionCorte::class, 'relacion_corte_id');
    }

    public function vale(): BelongsTo
    {
        return $this->belongsTo(Vale::class, 'vale_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
