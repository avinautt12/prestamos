<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos_financieros', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 150);
            $table->string('descripcion', 255)->nullable();
            $table->integer('numero_quincenas');
            $table->decimal('porcentaje_comision_empresa', 8, 4)->default(0.0000);
            $table->decimal('monto_seguro', 12, 2)->default(0.00);
            $table->decimal('porcentaje_interes_quincenal', 8, 4)->default(0.0000);
            $table->decimal('monto_multa_tardia', 12, 2)->default(0.00);
            $table->enum('modo_desembolso', ['TRANSFERENCIA', 'EFECTIVO', 'MIXTO'])->default('TRANSFERENCIA');
            $table->boolean('activo')->default(true);
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos_financieros');
    }
};
