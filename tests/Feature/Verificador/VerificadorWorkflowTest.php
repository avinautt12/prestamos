<?php

namespace Tests\Feature\Verificador;

use App\Events\DictamenSolicitud;
use App\Events\SolicitudListaParaAprobacion;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VerificadorWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_el_verificador_puede_ver_su_dashboard_y_mapa_de_ruta(): void
    {
        $verificador = $this->usuario('verificador');

        $this->actingAs($verificador)
            ->get(route('verificador.dashboard'))
            ->assertOk();

        $this->actingAs($verificador)
            ->get(route('verificador.solicitudes.index'))
            ->assertOk();

        $this->actingAs($verificador)
            ->get(route('verificador.mapa-ruta'))
            ->assertOk();
    }

    public function test_la_bandeja_del_verificador_se_filtra_por_sucursal_y_estado(): void
    {
        $verificador = $this->usuario('verificador');
        $sucursalActual = $verificador->sucursales()->firstOrFail();

        $otraSucursal = Sucursal::create([
            'codigo' => 'SUC-TEST-FILTRO',
            'nombre' => 'Sucursal Filtro',
            'direccion_texto' => 'Sucursal de prueba para filtrar',
            'telefono' => '5552223333',
            'activo' => true,
        ]);

        $this->crearSolicitud($sucursalActual->id, 'VISIBLE-FILTRO', Solicitud::ESTADO_EN_REVISION);
        $this->crearSolicitud($otraSucursal->id, 'OCULTA-OTRA-SUCURSAL', Solicitud::ESTADO_EN_REVISION);
        $this->crearSolicitud($sucursalActual->id, 'BORRADOR-OCULTO', Solicitud::ESTADO_PRE);

        $this->actingAs($verificador)
            ->get(route('verificador.solicitudes.index'))
            ->assertOk()
            ->assertSee('VISIBLE-FILTRO')
            ->assertDontSee('OCULTA-OTRA-SUCURSAL')
            ->assertDontSee('BORRADOR-OCULTO');
    }

    public function test_el_verificador_puede_tomar_y_verificar_una_solicitud_con_evidencia(): void
    {
        Storage::fake('spaces');
        Event::fake([DictamenSolicitud::class, SolicitudListaParaAprobacion::class]);

        $verificador = $this->usuario('verificador');
        $sucursal = $verificador->sucursales()->firstOrFail();

        $solicitud = $this->crearSolicitud($sucursal->id, 'FLUJO-VERIFICAR', Solicitud::ESTADO_EN_REVISION, [
            'latitud' => 19.4326000,
            'longitud' => -99.1332000,
        ]);

        $this->actingAs($verificador)
            ->post(route('verificador.solicitudes.tomar', $solicitud->id))
            ->assertRedirect(route('verificador.solicitudes.show', $solicitud->id));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'verificador_asignado_id' => $verificador->id,
        ]);

        $this->actingAs($verificador)
            ->post(route('verificador.solicitudes.verificar', $solicitud->id), [
                'resultado' => 'VERIFICADA',
                'latitud_verificacion' => 19.4326000,
                'longitud_verificacion' => -99.1332000,
                'fecha_visita' => now()->toISOString(),
                'checklist' => [
                    'domicilio_correcto' => true,
                    'persona_identificada' => true,
                    'vehiculos_visibles' => true,
                    'documentos_validos' => true,
                ],
                'foto_fachada' => UploadedFile::fake()->create('fachada.jpg', 100, 'image/jpeg'),
                'foto_ine_con_persona' => UploadedFile::fake()->create('ine.jpg', 100, 'image/jpeg'),
                'foto_comprobante' => UploadedFile::fake()->create('comprobante.jpg', 100, 'image/jpeg'),
            ])
            ->assertRedirect(route('verificador.solicitudes.index'));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
        ]);

        $this->assertDatabaseHas('verificaciones_solicitud', [
            'solicitud_id' => $solicitud->id,
            'verificador_usuario_id' => $verificador->id,
            'resultado' => 'VERIFICADA',
        ]);

        Event::assertDispatched(DictamenSolicitud::class, function (DictamenSolicitud $event) use ($solicitud, $verificador) {
            return $event->solicitudId === $solicitud->id
                && $event->usuarioId === $solicitud->coordinador_usuario_id
                && $event->resultado === 'VERIFICADA';
        });

        Event::assertDispatched(SolicitudListaParaAprobacion::class, function (SolicitudListaParaAprobacion $event) use ($solicitud) {
            return $event->solicitudId === $solicitud->id;
        });
    }

    public function test_el_verificador_puede_rechazar_con_observaciones_y_sin_lista_de_aprobacion(): void
    {
        Storage::fake('spaces');
        Event::fake([DictamenSolicitud::class, SolicitudListaParaAprobacion::class]);

        $verificador = $this->usuario('verificador');
        $sucursal = $verificador->sucursales()->firstOrFail();

        $solicitud = $this->crearSolicitud($sucursal->id, 'FLUJO-RECHAZAR', Solicitud::ESTADO_EN_REVISION, [
            'latitud' => 19.4331000,
            'longitud' => -99.1329000,
        ]);

        $this->actingAs($verificador)
            ->post(route('verificador.solicitudes.tomar', $solicitud->id));

        $this->actingAs($verificador)
            ->post(route('verificador.solicitudes.verificar', $solicitud->id), [
                'resultado' => 'RECHAZADA',
                'observaciones' => 'Se detectaron inconsistencias graves en el domicilio y en la documentación presentada.',
                'latitud_verificacion' => 19.4331000,
                'longitud_verificacion' => -99.1329000,
                'fecha_visita' => now()->toISOString(),
                'checklist' => [
                    'domicilio_correcto' => false,
                    'persona_identificada' => false,
                    'vehiculos_visibles' => false,
                    'documentos_validos' => false,
                ],
            ])
            ->assertRedirect(route('verificador.solicitudes.index'));

        $this->assertDatabaseHas('solicitudes', [
            'id' => $solicitud->id,
            'estado' => Solicitud::ESTADO_RECHAZADA,
        ]);

        $this->assertDatabaseHas('verificaciones_solicitud', [
            'solicitud_id' => $solicitud->id,
            'verificador_usuario_id' => $verificador->id,
            'resultado' => 'RECHAZADA',
        ]);

        Event::assertDispatched(DictamenSolicitud::class, function (DictamenSolicitud $event) use ($solicitud) {
            return $event->solicitudId === $solicitud->id
                && $event->resultado === 'RECHAZADA';
        });

        Event::assertNotDispatched(SolicitudListaParaAprobacion::class);
    }

    private function usuario(string $nombreUsuario): Usuario
    {
        return Usuario::where('nombre_usuario', $nombreUsuario)->firstOrFail();
    }

    private function crearSolicitud(int $sucursalId, string $prefijo, string $estado, array $coordenadas = []): Solicitud
    {
        $persona = Persona::create([
            'primer_nombre' => $prefijo,
            'segundo_nombre' => null,
            'apellido_paterno' => 'Prueba',
            'apellido_materno' => 'Verificador',
            'sexo' => 'M',
            'fecha_nacimiento' => '1990-01-01',
            'curp' => substr(strtoupper($prefijo . 'CURP0000000000'), 0, 18),
            'rfc' => substr(strtoupper($prefijo . 'RFC000000000'), 0, 13),
            'telefono_personal' => '5551112222',
            'telefono_celular' => '5551112222',
            'correo_electronico' => strtolower($prefijo) . '@prestamofacil.test',
            'calle' => 'Calle ' . $prefijo,
            'numero_exterior' => '123',
            'colonia' => 'Centro',
            'ciudad' => 'Ciudad de Mexico',
            'estado' => 'CDMX',
            'codigo_postal' => '06000',
            'latitud' => $coordenadas['latitud'] ?? 19.4326000,
            'longitud' => $coordenadas['longitud'] ?? -99.1332000,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        return Solicitud::create([
            'persona_solicitante_id' => $persona->id,
            'sucursal_id' => $sucursalId,
            'capturada_por_usuario_id' => $this->usuario('coordinador')->id,
            'coordinador_usuario_id' => $this->usuario('coordinador')->id,
            'estado' => $estado,
            'datos_familiares_json' => json_encode([
                'conyuge' => ['nombre' => 'Pareja ' . $prefijo, 'telefono' => '5553334444', 'ocupacion' => 'Comercio'],
                'hijos' => [['nombre' => 'Hijo ' . $prefijo, 'edad' => 10]],
                'padres' => [
                    'madre' => ['nombre' => 'Madre ' . $prefijo],
                    'padre' => ['nombre' => 'Padre ' . $prefijo],
                ],
            ]),
            'afiliaciones_externas_json' => json_encode([
                ['nombre' => 'Club ' . $prefijo, 'tipo' => 'Social', 'cargo' => 'Miembro'],
            ]),
            'vehiculos_json' => json_encode([
                ['marca' => 'Nissan', 'modelo' => 'Versa', 'tipo' => 'Sedan', 'placas' => 'ABC1234'],
            ]),
            'observaciones_validacion' => 'Solicitud generada para pruebas del verificador',
            'prevale_aprobado' => false,
            'fotos_casa_completas' => true,
            'enviada_en' => now(),
            'revisada_en' => null,
            'decidida_en' => null,
        ]);
    }
}
