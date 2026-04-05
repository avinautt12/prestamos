<?php

namespace Tests\Feature\Gerente;

use App\Models\CategoriaDistribuidora;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GerenteEntregaUnoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_la_bandeja_de_gerente_solo_muestra_verificadas_de_su_sucursal(): void
    {
        $gerente = $this->usuario('gerente');
        $sucursalGerente = $gerente->sucursales()->firstOrFail();

        $otraSucursal = Sucursal::create([
            'codigo' => 'SUC-GERENTE-OTRA',
            'nombre' => 'Sucursal Externa',
            'direccion_texto' => 'No debe verse en gerente actual',
            'telefono' => '5551231234',
            'activo' => true,
        ]);

        $this->crearSolicitudVerificada('VISIBLE-GERENTE', $sucursalGerente->id);
        $this->crearSolicitudVerificada('OCULTA-OTRA-SUC', $otraSucursal->id);

        $this->actingAs($gerente)
            ->get(route('gerente.distribuidoras'))
            ->assertOk()
            ->assertSee('VISIBLE-GERENTE')
            ->assertDontSee('OCULTA-OTRA-SUC');
    }

    public function test_aprobar_credito_se_bloquea_sin_vpn_cuando_la_politica_esta_activa(): void
    {
        config(['security.gerente.require_vpn' => true]);

        $gerente = $this->usuario('gerente');
        $sucursalGerente = $gerente->sucursales()->firstOrFail();
        $solicitud = $this->crearSolicitudVerificada('BLOQUEO-APROBAR', $sucursalGerente->id);
        $categoria = CategoriaDistribuidora::where('activo', true)->firstOrFail();

        $this->actingAs($gerente)
            ->post(route('gerente.distribuidoras.aprobar', $solicitud->id), [
                'limite_credito' => 2500,
                'categoria_id' => $categoria->id,
            ])
            ->assertSessionHasErrors('security');

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
        ]);
    }

    public function test_rechazar_credito_se_permite_con_ip_dentro_de_wireguard(): void
    {
        config(['security.gerente.require_vpn' => true]);
        config(['security.gerente.wireguard_cidr' => '10.8.0.0/24']);

        $gerente = $this->usuario('gerente');
        $sucursalGerente = $gerente->sucursales()->firstOrFail();
        $solicitud = $this->crearSolicitudVerificada('PERMITE-RECHAZO', $sucursalGerente->id);

        $this->actingAs($gerente)
            ->withServerVariables(['REMOTE_ADDR' => '10.8.0.25'])
            ->post(route('gerente.distribuidoras.rechazar', $solicitud->id), [
                'motivo_rechazo' => 'Se detectaron inconsistencias importantes en la visita y no procede para riesgo financiero.',
            ])
            ->assertRedirect(route('gerente.distribuidoras'));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'estado' => Solicitud::ESTADO_RECHAZADA,
        ]);
    }

    private function usuario(string $nombreUsuario): Usuario
    {
        return Usuario::where('nombre_usuario', $nombreUsuario)->firstOrFail();
    }

    private function crearSolicitudVerificada(string $prefijo, int $sucursalId): Solicitud
    {
        $persona = Persona::create([
            'primer_nombre' => $prefijo,
            'apellido_paterno' => 'Prueba',
            'apellido_materno' => 'Gerente',
            'sexo' => 'F',
            'curp' => substr(strtoupper($prefijo . 'CURP0000000000'), 0, 18),
            'rfc' => substr(strtoupper($prefijo . 'RFC000000000'), 0, 13),
            'telefono_celular' => '5557778888',
            'correo_electronico' => strtolower($prefijo) . '@prestamofacil.test',
            'calle' => 'Calle Gerente',
            'numero_exterior' => '12',
            'colonia' => 'Centro',
            'ciudad' => 'Ciudad de Mexico',
            'estado' => 'CDMX',
            'codigo_postal' => '06000',
            'latitud' => 19.4326000,
            'longitud' => -99.1332000,
        ]);

        $coordinadorId = $this->usuario('coordinador')->id;

        return Solicitud::create([
            'persona_solicitante_id' => $persona->id,
            'sucursal_id' => $sucursalId,
            'capturada_por_usuario_id' => $coordinadorId,
            'coordinador_usuario_id' => $coordinadorId,
            'estado' => Solicitud::ESTADO_VERIFICADA,
            'limite_credito_solicitado' => 2000,
            'datos_familiares_json' => json_encode(['conyuge' => ['nombre' => 'Conyuge']]),
            'afiliaciones_externas_json' => json_encode([['empresa' => 'Empresa Test']]),
            'vehiculos_json' => json_encode([['marca' => 'Nissan']]),
            'enviada_en' => now()->subDay(),
            'revisada_en' => now()->subHour(),
            'observaciones_validacion' => 'Lista para decisión de gerente',
        ]);
    }
}
