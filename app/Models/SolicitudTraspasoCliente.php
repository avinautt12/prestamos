<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudTraspasoCliente extends Model
{
    protected $table = 'solicitudes_traspaso_cliente';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'cliente_id',
        'distribuidora_origen_id',
        'distribuidora_destino_id',
        'solicitada_por_usuario_id',
        'coordinador_usuario_id',
        'confirmada_por_usuario_id',
        'estado',
        'codigo_confirmacion',
        'codigo_generado_en',
        'codigo_expira_en',
        'confirmada_en',
        'ejecutada_en',
        'motivo_solicitud',
        'motivo_rechazo',
        'comentarios',
    ];

    protected $casts = [
        'codigo_generado_en' => 'datetime',
        'codigo_expira_en' => 'datetime',
        'confirmada_en' => 'datetime',
        'ejecutada_en' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];

    public const ESTADO_PENDIENTE_COORDINADOR = 'PENDIENTE_COORDINADOR';
    public const ESTADO_APROBADA_CODIGO = 'APROBADA_CODIGO_EMITIDO';
    public const ESTADO_RECHAZADA = 'RECHAZADA';
    public const ESTADO_CANCELADA = 'CANCELADA';
    public const ESTADO_EJECUTADA = 'EJECUTADA';
    public const ESTADO_EXPIRADA = 'EXPIRADA';

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function distribuidoraOrigen(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_origen_id');
    }

    public function distribuidoraDestino(): BelongsTo
    {
        return $this->belongsTo(Distribuidora::class, 'distribuidora_destino_id');
    }

    public function solicitadaPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'solicitada_por_usuario_id');
    }

    public function coordinador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'coordinador_usuario_id');
    }

    public function confirmadaPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'confirmada_por_usuario_id');
    }
}
