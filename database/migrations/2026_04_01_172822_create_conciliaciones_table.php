<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conciliaciones', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('pago_distribuidora_id');
            $table->unsignedBigInteger('movimiento_bancario_id');
            $table->unsignedBigInteger('conciliado_por_usuario_id')->nullable();
            $table->timestamp('conciliado_en')->useCurrent();
            $table->decimal('monto_conciliado', 12, 2);
            $table->decimal('diferencia_monto', 12, 2)->default(0.00);
            $table->enum('estado', ['CONCILIADA', 'CON_DIFERENCIA', 'RECHAZADA'])->default('CONCILIADA');
            $table->text('observaciones')->nullable();

            $table->foreign('pago_distribuidora_id')->references('id')->on('pagos_distribuidora');
            $table->foreign('movimiento_bancario_id')->references('id')->on('movimientos_bancarios');
            $table->foreign('conciliado_por_usuario_id')->references('id')->on('usuarios');

            // Nombre de índice único acortado
            $table->unique(['pago_distribuidora_id', 'movimiento_bancario_id'], 'conc_pago_mov_unique');

            $table->index('pago_distribuidora_id');
            $table->index('movimiento_bancario_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conciliaciones');
    }
};
