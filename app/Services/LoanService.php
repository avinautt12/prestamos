<?php

namespace App\Services;

use App\Models\CategoriaDistribuidora;
use App\Models\ProductoFinanciero;
use App\Models\SucursalConfiguracion;

class LoanService
{
    public function calcularSeguro(float $principal, SucursalConfiguracion $configuracion): array
    {
        $tabuladores = $this->normalizarTabuladoresSeguro($configuracion->seguro_tabuladores_json ?? []);

        foreach ($tabuladores as $tabulador) {
            $desde = (float) ($tabulador['desde'] ?? 0);
            $hasta = array_key_exists('hasta', $tabulador) && $tabulador['hasta'] !== null
                ? (float) $tabulador['hasta']
                : null;

            if ($principal >= $desde && ($hasta === null || $principal <= $hasta)) {
                return [
                    'monto' => (float) ($tabulador['monto'] ?? 0),
                    'tabulador' => $tabulador,
                ];
            }
        }

        return [
            'monto' => 0.0,
            'tabulador' => null,
        ];
    }

    public function calcularComisionApertura(float $principal, SucursalConfiguracion $configuracion): float
    {
        return round($principal * ((float) $configuracion->porcentaje_comision_apertura / 100), 2);
    }

    public function calcularInteresTotal(float $principal, SucursalConfiguracion $configuracion, int $numQuincenas): float
    {
        return round($principal * ((float) $configuracion->porcentaje_interes_quincenal / 100) * $numQuincenas, 2);
    }

    public function calcularComisionDistribuidora(float $principal, CategoriaDistribuidora $categoria): float
    {
        return round($principal * ((float) $categoria->porcentaje_comision / 100), 2);
    }

    public function generarTablaAmortizacion(
        float $principal,
        int $numQuincenas,
        SucursalConfiguracion $configuracion,
        CategoriaDistribuidora $categoria,
        ?ProductoFinanciero $producto = null
    ): array {
        $seguro = $this->calcularSeguro($principal, $configuracion);
        $comisionApertura = $this->calcularComisionApertura($principal, $configuracion);
        $interesTotal = $this->calcularInteresTotal($principal, $configuracion, $numQuincenas);
        $comisionDistribuidoraTotal = $this->calcularComisionDistribuidora($principal, $categoria);
        $multaIncumplimiento = (float) $configuracion->multa_incumplimiento_monto;

        $total = round($principal + $comisionApertura + $seguro['monto'] + $interesTotal, 2);
        $montoQuincenalBase = $numQuincenas > 0 ? round($total / $numQuincenas, 2) : $total;
        $comisionDistribuidoraPorQuincena = $numQuincenas > 0 ? round($comisionDistribuidoraTotal / $numQuincenas, 2) : $comisionDistribuidoraTotal;
        $interesPorQuincena = $numQuincenas > 0 ? round($interesTotal / $numQuincenas, 2) : $interesTotal;

        $tabla = [];
        $saldoPendiente = $total;

        for ($quincena = 1; $quincena <= max(1, $numQuincenas); $quincena++) {
            $abonoCapital = $numQuincenas > 0 ? round($principal / $numQuincenas, 2) : $principal;
            $abonoInteres = $interesPorQuincena;
            $abonoComisionDistribuidora = $comisionDistribuidoraPorQuincena;
            $pagoProgramado = $numQuincenas > 0 ? $montoQuincenalBase : $total;

            $saldoPendiente = round(max(0, $saldoPendiente - $pagoProgramado), 2);

            $tabla[] = [
                'quincena' => $quincena,
                'abono_capital' => $abonoCapital,
                'abono_interes' => $abonoInteres,
                'abono_comision_distribuidora' => $abonoComisionDistribuidora,
                'seguro' => $quincena === 1 ? (float) $seguro['monto'] : 0.0,
                'multa' => 0.0,
                'pago_programado' => $pagoProgramado,
                'saldo_restante' => $saldoPendiente,
            ];
        }

        return [
            'principal' => round($principal, 2),
            'seguro' => $seguro,
            'comision_apertura' => $comisionApertura,
            'interes_total' => $interesTotal,
            'comision_distribuidora_total' => $comisionDistribuidoraTotal,
            'multa_incumplimiento' => $multaIncumplimiento,
            'total' => $total,
            'monto_quincenal' => $montoQuincenalBase,
            'tabla' => $tabla,
            'producto' => $producto?->nombre,
            'categoria' => $categoria->nombre,
        ];
    }

    private function normalizarTabuladoresSeguro(array $tabuladores): array
    {
        $normalizados = [];

        foreach ($tabuladores as $tabulador) {
            if (!is_array($tabulador)) {
                continue;
            }

            $normalizados[] = [
                'desde' => $tabulador['desde'] ?? 0,
                'hasta' => $tabulador['hasta'] ?? null,
                'monto' => $tabulador['monto'] ?? 0,
            ];
        }

        usort($normalizados, function (array $a, array $b) {
            return (float) $a['desde'] <=> (float) $b['desde'];
        });

        return $normalizados;
    }
}
