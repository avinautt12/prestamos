<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\RelacionCorte;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Notifications\NotificacionOperativa;
use App\Models\Usuario;
use App\Services\ServicioReglasNegocio;

class DetectarDistribuidorasMorosas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:detectar-distribuidoras-morosas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detecta relaciones de corte vencidas y etiqueta a las distribuidoras en MOROSA, aplicando penalizaciones.';

    /**
     * Execute the console command.
     */
    public function handle(ServicioReglasNegocio $reglas)
    {
        $this->info('Iniciando detección de distribuidoras morosas...');

        // Buscar relaciones de corte generadas o parciales cuya fecha limite ya pasó
        $relacionesVencidas = RelacionCorte::with(['distribuidora.coordinador', 'corte.sucursal'])
            ->whereIn('estado', [RelacionCorte::ESTADO_GENERADA, RelacionCorte::ESTADO_PARCIAL])
            ->whereNotNull('fecha_limite_pago')
            ->where('fecha_limite_pago', '<', now()->toDateString())
            ->get();

        $afectados = 0;

        foreach ($relacionesVencidas as $relacion) {
            DB::transaction(function () use ($relacion, $reglas) {
                // 1. Marcar relación como vencida
                $relacion->update(['estado' => RelacionCorte::ESTADO_VENCIDA]);
                
                $distribuidora = $relacion->distribuidora;
                if ($distribuidora) {
                    // Solo castigar si estaba activa (si ya era morosa, ya se le castigó antes tal vez,
                    // pero para prevenir dobles castigos por distintos cortes, validamos que su estatus cambie)
                    $yaEraMorosa = $distribuidora->estado === Distribuidora::ESTADO_MOROSA;
                    
                    // 2. Marcar distribuidora como MOROSA
                    $distribuidora->update([
                        'estado' => Distribuidora::ESTADO_MOROSA,
                        'puede_emitir_vales' => false
                    ]);
                    
                    if (!$yaEraMorosa) {
                        // 3. Penalizar puntos (Ej. 20% según Reglas de Negocio)
                        $puntosActuales = (float) $distribuidora->puntos_actuales;
                        if ($puntosActuales > 0) {
                            $calculoPenalizacion = $reglas->calcularPenalizacionAtraso($puntosActuales, 20); // Regla PDF: 20%
                            $perdidos = $calculoPenalizacion['puntos_perdidos'];
                            
                            if ($perdidos > 0) {
                                $distribuidora->decrement('puntos_actuales', $perdidos);
                                if (class_exists(MovimientoPunto::class)) {
                                    MovimientoPunto::create([
                                        'distribuidora_id' => $distribuidora->id,
                                        'tipo_movimiento' => MovimientoPunto::TIPO_PENALIZACION_ATRASO,
                                        'puntos' => -$perdidos,
                                        'valor_punto_snapshot' => 2.00,
                                        'motivo' => "Castigo 20% por Corte Vencido: {$relacion->numero_relacion}",
                                    ]);
                                }
                            }
                        }

                        // 4. Notificaciones
                        $nombreDist = $distribuidora->persona?->primer_nombre . ' ' . $distribuidora->persona?->apellido_paterno;
                        $noti = new NotificacionOperativa(
                            titulo: 'Alerta de Mora Crítica',
                            mensaje: "La Distribuidora {$nombreDist} (Corte {$relacion->numero_relacion}) no liquidó a tiempo y entró en MOROSA.",
                            tipo: 'error'
                        );

                        // Notificar Coordinador
                        if ($distribuidora->coordinador) {
                            $distribuidora->coordinador->notify($noti);
                        }

                        // Notificar Cajeras de esa sucursal
                        if ($distribuidora->sucursal_id) {
                            $cajeras = Usuario::where('activo', true)
                                ->whereHas('roles', function($q) use ($distribuidora) {
                                    $q->where('codigo', 'CAJERA')
                                      ->where('usuario_rol.sucursal_id', $distribuidora->sucursal_id);
                                })->get();
                            
                            foreach ($cajeras as $cajera) {
                                $cajera->notify($noti);
                            }
                        }
                    }
                }
            });
            $afectados++;
        }

        Log::info("Comando detectar-distribuidoras-morosas ejecutado. Cortes vencidos: {$afectados}");
        $this->info("Proceso completado. {$afectados} cortes vencidos procesados y vinculados a sus distribuidoras.");
        
        return Command::SUCCESS;
    }
}
