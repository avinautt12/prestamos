<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos_cliente', function (Blueprint $table) {
            $table->index('cliente_id', 'pagos_cliente_cliente_id_idx');
            $table->index(['distribuidora_id', 'fecha_pago'], 'pagos_cliente_dist_fecha_idx');
        });

        Schema::table('partidas_relacion_corte', function (Blueprint $table) {
            $table->index('cliente_id', 'partidas_rel_corte_cliente_id_idx');
        });

        Schema::table('movimientos_puntos', function (Blueprint $table) {
            $table->index('pago_cliente_id', 'mov_puntos_pago_cliente_id_idx');
        });

        Schema::table('vales', function (Blueprint $table) {
            $table->index('fecha_emision', 'vales_fecha_emision_idx');
            $table->index(['estado', 'fecha_limite_pago'], 'vales_estado_limite_idx');
        });
    }

    public function down(): void
    {
        Schema::table('vales', function (Blueprint $table) {
            $table->dropIndex('vales_estado_limite_idx');
            $table->dropIndex('vales_fecha_emision_idx');
        });

        Schema::table('movimientos_puntos', function (Blueprint $table) {
            $table->dropIndex('mov_puntos_pago_cliente_id_idx');
        });

        Schema::table('partidas_relacion_corte', function (Blueprint $table) {
            $table->dropIndex('partidas_rel_corte_cliente_id_idx');
        });

        Schema::table('pagos_cliente', function (Blueprint $table) {
            $table->dropIndex('pagos_cliente_dist_fecha_idx');
            $table->dropIndex('pagos_cliente_cliente_id_idx');
        });
    }
};
