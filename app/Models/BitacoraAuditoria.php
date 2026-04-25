<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraAuditoria extends Model
{
    public const TABLA = 'bitacora_auditorias';

    protected $table = self::TABLA;

    public $timestamps = false;

    protected $fillable = [
        'tipo_evento',
        'nivel',
        'usuario_id',
        'usuario_nombre',
        'usuario_rol',
        'sucursal_id',
        'modulo',
        'descripcion',
        'datos_extra',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'datos_extra' => 'array',
        'creado_en' => 'datetime',
    ];

    public const NIVEL_INFO = 'INFO';
    public const NIVEL_WARNING = 'WARNING';
    public const NIVEL_ERROR = 'ERROR';
    public const NIVEL_CRITICO = 'CRITICO';

    public const MODULO_AUTENTICACION = 'AUTENTICACION';
    public const MODULO_CONFIGURACION = 'CONFIGURACION';
    public const MODULO_CORTE = 'CORTE';
    public const MODULO_DISTRIBUIDORA = 'DISTRIBUIDORA';
    public const MODULO_USUARIOS = 'USUARIOS';
    public const MODULO_SOLICITUDES = 'SOLICITUDES';
    public const MODULO_APROBACIONES = 'APROBACIONES';
    public const MODULO_REPORTES = 'REPORTES';

    public const TIPO_LOGIN = 'LOGIN';
    public const TIPO_LOGOUT = 'LOGOUT';
    public const TIPO_CREAR = 'CREAR';
    public const TIPO_ACTUALIZAR = 'ACTUALIZAR';
    public const TIPO_ELIMINAR = 'ELIMINAR';
    public const TIPO_APROBAR = 'APROBAR';
    public const TIPO_RECHAZAR = 'RECHAZAR';
    public const TIPO_ERROR_SISTEMA = 'ERROR_SISTEMA';
    public const TIPO_CAMBIO_CONFIG = 'CAMBIO_CONFIG';
    public const TIPO_CIERRE_CORTE = 'CIERRE_CORTE';

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public static function registrar(array $data): self
    {
        $user = auth()->user();
        
        return static::create([
            'tipo_evento' => $data['tipo_evento'],
            'nivel' => $data['nivel'] ?? self::NIVEL_INFO,
            'usuario_id' => $user?->id,
            'usuario_nombre' => $user?->persona?->nombre_completo ?? $user?->email,
            'usuario_rol' => $user?->rol_principal?->codigo,
            'sucursal_id' => $user?->sucursal_id,
            'modulo' => $data['modulo'],
            'descripcion' => $data['descripcion'],
            'datos_extra' => $data['datos_extra'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public static function error(string $modulo, string $descripcion, array $datosExtra = []): self
    {
        return static::registrar([
            'tipo_evento' => self::TIPO_ERROR_SISTEMA,
            'nivel' => self::NIVEL_ERROR,
            'modulo' => $modulo,
            'descripcion' => $descripcion,
            'datos_extra' => $datosExtra,
        ]);
    }

    public static function critico(string $modulo, string $descripcion, array $datosExtra = []): self
    {
        return static::registrar([
            'tipo_evento' => self::TIPO_ERROR_SISTEMA,
            'nivel' => self::NIVEL_CRITICO,
            'modulo' => $modulo,
            'descripcion' => $descripcion,
            'datos_extra' => $datosExtra,
        ]);
    }
}