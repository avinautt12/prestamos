<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vales', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('numero_vale', 50)->unique();
            $table->unsignedBigInteger('distribuidora_id');
            $table->unsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('producto_financiero_id');
            $table->unsignedBigInteger('sucursal_id');
            $table->unsignedBigInteger('creado_por_usuario_id')->nullable();
            $table->unsignedBigInteger('aprobado_por_usuario_id')->nullable();
            $table->enum('estado', [
                'BORRADOR',
                'APROBADO',
                'TRANSFERIDO',
                'ACTIVO',
                'PAGO_PARCIAL',
                'PAGADO',
                'MOROSO',
                'RECLAMADO',
                'CANCELADO',
                'REVERSADO'
            ])->default('BORRADOR');
            $table->decimal('monto', 12, 2);
            $table->decimal('porcentaje_comision_empresa_snap', 8, 4)->default(0.0000);
            $table->decimal('monto_comision_empresa', 12, 2)->default(0.00);
            $table->decimal('monto_seguro_snap', 12, 2)->default(0.00);
            $table->decimal('porcentaje_interes_snap', 8, 4)->default(0.0000);
            $table->decimal('monto_interes', 12, 2)->default(0.00);
            $table->decimal('porcentaje_ganancia_dist_snap', 8, 4)->default(0.0000);
            $table->decimal('monto_ganancia_distribuidora', 12, 2)->default(0.00);
            $table->decimal('monto_multa_snap', 12, 2)->default(0.00);
            $table->decimal('monto_total_deuda', 12, 2);
            $table->decimal('monto_quincenal', 12, 2);
            $table->integer('quincenas_totales');
            $table->integer('pagos_realizados')->default(0);
            $table->decimal('saldo_actual', 12, 2);
            $table->string('referencia_transferencia', 100)->nullable();
            $table->dateTime('fecha_emision')->nullable();
            $table->dateTime('fecha_transferencia')->nullable();
            $table->date('fecha_limite_pago')->nullable();
            $table->date('fecha_inicio_pago_anticipado')->nullable();
            $table->date('fecha_fin_pago_anticipado')->nullable();
            $table->text('motivo_reclamo')->nullable();
            $table->boolean('cancelado')->default(false);
            $table->dateTime('cancelado_en')->nullable();
            $table->text('notas')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('distribuidora_id')->references('id')->on('distribuidoras');
            $table->foreign('cliente_id')->references('id')->on('clientes');
            $table->foreign('producto_financiero_id')->references('id')->on('productos_financieros');
            $table->foreign('sucursal_id')->references('id')->on('sucursales');
            $table->foreign('creado_por_usuario_id')->references('id')->on('usuarios');
            $table->foreign('aprobado_por_usuario_id')->references('id')->on('usuarios');

            $table->index('distribuidora_id');
            $table->index('cliente_id');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vales');
    }
};
