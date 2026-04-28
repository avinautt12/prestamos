<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partidas_relacion_corte', function (Blueprint $table) {
            $table->boolean('es_atraso')->default(false)->after('pagos_totales');
            $table->smallInteger('numero_quincena')->nullable()->after('es_atraso');
            $table->smallInteger('quincenas_atrasadas_acumuladas')->default(0)->after('numero_quincena');
            $table->decimal('monto_pagado_previo', 12, 2)->default(0.00)->after('monto_total_linea');
            $table->unsignedBigInteger('corte_origen_id')->nullable()->after('monto_pagado_previo');
            $table->unsignedBigInteger('relacion_origen_id')->nullable()->after('corte_origen_id');

            $table->foreign('corte_origen_id')->references('id')->on('cortes')->nullOnDelete();
            $table->foreign('relacion_origen_id')->references('id')->on('relaciones_corte')->nullOnDelete();

            $table->index('es_atraso');
            $table->index(['vale_id', 'numero_quincena'], 'partidas_vale_quincena_idx');
        });
    }

    public function down(): void
    {
        Schema::table('partidas_relacion_corte', function (Blueprint $table) {
            $table->dropForeign(['corte_origen_id']);
            $table->dropForeign(['relacion_origen_id']);
            $table->dropIndex(['es_atraso']);
            $table->dropIndex('partidas_vale_quincena_idx');
            $table->dropColumn([
                'es_atraso',
                'numero_quincena',
                'quincenas_atrasadas_acumuladas',
                'monto_pagado_previo',
                'corte_origen_id',
                'relacion_origen_id',
            ]);
        });
    }
};
