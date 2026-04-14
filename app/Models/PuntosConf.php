<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Configuracion global del sistema de puntos (tabla singleton).
 *
 * Solo debe existir 1 fila. Editable unicamente por rol ADMIN.
 * Los valores aplican a todas las sucursales y todas las categorias.
 *
 * @property int $id
 * @property int $factor_divisor_puntos    Divisor de la formula de puntos (default 1200)
 * @property int $multiplicador_puntos     Multiplicador de la formula (default 3)
 * @property string $valor_punto_mxn       MXN que vale cada punto al canjearse (default 2.00)
 * @property string $castigo_pct_atraso    Porcentaje de castigo por mora sobre total (default 20.0000)
 * @property int|null $actualizado_por_usuario_id
 */
class PuntosConf extends Model
{
    protected $table = 'puntos_conf';

    public const CREATED_AT = 'creado_en';
    public const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'factor_divisor_puntos',
        'multiplicador_puntos',
        'valor_punto_mxn',
        'castigo_pct_atraso',
        'actualizado_por_usuario_id',
    ];

    protected $casts = [
        'factor_divisor_puntos' => 'integer',
        'multiplicador_puntos'  => 'integer',
        'valor_punto_mxn'       => 'decimal:2',
        'castigo_pct_atraso'    => 'decimal:4',
        'creado_en'             => 'datetime',
        'actualizado_en'        => 'datetime',
    ];

    /**
     * Devuelve la unica fila de configuracion. Si no existe, la crea con defaults.
     * Llamar como `PuntosConf::actual()` en cualquier lugar del codigo.
     */
    public static function actual(): self
    {
        return static::query()->firstOrCreate(
            ['id' => 1],
            [
                'factor_divisor_puntos' => 1200,
                'multiplicador_puntos'  => 3,
                'valor_punto_mxn'       => 2.00,
                'castigo_pct_atraso'    => 20.0000,
            ]
        );
    }

    public function actualizadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'actualizado_por_usuario_id');
    }
}
