<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partidas_relacion_corte', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('relacion_corte_id');
            $table->unsignedBigInteger('vale_id');
            $table->unsignedBigInteger('cliente_id');
            $table->string('nombre_producto_snapshot', 150);
            $table->integer('pagos_realizados')->default(0);
            $table->integer('pagos_totales')->default(0);
            $table->decimal('monto_comision', 12, 2)->default(0.00);
            $table->decimal('monto_pago', 12, 2)->default(0.00);
            $table->decimal('monto_recargo', 12, 2)->default(0.00);
            $table->decimal('monto_total_linea', 12, 2)->default(0.00);
            $table->timestamp('creado_en')->useCurrent();

            $table->foreign('relacion_corte_id')->references('id')->on('relaciones_corte');
            $table->foreign('vale_id')->references('id')->on('vales');
            $table->foreign('cliente_id')->references('id')->on('clientes');

            $table->index('relacion_corte_id');
            $table->index('vale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partidas_relacion_corte');
    }
};
