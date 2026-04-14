<?php

namespace Tests\Feature\Admin;

use App\Mail\ActivacionDistribuidoraMail;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ReenviarActivacionDistribuidoraTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_puede_reenviar_activacion_a_distribuidora(): void
    {
        Mail::fake();
        $sucursal = $this->crearSucursal();

        $admin = $this->crearUsuarioConRol('ADMIN', 'admin_general', null, 'admin@test.local');
        $distribuidora = $this->crearUsuarioConRol('DISTRIBUIDORA', 'dist_prueba', $sucursal->id, 'dist@test.local');

        $response = $this->actingAs($admin)
            ->post(route('admin.usuarios.reenviar-activacion', $distribuidora));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $response->assertSessionHas('activation_link');
        $response->assertSessionHas('activation_expires_at');

        $this->assertDatabaseHas('activaciones_distribuidora', [
            'usuario_id' => $distribuidora->id,
            'usado_en' => null,
        ]);

        Mail::assertSent(ActivacionDistribuidoraMail::class, function (ActivacionDistribuidoraMail $mail) {
            return $mail->hasTo('dist@test.local');
        });
    }

    public function test_admin_no_puede_reenviar_activacion_a_rol_no_distribuidora(): void
    {
        $sucursal = $this->crearSucursal();

        $admin = $this->crearUsuarioConRol('ADMIN', 'admin_general', null, 'admin2@test.local');
        $coordinador = $this->crearUsuarioConRol('COORDINADOR', 'coord_prueba', $sucursal->id, 'coord@test.local');

        $response = $this->actingAs($admin)
            ->post(route('admin.usuarios.reenviar-activacion', $coordinador));

        $response->assertRedirect();
        $response->assertSessionHasErrors(['general']);

        $this->assertDatabaseMissing('activaciones_distribuidora', [
            'usuario_id' => $coordinador->id,
        ]);
    }

    private function crearUsuarioConRol(string $codigoRol, string $nombreUsuario, ?int $sucursalId, ?string $correo = null): Usuario
    {
        $persona = Persona::query()->create([
            'primer_nombre' => strtoupper(substr($nombreUsuario, 0, 4)),
            'apellido_paterno' => 'Prueba',
            'correo_electronico' => $correo,
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
            'sucursal_id' => $sucursalId,
            'asignado_en' => now(),
            'revocado_en' => null,
            'es_principal' => true,
        ]);

        return $usuario;
    }

    private function crearSucursal(): Sucursal
    {
        return Sucursal::query()->create([
            'codigo' => 'SUC-TST',
            'nombre' => 'Sucursal Test',
            'activo' => true,
        ]);
    }
}
