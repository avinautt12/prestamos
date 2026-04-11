<?php

namespace Tests\Unit;

use App\Services\ProductoFinancieroService;
use App\Services\ServicioReglasNegocio;
use Tests\TestCase;

class FormulasFinancierasTest extends TestCase
{
    public function test_formula_vale_profesor_da_totales_correctos(): void
    {
        $reglas = app(ServicioReglasNegocio::class);

        $resultado = $reglas->calcularDeudaTotal(15000, 10, 100, 5, 8);

        $this->assertSame(1500.0, $resultado['comision']);
        $this->assertSame(6000.0, $resultado['interes_total']);
        $this->assertSame(22600.0, $resultado['total']);

        $pagoQuincenal = round($resultado['total'] / 8, 2);
        $this->assertSame(2825.0, $pagoQuincenal);
    }

    public function test_formula_puntos_con_redondeo_piso_es_correcta(): void
    {
        $reglas = app(ServicioReglasNegocio::class);

        $puntos = $reglas->calcularPuntos(69650, 1200, 3);

        $this->assertSame(58, $puntos['bloques_completos']);
        $this->assertSame(174, $puntos['puntos_totales']);
        $this->assertSame(50.0, $puntos['resto_no_convertido']);
    }

    public function test_formula_penalizacion_atraso_20_por_ciento(): void
    {
        $reglas = app(ServicioReglasNegocio::class);

        $penalizacion = $reglas->calcularPenalizacionAtraso(174, 20);

        $this->assertSame(34, $penalizacion['puntos_perdidos']);
        $this->assertSame(140, $penalizacion['puntos_restantes']);
    }

    public function test_producto_service_usa_mismas_formulas_que_reglas_negocio(): void
    {
        $productoService = app(ProductoFinancieroService::class);

        $montos = $productoService->calcularMontosDelProducto(15000, 10, 100, 5, 8);

        $this->assertSame(1500.0, $montos['comision_empresa']);
        $this->assertSame(6000.0, $montos['interes_total']);
        $this->assertSame(22600.0, $montos['total_deuda']);
        $this->assertSame(2825.0, $montos['monto_quincenal']);
        $this->assertSame(8, $montos['quincenas_totales']);
    }

    public function test_ganancia_categoria_plata_en_base_principal(): void
    {
        $productoService = app(ProductoFinancieroService::class);

        $ganancia = $productoService->calcularGananciaDistribuidora(15000, 6);

        $this->assertSame(900.0, $ganancia);
        $this->assertSame(112.5, round($ganancia / 8, 2));
    }
}
