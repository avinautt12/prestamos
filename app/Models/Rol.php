<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $codigo
 * @property string $nombre
 * @property string|null $descripcion
 * @property bool $activo
 * @property \Illuminate\Support\Carbon $creado_en
 * @property \Illuminate\Support\Carbon $actualizado_en
 * 
 * @property-read \Illuminate\Database\Eloquent\Collection|Usuario[] $usuarios
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|Rol newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Rol newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Rol query()
 */
class Rol extends Model
{
    protected $table = 'roles';

    // Deshabilitar timestamps automáticos de Laravel
    public $timestamps = false;

    protected $fillable = ['codigo', 'nombre', 'descripcion', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    // Relaciones
    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'usuario_rol', 'rol_id', 'usuario_id')
            ->withPivot('sucursal_id', 'asignado_en', 'revocado_en', 'es_principal');
    }
}
