<?php

namespace Tests\Feature\Verificador;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Notifications\SolicitudTomadaVerificadorNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TomarSolicitudNotificacionTest extends TestCase
{
    use RefreshDatabase;

    public function test_tomar_solicitud_notifica_al_coordinador(): void
    {
        $sucursal = Sucursal::query()->create([
            'codigo' => 'SUC-VER',
            'nombre' => 'Sucursal Verificacion',
            'activo' => true,
        ]);

        $verificador = $this->crearUsuarioConRolEnSucursal('VERIFICADOR', $sucursal, 'verificador_test', 'VER');
        $coordinador = $this->crearUsuarioConRolEnSucursal('COORDINADOR', $sucursal, 'coordinador_test', 'COO');

        $personaProspecto = Persona::query()->create([
            'primer_nombre' => 'Cliente',
            'apellido_paterno' => 'Prueba',
        ]);

        $solicitud = Solicitud::query()->create([
            'persona_solicitante_id' => $personaProspecto->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_EN_REVISION,
            'categoria_inicial_codigo' => 'COBRE',
        ]);

        $response = $this->actingAs($verificador)
            ->post(route('verificador.solicitudes.tomar', $solicitud->id));

        $response->assertRedirect(route('verificador.solicitudes.show', $solicitud->id));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'verificador_asignado_id' => $verificador->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Usuario::class,
            'notifiable_id' => $coordinador->id,
            'type' => SolicitudTomadaVerificadorNotification::class,
        ]);
    }

    private function crearUsuarioConRolEnSucursal(string $codigoRol, Sucursal $sucursal, string $nombreUsuario, string $prefijo): Usuario
    {
        $persona = Persona::query()->create([
            'primer_nombre' => $prefijo,
            'apellido_paterno' => 'Usuario',
        ]);

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
}
