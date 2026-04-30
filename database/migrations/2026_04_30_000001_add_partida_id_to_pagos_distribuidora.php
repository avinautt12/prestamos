<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos_distribuidora', function (Blueprint $table) {
            $table->unsignedBigInteger('partida_id')->nullable()->after('distribuidora_id');
            $table->foreign('partida_id')->references('id')->on('partidas_relacion_corte')->onDelete('cascade');
            $table->index('partida_id');
        });
    }

    public function down(): void
    {
        Schema::table('pagos_distribuidora', function (Blueprint $table) {
            $table->dropForeign(['partida_id']);
            $table->dropColumn('partida_id');
        });
    }
};