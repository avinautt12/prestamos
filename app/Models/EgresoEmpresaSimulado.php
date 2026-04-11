<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EgresoEmpresaSimulado extends Model
{
    protected $table = 'egresos_empresa_simulados';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'vale_id',
        'distribuidora_id',
        'cliente_id',
        'ejecutado_por_usuario_id',
        'origen',
        'referencia_interna',
        'monto',
        'fecha_operacion',
        'notas',
    ];

    protected $casts = [
        'monto' => 'float',
        'fecha_operacion' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    public function vale(): BelongsTo
    {
        return $this->belongsTo(Vale::class, 'vale_id');
    }

    public function distribuidora(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function ejecutadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'ejecutado_por_usuario_id');
    }
}
