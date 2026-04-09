<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conciliaciones', function (Blueprint $table) {
            // Blindaje contra doble conciliacion del mismo movimiento o pago.
            $table->unique('movimiento_bancario_id', 'conciliaciones_movimiento_unique');
            $table->unique('pago_distribuidora_id', 'conciliaciones_pago_unique');
        });
    }

    public function down(): void
    {
        Schema::table('conciliaciones', function (Blueprint $table) {
            $table->dropUnique('conciliaciones_movimiento_unique');
            $table->dropUnique('conciliaciones_pago_unique');
        });
    }
};
