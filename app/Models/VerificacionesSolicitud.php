<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificacionesSolicitud extends Model
{
    protected $table = 'verificaciones_solicitud';

    // Deshabilitar timestamps automáticos de Laravel (usamos campos manuales)
    public $timestamps = false;

    protected $fillable = [
        'solicitud_id',
        'verificador_usuario_id',
        'resultado',
        'observaciones',
        'latitud_verificacion',
        'longitud_verificacion',
        'fecha_visita',
        'checklist_json',
        'foto_fachada',
        'foto_ine_con_persona',
        'foto_comprobante',
        'distancia_metros',
    ];

    protected $casts = [
        'checklist_json' => 'array',
        'fecha_visita' => 'datetime',
        'latitud_verificacion' => 'decimal:7',
        'longitud_verificacion' => 'decimal:8',
        'distancia_metros' => 'decimal:2',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    // Constantes para resultados
    public const RESULTADO_PENDIENTE = 'PENDIENTE';
    public const RESULTADO_VERIFICADA = 'VERIFICADA';
    public const RESULTADO_RECHAZADA = 'RECHAZADA';

    // Relaciones
    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function verificador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'verificador_usuario_id');
    }

    // Helper para saber si ya fue verificada
    public function isVerificada(): bool
    {
        return $this->resultado === self::RESULTADO_VERIFICADA;
    }

    public function isRechazada(): bool
    {
        return $this->resultado === self::RESULTADO_RECHAZADA;
    }

    public function isPendiente(): bool
    {
        return $this->resultado === self::RESULTADO_PENDIENTE;
    }
}
