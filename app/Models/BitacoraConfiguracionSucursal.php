<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraConfiguracionSucursal extends Model
{
    protected $table = 'bitacora_configuracion_sucursal';

    public $timestamps = false;

    protected $fillable = [
        'sucursal_configuracion_id',
        'sucursal_id',
        'actualizado_por_usuario_id',
        'tipo_evento',
        'referencia_id',
        'cambios_antes_json',
        'cambios_despues_json',
    ];

    protected $casts = [
        'cambios_antes_json' => 'array',
        'cambios_despues_json' => 'array',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    public function sucursalConfiguracion(): BelongsTo
    {
        return $this->belongsTo(SucursalConfiguracion::class, 'sucursal_configuracion_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function actualizadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'actualizado_por_usuario_id');
    }
}
