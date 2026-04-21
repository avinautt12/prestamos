<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historial_credito_score', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribuidora_id')->constrained('distribuidoras');
            $table->string('mes_evalucion', 7);
            $table->unsignedTinyInteger('score_base')->default(100);
            $table->decimal('score_final', 5, 2)->default(100.00);
            $table->json('factores_json')->nullable();
            $table->decimal('incremento_sugerido', 12, 2)->default(0.00);
            $table->boolean('auto_aplicado')->default(false);
            $table->timestamps();

            $table->unique(['distribuidora_id', 'mes_evalucion']);
            $table->index('mes_evalucion');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_credito_score');
    }
};