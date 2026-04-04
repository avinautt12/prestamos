<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relaciones_corte', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('corte_id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->string('numero_relacion', 50)->unique();
            $table->string('referencia_pago', 100)->nullable();
            $table->date('fecha_limite_pago');
            $table->date('fecha_inicio_pago_anticipado')->nullable();
            $table->date('fecha_fin_pago_anticipado')->nullable();
            $table->decimal('limite_credito_snapshot', 12, 2)->default(0.00);
            $table->decimal('credito_disponible_snapshot', 12, 2)->default(0.00);
            $table->decimal('puntos_snapshot', 12, 2)->default(0.00);
            $table->decimal('total_comision', 12, 2)->default(0.00);
            $table->decimal('total_pago', 12, 2)->default(0.00);
            $table->decimal('total_recargos', 12, 2)->default(0.00);
            $table->decimal('total_a_pagar', 12, 2)->default(0.00);
            $table->enum('estado', ['GENERADA', 'PAGADA', 'PARCIAL', 'VENCIDA', 'CERRADA'])->default('GENERADA');
            $table->timestamp('generada_en')->useCurrent();

            $table->foreign('corte_id')->references('id')->on('cortes');
            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');

            $table->index('corte_id');
            $table->index('distribuidora_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relaciones_corte');
    }
};
