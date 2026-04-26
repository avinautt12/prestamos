<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_distribuidora', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('relacion_corte_id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('cuenta_banco_empresa_id')->nullable();
            $table->decimal('monto', 12, 2);
            $table->enum('metodo_pago', ['TRANSFERENCIA', 'DEPOSITO', 'OTRO'])->default('TRANSFERENCIA');
            $table->string('referencia_reportada', 100)->nullable();
            $table->dateTime('fecha_pago');
            $table->enum('estado', ['REPORTADO', 'DETECTADO', 'CONCILIADO', 'RECHAZADO'])->default('REPORTADO');
            $table->text('observaciones')->nullable();
            $table->json('desglose_vales')->nullable();
            $table->boolean('desglose_aplicado')->default(false);
            $table->timestamp('creado_en')->useCurrent();

            $table->foreign('relacion_corte_id')->references('id')->on('relaciones_corte');
            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('cuenta_banco_empresa_id')->references('id')->on('cuentas_bancarias');

            $table->index('relacion_corte_id');
            $table->index('distribuidora_id');
            $table->index(['relacion_corte_id', 'estado'], 'pagos_dist_rel_estado_idx');
            $table->index(['distribuidora_id', 'estado'], 'pagos_dist_dist_estado_idx');
            $table->index(['distribuidora_id', 'fecha_pago'], 'pagos_dist_dist_fecha_idx');
            $table->index(['referencia_reportada', 'estado'], 'pagos_dist_ref_estado_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_distribuidora');
    }
};
