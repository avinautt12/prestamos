<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use SoftDeletes;

    protected $table = 'sucursales';

    public $timestamps = false;

    protected $fillable = ['codigo', 'nombre', 'direccion_texto', 'telefono', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];


    // Relaciones
    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'usuario_rol')
            ->withPivot('rol_id', 'asignado_en', 'revocado_en', 'es_principal');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'sucursal_id');
    }

    public function distribuidoras(): HasMany
    {
        return $this->hasMany(Distribuidora::class, 'sucursal_id');
    }

    public function vales(): HasMany
    {
        return $this->hasMany(Vale::class, 'sucursal_id');
    }

    public function cortes(): HasMany
    {
        return $this->hasMany(Corte::class, 'sucursal_id');
    }

    public function configuracion(): HasOne
    {
        return $this->hasOne(SucursalConfiguracion::class, 'sucursal_id');
    }
}
