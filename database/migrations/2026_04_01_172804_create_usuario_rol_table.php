<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuario_rol', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('sucursal_id')->nullable();
            $table->timestamp('asignado_en')->useCurrent();
            $table->timestamp('revocado_en')->nullable();
            $table->boolean('es_principal')->default(false);

            $table->foreign('usuario_id')->references('id')->on('usuarios');
            $table->foreign('rol_id')->references('id')->on('roles');
            $table->foreign('sucursal_id')->references('id')->on('sucursales');

            $table->index('usuario_id');
            $table->index('rol_id');
            $table->index('sucursal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_rol');
    }
};
