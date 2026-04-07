<?php

require 'vendor/autoload.php';

use App\Services\ServicioReglasNegocio;

$servicio = app(ServicioReglasNegocio::class);

echo "========================================\n";
echo "EJEMPLO 1: CALCULAR DEUDA TOTAL\n";
echo "========================================\n";

$deuda1 = $servicio->calcularDeudaTotal(
    principal: 5000.00,
    porcentajeComision: 10,
    montoSeguro: 100,
    porcentajeInteresQuincenal: 5,
    numQuincenas: 8
);

echo "INPUT:\n";
echo "  Principal: \$5,000.00\n";
echo "  % Comisión: 10% (CONFIGURABLE)\n";
echo "  Seguro: \$100 (CONFIGURABLE - de tabuladores)\n";
echo "  % Interés/Quincena: 5% (CONFIGURABLE)\n";
echo "  Quincenas: 8 (EXPLÍCITO - duración préstamo)\n";
echo "\nCÁLCULO:\n";
echo "  Principal:           \$5,000.00\n";
echo "  + Comisión (10%):    \$" . number_format($deuda1['comision'], 2) . "\n";
echo "  + Seguro:            \$" . number_format($deuda1['seguro'], 2) . "\n";
echo "  + Interés (5% × 8):  \$" . number_format($deuda1['interes_total'], 2) . "\n";
echo "  ─────────────────────────────\n";
echo "  TOTAL DEUDA:         \$" . number_format($deuda1['total'], 2) . "\n";

echo "\n\n";
echo "========================================\n";
echo "EJEMPLO 2: CALCULAR PUNTOS EN CORTE\n";
echo "========================================\n";

$puntos = $servicio->calcularPuntos(
    totalEfectivo: 12000.00,
    factorBase: 1200,
    multiplicador: 3
);

echo "INPUT:\n";
echo "  Total Efectivo Corte: \$12,000.00 (EXPLÍCITO - dinero recaudado)\n";
echo "  Bloque de Venta: \$1,200 (CONFIGURABLE)\n";
echo "  Puntos por Bloque: 3 (CONFIGURABLE)\n";
echo "\nCÁLCULO:\n";
echo "  Bloques completos: 12,000 ÷ 1,200 = " . $puntos['bloques_completos'] . " bloques\n";
echo "  Puntos totales: " . $puntos['bloques_completos'] . " × 3 = " . $puntos['puntos_totales'] . " puntos\n";
echo "  Dinero sin convertir: \$" . number_format($puntos['resto_no_convertido'], 2) . "\n";
echo "\nRESULTADO: " . $puntos['puntos_totales'] . " PUNTOS GENERADOS\n";

echo "\n\n";
echo "========================================\n";
echo "EJEMPLO 3: PENALIZACIÓN POR ATRASO\n";
echo "========================================\n";

$penalizacion = $servicio->calcularPenalizacionAtraso(
    puntosAcumulados: 150,
    porcentajePenalizacion: 20
);

echo "INPUT:\n";
echo "  Puntos Acumulados: 150 (EXPLÍCITO - saldo actual)\n";
echo "  % Penalización: 20% (CONFIGURABLE)\n";
echo "\nCÁLCULO:\n";
echo "  Puntos perdidos: 150 × 20% = " . $penalizacion['puntos_perdidos'] . " puntos\n";
echo "  Antes: " . $penalizacion['puntos_antes'] . " puntos\n";
echo "  Después: " . $penalizacion['puntos_restantes'] . " puntos\n";
echo "\nRESULTADO: PIERDE " . $penalizacion['puntos_perdidos'] . " PUNTOS\n";

echo "\n\n";
echo "========================================\n";
echo "EJEMPLO 4: CANJE DE PUNTOS A DINERO\n";
echo "========================================\n";

$canje = $servicio->calcularValorPuntos(
    puntosACanjear: 50,
    valorPorUnoPunto: 2.00
);

echo "INPUT:\n";
echo "  Puntos a Canjear: 50 (EXPLÍCITO - solicitud usuario)\n";
echo "  Valor por Punto: \$2.00 (CONFIGURABLE)\n";
echo "\nCÁLCULO:\n";
echo "  Monto recibido: 50 × \$2.00 = \$" . number_format($canje['monto_canjeado'], 2) . "\n";
echo "\nRESULTADO: RECIBE \$" . number_format($canje['monto_canjeado'], 2) . "\n";

echo "\n\n";
echo "========================================\n";
echo "RESUMEN DE PARÁMETROS\n";
echo "========================================\n\n";

echo "CONFIGURABLE (en sucursal_configuraciones):\n";
echo "  ✓ porcentaje_comision_apertura (10%)\n";
echo "  ✓ porcentaje_interes_quincenal (5%)\n";
echo "  ✓ bloque_venta_para_puntos (\$1,200)\n";
echo "  ✓ puntos_por_bloque (3)\n";
echo "  ✓ precio_canje_por_punto (\$2.00)\n";
echo "  ✓ porcentaje_penalizacion_atraso (20%)\n";
echo "  ✓ monto_seguro (varía por tabuladores)\n\n";

echo "EXPLÍCITO (vienen del usuario/operación):\n";
echo "  • principal (monto solicitado)\n";
echo "  • numQuincenas (plazo del préstamo)\n";
echo "  • totalEfectivo (dinero recaudado en corte)\n";
echo "  • puntosAcumulados (saldo actual)\n";
echo "  • puntosACanjear (lo que solicita canjear)\n";
