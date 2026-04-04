<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    public $timestamps = false;

    protected $fillable = ['persona_id', 'codigo_cliente', 'estado', 'notas'];

    protected $casts = [
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const ESTADO_ACTIVO = 'ACTIVO';
    public const ESTADO_BLOQUEADO = 'BLOQUEADO';
    public const ESTADO_MOROSO = 'MOROSO';
    public const ESTADO_INACTIVO = 'INACTIVO';

    // Relaciones
    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function distribuidoras()
    {
        return $this->belongsToMany(Distribuidora::class, 'clientes_distribuidora')
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
        return $this->hasMany(Vale::class, 'cliente_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(PagoCliente::class, 'cliente_id');
    }
}
