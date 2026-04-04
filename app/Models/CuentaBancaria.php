<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CuentaBancaria extends Model
{
    protected $table = 'cuentas_bancarias';

    public $timestamps = false;

    protected $fillable = [
        'tipo_propietario',
        'propietario_id',
        'banco',
        'nombre_titular',
        'numero_cuenta_mascarado',
        'clabe',
        'convenio',
        'referencia_base',
        'es_principal',
        'verificada_en'
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'verificada_en' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const TIPO_PERSONA = 'PERSONA';
    public const TIPO_DISTRIBUIDORA = 'DISTRIBUIDORA';
    public const TIPO_EMPRESA = 'EMPRESA';

    // Relaciones polimórficas
    public function propietario(): MorphTo
    {
        return $this->morphTo();
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'cuenta_bancaria_id');
    }

    public function pagosDistribuidora(): HasMany
    {
        return $this->hasMany(PagoDistribuidora::class, 'cuenta_banco_empresa_id');
    }

    public function movimientosBancarios(): HasMany
    {
        return $this->hasMany(MovimientoBancario::class, 'cuenta_banco_empresa_id');
    }
}
