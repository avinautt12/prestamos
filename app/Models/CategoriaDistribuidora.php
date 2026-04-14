<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CategoriaDistribuidora extends Model
{
    use SoftDeletes;

    protected $table = 'categorias_distribuidora';

    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'porcentaje_comision',
        'puntos_por_cada_1200',
        'castigo_pct_atraso',
        'activo'
    ];

    protected $casts = [
        'porcentaje_comision' => 'float',
        'castigo_pct_atraso' => 'float',
        'activo' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    // Relaciones
    public function distribuidoras(): HasMany
    {
        return $this->hasMany(Distribuidora::class, 'categoria_id');
    }
}
