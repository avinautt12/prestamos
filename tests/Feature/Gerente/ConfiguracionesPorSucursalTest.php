<?php

namespace Tests\Feature\Gerente;

use App\Models\CategoriaDistribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConfiguracionesPorSucursalTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardado_categoria_y_producto_es_por_sucursal_y_no_global(): void
    {
        [$gerenteUno, $sucursalUno] = $this->crearGerenteConSucursal('UNO');
        [$gerenteDos, $sucursalDos] = $this->crearGerenteConSucursal('DOS');

        $categoria = CategoriaDistribuidora::query()->create([
            'codigo' => 'CAT-BASE',
            'nombre' => 'Categoria Base',
            'porcentaje_comision' => 6,
            'puntos_por_cada_1200' => 3,
            'valor_punto' => 2,
            'castigo_pct_atraso' => 20,
            'activo' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $producto = ProductoFinanciero::query()->create([
            'codigo' => 'PROD-BASE',
            'nombre' => 'Producto Base',
            'monto_principal' => 10000,
            'numero_quincenas' => 10,
            'porcentaje_comision_empresa' => 5,
            'monto_seguro' => 250,
            'porcentaje_interes_quincenal' => 1.5,
            'modo_desembolso' => ProductoFinanciero::MODO_TRANSFERENCIA,
            'activo' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $this->actingAs($gerenteUno)->put(
            route('gerente.configuraciones.categorias.update', $categoria->id),
            [
                'nombre' => 'Categoria Sucursal Uno',
                'porcentaje_comision' => 9.5,
            ]
        )->assertRedirect();

        $this->actingAs($gerenteUno)->put(
            route('gerente.configuraciones.productos.update', $producto->id),
            [
                'monto_principal' => 12500,
                'monto_seguro' => 300,
                'porcentaje_comision_empresa' => 6,
                'porcentaje_interes_quincenal' => 1.8,
                'numero_quincenas' => 12,
            ]
        )->assertRedirect();

        $categoria->refresh();
        $producto->refresh();

        $this->assertSame('Categoria Base', $categoria->nombre);
        $this->assertEquals(6.0, (float) $categoria->porcentaje_comision);
        $this->assertEquals(10000.0, (float) $producto->monto_principal);

        $configUno = SucursalConfiguracion::query()->where('sucursal_id', $sucursalUno->id)->first();
        $this->assertNotNull($configUno);

        $overrideCategoriaUno = (array) (($configUno->categorias_config_json ?? [])[(string) $categoria->id] ?? []);
        $overrideProductoUno = (array) (($configUno->productos_config_json ?? [])[(string) $producto->id] ?? []);

        $this->assertSame('Categoria Sucursal Uno', $overrideCategoriaUno['nombre'] ?? null);
        $this->assertEquals(9.5, (float) ($overrideCategoriaUno['porcentaje_comision'] ?? 0));
        $this->assertEquals(12500.0, (float) ($overrideProductoUno['monto_principal'] ?? 0));
        $this->assertEquals(12, (int) ($overrideProductoUno['numero_quincenas'] ?? 0));

        $configDos = SucursalConfiguracion::query()->where('sucursal_id', $sucursalDos->id)->first();
        $this->assertTrue($configDos === null || empty(($configDos->categorias_config_json ?? [])[(string) $categoria->id] ?? null));
        $this->assertTrue($configDos === null || empty(($configDos->productos_config_json ?? [])[(string) $producto->id] ?? null));

        $this->actingAs($gerenteDos)->get(route('gerente.configuraciones'))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Gerente/Configuraciones'));
    }

    private function crearGerenteConSucursal(string $sufijo): array
    {
        $persona = Persona::query()->create([
            'primer_nombre' => 'Gerente',
            'apellido_paterno' => $sufijo,
            'curp' => 'GE' . str_pad($sufijo, 16, 'X'),
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => 'gerente_cfg_' . strtolower($sufijo),
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $rolGerente = Rol::query()->firstOrCreate(
            ['codigo' => 'GERENTE'],
            ['nombre' => 'Gerente', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now()]
        );

        $sucursal = Sucursal::query()->create([
            'codigo' => 'CFG-' . strtoupper($sufijo),
            'nombre' => 'Sucursal Config ' . strtoupper($sufijo),
            'activo' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        DB::table('usuario_rol')->insert([
            'usuario_id' => $usuario->id,
            'rol_id' => $rolGerente->id,
            'sucursal_id' => $sucursal->id,
            'asignado_en' => now(),
            'revocado_en' => null,
            'es_principal' => true,
        ]);

        return [$usuario, $sucursal];
    }
}
