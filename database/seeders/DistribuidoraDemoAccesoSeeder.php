<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DistribuidoraDemoAccesoSeeder extends Seeder
{
    public function run(): void
    {
        $passwordDemo = 'password123';

        $sucursal = Sucursal::query()
            ->where('activo', true)
            ->orderBy('codigo')
            ->first();

        if (!$sucursal) {
            $this->command?->warn('No hay sucursales activas para crear la distribuidora demo.');
            return;
        }

        $categoria = CategoriaDistribuidora::query()
            ->where('activo', true)
            ->orderByRaw("CASE WHEN codigo = 'PLATA' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->first();

        $rolDistribuidora = Rol::query()
            ->where('codigo', 'DISTRIBUIDORA')
            ->where('activo', true)
            ->first();

        if (!$rolDistribuidora) {
            $this->command?->warn('No existe rol DISTRIBUIDORA activo.');
            return;
        }

        $personaDistribuidora = Persona::updateOrCreate(
            ['correo_electronico' => 'dist.demo.activa@demo.local'],
            [
                'primer_nombre' => 'Distribuidora',
                'apellido_paterno' => 'Demo',
                'apellido_materno' => 'Activa',
                'sexo' => 'F',
                'curp' => 'DEMA900101MCLMCT01',
                'rfc' => 'DEMA900101AAA',
                'telefono_celular' => '8719001000',
                'correo_electronico' => 'dist.demo.activa@demo.local',
                'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]
        );

        $distribuidora = Distribuidora::updateOrCreate(
            ['numero_distribuidora' => 'DIST-DEMO-ACTIVA-01'],
            [
                'persona_id' => $personaDistribuidora->id,
                'solicitud_id' => null,
                'sucursal_id' => $sucursal->id,
                'coordinador_usuario_id' => null,
                'categoria_id' => $categoria?->id,
                'numero_distribuidora' => 'DIST-DEMO-ACTIVA-01',
                'estado' => Distribuidora::ESTADO_ACTIVA,
                'limite_credito' => 80000,
                'credito_disponible' => 42000,
                'sin_limite' => false,
                'puntos_actuales' => 100,
                'puede_emitir_vales' => true,
                'es_externa' => false,
                'activada_en' => now()->subDays(10),
                'desactivada_en' => null,
            ]
        );

        $usuario = Usuario::query()->where('persona_id', $personaDistribuidora->id)->first();

        if (!$usuario) {
            $usuario = Usuario::query()->create([
                'persona_id' => $personaDistribuidora->id,
                'nombre_usuario' => 'distdemoactiva01',
                'clave_hash' => Hash::make($passwordDemo),
                'activo' => true,
                'requiere_vpn' => false,
                'canal_login' => Usuario::CANAL_WEB,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]);
        } else {
            $usuario->update([
                'nombre_usuario' => 'distdemoactiva01',
                'clave_hash' => Hash::make($passwordDemo),
                'activo' => true,
                'requiere_vpn' => false,
                'canal_login' => Usuario::CANAL_WEB,
                'actualizado_en' => now(),
            ]);
        }

        DB::table('usuario_rol')->updateOrInsert(
            [
                'usuario_id' => $usuario->id,
                'rol_id' => $rolDistribuidora->id,
                'sucursal_id' => $sucursal->id,
            ],
            [
                'asignado_en' => now(),
                'revocado_en' => null,
                'es_principal' => true,
            ]
        );

        for ($i = 1; $i <= 2; $i++) {
            $personaCliente = Persona::updateOrCreate(
                ['correo_electronico' => 'cli.dist.demo.activa.' . $i . '@demo.local'],
                [
                    'primer_nombre' => 'Cliente',
                    'apellido_paterno' => 'Demo',
                    'apellido_materno' => 'Activa' . $i,
                    'sexo' => $i % 2 === 0 ? 'F' : 'M',
                    'curp' => sprintf('CDAA91010%dHCLMCT0%d', $i, $i),
                    'rfc' => sprintf('CDAA91010%dAA%d', $i, $i),
                    'telefono_celular' => '87190110' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                    'correo_electronico' => 'cli.dist.demo.activa.' . $i . '@demo.local',
                    'ciudad' => str_contains($sucursal->codigo, 'GPO') ? 'Gomez Palacio' : 'Torreon',
                    'estado' => str_contains($sucursal->codigo, 'GPO') ? 'Durango' : 'Coahuila',
                    'codigo_postal' => str_contains($sucursal->codigo, 'GPO') ? '35000' : '27000',
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            $codigoCliente = 'CL-DIST-DEMO-ACTIVA-' . $i;
            $cliente = Cliente::query()->firstOrNew(['codigo_cliente' => $codigoCliente]);
            $cliente->fill([
                'persona_id' => $personaCliente->id,
                'codigo_cliente' => $codigoCliente,
                'estado' => Cliente::ESTADO_ACTIVO,
                'notas' => 'Cliente demo vinculado a DIST-DEMO-ACTIVA-01',
                'actualizado_en' => now(),
            ]);

            if (!$cliente->exists) {
                $cliente->creado_en = now();
            }

            $cliente->save();

            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id' => $cliente->id,
                ],
                [
                    'estado_relacion' => 'ACTIVA',
                    'bloqueado_por_parentesco' => false,
                    'observaciones_parentesco' => null,
                    'vinculado_en' => now()->subDays(5 + $i),
                    'desvinculado_en' => null,
                ]
            );
        }

        $this->command?->info('Distribuidora demo de acceso creada/actualizada.');
        $this->command?->line('Sucursal: ' . $sucursal->codigo);
        $this->command?->line('Distribuidora: DIST-DEMO-ACTIVA-01');
        $this->command?->line('Usuario: distdemoactiva01');
        $this->command?->line('Password: ' . $passwordDemo);
    }
}
