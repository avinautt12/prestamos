<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relaciones_corte', function (Blueprint $table) {
            $table->unsignedBigInteger('relacion_anterior_id')->nullable()->after('distribuidora_id');
            $table->timestamp('cerrada_por_arrastre_en')->nullable()->after('estado');
            $table->decimal('total_arrastre_recibido', 12, 2)->default(0.00)->after('total_a_pagar');

            $table->foreign('relacion_anterior_id')->references('id')->on('relaciones_corte')->nullOnDelete();
            $table->index('relacion_anterior_id');
        });
    }

    public function down(): void
    {
        Schema::table('relaciones_corte', function (Blueprint $table) {
            $table->dropForeign(['relacion_anterior_id']);
            $table->dropIndex(['relacion_anterior_id']);
            $table->dropColumn([
                'relacion_anterior_id',
                'cerrada_por_arrastre_en',
                'total_arrastre_recibido',
            ]);
        });
    }
};
