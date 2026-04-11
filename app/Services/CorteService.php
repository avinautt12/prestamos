<?php

namespace App\Services;

use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\PartidaRelacionCorte;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use App\Models\Vale;
use App\Services\Distribuidora\DistribuidoraNotificationService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CorteService
{
    public function __construct(
        private readonly DistribuidoraNotificationService $distribuidoraNotificationService
    ) {}

    public function sincronizarProximoCorteProgramado(Sucursal $sucursal, SucursalConfiguracion $configuracion): ?Corte
    {
        $diaCorte = $configuracion->dia_corte;
        $horaCorte = $configuracion->hora_corte;

        if (!$diaCorte || !$horaCorte) {
            return null;
        }

        $fechaProgramada = $this->calcularFechaProgramada((int) $diaCorte, (string) $horaCorte);

        return Corte::query()->updateOrCreate(
            [
                'sucursal_id' => $sucursal->id,
                'estado' => Corte::ESTADO_PROGRAMADO,
                'observaciones' => 'AUTO_CONFIG_SUCURSAL',
            ],
            [
                'tipo_corte' => Corte::TIPO_PAGOS,
                'dia_base_mes' => (int) $diaCorte,
                'hora_base' => $horaCorte,
                'fecha_programada' => $fechaProgramada,
                'mantener_fecha_en_inhabil' => true,
            ]
        );
    }

    public function obtenerProximoCorte(Sucursal $sucursal): ?Corte
    {
        $proximo = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Corte::ESTADO_PROGRAMADO)
            ->whereDate('fecha_programada', '>=', today())
            ->orderBy('fecha_programada')
            ->first();

        if ($proximo) {
            $proximo->setAttribute('es_atrasado', false);
            return $proximo;
        }

        $atrasado = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Corte::ESTADO_PROGRAMADO)
            ->orderBy('fecha_programada')
            ->first();

        if ($atrasado) {
            $atrasado->setAttribute('es_atrasado', true);
        }

        return $atrasado;
    }

    public function obtenerCortesMes(Sucursal $sucursal, ?Carbon $mes = null): Collection
    {
        $mes = $mes ?? now();
        $inicio = $mes->copy()->startOfMonth();
        $fin = $mes->copy()->endOfMonth();

        return Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->whereBetween('fecha_programada', [$inicio, $fin])
            ->orderBy('fecha_programada')
            ->get();
    }

    public function cerrarManual(Corte $corte, Usuario $usuario, ?string $observaciones = null): Corte
    {
        $corte->update([
            'estado' => Corte::ESTADO_EJECUTADO,
            'fecha_ejecucion' => now(),
            'observaciones' => trim((string) $observaciones) !== ''
                ? trim((string) $observaciones)
                : $corte->observaciones,
        ]);

        return $corte->refresh();
    }

    /**
     * Genera RelacionCorte y PartidaRelacionCorte para cada distribuidora ACTIVA
     * de la sucursal del corte. Se debe invocar después de cerrarManual().
     *
     * Reglas:
     * - Solo distribuidoras con estado ACTIVA
     * - Solo vales en estado ACTIVO/PAGO_PARCIAL/MOROSO sin partida ya generada
     * - Calcula fechas de pago anticipado y limite usando sucursal_configuraciones
     * - Genera referencia única por distribuidora para conciliación bancaria
     *
     * @return int Cantidad de relaciones creadas
     */
    public function generarRelacionesParaCorte(Corte $corte): int
    {
        $sucursal = $corte->sucursal()->with('configuracion')->first();
        if (!$sucursal) {
            return 0;
        }

        $config = $sucursal->configuracion;
        $plazoPagoDias = (int) ($config?->plazo_pago_dias ?? 15);

        $fechaCorte = $corte->fecha_ejecucion ?? now();
        $fechaLimite = $fechaCorte->copy()->addDays($plazoPagoDias);
        $fechaInicioAnticipado = $fechaLimite->copy()->subDays(3);
        $fechaFinAnticipado = $fechaLimite->copy()->subDays(1);

        $sucursalCodigo = $sucursal->codigo ?? 'SUC';
        $year = $fechaCorte->format('Y');
        $ymd = $fechaCorte->format('ymd');

        $distribuidoras = Distribuidora::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Distribuidora::ESTADO_ACTIVA)
            ->get();

        $relacionesCreadas = 0;
        $consecutivo = (int) RelacionCorte::query()
            ->whereYear('generada_en', $year)
            ->count();

        foreach ($distribuidoras as $distribuidora) {
            // Vales con saldo abierto que no tengan ya una partida en este corte
            $vales = Vale::query()
                ->where('distribuidora_id', $distribuidora->id)
                ->whereIn('estado', [
                    Vale::ESTADO_ACTIVO,
                    Vale::ESTADO_PAGO_PARCIAL,
                    Vale::ESTADO_MOROSO,
                ])
                ->with('productoFinanciero:id,nombre')
                ->get();

            if ($vales->isEmpty()) {
                continue;
            }

            DB::transaction(function () use (
                $distribuidora,
                $vales,
                $corte,
                $sucursalCodigo,
                $year,
                $ymd,
                $fechaLimite,
                $fechaInicioAnticipado,
                $fechaFinAnticipado,
                &$consecutivo,
                &$relacionesCreadas
            ) {
                $totalComision = 0.0;
                $totalPago = 0.0;
                $totalRecargos = 0.0;

                $partidasData = [];
                foreach ($vales as $vale) {
                    $quincenas = max(1, (int) $vale->quincenas_totales);
                    $comisionPorQuincena = round((float) $vale->monto_comision_empresa / $quincenas, 2);
                    $pagoQuincenal = (float) $vale->monto_quincenal;
                    $recargo = $vale->estado === Vale::ESTADO_MOROSO
                        ? (float) $vale->monto_multa_snap
                        : 0.0;
                    $totalLinea = round($comisionPorQuincena + $pagoQuincenal + $recargo, 2);

                    $totalComision += $comisionPorQuincena;
                    $totalPago += $pagoQuincenal;
                    $totalRecargos += $recargo;

                    $partidasData[] = [
                        'vale_id' => $vale->id,
                        'cliente_id' => $vale->cliente_id,
                        'nombre_producto_snapshot' => $vale->productoFinanciero?->nombre ?? 'Producto',
                        'pagos_realizados' => (int) $vale->pagos_realizados,
                        'pagos_totales' => (int) $vale->quincenas_totales,
                        'monto_comision' => $comisionPorQuincena,
                        'monto_pago' => $pagoQuincenal,
                        'monto_recargo' => $recargo,
                        'monto_total_linea' => $totalLinea,
                    ];
                }

                $totalAPagar = round($totalComision + $totalPago + $totalRecargos, 2);
                $consecutivo++;

                $numeroRelacion = sprintf('REL-%s-%s-%03d', $sucursalCodigo, $year, $consecutivo);
                $referenciaPago = sprintf('%s%d%s', $sucursalCodigo, $distribuidora->id, $ymd);

                $relacion = RelacionCorte::create([
                    'corte_id' => $corte->id,
                    'distribuidora_id' => $distribuidora->id,
                    'numero_relacion' => $numeroRelacion,
                    'referencia_pago' => $referenciaPago,
                    'fecha_limite_pago' => $fechaLimite->toDateString(),
                    'fecha_inicio_pago_anticipado' => $fechaInicioAnticipado->toDateString(),
                    'fecha_fin_pago_anticipado' => $fechaFinAnticipado->toDateString(),
                    'limite_credito_snapshot' => (float) $distribuidora->limite_credito,
                    'credito_disponible_snapshot' => (float) $distribuidora->credito_disponible,
                    'puntos_snapshot' => (float) $distribuidora->puntos_actuales,
                    'total_comision' => round($totalComision, 2),
                    'total_pago' => round($totalPago, 2),
                    'total_recargos' => round($totalRecargos, 2),
                    'total_a_pagar' => $totalAPagar,
                    'estado' => RelacionCorte::ESTADO_GENERADA,
                ]);

                foreach ($partidasData as $partida) {
                    $partida['relacion_corte_id'] = $relacion->id;
                    PartidaRelacionCorte::create($partida);
                }

                DB::afterCommit(function () use ($corte, $distribuidora, $relacion) {
                    if ($corte->tipo_corte === Corte::TIPO_PUNTOS) {
                        $this->distribuidoraNotificationService->notificar(
                            $distribuidora,
                            'CORTE_PUNTOS_LISTO',
                            'Tu corte de puntos esta listo',
                            "Se genero el corte de puntos {$relacion->numero_relacion}. Revisa tus movimientos de puntos.",
                            [
                                'corte_id' => (int) $corte->id,
                                'relacion_corte_id' => (int) $relacion->id,
                                'numero_relacion' => (string) $relacion->numero_relacion,
                            ]
                        );

                        return;
                    }

                    $this->distribuidoraNotificationService->notificar(
                        $distribuidora,
                        'CORTE_LISTO',
                        'Tu corte esta listo',
                        "Se genero tu relacion {$relacion->numero_relacion} por un total de $" . number_format((float) $relacion->total_a_pagar, 2) . '.',
                        [
                            'corte_id' => (int) $corte->id,
                            'relacion_corte_id' => (int) $relacion->id,
                            'numero_relacion' => (string) $relacion->numero_relacion,
                            'total_a_pagar' => (float) $relacion->total_a_pagar,
                        ]
                    );
                });

                $relacionesCreadas++;
            });
        }

        return $relacionesCreadas;
    }

    private function calcularFechaProgramada(int $diaCorte, string $horaCorte): Carbon
    {
        $ahora = now();
        $diasMesActual = $ahora->copy()->endOfMonth()->day;

        $fechaProgramada = $ahora->copy()
            ->day(min($diaCorte, $diasMesActual))
            ->setTimeFromTimeString($horaCorte . ':00');

        if ($fechaProgramada->lessThanOrEqualTo($ahora)) {
            $siguienteMes = $ahora->copy()->addMonthNoOverflow();
            $diasSiguienteMes = $siguienteMes->copy()->endOfMonth()->day;

            $fechaProgramada = $siguienteMes
                ->day(min($diaCorte, $diasSiguienteMes))
                ->setTimeFromTimeString($horaCorte . ':00');
        }

        return $fechaProgramada;
    }
}
