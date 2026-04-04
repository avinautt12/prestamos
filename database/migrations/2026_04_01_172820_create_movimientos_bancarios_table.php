<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_bancarios', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('cuenta_banco_empresa_id')->nullable();
            $table->string('referencia', 100)->nullable();
            $table->date('fecha_movimiento');
            $table->time('hora_movimiento')->nullable();
            $table->decimal('monto', 12, 2);
            $table->string('tipo_movimiento', 50)->nullable();
            $table->string('folio', 100)->nullable();
            $table->string('nombre_pagador', 150)->nullable();
            $table->text('concepto_raw')->nullable();
            $table->timestamp('creado_en')->useCurrent();

            $table->foreign('cuenta_banco_empresa_id')->references('id')->on('cuentas_bancarias');

            $table->index('referencia');
            $table->index(['fecha_movimiento', 'monto']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_bancarios');
    }
};
