<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('egresos_empresa_simulados', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('vale_id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('ejecutado_por_usuario_id')->nullable();
            $table->string('origen', 40)->default('VALE_FERIADO');
            $table->string('referencia_interna', 120)->unique();
            $table->decimal('monto', 12, 2);
            $table->dateTime('fecha_operacion');
            $table->text('notas')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('vale_id')->references('id')->on('vales');
            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('cliente_id')->references('id')->on('clientes');
            $table->foreign('ejecutado_por_usuario_id')->references('id')->on('usuarios');

            $table->unique('vale_id');
            $table->index(['distribuidora_id', 'fecha_operacion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('egresos_empresa_simulados');
    }
};
