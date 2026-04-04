<?php

namespace App\Models;

use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Usuario implements CanResetPasswordContract
{
    use HasFactory, CanResetPassword;

    protected $fillable = [
        'persona_id',
        'name',
        'email',
        'password',
        'nombre_usuario',
        'clave_hash',
        'activo',
        'requiere_vpn',
        'canal_login',
        'ultimo_acceso_en',
        'remember_token',
    ];

    public function setEmailAttribute($value): void
    {
        $this->attributes['email'] = $value;
        $this->attributes['nombre_usuario'] = $value;
    }

    public function setPasswordAttribute($value): void
    {
        $this->attributes['clave_hash'] = $value;
    }

    public function getAuthPasswordName(): string
    {
        return 'clave_hash';
    }
}
