<?php

namespace Tests\Feature\Gerente;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Notifications\RechazoSolicitudGerenteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RechazarDistribuidoraTest extends TestCase
{
    use RefreshDatabase;

    public function test_gerente_rechaza_solicitud_y_se_registra_bitacora(): void
    {
        $gerente = $this->crearGerenteConSucursal();
        $sucursal = $this->obtenerSucursalPrincipal($gerente);
        $coordinador = $this->crearUsuarioConRolEnSucursal('COORDINADOR', $sucursal, 'coord_main');

        $solicitud = Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('PROS')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
            'categoria_inicial_codigo' => 'COBRE',
        ]);

        $response = $this->actingAs($gerente)
            ->post(route('gerente.distribuidoras.rechazar', $solicitud->id), [
                'motivo_rechazo' => 'Se detectaron inconsistencias documentales en la validacion domiciliaria.',
            ]);

        $response->assertRedirect(route('gerente.distribuidoras.rechazadas'));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'estado' => Solicitud::ESTADO_RECHAZADA,
        ]);

        $this->assertDatabaseHas('bitacora_decisiones_gerente', [
            'gerente_usuario_id' => $gerente->id,
            'solicitud_id' => $solicitud->id,
            'tipo_evento' => 'RECHAZO',
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Usuario::class,
            'notifiable_id' => $coordinador->id,
            'type' => RechazoSolicitudGerenteNotification::class,
        ]);
    }

    public function test_no_rechaza_solicitud_de_otra_sucursal(): void
    {
        $gerenteA = $this->crearGerenteConSucursal('A');
        $gerenteB = $this->crearGerenteConSucursal('B');

        $solicitudSucursalB = Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('OTR')->id,
            'sucursal_id' => $this->obtenerSucursalPrincipal($gerenteB)->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
            'categoria_inicial_codigo' => 'COBRE',
        ]);

        $response = $this->actingAs($gerenteA)
            ->post(route('gerente.distribuidoras.rechazar', $solicitudSucursalB->id), [
                'motivo_rechazo' => 'El prospecto no cumple con politicas minimas para aprobacion de credito.',
            ]);

        $response->assertNotFound();

        $this->assertDatabaseMissing('bitacora_decisiones_gerente', [
            'solicitud_id' => $solicitudSucursalB->id,
            'tipo_evento' => 'RECHAZO',
        ]);
    }

    private function crearGerenteConSucursal(string $sufijo = ''): Usuario
    {
        $persona = $this->crearPersona('GER' . $sufijo);

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => 'gerente_' . strtolower($sufijo ?: 'main'),
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        $rolGerente = Rol::query()->firstOrCreate(
            ['codigo' => 'GERENTE'],
            ['nombre' => 'Gerente', 'activo' => true]
        );

        $sucursal = Sucursal::query()->create([
            'codigo' => 'SUC' . strtoupper($sufijo ?: 'M'),
            'nombre' => 'Sucursal ' . strtoupper($sufijo ?: 'Principal'),
            'activo' => true,
        ]);

        DB::table('usuario_rol')->insert([
            'usuario_id' => $usuario->id,
            'rol_id' => $rolGerente->id,
            'sucursal_id' => $sucursal->id,
            'asignado_en' => now(),
            'revocado_en' => null,
            'es_principal' => true,
        ]);

        return $usuario;
    }

    private function crearUsuarioConRolEnSucursal(string $codigoRol, Sucursal $sucursal, string $nombreUsuario): Usuario
    {
        $persona = $this->crearPersona(substr($codigoRol, 0, 3));

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => $nombreUsuario,
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        $rol = Rol::query()->firstOrCreate(
            ['codigo' => $codigoRol],
            ['nombre' => ucfirst(strtolower($codigoRol)), 'activo' => true]
        );

        DB::table('usuario_rol')->insert([
            'usuario_id' => $usuario->id,
            'rol_id' => $rol->id,
            'sucursal_id' => $sucursal->id,
            'asignado_en' => now(),
            'revocado_en' => null,
            'es_principal' => true,
        ]);

        return $usuario;
    }

    private function crearPersona(string $prefijo): Persona
    {
        return Persona::query()->create([
            'primer_nombre' => $prefijo,
            'apellido_paterno' => 'Prueba',
        ]);
    }

    private function obtenerSucursalPrincipal(Usuario $usuario): Sucursal
    {
        $sucursal = $usuario->sucursales()
            ->wherePivotNull('revocado_en')
            ->wherePivot('es_principal', true)
            ->first();

        $this->assertNotNull($sucursal);

        return $sucursal;
    }
}
