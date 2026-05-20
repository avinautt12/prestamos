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
    public const HORA_CORTE_FIJA = '18:00:00';
    public const RECARGO_POR_ATRASO = 300.00;

    public function __construct(
        private readonly DistribuidoraNotificationService $distribuidoraNotificationService
    ) {}

    public function sincronizarProximoCorteProgramado(Sucursal $sucursal, SucursalConfiguracion $configuracion): ?Corte
    {
        $diaCorte = $configuracion->dia_corte;
        $horaCorte = $configuracion->hora_corte ?? self::HORA_CORTE_FIJA;

        if (!$diaCorte) {
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
        $configuracion = SucursalConfiguracion::query()->where('sucursal_id', $sucursal->id)->first();

        if ($configuracion && $configuracion->dia_corte) {
            $this->sincronizarProximoCorteProgramado($sucursal, $configuracion);
        }

        $proximoConfig = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Corte::ESTADO_PROGRAMADO)
            ->where('observaciones', 'AUTO_CONFIG_SUCURSAL')
            ->whereDate('fecha_programada', '>=', today())
            ->orderBy('fecha_programada')
            ->first();

        if ($proximoConfig) {
            $proximoConfig->setAttribute('es_atrasado', false);
            return $proximoConfig;
        }

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

        $configuracion = SucursalConfiguracion::query()->where('sucursal_id', $sucursal->id)->first();
        if ($configuracion && $configuracion->dia_corte) {
            $this->sincronizarProximoCorteProgramado($sucursal, $configuracion);
        }

        return Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->whereBetween('fecha_programada', [$inicio, $fin])
            ->where(function ($query) {
                $query->where('observaciones', 'AUTO_CONFIG_SUCURSAL')
                    ->orWhereNull('observaciones')
                    ->orWhere('estado', Corte::ESTADO_EJECUTADO);
            })
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

        $corteAnterior = $this->obtenerCorteAnterior($corte);

        $distribuidoras = Distribuidora::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Distribuidora::ESTADO_ACTIVA)
            ->get();

        $relacionesCreadas = 0;
        $consecutivo = (int) RelacionCorte::query()
            ->whereYear('generada_en', $year)
            ->count();

        foreach ($distribuidoras as $distribuidora) {
            // LOG TEMPORAL: Inicio de procesamiento de distribuidora
            \Log::info('[CORTE] Iniciando distribuidora', [
                'corte_id' => $corte->id,
                'distribuidora_id' => $distribuidora->id,
                'distribuidora_numero' => $distribuidora->numero_distribuidora,
                'distribuidora_estado' => $distribuidora->estado,
            ]);

            // Idempotencia: si ya existe relación para (corte, distribuidora), saltar
            if (RelacionCorte::query()
                ->where('corte_id', $corte->id)
                ->where('distribuidora_id', $distribuidora->id)
                ->exists()
            ) {
                \Log::info('[CORTE] Saltando - ya existe relacion', [
                    'corte_id' => $corte->id,
                    'distribuidora_id' => $distribuidora->id,
                ]);
                continue;
            }

            $valesQuery = Vale::query()
                ->where('distribuidora_id', $distribuidora->id)
                ->whereIn('estado', [
                    Vale::ESTADO_ACTIVO,
                    Vale::ESTADO_PAGO_PARCIAL,
                    Vale::ESTADO_MOROSO,
                ])
                ->whereColumn('pagos_realizados', '<', 'quincenas_totales')
                ->with('productoFinanciero:id,nombre');

            if ($corteAnterior !== null) {
                $valesQuery->where('fecha_emision', '<', $corteAnterior->fecha_ejecucion);
            }

            $vales = $valesQuery->get();

            // LOG TEMPORAL: Vales encontrados
            \Log::info('[CORTE] Vales encontrados para distribuidora', [
                'distribuidora_id' => $distribuidora->id,
                'vales_count' => $vales->count(),
                'vales_ids' => $vales->pluck('id')->toArray(),
                'vales_estados' => $vales->pluck('estado')->toArray(),
            ]);

            $relacionAnterior = $this->obtenerRelacionAnteriorAbierta($distribuidora, $corte);

            if ($vales->isEmpty() && $relacionAnterior === null) {
                \Log::info('[CORTE] Saltando - sin vales y sin relacion anterior', [
                    'distribuidora_id' => $distribuidora->id,
                ]);
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
                $relacionAnterior,
                $config,
                &$consecutivo,
                &$relacionesCreadas
            ) {
                $totalComision = 0.0;
                $totalPago = 0.0;
                $totalRecargos = 0.0;
                $totalArrastreRecibido = 0.0;
                $montoOtorgado = 0.0; // Suma de principales de vales nuevos en este corte

                $partidasData = [];
                foreach ($vales as $vale) {
                    $quincenas = max(1, (int) $vale->quincenas_totales);
                    $comisionPorQuincena = round((float) $vale->monto_comision_empresa / $quincenas, 2);
                    $pagoQuincenal = (float) $vale->monto_quincenal;
                    $nombreProducto = $vale->productoFinanciero?->nombre ?? 'Producto';

                    $quincenasYaPagadas = (int) $vale->pagos_realizados;
                    $quincenasEsperadas = $this->quincenasEsperadasParaVale($vale, $corte);
                    $quincenasAtrasadas = max(0, $quincenasEsperadas - 1 - $quincenasYaPagadas);
                    $cuposDisponibles = $quincenas - $quincenasYaPagadas;
                    $cuposUsados = 0;

                    // Partidas ATRASO (una por corte vencido)
                    for ($i = 1; $i <= $quincenasAtrasadas && $cuposUsados < $cuposDisponibles; $i++) {
                        $numQ = $quincenasYaPagadas + $i;

                        $partidaOrigen = PartidaRelacionCorte::query()
                            ->where('vale_id', $vale->id)
                            ->where('numero_quincena', $numQ)
                            ->orderByDesc('id')
                            ->first();

                        $montoPagadoPrevio = (float) ($partidaOrigen?->monto_pagado_previo ?? 0);
                        $saldoPendiente = max(0.0, round($pagoQuincenal - $montoPagadoPrevio, 2));
                        $qAcumAnterior = (int) ($partidaOrigen?->quincenas_atrasadas_acumuladas ?? 0);
                        $montoMulta = (float) ($config?->multa_incumplimiento_monto ?? self::RECARGO_POR_ATRASO);
                        $recargoAcumulado = round(($qAcumAnterior + 1) * $montoMulta, 2);
                        $totalLinea = round($saldoPendiente + $recargoAcumulado, 2);

                        $partidasData[] = [
                            'vale_id' => $vale->id,
                            'cliente_id' => $vale->cliente_id,
                            'nombre_producto_snapshot' => $nombreProducto,
                            'pagos_realizados' => $quincenasYaPagadas,
                            'pagos_totales' => $quincenas,
                            'es_atraso' => true,
                            'numero_quincena' => $numQ,
                            'quincenas_atrasadas_acumuladas' => $qAcumAnterior + 1,
                            'monto_comision' => 0.0,
                            'monto_pago' => $saldoPendiente,
                            'monto_recargo' => $recargoAcumulado,
                            'monto_total_linea' => $totalLinea,
                            'monto_pagado_previo' => $montoPagadoPrevio,
                            'corte_origen_id' => $partidaOrigen?->relacionCorte?->corte_id,
                            'relacion_origen_id' => $relacionAnterior?->id,
                        ];

                        $totalPago += $saldoPendiente;
                        $totalRecargos += $recargoAcumulado;
                        $totalArrastreRecibido += $saldoPendiente;
                        $cuposUsados++;
                    }

                    // Partida NORMAL del corte actual (si quedan cupos)
                    if ($cuposUsados < $cuposDisponibles) {
                        $numQ = $quincenasYaPagadas + $quincenasAtrasadas + 1;
                        $totalLinea = round($comisionPorQuincena + $pagoQuincenal, 2);

                        $partidasData[] = [
                            'vale_id' => $vale->id,
                            'cliente_id' => $vale->cliente_id,
                            'nombre_producto_snapshot' => $nombreProducto,
                            'pagos_realizados' => $quincenasYaPagadas,
                            'pagos_totales' => $quincenas,
                            'es_atraso' => false,
                            'numero_quincena' => $numQ,
                            'quincenas_atrasadas_acumuladas' => 0,
                            'monto_comision' => $comisionPorQuincena,
                            'monto_pago' => $pagoQuincenal,
                            'monto_recargo' => 0.0,
                            'monto_total_linea' => $totalLinea,
                            'monto_pagado_previo' => 0.0,
                            'corte_origen_id' => null,
                            'relacion_origen_id' => null,
                        ];

                        $totalComision += $comisionPorQuincena;
                        $totalPago += $pagoQuincenal;

                        if ($numQ === 1) {
                            $montoOtorgado += (float) $vale->monto_principal;
                        }
                    }
                }

                if (empty($partidasData) && $relacionAnterior === null) {
                    return;
                }

                $totalAPagar = round($totalComision + $totalPago + $totalRecargos, 2);
                $consecutivo++;

                $numeroRelacion = sprintf('REL-%s-%s-%03d', $sucursalCodigo, $year, $consecutivo);
                $referenciaPago = sprintf('%s%d%s', $sucursalCodigo, $distribuidora->id, $ymd);

                $relacion = RelacionCorte::create([
                    'corte_id' => $corte->id,
                    'distribuidora_id' => $distribuidora->id,
                    'relacion_anterior_id' => $relacionAnterior?->id,
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
                    'total_arrastre_recibido' => round($totalArrastreRecibido, 2),
                    'estado' => RelacionCorte::ESTADO_GENERADA,
                ]);

                // LOG TEMPORAL: Relacion creada
                \Log::info('[CORTE] RelacionCorte creada', [
                    'relacion_id' => $relacion->id,
                    'numero_relacion' => $relacion->numero_relacion,
                    'referencia_pago' => $relacion->referencia_pago,
                    'total_a_pagar' => $relacion->total_a_pagar,
                    'estado' => $relacion->estado,
                ]);

                foreach ($partidasData as $partida) {
                    $partida['relacion_corte_id'] = $relacion->id;
                    PartidaRelacionCorte::create($partida);
                }

                // LOG TEMPORAL: Partidas creadas
                $partidasCreadas = PartidaRelacionCorte::where('relacion_corte_id', $relacion->id)->get();
                \Log::info('[CORTE] PartidasRelacionCorte creadas', [
                    'relacion_id' => $relacion->id,
                    'partidas_count' => $partidasCreadas->count(),
                    'partidas_ids' => $partidasCreadas->pluck('id')->toArray(),
                    'total_monto_partidas' => $partidasCreadas->sum('monto_total_linea'),
                ]);

                if ($relacionAnterior !== null) {
                    $this->cerrarRelacionAnteriorPorArrastre($relacionAnterior);
                }

                $factorBase = (int) ($config?->factor_divisor_puntos ?? 1200);
                $multiplicador = (int) ($config?->multiplicador_puntos ?? 3);
                $valorPunto = (float) ($config?->valor_punto_mxn ?? 2.00);
                $castigoPct = (float) ($config?->castigo_pct_atraso ?? 20.0);

                // Los puntos se ganan por el monto total otorgado (principal de nuevos vales)
                $puntosGanados = app(\App\Services\ServicioReglasNegocio::class)
                    ->calcularPuntos($montoOtorgado, $factorBase, $multiplicador)['puntos_totales'];

                // 1. Ganar puntos por el total a pagar del corte
                if ($puntosGanados > 0) {
                    $distribuidora->increment('puntos_actuales', $puntosGanados);
                    \App\Models\MovimientoPunto::create([
                        'distribuidora_id' => $distribuidora->id,
                        'corte_id' => $corte->id,
                        'tipo_movimiento' => \App\Models\MovimientoPunto::TIPO_GANADO_PUNTUAL,
                        'puntos' => $puntosGanados,
                        'valor_punto_snapshot' => $valorPunto,
                        'motivo' => "Puntos generados por Relación {$relacion->numero_relacion}",
                    ]);
                }

                // 2. Penalizar (Merma de Puntos) si hubo morosidad (recargos)
                $puntosPerdidos = 0;
                if ($totalRecargos > 0 && $distribuidora->puntos_actuales > 0 && $castigoPct > 0) {
                    $puntosActuales = $distribuidora->fresh()->puntos_actuales;
                    $penalizacion = app(\App\Services\ServicioReglasNegocio::class)
                        ->calcularPenalizacionAtraso($puntosActuales, $castigoPct);
                    
                    if ($penalizacion['puntos_perdidos'] > 0) {
                        $puntosPerdidos = $penalizacion['puntos_perdidos'];
                        $distribuidora->decrement('puntos_actuales', $puntosPerdidos);
                        \App\Models\MovimientoPunto::create([
                            'distribuidora_id' => $distribuidora->id,
                            'corte_id' => $corte->id,
                            'tipo_movimiento' => \App\Models\MovimientoPunto::TIPO_PENALIZACION_ATRASO,
                            'puntos' => -$puntosPerdidos,
                            'valor_punto_snapshot' => $valorPunto,
                            'motivo' => "Castigo por mora ({$castigoPct}%) en Relación {$relacion->numero_relacion}",
                        ]);
                    }
                }

                DB::afterCommit(function () use ($corte, $distribuidora, $relacion, $puntosGanados, $puntosPerdidos) {
                    if ($corte->tipo_corte === Corte::TIPO_PUNTOS) {
                        $this->distribuidoraNotificationService->notificar(
                            $distribuidora,
                            'CORTE_PUNTOS_LISTO',
                            'Tu corte de puntos esta listo',
                            "Se genero el corte de puntos {$relacion->numero_relacion}. Revisa tus movimientos.",
                            [
                                'corte_id' => (int) $corte->id,
                                'relacion_corte_id' => (int) $relacion->id,
                                'numero_relacion' => (string) $relacion->numero_relacion,
                            ]
                        );
                        return;
                    }

                    $pmsj = $puntosGanados > 0 ? " Ademas, has acumulado {$puntosGanados} puntos." : '';
                    if ($puntosPerdidos > 0) {
                        $pmsj .= " Has perdido {$puntosPerdidos} puntos por penalización de mora.";
                    }
                    $this->distribuidoraNotificationService->notificar(
                        $distribuidora,
                        'CORTE_LISTO',
                        'Tu corte de pagos esta listo',
                        "Se genero tu relacion {$relacion->numero_relacion} por un total de $" . number_format((float) $relacion->total_a_pagar, 2) . ".{$pmsj}",
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

        if ($relacionesCreadas > 0) {
            $gerentes = \App\Models\Usuario::where('activo', true)
                ->whereHas('roles', function($q) use ($sucursal) {
                    $q->where('codigo', 'GERENTE')
                      ->where('usuario_rol.sucursal_id', $sucursal->id);
                })
                ->get();
            
            foreach ($gerentes as $gerente) {
                $gerente->notify(new \App\Notifications\NotificacionOperativa(
                    titulo: 'Cortes Procesados',
                    mensaje: "El sistema ha finalizado el corte global y generado {$relacionesCreadas} relaciones de cobro.",
                    tipo: 'info'
                ));
            }
        }

        return $relacionesCreadas;
    }

    private function calcularFechaProgramada(int $diaCorte, string $horaCorte): Carbon
    {
        $horaNormalizada = $this->normalizarHoraCorte($horaCorte);
        $ahora = now();
        $diasMesActual = $ahora->copy()->endOfMonth()->day;

        $primeraFecha = $ahora->copy()
            ->day(min($diaCorte, $diasMesActual))
            ->setTimeFromTimeString($horaNormalizada);

        if ($ahora->lessThanOrEqualTo($primeraFecha)) {
            return $primeraFecha;
        }

        $segundaFecha = $primeraFecha->copy()->addDays(15);

        if ($ahora->lessThanOrEqualTo($segundaFecha)) {
            return $segundaFecha;
        }

        $siguienteMes = $ahora->copy()->addMonthNoOverflow();
        $diasSiguienteMes = $siguienteMes->copy()->endOfMonth()->day;

        return $siguienteMes
            ->day(min($diaCorte, $diasSiguienteMes))
            ->setTimeFromTimeString($horaNormalizada);
    }

    private function normalizarHoraCorte(string $horaCorte): string
    {
        $hora = trim($horaCorte);

        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $hora) === 1) {
            return $hora;
        }

        if (preg_match('/^\d{2}:\d{2}$/', $hora) === 1) {
            return $hora . ':00';
        }

        try {
            return Carbon::parse($hora)->format('H:i:s');
        } catch (\Throwable) {
            return '18:00:00';
        }
    }

    private function obtenerCorteAnterior(Corte $corte): ?Corte
    {
        $referencia = $corte->fecha_ejecucion ?? now();

        return Corte::query()
            ->where('sucursal_id', $corte->sucursal_id)
            ->where('estado', Corte::ESTADO_EJECUTADO)
            ->where('id', '!=', $corte->id)
            ->whereNotNull('fecha_ejecucion')
            ->where('fecha_ejecucion', '<', $referencia)
            ->orderByDesc('fecha_ejecucion')
            ->first();
    }

    private function obtenerRelacionAnteriorAbierta(Distribuidora $distribuidora, Corte $corte): ?RelacionCorte
    {
        return RelacionCorte::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->where('corte_id', '!=', $corte->id)
            ->orderByDesc('id')
            ->first();
    }

    private function quincenasEsperadasParaVale(Vale $vale, Corte $corte): int
    {
        $quincenasTotales = max(1, (int) $vale->quincenas_totales);

        $partidasNormalesPrevias = PartidaRelacionCorte::query()
            ->where('vale_id', $vale->id)
            ->where('es_atraso', false)
            ->whereHas('relacionCorte', fn($q) => $q->where('corte_id', '!=', $corte->id))
            ->count();

        return min($partidasNormalesPrevias + 1, $quincenasTotales);
    }

    private function cerrarRelacionAnteriorPorArrastre(RelacionCorte $relacion): void
    {
        $relacion->update([
            'estado' => RelacionCorte::ESTADO_CERRADA,
            'cerrada_por_arrastre_en' => now(),
        ]);

        try {
            \App\Models\BitacoraAuditoria::create([
                'usuario_id' => auth()->user()?->id,
                'sucursal_id' => $relacion->corte?->sucursal_id,
                'tipo_evento' => \App\Models\BitacoraAuditoria::TIPO_ACTUALIZAR,
                'nivel' => \App\Models\BitacoraAuditoria::NIVEL_INFO,
                'modulo' => \App\Models\BitacoraAuditoria::MODULO_CORTE,
                'descripcion' => "RelacionCorte {$relacion->numero_relacion} cerrada por arrastre al siguiente corte.",
                'datos_extra' => [
                    'relacion_corte_id' => $relacion->id,
                    'numero_relacion' => $relacion->numero_relacion,
                    'estado_anterior' => $relacion->getOriginal('estado'),
                ],
            ]);
        } catch (\Throwable) {
            // No interrumpir el cierre por fallo en bitácora
        }
    }
}
