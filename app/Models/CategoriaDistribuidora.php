<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaDistribuidora extends Model
{
    protected $table = 'categorias_distribuidora';

    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'porcentaje_comision',
        'puntos_por_cada_1200',
        'valor_punto',
        'castigo_pct_atraso',
        'activo'
    ];

    protected $casts = [
        'porcentaje_comision' => 'decimal:4',
        'valor_punto' => 'decimal:2',
        'castigo_pct_atraso' => 'decimal:4',
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
