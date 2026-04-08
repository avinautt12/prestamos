<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SucursalesSeeder::class,
            RolesSeeder::class,
            CategoriasDistribuidoraSeeder::class,
            ProductosFinancierosSeeder::class,
            UsuarioTestSeeder::class,
            DistribuidoraPruebaSeeder::class,
            SolicitudesPruebaSeeder::class,
            PrevalesCajeraSeeder::class, 
        ]);
    }
}
