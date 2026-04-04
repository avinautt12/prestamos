<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('persona_solicitante_id');
            $table->unsignedBigInteger('sucursal_id');
            $table->unsignedBigInteger('capturada_por_usuario_id')->nullable();
            $table->unsignedBigInteger('coordinador_usuario_id')->nullable();
            $table->unsignedBigInteger('cuenta_bancaria_id')->nullable();
            $table->enum('estado', [
                'PRE',
                'MODIFICADA',
                'EN_REVISION',
                'VERIFICADA',
                'POSIBLE_DISTRIBUIDORA',
                'APROBADA',
                'RECHAZADA'
            ])->default('PRE');
            $table->longText('datos_familiares_json')->nullable();
            $table->longText('afiliaciones_externas_json')->nullable();
            $table->longText('vehiculos_json')->nullable();
            $table->string('resultado_buro', 100)->nullable();
            $table->text('observaciones_validacion')->nullable();
            $table->boolean('prevale_aprobado')->default(false);
            $table->boolean('fotos_casa_completas')->default(false);
            $table->timestamp('enviada_en')->nullable();
            $table->timestamp('revisada_en')->nullable();
            $table->timestamp('decidida_en')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('persona_solicitante_id')->references('id')->on('personas');
            $table->foreign('sucursal_id')->references('id')->on('sucursales');
            $table->foreign('capturada_por_usuario_id')->references('id')->on('usuarios');
            $table->foreign('coordinador_usuario_id')->references('id')->on('usuarios');
            $table->foreign('cuenta_bancaria_id')->references('id')->on('cuentas_bancarias');

            $table->index('estado');
            $table->index('sucursal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes');
    }
};
