<?php

namespace Tests\Feature\Traspasos;

use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\Rol;
use App\Models\SolicitudTraspasoCliente;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\Vale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TraspasoClienteFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_flujo_completo_traspaso_cliente(): void
    {
        $sucursal = $this->crearSucursal();
        $coordinador = $this->crearUsuarioConRol('COORDINADOR', 'coord_traspaso', $sucursal);

        [$usuarioOrigen, $distOrigen] = $this->crearDistribuidoraConUsuario('ori', $coordinador, $sucursal);
        [$usuarioDestino, $distDestino] = $this->crearDistribuidoraConUsuario('des', $coordinador, $sucursal);

        $cliente = $this->crearCliente('CLI-TRASP-001');

        DB::table('clientes_distribuidora')->insert([
            'distribuidora_id' => $distOrigen->id,
            'cliente_id' => $cliente->id,
            'estado_relacion' => 'ACTIVA',
            'vinculado_en' => now()->subDays(10),
        ]);

        $this->actingAs($usuarioDestino)->post(route('distribuidora.traspasos.store'), [
            'codigo_cliente' => 'CLI-TRASP-001',
            'motivo_solicitud' => 'Cliente solicita cambio por cercania.',
        ])->assertRedirect(route('distribuidora.traspasos.index'));

        /** @var SolicitudTraspasoCliente $solicitud */
        $solicitud = SolicitudTraspasoCliente::query()->firstOrFail();

        $this->assertSame(SolicitudTraspasoCliente::ESTADO_PENDIENTE_COORDINADOR, $solicitud->estado);

        $this->actingAs($coordinador)
            ->post(route('coordinador.traspasos.aprobar', $solicitud->id))
            ->assertRedirect(route('coordinador.traspasos.index'));

        $solicitud->refresh();

        $this->assertSame(SolicitudTraspasoCliente::ESTADO_APROBADA_CODIGO, $solicitud->estado);
        $this->assertNotEmpty($solicitud->codigo_confirmacion);

        $this->actingAs($usuarioOrigen)->post(route('distribuidora.traspasos.confirmar', $solicitud->id), [
            'codigo_confirmacion' => $solicitud->codigo_confirmacion,
        ])->assertRedirect(route('distribuidora.traspasos.index'));

        $solicitud->refresh();

        $this->assertSame(SolicitudTraspasoCliente::ESTADO_EJECUTADA, $solicitud->estado);

        $this->assertDatabaseHas('clientes_distribuidora', [
            'distribuidora_id' => $distOrigen->id,
            'cliente_id' => $cliente->id,
            'estado_relacion' => 'TERMINADA',
        ]);

        $this->assertDatabaseHas('clientes_distribuidora', [
            'distribuidora_id' => $distDestino->id,
            'cliente_id' => $cliente->id,
            'estado_relacion' => 'ACTIVA',
        ]);
    }

    public function test_no_permite_solicitar_traspaso_si_cliente_tiene_deuda_abierta(): void
    {
        $sucursal = $this->crearSucursal('SUC-DEU', 'Sucursal Deuda');
        $coordinador = $this->crearUsuarioConRol('COORDINADOR', 'coord_deuda', $sucursal);

        [, $distOrigen] = $this->crearDistribuidoraConUsuario('ori2', $coordinador, $sucursal);
        [$usuarioDestino,] = $this->crearDistribuidoraConUsuario('des2', $coordinador, $sucursal);

        $cliente = $this->crearCliente('CLI-DEUDA-001');

        DB::table('clientes_distribuidora')->insert([
            'distribuidora_id' => $distOrigen->id,
            'cliente_id' => $cliente->id,
            'estado_relacion' => 'ACTIVA',
            'vinculado_en' => now()->subDays(10),
        ]);

        $producto = ProductoFinanciero::query()->create([
            'codigo' => 'PRD-DEUDA',
            'nombre' => 'Producto Prueba',
            'descripcion' => 'Test',
            'monto_principal' => 1200,
            'numero_quincenas' => 4,
            'porcentaje_comision_empresa' => 5,
            'monto_seguro' => 0,
            'porcentaje_interes_quincenal' => 3,
            'monto_multa_tardia' => 0,
            'modo_desembolso' => 'TRANSFERENCIA',
            'activo' => true,
        ]);

        Vale::query()->create([
            'numero_vale' => 'VALE-DEUDA-001',
            'distribuidora_id' => $distOrigen->id,
            'cliente_id' => $cliente->id,
            'producto_financiero_id' => $producto->id,
            'sucursal_id' => $sucursal->id,
            'estado' => Vale::ESTADO_ACTIVO,
            'monto' => 1200,
            'porcentaje_comision_empresa_snap' => 0,
            'monto_comision_empresa' => 0,
            'monto_seguro_snap' => 0,
            'porcentaje_interes_snap' => 0,
            'monto_interes' => 0,
            'porcentaje_ganancia_dist_snap' => 0,
            'monto_ganancia_distribuidora' => 0,
            'monto_multa_snap' => 0,
            'monto_total_deuda' => 1200,
            'monto_quincenal' => 300,
            'quincenas_totales' => 4,
            'pagos_realizados' => 0,
            'saldo_actual' => 1200,
        ]);

        $this->actingAs($usuarioDestino)->post(route('distribuidora.traspasos.store'), [
            'codigo_cliente' => 'CLI-DEUDA-001',
        ])->assertSessionHasErrors('codigo_cliente');

        $this->assertDatabaseCount('solicitudes_traspaso_cliente', 0);
    }

    private function crearSucursal(string $codigo = 'SUC-T01', string $nombre = 'Sucursal Traspaso'): Sucursal
    {
        return Sucursal::query()->create([
            'codigo' => $codigo,
            'nombre' => $nombre,
            'activo' => true,
        ]);
    }

    private function crearUsuarioConRol(string $codigoRol, string $nombreUsuario, Sucursal $sucursal): Usuario
    {
        $persona = Persona::query()->create([
            'primer_nombre' => strtoupper(substr($nombreUsuario, 0, 4)),
            'apellido_paterno' => 'Prueba',
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

    private function crearDistribuidoraConUsuario(string $sufijo, Usuario $coordinador, Sucursal $sucursal): array
    {
        $usuario = $this->crearUsuarioConRol('DISTRIBUIDORA', 'dist_' . $sufijo, $sucursal);

        $distribuidora = Distribuidora::query()->create([
            'persona_id' => $usuario->persona_id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'numero_distribuidora' => 'DIST-' . strtoupper($sufijo),
            'estado' => Distribuidora::ESTADO_ACTIVA,
            'limite_credito' => 10000,
            'credito_disponible' => 10000,
            'sin_limite' => false,
            'puntos_actuales' => 0,
            'puede_emitir_vales' => true,
            'es_externa' => false,
            'activada_en' => now()->subDays(5),
        ]);

        return [$usuario, $distribuidora];
    }

    private function crearCliente(string $codigo): Cliente
    {
        $persona = Persona::query()->create([
            'primer_nombre' => 'Cliente',
            'apellido_paterno' => 'Demo',
        ]);

        return Cliente::query()->create([
            'persona_id' => $persona->id,
            'codigo_cliente' => $codigo,
            'estado' => Cliente::ESTADO_ACTIVO,
        ]);
    }
}
