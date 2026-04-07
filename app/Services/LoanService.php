<?php

namespace App\Services;

use App\Models\CategoriaDistribuidora;
use App\Models\ProductoFinanciero;
use App\Models\SucursalConfiguracion;

class LoanService
{
    public function __construct(private readonly ServicioReglasNegocio $reglasNegocio) {}

    public function calcularSeguro(float $principal, SucursalConfiguracion $configuracion): array
    {
        $resultado = $this->reglasNegocio->calcularSeguroPorTabuladores(
            $principal,
            $configuracion->seguro_tabuladores_json ?? []
        );

        return [
            'monto' => $resultado['monto'],
            'tabulador' => $resultado['tabulador'],
        ];
    }

    public function calcularComisionApertura(float $principal, SucursalConfiguracion $configuracion): float
    {
        return $this->reglasNegocio->calcularComisionApertura($principal, (float) $configuracion->porcentaje_comision_apertura);
    }

    public function calcularInteresTotal(float $principal, SucursalConfiguracion $configuracion, int $numQuincenas): float
    {
        return $this->reglasNegocio->calcularInteresTotal(
            $principal,
            (float) $configuracion->porcentaje_interes_quincenal,
            $numQuincenas
        );
    }

    public function calcularComisionDistribuidora(float $principal, CategoriaDistribuidora $categoria): float
    {
        return $this->reglasNegocio->calcularComisionDistribuidora($principal, (float) $categoria->porcentaje_comision);
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
}
