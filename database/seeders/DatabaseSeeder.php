<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Stack de seeders reestructurado (abril 2026):
     *   - Fase 1: catálogos (sucursales, roles, categorias, productos, config sucursal)
     *   - Fase 2: usuarios operativos
     *   - Fase 3: solicitudes, distribuidoras, clientes
     *   - Fase 4: vales
     *   - Fase 5: cortes y todo lo encadenado (relaciones, pagos, conciliaciones, puntos)
     *   - Fase 6: bitácoras
     */
    public function run(): void
    {
        $this->call([
            // --- Catálogos base ---
            SucursalesSeeder::class,
            RolesSeeder::class,
            CategoriasDistribuidoraSeeder::class,
            ProductosFinancierosSeeder::class,
            SucursalConfiguracionesSeeder::class,

            // --- Configuracion global de puntos (singleton, editable por ADMIN) ---
            PuntosConfSeeder::class,

            // --- Usuarios operativos ---
            UsuariosSeeder::class,

            // --- Solicitudes, Distribuidoras y Clientes ---
            SolicitudesSeeder::class,
            DistribuidorasSeeder::class,
            ClientesSeeder::class,

            // --- Vales ---
            ValesSeeder::class,

            // --- Cortes + relaciones + pagos + conciliaciones + puntos ---
            CortesSeeder::class,

            // --- Bitácoras ---
            BitacorasSeeder::class,
        ]);
    }
}
