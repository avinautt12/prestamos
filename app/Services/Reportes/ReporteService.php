<?php

namespace App\Services\Reportes;

use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Models\PagoCliente;
use App\Models\PagoDistribuidora;
use App\Models\RelacionCorte;
use App\Models\Solicitud;
use App\Models\Vale;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Centraliza las queries para los 4 reportes ejecutivos:
 *   1. Distribuidoras morosas y saldos
 *   2. Saldo de cortes
 *   3. Saldo de puntos por distribuidora al corte
 *   4. Presolicitudes pendientes y validadas
 *
 * Todos los métodos aceptan filtros opcionales de sucursal y rango de fechas.
 * Cuando `sucursal_id` es null se genera el reporte global (Admin).
 */
class ReporteService
{
    /**
     * Reporte 1 — Distribuidoras morosas y saldos.
     *
     * Considera distribuidoras con estado MOROSA O con vales en estado MOROSO.
     * Si `$fechaCorte` se pasa, filtra vales cuya `fecha_limite_pago <= fechaCorte`.
     */
    public function distribuidorasMorosas(?int $sucursalId = null, ?CarbonInterface $fechaCorte = null): Collection
    {
        $distribuidorasQuery = Distribuidora::query()
            ->with([
                'persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'sucursal:id,codigo,nombre',
                'categoria:id,codigo,nombre',
            ])
            ->where(function ($q) {
                $q->where('estado', Distribuidora::ESTADO_MOROSA)
                    ->orWhereHas('vales', fn($valeQ) => $valeQ->where('estado', Vale::ESTADO_MOROSO));
            });

        if ($sucursalId !== null) {
            $distribuidorasQuery->where('sucursal_id', $sucursalId);
        }

        $distribuidoras = $distribuidorasQuery->get();

        return $distribuidoras->map(function (Distribuidora $dist) use ($fechaCorte) {
            $valesMorososQuery = Vale::query()
                ->where('distribuidora_id', $dist->id)
                ->where('estado', Vale::ESTADO_MOROSO);

            if ($fechaCorte) {
                $valesMorososQuery->where('fecha_limite_pago', '<=', $fechaCorte->toDateString());
            }

            $valesMorosos = $valesMorososQuery->get();
            $saldoPendiente = (float) $valesMorosos->sum('saldo_actual');
            $cantidadMorosos = $valesMorosos->count();

            $valeMasAntiguo = $valesMorosos->sortBy('fecha_limite_pago')->first();
            $diasAtraso = $valeMasAntiguo && $valeMasAntiguo->fecha_limite_pago
                ? Carbon::parse($valeMasAntiguo->fecha_limite_pago)->diffInDays(now())
                : 0;

            $ultimoPago = PagoCliente::query()
                ->whereIn('vale_id', $valesMorosos->pluck('id'))
                ->whereNull('revertido_en')
                ->orderByDesc('fecha_pago')
                ->first();

            return [
                'sucursal'               => $dist->sucursal?->codigo,
                'numero_distribuidora'   => $dist->numero_distribuidora,
                'persona'                => trim(implode(' ', array_filter([
                    $dist->persona?->primer_nombre,
                    $dist->persona?->apellido_paterno,
                    $dist->persona?->apellido_materno,
                ]))),
                'estado_distribuidora'   => $dist->estado,
                'categoria'              => $dist->categoria?->nombre,
                'credito_disponible'     => (float) $dist->credito_disponible,
                'vales_morosos'          => $cantidadMorosos,
                'saldo_pendiente_total'  => round($saldoPendiente, 2),
                'dias_atraso_max'        => (int) $diasAtraso,
                'fecha_ultimo_pago'      => $ultimoPago?->fecha_pago?->toDateString(),
                'monto_ultimo_pago'      => $ultimoPago ? (float) $ultimoPago->monto : null,
            ];
        })->sortByDesc('saldo_pendiente_total')->values();
    }

    /**
     * Reporte 2 — Saldo de cortes (global o por sucursal, con rango de fechas).
     *
     * Devuelve las relaciones de corte en el rango con totales comparados contra
     * pagos distribuidora CONCILIADOS.
     */
    public function saldoCortes(
        ?int $sucursalId = null,
        ?CarbonInterface $desde = null,
        ?CarbonInterface $hasta = null
    ): Collection {
        $query = Corte::query()
            ->with(['sucursal:id,codigo,nombre']);

        if ($sucursalId !== null) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($desde) {
            $query->where(function ($q) use ($desde) {
                $q->where('fecha_programada', '>=', $desde)
                    ->orWhere('fecha_ejecucion', '>=', $desde);
            });
        }

        if ($hasta) {
            $query->where(function ($q) use ($hasta) {
                $q->where('fecha_programada', '<=', $hasta)
                    ->orWhere('fecha_ejecucion', '<=', $hasta);
            });
        }

        $cortes = $query->orderByDesc('fecha_programada')->get();

        return $cortes->map(function (Corte $corte) {
            $relaciones = RelacionCorte::query()
                ->where('corte_id', $corte->id)
                ->get();

            $totalAPagar = (float) $relaciones->sum('total_a_pagar');

            $totalConciliado = (float) PagoDistribuidora::query()
                ->whereIn('relacion_corte_id', $relaciones->pluck('id'))
                ->where('estado', PagoDistribuidora::ESTADO_CONCILIADO)
                ->sum('monto');

            $pendiente = max(0, round($totalAPagar - $totalConciliado, 2));
            $porcentajeCobranza = $totalAPagar > 0
                ? round(($totalConciliado / $totalAPagar) * 100, 2)
                : 0.0;

            $distsConPago = PagoDistribuidora::query()
                ->whereIn('relacion_corte_id', $relaciones->pluck('id'))
                ->where('estado', PagoDistribuidora::ESTADO_CONCILIADO)
                ->distinct('distribuidora_id')
                ->count('distribuidora_id');

            $distsTotal = $relaciones->count();

            return [
                'sucursal'             => $corte->sucursal?->codigo,
                'corte_id'             => $corte->id,
                'tipo_corte'           => $corte->tipo_corte,
                'estado_corte'         => $corte->estado,
                'fecha_programada'     => $corte->fecha_programada?->toDateString(),
                'fecha_ejecucion'      => $corte->fecha_ejecucion?->toDateTimeString(),
                'relaciones_generadas' => $distsTotal,
                'total_a_pagar'        => round($totalAPagar, 2),
                'total_conciliado'     => round($totalConciliado, 2),
                'pendiente'            => $pendiente,
                'porcentaje_cobranza'  => $porcentajeCobranza,
                'distribuidoras_pagaron'     => $distsConPago,
                'distribuidoras_sin_pago'    => max(0, $distsTotal - $distsConPago),
            ];
        })->values();
    }

    /**
     * Reporte 3 — Saldo de puntos por distribuidora al corte.
     *
     * Si `$corteId` se pasa, se usa como snapshot (puntos ganados/penalizados
     * específicamente en ese corte). Si no, es un snapshot actual acumulado.
     */
    public function saldoPuntosPorDistribuidora(?int $sucursalId = null, ?int $corteId = null): Collection
    {
        $distsQuery = Distribuidora::query()
            ->with([
                'persona:id,primer_nombre,apellido_paterno,apellido_materno',
                'sucursal:id,codigo,nombre',
            ])
            ->where('estado', '!=', Distribuidora::ESTADO_CANDIDATA);

        if ($sucursalId !== null) {
            $distsQuery->where('sucursal_id', $sucursalId);
        }

        $distribuidoras = $distsQuery->get();

        return $distribuidoras->map(function (Distribuidora $dist) use ($corteId) {
            $movsQuery = MovimientoPunto::query()->where('distribuidora_id', $dist->id);

            if ($corteId !== null) {
                $movsQuery->where('corte_id', $corteId);
            }

            $movimientos = $movsQuery->get();

            $ganadosAnticipados = (float) $movimientos
                ->where('tipo_movimiento', MovimientoPunto::TIPO_GANADO_ANTICIPADO)
                ->sum('puntos');
            $ganadosPuntuales = (float) $movimientos
                ->where('tipo_movimiento', MovimientoPunto::TIPO_GANADO_PUNTUAL)
                ->sum('puntos');
            $penalizados = (float) $movimientos
                ->where('tipo_movimiento', MovimientoPunto::TIPO_PENALIZACION_ATRASO)
                ->sum('puntos');
            $canjeados = (float) $movimientos
                ->where('tipo_movimiento', MovimientoPunto::TIPO_CANJE)
                ->sum('puntos');
            $ajustes = (float) $movimientos
                ->where('tipo_movimiento', MovimientoPunto::TIPO_AJUSTE_MANUAL)
                ->sum('puntos');

            $valorPuntoSnapshot = (float) ($movimientos->first()?->valor_punto_snapshot ?? 2.0);
            $puntosActuales = (float) $dist->puntos_actuales;

            return [
                'sucursal'             => $dist->sucursal?->codigo,
                'numero_distribuidora' => $dist->numero_distribuidora,
                'persona'              => trim(implode(' ', array_filter([
                    $dist->persona?->primer_nombre,
                    $dist->persona?->apellido_paterno,
                    $dist->persona?->apellido_materno,
                ]))),
                'puntos_ganados_anticipado' => round($ganadosAnticipados, 2),
                'puntos_ganados_puntual'    => round($ganadosPuntuales, 2),
                'puntos_penalizados'   => round(abs($penalizados), 2),
                'puntos_canjeados'     => round(abs($canjeados), 2),
                'puntos_ajustes'       => round($ajustes, 2),
                'puntos_actuales'      => round($puntosActuales, 2),
                'valor_en_pesos'       => round($puntosActuales * $valorPuntoSnapshot, 2),
            ];
        })->sortByDesc('puntos_actuales')->values();
    }

    /**
     * Reporte 4 — Presolicitudes pendientes y validadas.
     *
     * Incluye todas las solicitudes en estados del flujo (PRE → APROBADA/RECHAZADA)
     * dentro del rango dado.
     */
    public function presolicitudes(
        ?int $sucursalId = null,
        ?CarbonInterface $desde = null,
        ?CarbonInterface $hasta = null
    ): Collection {
        $query = Solicitud::query()
            ->with([
                'persona:id,primer_nombre,apellido_paterno,apellido_materno',
                'sucursal:id,codigo,nombre',
                'capturador:id,nombre_usuario',
                'verificadorAsignado:id,nombre_usuario',
                'verificacion',
            ]);

        if ($sucursalId !== null) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($desde) {
            $query->where('creado_en', '>=', $desde);
        }

        if ($hasta) {
            $query->where('creado_en', '<=', $hasta);
        }

        $solicitudes = $query->orderByDesc('creado_en')->get();

        return $solicitudes->map(function (Solicitud $s) {
            $diasEnFlujo = $s->creado_en
                ? (int) $s->creado_en->diffInDays(now())
                : 0;

            return [
                'sucursal'             => $s->sucursal?->codigo,
                'solicitud_id'         => $s->id,
                'fecha_captura'        => $s->creado_en?->toDateString(),
                'coordinador'          => $s->capturador?->nombre_usuario,
                'verificador'          => $s->verificadorAsignado?->nombre_usuario,
                'estado'               => $s->estado,
                'persona_solicitante'  => trim(implode(' ', array_filter([
                    $s->persona?->primer_nombre,
                    $s->persona?->apellido_paterno,
                    $s->persona?->apellido_materno,
                ]))),
                'categoria_inicial'    => $s->categoria_inicial_codigo,
                'limite_solicitado'    => (float) $s->limite_credito_solicitado,
                'dictamen'             => $s->verificacion?->resultado,
                'motivo_rechazo'       => $s->motivo_rechazo,
                'dias_en_flujo'        => $diasEnFlujo,
            ];
        })->values();
    }

    /**
     * Helper: devuelve rango [desde, hasta] para un periodo predefinido.
     */
    public function rangoPorPeriodo(string $tipo, ?string $ancla = null): array
    {
        $ref = $ancla ? Carbon::parse($ancla) : Carbon::now();

        return match ($tipo) {
            'mensual' => [$ref->copy()->startOfMonth(), $ref->copy()->endOfMonth()],
            'anual'   => [$ref->copy()->startOfYear(),  $ref->copy()->endOfYear()],
            default   => [$ref->copy()->startOfDay(),   $ref->copy()->endOfDay()],
        };
    }
}
