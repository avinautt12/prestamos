<?php

namespace Tests\Feature\Coordinador;

use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoordinadorAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_el_coordinador_puede_ver_sus_paginas_principales(): void
    {
        $coordinador = $this->usuario('coordinador');

        $this->actingAs($coordinador)
            ->get(route('coordinador.dashboard'))
            ->assertOk();

        $this->actingAs($coordinador)
            ->get(route('coordinador.solicitudes.create'))
            ->assertOk();

        $this->actingAs($coordinador)
            ->get(route('coordinador.solicitudes.index'))
            ->assertOk();

        $this->actingAs($coordinador)
            ->get(route('coordinador.clientes'))
            ->assertOk();

        $this->actingAs($coordinador)
            ->get(route('coordinador.mis-distribuidoras'))
            ->assertOk();
    }

    public function test_el_verificador_no_puede_entrar_al_dashboard_del_coordinador(): void
    {
        $verificador = $this->usuario('verificador');

        $this->actingAs($verificador)
            ->get(route('coordinador.dashboard'))
            ->assertRedirect(route('verificador.dashboard'));
    }

    private function usuario(string $nombreUsuario): Usuario
    {
        return Usuario::where('nombre_usuario', $nombreUsuario)->firstOrFail();
    }
}
