<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla singleton de configuracion global del sistema de puntos.
     * Solo debe existir 1 fila. Editable unicamente por rol ADMIN.
     */
    public function up(): void
    {
        Schema::create('puntos_conf', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('factor_divisor_puntos')->default(1200);
            $table->unsignedInteger('multiplicador_puntos')->default(3);
            $table->decimal('valor_punto_mxn', 12, 2)->default(2.00);
            $table->decimal('castigo_pct_atraso', 8, 4)->default(20.0000);

            $table->foreignId('actualizado_por_usuario_id')
                ->nullable()
                ->constrained('usuarios')
                ->nullOnDelete();

            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puntos_conf');
    }
};
