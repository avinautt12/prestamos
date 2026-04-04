<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cortes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('sucursal_id');
            $table->enum('tipo_corte', ['PAGOS', 'PUNTOS', 'MIXTO'])->default('PAGOS');
            $table->integer('dia_base_mes')->nullable();
            $table->time('hora_base')->nullable();
            $table->dateTime('fecha_programada');
            $table->dateTime('fecha_ejecucion')->nullable();
            $table->boolean('mantener_fecha_en_inhabil')->default(true);
            $table->enum('estado', ['PROGRAMADO', 'EJECUTADO', 'CERRADO', 'REPROCESADO'])->default('PROGRAMADO');
            $table->text('observaciones')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('sucursal_id')->references('id')->on('sucursales');

            $table->index('sucursal_id');
            $table->index('fecha_programada');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cortes');
    }
};
