<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_decisiones_gerente', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('gerente_usuario_id');
            $table->unsignedBigInteger('solicitud_id');
            $table->unsignedBigInteger('distribuidora_id')->nullable();
            $table->enum('tipo_evento', ['NUEVA_DISTRIBUIDORA', 'INCREMENTO_LIMITE', 'APROBACION']);
            $table->decimal('monto_anterior', 12, 2)->default(0);
            $table->decimal('monto_nuevo', 12, 2)->default(0);
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('gerente_usuario_id')->references('id')->on('usuarios');
            $table->foreign('solicitud_id')->references('id')->on('solicitudes');
            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');

            $table->index('gerente_usuario_id');
            $table->index('solicitud_id');
            $table->index('tipo_evento');
            $table->index('creado_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_decisiones_gerente');
    }
};
