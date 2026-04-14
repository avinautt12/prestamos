<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Elimina la columna `valor_punto` de categorias_distribuidora.
     * Era puramente decorativa (solo se exponia al frontend, ningun calculo la leia).
     * El valor real del punto ahora es global en `puntos_conf.valor_punto_mxn`.
     */
    public function up(): void
    {
        Schema::table('categorias_distribuidora', function (Blueprint $table) {
            $table->dropColumn('valor_punto');
        });
    }

    public function down(): void
    {
        Schema::table('categorias_distribuidora', function (Blueprint $table) {
            $table->decimal('valor_punto', 12, 2)->default(2.00)->after('puntos_por_cada_1200');
        });
    }
};
