<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distribuidoras', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('persona_id')->unique();
            $table->unsignedBigInteger('solicitud_id')->nullable()->unique();
            $table->unsignedBigInteger('sucursal_id');
            $table->unsignedBigInteger('coordinador_usuario_id')->nullable();
            $table->unsignedBigInteger('categoria_id')->nullable();
            $table->unsignedBigInteger('cuenta_bancaria_id')->nullable();
            $table->string('numero_distribuidora', 50)->unique();
            $table->enum('estado', [
                'CANDIDATA',
                'POSIBLE',
                'ACTIVA',
                'INACTIVA',
                'MOROSA',
                'BLOQUEADA',
                'CERRADA'
            ])->default('CANDIDATA');
            $table->decimal('limite_credito', 12, 2)->default(0.00);
            $table->decimal('credito_disponible', 12, 2)->default(0.00);
            $table->boolean('sin_limite')->default(false);
            $table->decimal('puntos_actuales', 12, 2)->default(0.00);
            $table->boolean('puede_emitir_vales')->default(false);
            $table->boolean('es_externa')->default(false);
            $table->timestamp('activada_en')->nullable();
            $table->timestamp('desactivada_en')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('persona_id')->references('id')->on('personas');
            $table->foreign('solicitud_id')->references('id')->on('solicitudes');
            $table->foreign('sucursal_id')->references('id')->on('sucursales');
            $table->foreign('coordinador_usuario_id')->references('id')->on('usuarios');
            $table->foreign('categoria_id')->references('id')->on('categorias_distribuidora');
            $table->foreign('cuenta_bancaria_id')->references('id')->on('cuentas_bancarias');

            $table->index('estado');
            $table->index('sucursal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distribuidoras');
    }
};
