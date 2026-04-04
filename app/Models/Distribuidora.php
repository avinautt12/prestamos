<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Distribuidora extends Model
{
    protected $table = 'distribuidoras';

    public $timestamps = false;

    protected $fillable = [
        'persona_id',
        'solicitud_id',
        'sucursal_id',
        'coordinador_usuario_id',
        'categoria_id',
        'cuenta_bancaria_id',
        'numero_distribuidora',
        'estado',
        'limite_credito',
        'credito_disponible',
        'sin_limite',
        'puntos_actuales',
        'puede_emitir_vales',
        'es_externa',
        'activada_en',
        'desactivada_en'
    ];

    protected $casts = [
        'limite_credito' => 'decimal:2',
        'credito_disponible' => 'decimal:2',
        'puntos_actuales' => 'decimal:2',
        'sin_limite' => 'boolean',
        'puede_emitir_vales' => 'boolean',
        'es_externa' => 'boolean',
        'activada_en' => 'datetime',
        'desactivada_en' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const ESTADO_CANDIDATA = 'CANDIDATA';
    public const ESTADO_POSIBLE = 'POSIBLE';
    public const ESTADO_ACTIVA = 'ACTIVA';
    public const ESTADO_INACTIVA = 'INACTIVA';
    public const ESTADO_MOROSA = 'MOROSA';
    public const ESTADO_BLOQUEADA = 'BLOQUEADA';
    public const ESTADO_CERRADA = 'CERRADA';

    // Relaciones
    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function coordinador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'coordinador_usuario_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaDistribuidora::class, 'categoria_id');
    }

    public function cuentaBancaria(): BelongsTo
    {
        return $this->belongsTo(CuentaBancaria::class, 'cuenta_bancaria_id');
    }

    public function clientes()
    {
        return $this->belongsToMany(Cliente::class, 'clientes_distribuidora')
            ->withPivot(
                'estado_relacion',
                'bloqueado_por_parentesco',
                'observaciones_parentesco',
                'vinculado_en',
                'desvinculado_en'
            )
            ->withTimestamps();
    }

    public function vales(): HasMany
    {
        return $this->hasMany(Vale::class, 'distribuidora_id');
    }

    public function pagosCliente(): HasManyThrough
    {
        return $this->hasManyThrough(
            PagoCliente::class,
            Vale::class,
            'distribuidora_id',
            'vale_id'
        );
    }

    public function relacionesCorte(): HasMany
    {
        return $this->hasMany(RelacionCorte::class, 'distribuidora_id');
    }

    public function movimientosPuntos(): HasMany
    {
        return $this->hasMany(MovimientoPunto::class, 'distribuidora_id');
    }
}
