<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sucursal_configuraciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();

            $table->unsignedTinyInteger('dia_corte')->nullable();
            $table->time('hora_corte')->nullable();

            $table->unsignedSmallInteger('frecuencia_pago_dias')->default(14);
            $table->unsignedSmallInteger('plazo_pago_dias')->default(15);
            $table->decimal('linea_credito_default', 12, 2)->default(0.00);

            $table->json('seguro_tabuladores_json')->nullable();
            $table->decimal('porcentaje_comision_apertura', 6, 4)->default(10.0000);
            $table->decimal('porcentaje_interes_quincenal', 6, 4)->default(5.0000);
            $table->decimal('multa_incumplimiento_monto', 12, 2)->default(300.00);
            $table->unsignedInteger('factor_divisor_puntos')->default(1200);
            $table->unsignedInteger('multiplicador_puntos')->default(3);
            $table->decimal('valor_punto_mxn', 12, 2)->default(2.00);

            // Overrides por sucursal para no tocar catalogos globales.
            $table->json('categorias_config_json')->nullable();
            $table->json('productos_config_json')->nullable();

            $table->foreignId('actualizado_por_usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->dateTime('creado_en')->useCurrent();
            $table->dateTime('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->unique('sucursal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sucursal_configuraciones');
    }
};
