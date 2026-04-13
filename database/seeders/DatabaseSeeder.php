<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SucursalesSeeder::class,
            RolesSeeder::class,
            CategoriasDistribuidoraSeeder::class,
            ProductosFinancierosSeeder::class,
            CuentasBancariasEmpresaSeeder::class,
            UsuarioTestSeeder::class,
            SolicitudesPruebaSeeder::class,
            DistribuidoraPruebaSeeder::class,
            DistribuidoraCompletaPruebaSeeder::class,
            DatosPruebaAmpliosSeeder::class,
            PrevalesCajeraSeeder::class,
            ConciliacionesCajeraSeeder::class,
            EscenariosPresentacionSeeder::class,
        ]);
    }
}
