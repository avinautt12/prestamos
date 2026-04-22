<?php

namespace App\Services\Distribuidora;

use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Models\PagoCliente;
use App\Models\RelacionCorte;
use App\Models\Vale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CategoriaScoreService
{
    public const SCORE_BASE = 100;
    public const VENTANA_DIAS = 90;

    public const UMBRAL_DIAMANTE = 85;
    public const UMBRAL_ORO = 65;
    public const UMBRAL_PLATA = 40;

    public const PUNTOS_EXCEPCIONAL_UMBRAL = 500;
    public const PAGOS_ANTICIPADOS_EXCEPCIONAL_UMBRAL = 3;
    public const ATRASO_PROMEDIO_UMBRAL_DIAS = 10;

    /**
     * Evalua una distribuidora y devuelve el score + categoria sugerida + factores.
     *
     * @return array{
     *   score: int,
     *   categoria_actual: ?CategoriaDistribuidora,
     *   categoria_sugerida: ?CategoriaDistribuidora,
     *   direccion: string,
     *   factores: array
     * }
     */
    public function evaluar(Distribuidora $distribuidora): array
    {
        $desde = Carbon::now()->subDays(self::VENTANA_DIAS);

        $penalizaciones = [];
        $bonificaciones = [];
        $puntos = 0;

        // ----- PENALIZACIONES -----
        $valesMorososCount = Vale::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->where('estado', Vale::ESTADO_MOROSO)
            ->count();

        if ($valesMorososCount > 0) {
            $resta = -10 * $valesMorososCount;
            $puntos += $resta;
            $penalizaciones['vales_morosos_activos'] = ['count' => $valesMorososCount, 'puntos' => $resta];
        }

        $pagosRevertidos = PagoCliente::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->whereNotNull('revertido_en')
            ->where('revertido_en', '>=', $desde)
            ->count();

        if ($pagosRevertidos > 0) {
            $resta = -3 * $pagosRevertidos;
            $puntos += $resta;
            $penalizaciones['pagos_revertidos'] = ['count' => $pagosRevertidos, 'puntos' => $resta];
        }

        $atrasoPromedio = $this->calcularAtrasoPromedioDias($distribuidora, $desde);

        if ($atrasoPromedio !== null && $atrasoPromedio > self::ATRASO_PROMEDIO_UMBRAL_DIAS) {
            $puntos += -5;
            $penalizaciones['atraso_promedio_alto'] = ['dias' => round($atrasoPromedio, 1), 'puntos' => -5];
        }

        if ($distribuidora->estado === Distribuidora::ESTADO_MOROSA) {
            $puntos += -8;
            $penalizaciones['morosidad_elevada'] = ['puntos' => -8];
        }

        // ----- BONIFICACIONES -----
        $valesLiquidadosSinMora = Vale::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->where('estado', Vale::ESTADO_LIQUIDADO)
            ->where('actualizado_en', '>=', $desde)
            ->count();

        if ($valesLiquidadosSinMora > 0) {
            $puntos += 8;
            $bonificaciones['vales_liquidados_sin_mora'] = ['count' => $valesLiquidadosSinMora, 'puntos' => 8];
        }

        $cortesVencidosRecientes = RelacionCorte::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->where('estado', RelacionCorte::ESTADO_VENCIDA)
            ->where('generada_en', '>=', $desde)
            ->count();

        if ($cortesVencidosRecientes === 0) {
            $puntos += 5;
            $bonificaciones['sin_mora_3_meses'] = ['puntos' => 5];
        }

        $comportamientoExcepcional = $this->esComportamientoExcepcional($distribuidora, $desde);

        if ($comportamientoExcepcional['cumple']) {
            $puntos += 5;
            $bonificaciones['comportamiento_excepcional'] = [
                'puntos' => 5,
                'razon' => $comportamientoExcepcional['razon'],
            ];
        }

        // ----- SCORE FINAL -----
        $score = max(0, min(100, self::SCORE_BASE + $puntos));

        $categoriaActual = $distribuidora->categoria;
        $categoriaSugerida = $this->decidirCategoria($score);

        $direccion = $this->determinarDireccion($categoriaActual, $categoriaSugerida);

        return [
            'score' => $score,
            'categoria_actual' => $categoriaActual,
            'categoria_sugerida' => $categoriaSugerida,
            'direccion' => $direccion,
            'factores' => [
                'penalizaciones' => $penalizaciones,
                'bonificaciones' => $bonificaciones,
                'score_base' => self::SCORE_BASE,
                'score_ajuste' => $puntos,
                'ventana_dias' => self::VENTANA_DIAS,
            ],
        ];
    }

    private function calcularAtrasoPromedioDias(Distribuidora $distribuidora, Carbon $desde): ?float
    {
        $resultado = DB::table('pagos_cliente as pc')
            ->join('vales as v', 'v.id', '=', 'pc.vale_id')
            ->where('pc.distribuidora_id', $distribuidora->id)
            ->whereNull('pc.revertido_en')
            ->where('pc.fecha_pago', '>=', $desde)
            ->whereNotNull('v.fecha_limite_pago')
            ->selectRaw('AVG(DATEDIFF(pc.fecha_pago, v.fecha_limite_pago)) as promedio')
            ->first();

        if (!$resultado || $resultado->promedio === null) {
            return null;
        }

        return (float) $resultado->promedio;
    }

    private function esComportamientoExcepcional(Distribuidora $distribuidora, Carbon $desde): array
    {
        $puntosActuales = (float) ($distribuidora->puntos_actuales ?? 0);

        if ($puntosActuales > self::PUNTOS_EXCEPCIONAL_UMBRAL) {
            return ['cumple' => true, 'razon' => "puntos_actuales={$puntosActuales}"];
        }

        $anticipadosRecientes = MovimientoPunto::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->where('tipo_movimiento', MovimientoPunto::TIPO_GANADO_ANTICIPADO)
            ->where('creado_en', '>=', $desde)
            ->count();

        if ($anticipadosRecientes >= self::PAGOS_ANTICIPADOS_EXCEPCIONAL_UMBRAL) {
            return ['cumple' => true, 'razon' => "pagos_anticipados_90d={$anticipadosRecientes}"];
        }

        return ['cumple' => false, 'razon' => null];
    }

    private function decidirCategoria(int $score): ?CategoriaDistribuidora
    {
        $codigo = match (true) {
            $score >= self::UMBRAL_DIAMANTE => 'DIAMANTE',
            $score >= self::UMBRAL_ORO => 'ORO',
            $score >= self::UMBRAL_PLATA => 'PLATA',
            default => 'COBRE',
        };

        return CategoriaDistribuidora::query()
            ->where('codigo', $codigo)
            ->where('activo', true)
            ->first();
    }

    private function determinarDireccion(?CategoriaDistribuidora $actual, ?CategoriaDistribuidora $sugerida): string
    {
        if (!$actual || !$sugerida || $actual->id === $sugerida->id) {
            return 'SIN_CAMBIO';
        }

        $porcentajeActual = (float) $actual->porcentaje_comision;
        $porcentajeSugerido = (float) $sugerida->porcentaje_comision;

        return $porcentajeSugerido > $porcentajeActual ? 'SUBIDA' : 'BAJADA';
    }
}
