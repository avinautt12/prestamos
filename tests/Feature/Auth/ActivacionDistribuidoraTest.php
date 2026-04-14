<?php

namespace Tests\Feature\Auth;

use App\Models\Persona;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ActivacionDistribuidoraTest extends TestCase
{
    use RefreshDatabase;

    public function test_distribuidora_activa_cuenta_con_token_valido(): void
    {
        $usuario = $this->crearUsuarioDistribuidoraInactiva('dist_token_ok');
        $token = 'token-prueba-activacion-123';

        DB::table('activaciones_distribuidora')->insert([
            'usuario_id' => $usuario->id,
            'token_hash' => hash('sha256', $token),
            'expira_en' => now()->addHour(),
            'usado_en' => null,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $response = $this->post(route('distribuidora.activacion.store', ['token' => $token]), [
            'password' => 'NuevaClave123$',
            'password_confirmation' => 'NuevaClave123$',
        ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status', 'Cuenta activada. Ya puedes iniciar sesion.');

        $usuario->refresh();
        $this->assertTrue($usuario->activo);
        $this->assertTrue(Hash::check('NuevaClave123$', $usuario->clave_hash));

        $this->assertDatabaseMissing('activaciones_distribuidora', [
            'usuario_id' => $usuario->id,
            'usado_en' => null,
        ]);
    }

    public function test_no_activa_si_el_token_ya_expiro(): void
    {
        $usuario = $this->crearUsuarioDistribuidoraInactiva('dist_token_exp');
        $token = 'token-expirado-prueba-456';

        DB::table('activaciones_distribuidora')->insert([
            'usuario_id' => $usuario->id,
            'token_hash' => hash('sha256', $token),
            'expira_en' => now()->subMinute(),
            'usado_en' => null,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $response = $this->post(route('distribuidora.activacion.store', ['token' => $token]), [
            'password' => 'OtraClave123$',
            'password_confirmation' => 'OtraClave123$',
        ]);

        $response->assertSessionHasErrors(['password']);

        $usuario->refresh();
        $this->assertFalse($usuario->activo);
        $this->assertTrue(Hash::check('viejaClave123', $usuario->clave_hash));
    }

    private function crearUsuarioDistribuidoraInactiva(string $nombreUsuario): Usuario
    {
        $persona = Persona::query()->create([
            'primer_nombre' => 'Dist',
            'apellido_paterno' => 'Prueba',
            'correo_electronico' => $nombreUsuario . '@test.local',
        ]);

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => $nombreUsuario,
            'clave_hash' => Hash::make('viejaClave123'),
            'activo' => false,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        return $usuario;
    }
}
