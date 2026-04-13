<?php

namespace Tests\Feature\Gerente;

use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\RelacionCorte;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportesGerenteTest extends TestCase
{
    use RefreshDatabase;

    public function test_reportes_gerente_incluye_metricas_nuevas(): void
    {
        $gerente = $this->crearGerenteConSucursal();
        $sucursal = $this->obtenerSucursalPrincipal($gerente);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('PRE')->id,
            'sucursal_id' => $sucursal->id,
            'estado' => Solicitud::ESTADO_PRE,
            'categoria_inicial_codigo' => 'COBRE',
            'creado_en' => now(),
        ]);

        Solicitud::query()->create([
            'persona_solicitante_id' => $this->crearPersona('VER')->id,
            'sucursal_id' => $sucursal->id,
            'estado' => Solicitud::ESTADO_VERIFICADA,
            'categoria_inicial_codigo' => 'PLATA',
            'creado_en' => now(),
        ]);

        $distribuidora = Distribuidora::query()->create([
            'persona_id' => $this->crearPersona('MOR')->id,
            'sucursal_id' => $sucursal->id,
            'numero_distribuidora' => 'DIST-001',
            'estado' => Distribuidora::ESTADO_MOROSA,
            'limite_credito' => 5000,
            'credito_disponible' => 1200,
            'puntos_actuales' => 90,
        ]);

        $corte = Corte::query()->create([
            'sucursal_id' => $sucursal->id,
            'tipo_corte' => Corte::TIPO_MIXTO,
            'fecha_programada' => now()->subDay(),
            'fecha_ejecucion' => now()->subDay(),
            'estado' => Corte::ESTADO_EJECUTADO,
        ]);

        RelacionCorte::query()->create([
            'corte_id' => $corte->id,
            'distribuidora_id' => $distribuidora->id,
            'numero_relacion' => 'REL-001',
            'fecha_limite_pago' => now()->toDateString(),
            'puntos_snapshot' => 55,
            'total_a_pagar' => 1000,
            'total_pago' => 200,
            'estado' => RelacionCorte::ESTADO_VENCIDA,
        ]);

        $response = $this->actingAs($gerente)
            ->get(route('gerente.reportes', ['periodo' => 'mes']));

        $response->assertOk();
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('Gerente/Reportes')
                ->where('filtro.periodo', 'mes')
                ->where('resumen.presolicitudes_pendientes', 1)
                ->where('resumen.presolicitudes_validadas', 1)
                ->where('resumen.capital_colocado', 0)
                ->where('resumen.saldo_cortes', 800)
                ->where('saldoCortes.monto_vencido', 800)
                ->has('puntosPorDistribuidora', 1)
        );
    }

    private function crearGerenteConSucursal(string $sufijo = ''): Usuario
    {
        $persona = $this->crearPersona('GER' . $sufijo);

        /** @var Usuario $usuario */
        $usuario = Usuario::query()->create([
            'persona_id' => $persona->id,
            'nombre_usuario' => 'gerente_' . strtolower($sufijo ?: 'reportes'),
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
            'codigo' => 'SR' . strtoupper($sufijo ?: 'M'),
            'nombre' => 'Sucursal Reportes ' . strtoupper($sufijo ?: 'Principal'),
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
