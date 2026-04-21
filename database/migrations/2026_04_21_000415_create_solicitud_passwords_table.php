<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('solicitudes_password', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('aprobado_por_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->enum('estado', ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'EXPIRADA'])->default('PENDIENTE');
            $table->string('token_generado')->nullable()->unique();
            $table->timestamp('expira_en')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitudes_password');
    }
};
