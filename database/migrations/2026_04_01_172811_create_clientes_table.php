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
            $table->enum('estado', ['EN_VERIFICACION', 'ACTIVO', 'BLOQUEADO', 'MOROSO', 'INACTIVO'])->default('EN_VERIFICACION')->nullable();
            $table->text('notas')->nullable();
            $table->string('foto_ine_frente')->nullable();
            $table->string('foto_ine_reverso')->nullable();
            $table->string('foto_selfie_ine')->nullable();
            $table->string('foto_comprobante_domicilio')->nullable();
            $table->string('cuenta_banco')->nullable();
            $table->string('cuenta_clabe', 18)->nullable();
            $table->string('cuenta_titular')->nullable();
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
