<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_puntos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('vale_id')->nullable();
            $table->unsignedBigInteger('corte_id')->nullable();
            $table->unsignedBigInteger('pago_cliente_id')->nullable();
            $table->enum('tipo_movimiento', [
                'GANADO_ANTICIPADO',
                'GANADO_PUNTUAL',
                'PENALIZACION_ATRASO',
                'AJUSTE_MANUAL',
                'REVERSO',
                'CANJE'
            ]);
            $table->decimal('puntos', 12, 2);
            $table->decimal('valor_punto_snapshot', 12, 2)->default(2.00);
            $table->string('motivo', 255)->nullable();
            $table->timestamp('fecha_movimiento')->useCurrent();
            $table->timestamp('creado_en')->useCurrent();

            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('vale_id')->references('id')->on('vales');
            $table->foreign('corte_id')->references('id')->on('cortes');
            $table->foreign('pago_cliente_id')->references('id')->on('pagos_cliente');

            $table->index('distribuidora_id');
            $table->index('vale_id');
            $table->index('corte_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_puntos');
    }
};
