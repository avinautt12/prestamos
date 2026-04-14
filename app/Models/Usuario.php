<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property int $persona_id
 * @property string $nombre_usuario
 * @property string $clave_hash
 * @property bool $activo
 * @property bool $requiere_vpn
 * @property string $canal_login
 * @property \Illuminate\Support\Carbon|null $ultimo_acceso_en
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon $creado_en
 * @property \Illuminate\Support\Carbon $actualizado_en
 * 
 * @property-read Persona $persona
 * @property-read \Illuminate\Database\Eloquent\Collection|Rol[] $roles
 * @property-read \Illuminate\Database\Eloquent\Collection|Sucursal[] $sucursales
 * @property-read \Illuminate\Database\Eloquent\Collection|Solicitud[] $solicitudesCapturadas
 * @property-read \Illuminate\Database\Eloquent\Collection|Solicitud[] $solicitudesCoordinadas
 * @property-read \Illuminate\Database\Eloquent\Collection|Vale[] $valesCreados
 * @property-read \Illuminate\Database\Eloquent\Collection|Vale[] $valesAprobados
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|Usuario newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Usuario newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Usuario query()
 */
class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $table = 'usuarios';

    // Deshabilitar timestamps automáticos de Laravel
    public $timestamps = false;

    protected $fillable = [
        'persona_id',
        'nombre_usuario',
        'clave_hash',
        'activo',
        'requiere_vpn',
        'canal_login',
        'ultimo_acceso_en',
        'remember_token',
    ];

    protected $hidden = [
        'clave_hash',
        'remember_token',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'requiere_vpn' => 'boolean',
        'ultimo_acceso_en' => 'datetime',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime'
    ];

    public const CANAL_WEB = 'WEB';
    public const CANAL_VPN_WEB = 'VPN_WEB';
    public const CANAL_MOVIL = 'MOVIL';

    /**
     * Get the name of the unique identifier for the user.
     */
    public function getAuthIdentifierName()
    {
        return 'nombre_usuario';
    }

    /**
     * Get the password for the user.
     */
    public function getAuthPassword()
    {
        return $this->clave_hash;
    }

    /**
     * Get the column name for the "remember me" token.
     */
    public function getRememberTokenName()
    {
        return 'remember_token';
    }

    // Relaciones
    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    /**
     * Get the user's roles
     * @return BelongsToMany
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol', 'usuario_id', 'rol_id')
            ->withPivot('sucursal_id', 'asignado_en', 'revocado_en', 'es_principal');
    }

    /**
     * Get the user's sucursales
     * @return BelongsToMany
     */
    public function sucursales(): BelongsToMany
    {
        return $this->belongsToMany(Sucursal::class, 'usuario_rol', 'usuario_id', 'sucursal_id')
            ->withPivot('rol_id', 'asignado_en', 'revocado_en', 'es_principal');
    }

    public function solicitudesCapturadas(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'capturada_por_usuario_id');
    }

    public function solicitudesCoordinadas(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'coordinador_usuario_id');
    }

    public function valesCreados(): HasMany
    {
        return $this->hasMany(Vale::class, 'creado_por_usuario_id');
    }

    public function valesAprobados(): HasMany
    {
        return $this->hasMany(Vale::class, 'aprobado_por_usuario_id');
    }

    /**
     * Get the user's main role (the one that is not revoked and is principal)
     * 
     * @return Rol|null
     */
    public function obtenerRolPrincipal(): ?Rol
    {
        $rolPrincipal = $this->roles()
            ->wherePivot('revocado_en', null)
            ->wherePivot('es_principal', true)
            ->first();

        if ($rolPrincipal) {
            return $rolPrincipal;
        }

        return $this->roles()
            ->wherePivot('revocado_en', null)
            ->first();
    }

    /**
     * Get the user's main role as accessor (for $usuario->rol_principal)
     * 
     * @return Rol|null
     */
    public function getRolPrincipalAttribute(): ?Rol
    {
        return $this->obtenerRolPrincipal();
    }

    /**
     * Get the role name as lowercase string
     * 
     * @return string
     */
    public function getRolNombreAttribute(): string
    {
        $rol = $this->obtenerRolPrincipal();
        return $rol ? strtolower($rol->codigo) : 'sin-rol';
    }

    /**
     * Check if user has a specific role
     * 
     * @param string $rolCodigo
     * @return bool
     */
    public function tieneRol(string $rolCodigo): bool
    {
        return $this->roles()
            ->where('codigo', $rolCodigo)
            ->wherePivot('revocado_en', null)
            ->exists();
    }

    public function tieneCombinacionRolesIncompatible(): bool
    {
        return $this->roles()
            ->wherePivot('revocado_en', null)
            ->whereIn('codigo', ['ADMIN', 'GERENTE'])
            ->count() > 1;
    }

    /**
     * Override save method to handle timestamps manually
     * 
     * @param array $options
     * @return bool
     */
    public function save(array $options = [])
    {
        // Si es un nuevo registro, establecer creado_en
        if (!$this->exists && !$this->creado_en) {
            $this->creado_en = now();
        }

        // Siempre actualizar actualizado_en
        $this->actualizado_en = now();

        return parent::save($options);
    }
}
