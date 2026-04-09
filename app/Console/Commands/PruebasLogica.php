<?php

namespace App\Console\Commands;

use App\Services\ServicioReglasNegocio;
use Illuminate\Console\Command;

class PruebasLogica extends Command
{
    protected $signature = 'pruebas:logica';
    protected $description = 'Ejecuta pruebas de lógica del servicio';

    public function handle()
    {
        $servicio = app(ServicioReglasNegocio::class);

        $this->info('========================================');
        $this->info('EJEMPLO 1: CALCULAR DEUDA TOTAL');
        $this->info('========================================');

        $deuda1 = $servicio->calcularDeudaTotal(5000, 10, 100, 5, 8);

        $this->line('INPUT:');
        $this->line('  Principal: $5,000.00');
        $this->line('  % Comisión: 10% (CONFIGURABLE)');
        $this->line('  Seguro: $100 (CONFIGURABLE - de tabuladores)');
        $this->line('  % Interés/Quincena: 5% (CONFIGURABLE)');
        $this->line('  Quincenas: 8 (EXPLÍCITO - duración préstamo)');
        $this->line('');
        $this->line('CÁLCULO:');
        $this->line('  Principal:           $5,000.00');
        $this->line('  + Comisión (10%):    $' . number_format($deuda1['comision'], 2));
        $this->line('  + Seguro:            $' . number_format($deuda1['seguro'], 2));
        $this->line('  + Interés (5% × 8):  $' . number_format($deuda1['interes_total'], 2));
        $this->line('  ─────────────────────────────');
        $this->line('  ✓ TOTAL DEUDA:       $' . number_format($deuda1['total'], 2));

        $this->line('');
        $this->line('');
        $this->info('========================================');
        $this->info('EJEMPLO 2: CALCULAR PUNTOS EN CORTE');
        $this->info('========================================');

        $puntos = $servicio->calcularPuntos(12000, 1200, 3);

        $this->line('INPUT:');
        $this->line('  Total Efectivo Corte: $12,000.00 (EXPLÍCITO - dinero recaudado)');
        $this->line('  Bloque de Venta: $1,200 (CONFIGURABLE)');
        $this->line('  Puntos por Bloque: 3 (CONFIGURABLE)');
        $this->line('');
        $this->line('CÁLCULO:');
        $this->line('  Bloques completos: 12,000 ÷ 1,200 = ' . $puntos['bloques_completos'] . ' bloques');
        $this->line('  Puntos totales: ' . $puntos['bloques_completos'] . ' × 3 = ' . $puntos['puntos_totales'] . ' puntos');
        $this->line('  Dinero sin convertir: $' . number_format($puntos['resto_no_convertido'], 2));
        $this->line('');
        $this->line('  ✓ RESULTADO: ' . $puntos['puntos_totales'] . ' PUNTOS GENERADOS');

        $this->line('');
        $this->line('');
        $this->info('========================================');
        $this->info('EJEMPLO 3: PENALIZACIÓN POR ATRASO');
        $this->info('========================================');

        $penalizacion = $servicio->calcularPenalizacionAtraso(150, 20);

        $this->line('INPUT:');
        $this->line('  Puntos Acumulados: 150 (EXPLÍCITO - saldo actual)');
        $this->line('  % Penalización: 20% (CONFIGURABLE)');
        $this->line('');
        $this->line('CÁLCULO:');
        $this->line('  Puntos perdidos: 150 × 20% = ' . $penalizacion['puntos_perdidos'] . ' puntos');
        $this->line('  Antes: ' . $penalizacion['puntos_antes'] . ' puntos');
        $this->line('  Después: ' . $penalizacion['puntos_restantes'] . ' puntos');
        $this->line('');
        $this->line('  ✓ RESULTADO: PIERDE ' . $penalizacion['puntos_perdidos'] . ' PUNTOS');

        $this->line('');
        $this->line('');
        $this->info('========================================');
        $this->info('EJEMPLO 4: CANJE DE PUNTOS A DINERO');
        $this->info('========================================');

        $canje = $servicio->calcularValorPuntos(50, 2.00);

        $this->line('INPUT:');
        $this->line('  Puntos a Canjear: 50 (EXPLÍCITO - solicitud usuario)');
        $this->line('  Valor por Punto: $2.00 (CONFIGURABLE)');
        $this->line('');
        $this->line('CÁLCULO:');
        $this->line('  Monto recibido: 50 × $2.00 = $' . number_format($canje['monto_canjeado'], 2));
        $this->line('');
        $this->line('  ✓ RESULTADO: RECIBE $' . number_format($canje['monto_canjeado'], 2));

        $this->line('');
        $this->line('');
        $this->info('========================================');
        $this->info('RESUMEN DE PARÁMETROS');
        $this->info('========================================');
        $this->line('');

        $this->line('<fg=green>CONFIGURABLE</> (en sucursal_configuraciones):');
        $this->line('  ✓ porcentaje_comision_apertura (10%)');
        $this->line('  ✓ porcentaje_interes_quincenal (5%)');
        $this->line('  ✓ bloque_venta_para_puntos ($1,200)');
        $this->line('  ✓ puntos_por_bloque (3)');
        $this->line('  ✓ precio_canje_por_punto ($2.00)');
        $this->line('  ✓ porcentaje_penalizacion_atraso (20%)');
        $this->line('  ✓ monto_seguro (varía por tabuladores)');
        $this->line('');

        $this->line('<fg=yellow>EXPLÍCITO</> (vienen del usuario/operación):');
        $this->line('  • principal (monto solicitado)');
        $this->line('  • numQuincenas (plazo del préstamo)');
        $this->line('  • totalEfectivo (dinero recaudado en corte)');
        $this->line('  • puntosAcumulados (saldo actual)');
        $this->line('  • puntosACanjear (lo que solicita canjear)');
    }
}
