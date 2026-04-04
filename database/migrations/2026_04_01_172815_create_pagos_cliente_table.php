<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_cliente', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('vale_id');
            $table->unsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('cobrado_por_usuario_id')->nullable();
            $table->dateTime('fecha_pago');
            $table->decimal('monto', 12, 2);
            $table->enum('metodo_pago', ['EFECTIVO', 'TRANSFERENCIA'])->default('EFECTIVO');
            $table->boolean('es_parcial')->default(false);
            $table->boolean('afecta_puntos')->default(true);
            $table->text('notas')->nullable();
            $table->timestamp('creado_en')->useCurrent();

            $table->foreign('vale_id')->references('id')->on('vales');
            $table->foreign('cliente_id')->references('id')->on('clientes');
            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('cobrado_por_usuario_id')->references('id')->on('usuarios');

            $table->index('vale_id');
            $table->index('fecha_pago');
            $table->index('distribuidora_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_cliente');
    }
};
