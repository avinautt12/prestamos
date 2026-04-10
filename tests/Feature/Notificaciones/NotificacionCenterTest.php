<?php

namespace Tests\Feature\Notificaciones;

use App\Models\Persona;
use App\Models\Usuario;
use App\Notifications\DistribuidoraAprobadaNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class NotificacionCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_lista_notificaciones_y_marca_todas_leidas(): void
    {
        $persona = Persona::query()->create([
            'primer_nombre' => 'Notif',
            'apellido_paterno' => 'Tester',
        ]);

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => 'notif_tester',
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        $usuario->notify(new DistribuidoraAprobadaNotification(2500, 'DIST-NTF-01'));

        $response = $this->actingAs($usuario)
            ->get(route('notificaciones.index'));

        $response->assertOk();
        $response->assertJsonPath('unread_count', 1);
        $response->assertJsonCount(1, 'notifications');

        $marcarTodas = $this->actingAs($usuario)
            ->patch(route('notificaciones.marcar-todas-leidas'));

        $marcarTodas->assertOk();
        $marcarTodas->assertJsonPath('unread_count', 0);
    }
}
