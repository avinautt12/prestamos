<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Persona extends Model
{
    protected $table = 'personas';

    public $timestamps = false;

    protected $fillable = [
        'primer_nombre',
        'segundo_nombre',
        'apellido_paterno',
        'apellido_materno',
        'sexo',
        'fecha_nacimiento',
        'curp',
        'rfc',
        'telefono_personal',
        'telefono_celular',
        'correo_electronico',
        'calle',
        'numero_exterior',
        'colonia',
        'ciudad',
        'estado',
        'codigo_postal',
        'latitud',
        'longitud',
        'notas'
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
        'latitud' => 'decimal:7',
        'longitud' => 'decimal:7'
    ];

    public const SEXO_M = 'M';
    public const SEXO_F = 'F';
    public const SEXO_OTRO = 'OTRO';

    // Relaciones
    public function usuario(): HasOne
    {
        return $this->hasOne(Usuario::class, 'persona_id');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'persona_solicitante_id');
    }

    public function distribuidora(): HasOne
    {
        return $this->hasOne(Distribuidora::class, 'persona_id');
    }

    public function cliente(): HasOne
    {
        return $this->hasOne(Cliente::class, 'persona_id');
    }

    public function cuentasBancarias(): HasMany
    {
        return $this->hasMany(CuentaBancaria::class, 'propietario_id')
            ->where('tipo_propietario', 'PERSONA');
    }
}
