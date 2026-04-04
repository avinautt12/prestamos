<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuentas_bancarias', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('tipo_propietario', ['PERSONA', 'DISTRIBUIDORA', 'EMPRESA']);
            $table->unsignedBigInteger('propietario_id');
            $table->string('banco', 100);
            $table->string('nombre_titular', 150);
            $table->string('numero_cuenta_mascarado', 50)->nullable();
            $table->string('clabe', 30)->nullable();
            $table->string('convenio', 50)->nullable();
            $table->string('referencia_base', 100)->nullable();
            $table->boolean('es_principal')->default(false);
            $table->timestamp('verificada_en')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->index(['tipo_propietario', 'propietario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas_bancarias');
    }
};
