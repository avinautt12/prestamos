<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes_distribuidora', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('cliente_id');
            $table->enum('estado_relacion', ['ACTIVA', 'BLOQUEADA', 'TERMINADA'])->default('ACTIVA');
            $table->boolean('prevale_aprobado')->default(false);
            $table->boolean('bloqueado_por_parentesco')->default(false);
            $table->text('observaciones_parentesco')->nullable();
            $table->timestamp('vinculado_en')->useCurrent();
            $table->timestamp('desvinculado_en')->nullable();

            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('cliente_id')->references('id')->on('clientes');

            $table->unique(['distribuidora_id', 'cliente_id']);
            $table->index('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes_distribuidora');
    }
};
