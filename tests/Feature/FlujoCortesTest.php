<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Services\CorteService;
use App\Services\Distribuidora\DistribuidoraNotificationService;
use Mockery;
use Carbon\Carbon;

class FlujoCortesTest extends TestCase
{
    /**
     * Prueba el algoritmo matemático de ventanas de cortes para las dos quincenas estipuladas en MD.
     */
    public function test_calcula_proximo_corte_a_15_dias()
    {
        $mockNotification = Mockery::mock(DistribuidoraNotificationService::class);
        $service = new CorteService($mockNotification);

        $reflection = new \ReflectionClass(CorteService::class);
        $method = $reflection->getMethod('calcularFechaProgramada');
        $method->setAccessible(true);

        // Caso 1: Inicio de mes
        Carbon::setTestNow(Carbon::create(2026, 4, 1, 10, 0, 0));
        $diaCorteBase = 5;
        $primerCorte = $method->invoke($service, $diaCorteBase, '18:00:00');
        $this->assertEquals('2026-04-05 18:00:00', $primerCorte->format('Y-m-d H:i:s'));

        // Caso 2: Segunda quincena (+15 días)
        Carbon::setTestNow(Carbon::create(2026, 4, 6, 12, 0, 0));
        $segundoCorte = $method->invoke($service, $diaCorteBase, '18:00:00');
        $this->assertEquals('2026-04-20 18:00:00', $segundoCorte->format('Y-m-d H:i:s'));

        // Caso 3: Salto al mes siguiente
        Carbon::setTestNow(Carbon::create(2026, 4, 21, 12, 0, 0));
        $tercerCorte = $method->invoke($service, $diaCorteBase, '18:00:00');
        $this->assertEquals('2026-05-05 18:00:00', $tercerCorte->format('Y-m-d H:i:s'));

        // Reset
        Carbon::setTestNow();
    }
}
