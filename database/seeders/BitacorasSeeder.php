<?php

namespace Database\Seeders;

use App\Models\BitacoraConfiguracionSucursal;
use App\Models\BitacoraDecisionGerente;
use App\Models\Distribuidora;
use App\Models\Solicitud;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class BitacorasSeeder extends Seeder
{
    /**
     * Crea bitacoras de ejemplo cubriendo los tipos de evento:
     * - BitacoraDecisionGerente: NUEVA_DISTRIBUIDORA, INCREMENTO_LIMITE, APROBACION, RECHAZO
     * - BitacoraConfiguracionSucursal: SUCURSAL, CATEGORIA, PRODUCTO
     */
    public function run(): void
    {
        $gerenteCentro = Usuario::where('nombre_usuario', 'gerente')->first();
        $gerenteNorte  = Usuario::where('nombre_usuario', 'gerente.trc_nte')->first();

        $solicitudAprobada = Solicitud::where('estado', Solicitud::ESTADO_APROBADA)->first();
        $solicitudRechazada = Solicitud::where('estado', Solicitud::ESTADO_RECHAZADA)->first();
        $distActiva = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)->orderBy('id')->first();

        // === BITACORA DE DECISIONES GERENTE ===
        if ($gerenteCentro && $solicitudAprobada) {
            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerenteCentro->id,
                'solicitud_id'       => $solicitudAprobada->id,
                'distribuidora_id'   => null,
                'tipo_evento'        => 'APROBACION',
                'monto_anterior'     => 0.00,
                'monto_nuevo'        => $solicitudAprobada->limite_credito_solicitado,
                'creado_en'          => now()->subDays(7),
                'actualizado_en'     => now()->subDays(7),
            ]);
        }

        if ($gerenteCentro && $distActiva && $solicitudAprobada) {
            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerenteCentro->id,
                'solicitud_id'       => $solicitudAprobada->id,
                'distribuidora_id'   => $distActiva->id,
                'tipo_evento'        => 'NUEVA_DISTRIBUIDORA',
                'monto_anterior'     => 0.00,
                'monto_nuevo'        => $distActiva->limite_credito,
                'creado_en'          => now()->subDays(30),
                'actualizado_en'     => now()->subDays(30),
            ]);

            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerenteCentro->id,
                'solicitud_id'       => $solicitudAprobada->id,
                'distribuidora_id'   => $distActiva->id,
                'tipo_evento'        => 'INCREMENTO_LIMITE',
                'monto_anterior'     => 30000.00,
                'monto_nuevo'        => $distActiva->limite_credito,
                'creado_en'          => now()->subDays(15),
                'actualizado_en'     => now()->subDays(15),
            ]);
        }

        if ($gerenteCentro && $solicitudRechazada) {
            BitacoraDecisionGerente::create([
                'gerente_usuario_id' => $gerenteCentro->id,
                'solicitud_id'       => $solicitudRechazada->id,
                'distribuidora_id'   => null,
                'tipo_evento'        => 'RECHAZO',
                'monto_anterior'     => 0.00,
                'monto_nuevo'        => 0.00,
                'creado_en'          => now()->subDays(3),
                'actualizado_en'     => now()->subDays(3),
            ]);
        }

        // === BITACORA DE CONFIGURACION DE SUCURSAL ===
        $configuraciones = SucursalConfiguracion::with('sucursal')->get();
        foreach ($configuraciones as $i => $config) {
            BitacoraConfiguracionSucursal::create([
                'sucursal_configuracion_id'  => $config->id,
                'sucursal_id'                => $config->sucursal_id,
                'actualizado_por_usuario_id' => $gerenteCentro?->id,
                'tipo_evento'                => 'SUCURSAL',
                'referencia_id'              => null,
                'cambios_antes_json'         => [
                    'linea_credito_default' => 30000.00,
                    'hora_corte'            => '17:00:00',
                ],
                'cambios_despues_json'       => [
                    'linea_credito_default' => (float) $config->linea_credito_default,
                    'hora_corte'            => $config->hora_corte,
                ],
                'creado_en'                  => now()->subDays(10 - $i),
                'actualizado_en'             => now()->subDays(10 - $i),
            ]);
        }

        // Un cambio de CATEGORIA de ejemplo (sucursal Centro)
        $configCentro = SucursalConfiguracion::whereHas('sucursal', fn ($q) => $q->where('codigo', 'SUC-TRC-CENTRO'))->first();
        if ($configCentro && $gerenteCentro) {
            BitacoraConfiguracionSucursal::create([
                'sucursal_configuracion_id'  => $configCentro->id,
                'sucursal_id'                => $configCentro->sucursal_id,
                'actualizado_por_usuario_id' => $gerenteCentro->id,
                'tipo_evento'                => 'CATEGORIA',
                'referencia_id'              => null,
                'cambios_antes_json'         => ['codigo' => 'PLATA', 'porcentaje_comision' => 5.0000],
                'cambios_despues_json'       => ['codigo' => 'PLATA', 'porcentaje_comision' => 6.0000],
                'creado_en'                  => now()->subDays(5),
                'actualizado_en'             => now()->subDays(5),
            ]);

            BitacoraConfiguracionSucursal::create([
                'sucursal_configuracion_id'  => $configCentro->id,
                'sucursal_id'                => $configCentro->sucursal_id,
                'actualizado_por_usuario_id' => $gerenteCentro->id,
                'tipo_evento'                => 'PRODUCTO',
                'referencia_id'              => null,
                'cambios_antes_json'         => ['codigo' => 'PRESTAMO-8/12000', 'porcentaje_interes_quincenal' => 2.0000],
                'cambios_despues_json'       => ['codigo' => 'PRESTAMO-8/12000', 'porcentaje_interes_quincenal' => 1.8000],
                'creado_en'                  => now()->subDays(4),
                'actualizado_en'             => now()->subDays(4),
            ]);
        }

        $this->command?->info('Bitacoras creadas: 4 decisiones gerente + 3 configuraciones sucursal + 2 cambios (categoria, producto).');
    }
}
