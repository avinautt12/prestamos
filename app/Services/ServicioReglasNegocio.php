<?php

namespace App\Services;

/**
 * ServicioReglasNegocio - Centraliza toda la "inteligencia" del negocio financiero.
 *
 * Este servicio encapsula todas las fórmulas y cálculos financieros para evitar
 * duplicación de lógica y facilitar el mantenimiento y auditoría del código.
 *
 * Responsabilidades:
 * - Calcular deuda total con fórmulas estándar
 * - Calcular puntos ganados en cortes
 * - Aplicar penalizaciones por atraso
 * - Validar rangos de valores de configuración
 */
class ServicioReglasNegocio
{
    public function calcularComisionApertura(float $principal, float $porcentajeComision): float
    {
        return round($principal * ($porcentajeComision / 100), 2);
    }

    public function calcularInteresTotal(float $principal, float $porcentajeInteresQuincenal, int $numQuincenas): float
    {
        return round($principal * ($porcentajeInteresQuincenal / 100) * $numQuincenas, 2);
    }

    public function calcularComisionDistribuidora(float $principal, float $porcentajeComision): float
    {
        return round($principal * ($porcentajeComision / 100), 2);
    }

    public function obtenerTabuladoresSeguroPorDefecto(): array
    {
        return [
            ['desde' => 0, 'hasta' => 5000, 'monto' => 50],
            ['desde' => 5001, 'hasta' => 15000, 'monto' => 100],
            ['desde' => 15001, 'hasta' => null, 'monto' => 150],
        ];
    }

    public function calcularSeguroPorTabuladores(float $principal, array $tabuladores): array
    {
        $tabuladoresNormalizados = $this->normalizarTabuladoresSeguro($tabuladores);

        foreach ($tabuladoresNormalizados as $tabulador) {
            $desde = (float) ($tabulador['desde'] ?? 0);
            $hasta = array_key_exists('hasta', $tabulador) && $tabulador['hasta'] !== null
                ? (float) $tabulador['hasta']
                : null;

            if ($principal >= $desde && ($hasta === null || $principal <= $hasta)) {
                return [
                    'monto' => (float) ($tabulador['monto'] ?? 0),
                    'tabulador' => $tabulador,
                    'tabuladores_normalizados' => $tabuladoresNormalizados,
                ];
            }
        }

        return [
            'monto' => 0.0,
            'tabulador' => null,
            'tabuladores_normalizados' => $tabuladoresNormalizados,
        ];
    }

    public function normalizarTabuladoresSeguro(array $tabuladores): array
    {
        $normalizados = [];

        foreach ($tabuladores as $tabulador) {
            if (!is_array($tabulador)) {
                continue;
            }

            $normalizados[] = [
                'desde' => isset($tabulador['desde']) ? (float) $tabulador['desde'] : 0.0,
                'hasta' => array_key_exists('hasta', $tabulador) && $tabulador['hasta'] !== null && $tabulador['hasta'] !== ''
                    ? (float) $tabulador['hasta']
                    : null,
                'monto' => isset($tabulador['monto']) ? (float) $tabulador['monto'] : 0.0,
            ];
        }

        usort($normalizados, function (array $a, array $b) {
            return $a['desde'] <=> $b['desde'];
        });

        return $normalizados;
    }

    /**
     * Calcula la deuda total que debe pagar un cliente.
     *
     * Fórmula:
     * Total = Principal + (Principal × %Comisión) + Seguro + (Principal × %Interés × Quincenas)
     *
     * @param float $principal Monto del préstamo
     * @param float $porcentajeComision Porcentaje de comisión (ej: 10 para 10%)
     * @param float $montoSeguro Monto del seguro en pesos
     * @param float $porcentajeInteresQuincenal Interés por quincena (ej: 5 para 5%)
     * @param int $numQuincenas Número de quincenas del préstamo
     * @return array Detalles del cálculo incluyendo componentes y total
     */
    public function calcularDeudaTotal(
        float $principal,
        float $porcentajeComision,
        float $montoSeguro,
        float $porcentajeInteresQuincenal,
        int $numQuincenas
    ): array {
        $comision = $this->calcularComisionApertura($principal, $porcentajeComision);
        $interesTotal = $this->calcularInteresTotal($principal, $porcentajeInteresQuincenal, $numQuincenas);

        $total = round($principal + $comision + $montoSeguro + $interesTotal, 2);

        return [
            'principal' => round($principal, 2),
            'comision' => $comision,
            'seguro' => round($montoSeguro, 2),
            'interes_total' => $interesTotal,
            'total' => $total,
            'desglose' => [
                'principal' => round($principal, 2),
                'comision' => "$comision (${porcentajeComision}% de \${$principal})",
                'seguro' => round($montoSeguro, 2),
                'interes' => "$interesTotal (${porcentajeInteresQuincenal}% × $numQuincenas quincenas)",
            ],
        ];
    }

    /**
     * Calcula los puntos ganados en un corte.
     *
     * Fórmula:
     * Puntos = ⌊(Total Efectivo / Bloque de Venta) × Puntos por Bloque⌋
     *
     * Ejemplo: Si Total Efectivo = $3,600 y Bloque = $1,200 y Puntos = 3
     * Puntos = ⌊(3600 / 1200) × 3⌋ = ⌊3 × 3⌋ = 9 puntos
     *
     * @param float $totalEfectivo Monto total de dinero generado (ingresos de corte)
     * @param int $factorBase Bloque de venta necesario para generar puntos (ej: 1200)
     * @param int $multiplicador Puntos que se ganan por cada bloque (ej: 3)
     * @return array Cálculo documentado de puntos
     */
    public function calcularPuntos(
        float $totalEfectivo,
        int $factorBase,
        int $multiplicador
    ): array {
        if ($factorBase <= 0) {
            return [
                'total_efectivo' => round($totalEfectivo, 2),
                'factor_base' => $factorBase,
                'multiplicador' => $multiplicador,
                'bloques_completos' => 0,
                'puntos_totales' => 0,
                'error' => 'Factor base debe ser mayor a 0',
            ];
        }

        $bloquesCompletos = intval(floor($totalEfectivo / $factorBase));
        $puntosTotales = $bloquesCompletos * $multiplicador;

        return [
            'total_efectivo' => round($totalEfectivo, 2),
            'factor_base' => $factorBase,
            'multiplicador' => $multiplicador,
            'bloques_completos' => $bloquesCompletos,
            'puntos_totales' => $puntosTotales,
            'resto_no_convertido' => round($totalEfectivo % $factorBase, 2),
            'formula' => "⌊{$totalEfectivo} / {$factorBase}⌋ × {$multiplicador} = {$puntosTotales} puntos",
        ];
    }

    /**
     * Calcula la penalización de puntos por atraso.
     *
     * Cuando un pago está en atraso, se pierde un porcentaje de los puntos acumulados.
     *
     * @param int $puntosAcumulados Puntos que tenía acumulados
     * @param float $porcentajePenalizacion Porcentaje a perder (ej: 20 para 20%)
     * @return array Detalles de la penalización
     */
    public function calcularPenalizacionAtraso(
        int $puntosAcumulados,
        float $porcentajePenalizacion
    ): array {
        $puntosPerdidos = intval(floor($puntosAcumulados * ($porcentajePenalizacion / 100)));
        $puntosRestantes = $puntosAcumulados - $puntosPerdidos;

        return [
            'puntos_antes' => $puntosAcumulados,
            'porcentaje_penalizacion' => $porcentajePenalizacion,
            'puntos_perdidos' => $puntosPerdidos,
            'puntos_restantes' => $puntosRestantes,
            'formula' => "$puntosAcumulados × ${porcentajePenalizacion}% = $puntosPerdidos puntos perdidos",
        ];
    }

    /**
     * Calcula el valor monetario de puntos canjeados.
     *
     * @param int $puntosACanjear Cantidad de puntos a convertir en dinero
     * @param float $valorPaqueUnoPunto Precio en pesos por cada punto
     * @return array Detalles del canje
     */
    public function calcularValorPuntos(
        int $puntosACanjear,
        float $valorPorUnoPunto
    ): array {
        $montoCanjeado = round($puntosACanjear * $valorPorUnoPunto, 2);

        return [
            'puntos_canjeados' => $puntosACanjear,
            'valor_por_punto' => round($valorPorUnoPunto, 2),
            'monto_canjeado' => $montoCanjeado,
            'formula' => "$puntosACanjear × \$$valorPorUnoPunto = \$$montoCanjeado",
        ];
    }

    /**
     * Valida que los parámetros de configuración estén dentro de rangos válidos.
     *
     * @param array $parametros Array con los parámetros a validar
     * @return array ['valido' => bool, 'errores' => array de mensajes]
     */
    public function validarParametrosConfiguracion(array $parametros): array
    {
        $errores = [];

        // Validar porcentajes (0 a 100)
        $porcentajes = [
            'porcentaje_comision_apertura',
            'porcentaje_interes_quincenal',
            'porcentaje_penalizacion',
        ];
        foreach ($porcentajes as $param) {
            if (isset($parametros[$param])) {
                $valor = (float) $parametros[$param];
                if ($valor < 0 || $valor > 100) {
                    $errores[] = "$param debe estar entre 0 y 100 (actual: $valor)";
                }
            }
        }

        // Validar montos positivos
        $montos = [
            'seguro' => 'Seguro',
            'multa_mora_fija' => 'Recargo por cobranza',
            'valor_punto' => 'Valor del punto',
            'linea_credito_default' => 'Línea de crédito',
        ];
        foreach ($montos as $param => $nombre) {
            if (isset($parametros[$param])) {
                $valor = (float) $parametros[$param];
                if ($valor < 0) {
                    $errores[] = "$nombre no puede ser negativo (actual: $valor)";
                }
            }
        }

        // Validar factores y multiplicadores (deben ser enteros positivos)
        $factores = ['factor_base' => 'Bloque de venta', 'multiplicador' => 'Puntos por bloque'];
        foreach ($factores as $param => $nombre) {
            if (isset($parametros[$param])) {
                $valor = intval($parametros[$param]);
                if ($valor <= 0) {
                    $errores[] = "$nombre debe ser mayor a 0 (actual: $valor)";
                }
            }
        }

        return [
            'valido' => count($errores) === 0,
            'errores' => $errores,
        ];
    }

    /**
     * Proporciona un resumen de cálculos financieros para auditoría.
     *
     * Útil para mostrar al Gerente un resumen de cómo se calculan los valores.
     *
     * @param float $principal
     * @param float $porcentajeComision
     * @param float $montoSeguro
     * @param float $porcentajeInteresQuincenal
     * @param int $numQuincenas
     * @param int $factorBase
     * @param int $multiplicadorPuntos
     * @return array Resumen completo de cálculos
     */
    public function obtenerResumenCalculos(
        float $principal,
        float $porcentajeComision,
        float $montoSeguro,
        float $porcentajeInteresQuincenal,
        int $numQuincenas,
        int $factorBase,
        int $multiplicadorPuntos
    ): array {
        $deuda = $this->calcularDeudaTotal(
            $principal,
            $porcentajeComision,
            $montoSeguro,
            $porcentajeInteresQuincenal,
            $numQuincenas
        );

        $puntos = $this->calcularPuntos($deuda['total'], $factorBase, $multiplicadorPuntos);

        return [
            'deuda' => $deuda,
            'puntos' => $puntos,
            'resumen' => [
                'principal_solicitado' => round($principal, 2),
                'deuda_total' => $deuda['total'],
                'plazo_quincenas' => $numQuincenas,
                'puntos_esperados' => $puntos['puntos_totales'],
            ],
        ];
    }
}
