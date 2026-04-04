<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('persona_id')->unique();
            $table->string('codigo_cliente', 50)->nullable()->unique();
            $table->enum('estado', ['ACTIVO', 'BLOQUEADO', 'MOROSO', 'INACTIVO'])->default('ACTIVO');
            $table->text('notas')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('persona_id')->references('id')->on('personas');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
