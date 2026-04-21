<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sugerencias_incremento_credito', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribuidora_id')->constrained('distribuidoras');
            $table->unsignedTinyInteger('score')->default(0);
            $table->decimal('incremento_sugerido', 12, 2);
            $table->json('motivo_json')->nullable();
            $table->enum('estado', ['PENDIENTE', 'APROBADA', 'RECHAZADA'])->default('PENDIENTE');
            $table->foreignId('aprobada_por_usuario_id')->nullable()->constrained('usuarios');
            $table->foreignId('rechazada_por_usuario_id')->nullable()->constrained('usuarios');
            $table->timestamp('decidido_en')->nullable();
            $table->timestamp('creado_en')->useCurrent();

            $table->index('estado');
            $table->index(['distribuidora_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sugerencias_incremento_credito');
    }
};