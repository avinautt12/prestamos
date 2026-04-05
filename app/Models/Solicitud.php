<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Solicitud extends Model
{
    protected $table = 'solicitudes';

    public const CREATED_AT = 'creado_en';
    public const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'persona_solicitante_id',
        'sucursal_id',
        'capturada_por_usuario_id',
        'coordinador_usuario_id',
        'cuenta_bancaria_id',
        'estado',
        'categoria_inicial_codigo',
        'datos_familiares_json',
        'afiliaciones_externas_json',
        'vehiculos_json',
        'ine_frente_path',
        'ine_reverso_path',
        'comprobante_domicilio_path',
        'reporte_buro_path',
        'limite_credito_solicitado',
        'resultado_buro',
        'observaciones_validacion',
        'prevale_aprobado',
        'fotos_casa_completas',
        'enviada_en',
        'tomada_en',
        'revisada_en',
        'decidida_en',
        'verificador_asignado_id'
    ];

    protected $casts = [
        'datos_familiares_json' => 'array',
        'afiliaciones_externas_json' => 'array',
        'vehiculos_json' => 'array',
        'limite_credito_solicitado' => 'decimal:2',
        'prevale_aprobado' => 'boolean',
        'fotos_casa_completas' => 'boolean',
        'enviada_en' => 'datetime',
        'tomada_en' => 'datetime',
        'revisada_en' => 'datetime',
        'decidida_en' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const ESTADO_PRE = 'PRE';
    public const ESTADO_MODIFICADA = 'MODIFICADA';
    public const ESTADO_EN_REVISION = 'EN_REVISION';
    public const ESTADO_VERIFICADA = 'VERIFICADA';
    public const ESTADO_POSIBLE_DISTRIBUIDORA = 'POSIBLE_DISTRIBUIDORA';
    public const ESTADO_APROBADA = 'APROBADA';
    public const ESTADO_RECHAZADA = 'RECHAZADA';

    // Relaciones
    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_solicitante_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function capturador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'capturada_por_usuario_id');
    }

    public function coordinador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'coordinador_usuario_id');
    }

    public function cuentaBancaria(): BelongsTo
    {
        return $this->belongsTo(CuentaBancaria::class, 'cuenta_bancaria_id');
    }

    public function distribuidora(): HasOne
    {
        return $this->hasOne(Distribuidora::class, 'solicitud_id');
    }

    // Relación con la verificación (una solicitud tiene una verificación)
    public function verificacion()
    {
        return $this->hasOne(VerificacionesSolicitud::class, 'solicitud_id');
    }

    // Relación con el verificador asignado
    public function verificadorAsignado()
    {
        return $this->belongsTo(Usuario::class, 'verificador_asignado_id');
    }
}
