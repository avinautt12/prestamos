<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias_distribuidora', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 100)->unique();
            $table->decimal('porcentaje_comision', 8, 4)->default(0.0000);
            $table->integer('puntos_por_cada_1200')->default(3);
            $table->decimal('valor_punto', 12, 2)->default(2.00);
            $table->decimal('castigo_pct_atraso', 8, 4)->default(20.0000);
            $table->boolean('activo')->default(true);
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias_distribuidora');
    }
};
