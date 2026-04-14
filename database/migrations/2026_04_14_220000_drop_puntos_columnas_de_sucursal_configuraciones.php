<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Elimina las 3 columnas de configuracion de puntos de sucursal_configuraciones.
     * Ahora son globales en `puntos_conf` (singleton, editable solo por ADMIN).
     */
    public function up(): void
    {
        Schema::table('sucursal_configuraciones', function (Blueprint $table) {
            $table->dropColumn([
                'factor_divisor_puntos',
                'multiplicador_puntos',
                'valor_punto_mxn',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('sucursal_configuraciones', function (Blueprint $table) {
            $table->unsignedInteger('factor_divisor_puntos')->default(1200)->after('multa_incumplimiento_monto');
            $table->unsignedInteger('multiplicador_puntos')->default(3)->after('factor_divisor_puntos');
            $table->decimal('valor_punto_mxn', 12, 2)->default(2.00)->after('multiplicador_puntos');
        });
    }
};
