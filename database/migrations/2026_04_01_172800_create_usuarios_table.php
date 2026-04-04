<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('persona_id');
            $table->string('nombre_usuario', 80)->unique();
            $table->string('clave_hash', 255);
            $table->boolean('activo')->default(true);
            $table->boolean('requiere_vpn')->default(false);
            $table->enum('canal_login', ['WEB', 'VPN_WEB', 'MOVIL'])->default('WEB');
            $table->timestamp('ultimo_acceso_en')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('persona_id')->references('id')->on('personas');
            $table->unique('persona_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
