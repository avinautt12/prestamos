<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_auditorias', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_evento', 50);
            $table->string('nivel', 20)->default('INFO');
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('usuario_nombre')->nullable();
            $table->string('usuario_rol')->nullable();
            $table->unsignedBigInteger('sucursal_id')->nullable();
            $table->string('modulo', 100);
            $table->text('descripcion');
            $table->json('datos_extra')->nullable();
            $table->text('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('creado_en')->useCurrent();

            $table->index(['tipo_evento', 'creado_en']);
            $table->index(['modulo', 'creado_en']);
            $table->index(['usuario_id', 'creado_en']);
            $table->index(['nivel', 'creado_en']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_auditorias');
    }
};