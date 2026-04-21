<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolicitudPassword extends Model
{
    use HasFactory;
    protected $table = 'solicitudes_password';

    protected $fillable = [
        'usuario_id',
        'aprobado_por_id',
        'estado',
        'token_generado',
        'expira_en',
    ];

    protected $casts = [
        'expira_en' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function aprobadaPor()
    {
        return $this->belongsTo(Usuario::class, 'aprobado_por_id');
    }
}
