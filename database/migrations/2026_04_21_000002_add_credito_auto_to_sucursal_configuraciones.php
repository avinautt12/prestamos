<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sucursal_configuraciones', function (Blueprint $table) {
            $table->decimal('umbral_incremento_auto', 12, 2)->after('multa_incumplimiento_monto')->nullable();
            $table->decimal('porcentaje_incremento_min_score', 5, 2)->after('umbral_incremento_auto')->default(70.00);
        });
    }

    public function down(): void
    {
        Schema::table('sucursal_configuraciones', function (Blueprint $table) {
            $table->dropColumn(['umbral_incremento_auto', 'porcentaje_incremento_min_score']);
        });
    }
};