<?php

namespace Tests\Feature\Coordinador;

use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportesCoordinadorTest extends TestCase
{
    use RefreshDatabase;

    public function test_reportes_coordinador_exponen_pipeline_y_cartera(): void
    {
        $coordinador = $this->crearCoordinadorConSucursal();
        $sucursal = $this->obtenerSucursalPrincipal($coordinador);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('PRE')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_PRE,
            'categoria_inicial_codigo' => 'COBRE',
            'creado_en' => now(),
        ]);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('VER')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
            'categoria_inicial_codigo' => 'COBRE',
            'creado_en' => now(),
        ]);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('APR')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_APROBADA,
            'categoria_inicial_codigo' => 'COBRE',
            'creado_en' => now(),
        ]);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('REJ')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'estado' => Solicitud::ESTADO_RECHAZADA,
            'categoria_inicial_codigo' => 'COBRE',
            'creado_en' => now(),
        ]);

        $activa = Distribuidora::query()->create([
            'persona_id' => $this->crearPersona('DST1')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'numero_distribuidora' => 'CO-DIST-01',
            'estado' => Distribuidora::ESTADO_ACTIVA,
            'limite_credito' => 5000,
            'credito_disponible' => 1500,
            'puntos_actuales' => 40,
        ]);

        Distribuidora::query()->create([
            'persona_id' => $this->crearPersona('DST2')->id,
            'sucursal_id' => $sucursal->id,
            'coordinador_usuario_id' => $coordinador->id,
            'numero_distribuidora' => 'CO-DIST-02',
            'estado' => Distribuidora::ESTADO_MOROSA,
            'limite_credito' => 6000,
            'credito_disponible' => 500,
            'puntos_actuales' => 10,
        ]);

        $cliente = Cliente::query()->create([
            'persona_id' => $this->crearPersona('CLI')->id,
            'codigo_cliente' => 'CL-001',
            'estado' => Cliente::ESTADO_ACTIVO,
        ]);

        DB::table('clientes_distribuidora')->insert([
            'distribuidora_id' => $activa->id,
            'cliente_id' => $cliente->id,
            'estado_relacion' => 'ACTIVA',
            'bloqueado_por_parentesco' => false,
            'vinculado_en' => now(),
        ]);

        $response = $this->actingAs($coordinador)
            ->get(route('coordinador.reportes', ['periodo' => 'mes']));

        $response->assertOk();
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('Coordinador/Reportes')
                ->where('filtro.periodo', 'mes')
                ->where('resumen.solicitudes_total_periodo', 4)
                ->where('resumen.solicitudes_pendientes', 1)
                ->where('resumen.solicitudes_validadas', 1)
                ->where('resumen.solicitudes_aprobadas', 1)
                ->where('resumen.solicitudes_rechazadas', 1)
                ->where('resumen.distribuidoras_asignadas', 2)
                ->where('resumen.clientes_activos', 1)
                ->where('resumen.distribuidoras_morosas', 1)
                ->has('topDistribuidoras', 2)
        );
    }

    private function crearCoordinadorConSucursal(string $sufijo = ''): Usuario
    {
        $persona = $this->crearPersona('COO' . $sufijo);

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => 'coord_' . strtolower($sufijo ?: 'reportes'),
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        $rolCoordinador = Rol::query()->firstOrCreate(
            ['codigo' => 'COORDINADOR'],
            ['nombre' => 'Coordinador', 'activo' => true]
        );

        $sucursal = Sucursal::query()->create([
            'codigo' => 'SC' . strtoupper($sufijo ?: 'M'),
            'nombre' => 'Sucursal Coordinador ' . strtoupper($sufijo ?: 'Principal'),
            'activo' => true,
        ]);

        DB::table('usuario_rol')->insert([
            'usuario_id' => $usuario->id,
            'rol_id' => $rolCoordinador->id,
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
