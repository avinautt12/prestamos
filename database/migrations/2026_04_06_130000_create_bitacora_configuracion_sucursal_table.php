<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_configuracion_sucursal', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sucursal_configuracion_id');
            $table->unsignedBigInteger('sucursal_id');
            $table->unsignedBigInteger('actualizado_por_usuario_id')->nullable();

            $table->enum('tipo_evento', ['SUCURSAL', 'CATEGORIA', 'PRODUCTO']);
            $table->unsignedBigInteger('referencia_id')->nullable();
            $table->json('cambios_antes_json')->nullable();
            $table->json('cambios_despues_json')->nullable();

            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('sucursal_configuracion_id', 'fk_bcs_cfg')
                ->references('id')
                ->on('sucursal_configuraciones')
                ->cascadeOnDelete();

            $table->foreign('sucursal_id', 'fk_bcs_sucursal')
                ->references('id')
                ->on('sucursales')
                ->cascadeOnDelete();

            $table->foreign('actualizado_por_usuario_id', 'fk_bcs_usuario')
                ->references('id')
                ->on('usuarios')
                ->nullOnDelete();

            $table->index(['sucursal_id', 'creado_en']);
            $table->index(['tipo_evento', 'referencia_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_configuracion_sucursal');
    }
};
