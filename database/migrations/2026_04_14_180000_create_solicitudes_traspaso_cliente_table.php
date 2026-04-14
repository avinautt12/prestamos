<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_traspaso_cliente', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('distribuidora_origen_id');
            $table->unsignedBigInteger('distribuidora_destino_id');
            $table->unsignedBigInteger('solicitada_por_usuario_id');
            $table->unsignedBigInteger('coordinador_usuario_id')->nullable();
            $table->unsignedBigInteger('confirmada_por_usuario_id')->nullable();
            $table->enum('estado', [
                'PENDIENTE_COORDINADOR',
                'APROBADA_CODIGO_EMITIDO',
                'RECHAZADA',
                'CANCELADA',
                'EJECUTADA',
                'EXPIRADA',
            ])->default('PENDIENTE_COORDINADOR');
            $table->string('codigo_confirmacion', 32)->nullable();
            $table->timestamp('codigo_generado_en')->nullable();
            $table->timestamp('codigo_expira_en')->nullable();
            $table->timestamp('confirmada_en')->nullable();
            $table->timestamp('ejecutada_en')->nullable();
            $table->text('motivo_solicitud')->nullable();
            $table->text('motivo_rechazo')->nullable();
            $table->text('comentarios')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('cliente_id')->references('id')->on('clientes');
            $table->foreign('distribuidora_origen_id')->references('id')->on('distribuidoras');
            $table->foreign('distribuidora_destino_id')->references('id')->on('distribuidoras');
            $table->foreign('solicitada_por_usuario_id')->references('id')->on('usuarios');
            $table->foreign('coordinador_usuario_id')->references('id')->on('usuarios');
            $table->foreign('confirmada_por_usuario_id')->references('id')->on('usuarios');

            $table->index(['distribuidora_destino_id', 'estado'], 'traspaso_destino_estado_idx');
            $table->index(['distribuidora_origen_id', 'estado'], 'traspaso_origen_estado_idx');
            $table->index(['cliente_id', 'estado'], 'traspaso_cliente_estado_idx');
            $table->index(['estado', 'codigo_expira_en'], 'traspaso_estado_expira_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_traspaso_cliente');
    }
};
