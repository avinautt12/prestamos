<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\Vale;

class DetectarValesMorosos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:detectar-vales-morosos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detecta todos los vales que pasaron su fecha limite y los etiqueta como MOROSO.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando detección de vales morosos...');

        $vales = Vale::with(['distribuidora.coordinador', 'cliente.persona', 'sucursal'])
            ->whereIn('estado', [Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL])
            ->whereNotNull('fecha_limite_pago')
            ->where('fecha_limite_pago', '<', now()->toDateString())
            ->where('saldo_actual', '>', 0)
            ->get();

        $afectados = 0;

        foreach ($vales as $vale) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($vale) {
                $vale->update(['estado' => Vale::ESTADO_MOROSO]);
                
                $distribuidora = $vale->distribuidora;
                if ($distribuidora) {
                    $puntosActuales = (int) $distribuidora->puntos_actuales;
                    if ($puntosActuales > 0) {
                        $reglas = app(\App\Services\ServicioReglasNegocio::class);
                        $calculoPenalizacion = $reglas->calcularPenalizacionAtraso($puntosActuales, 20); // Regla PDF: 20%
                        $perdidos = $calculoPenalizacion['puntos_perdidos'];
                        
                        if ($perdidos > 0) {
                            $distribuidora->decrement('puntos_actuales', $perdidos);
                            if (class_exists(\App\Models\MovimientoPunto::class)) {
                                \App\Models\MovimientoPunto::create([
                                    'distribuidora_id' => $distribuidora->id,
                                    'vale_id' => $vale->id,
                                    'tipo_movimiento' => \App\Models\MovimientoPunto::TIPO_PENALIZACION_ATRASO,
                                    'puntos' => -$perdidos,
                                    'valor_punto_snapshot' => 2.00,
                                    'motivo' => "Castigo 20% por Mora en Vale {$vale->numero_vale}",
                                ]);
                            }
                        }
                    }

                    $nombreCliente = $vale->cliente?->persona?->primer_nombre . ' ' . $vale->cliente?->persona?->apellido_paterno;
                    $noti = new \App\Notifications\NotificacionOperativa(
                        titulo: 'Alerta de Mora Crítica',
                        mensaje: "El cliente {$nombreCliente} (Vale {$vale->numero_vale}) entró en estado MOROSO. Se castigó a la Distribuidora.",
                        tipo: 'error'
                    );

                    // Notificar Coordinador
                    if ($distribuidora->coordinador) {
                        $distribuidora->coordinador->notify($noti);
                    }

                    // Notificar Cajeras de esa sucursal
                    if ($vale->sucursal_id) {
                        $cajeras = \App\Models\Usuario::where('activo', true)
                            ->whereHas('roles', function($q) use ($vale) {
                                $q->where('codigo', 'CAJERA')
                                  ->where('usuario_rol.sucursal_id', $vale->sucursal_id);
                            })->get();
                        
                        foreach ($cajeras as $cajera) {
                            $cajera->notify($noti);
                        }
                    }
                }
            });
            $afectados++;
        }

        Log::info("Comando detectar-vales-morosos ejecutado. Vales afectados: {$afectados}");
        
        $this->info("Proceso completado. {$afectados} vales fueron procesados, notificados y multados.");
        
        return Command::SUCCESS;
    }
}
