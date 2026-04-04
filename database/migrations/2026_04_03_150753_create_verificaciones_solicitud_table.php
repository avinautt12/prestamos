<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verificaciones_solicitud', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('solicitud_id')
                ->constrained('solicitudes')
                ->onDelete('cascade');
            $table->foreignId('verificador_usuario_id')
                ->constrained('usuarios')
                ->onDelete('cascade');

            // Resultado de la verificación
            $table->enum('resultado', ['PENDIENTE', 'VERIFICADA', 'RECHAZADA'])
                ->default('PENDIENTE');

            // Observaciones del verificador
            $table->text('observaciones')->nullable();

            // Ubicación GPS donde se realizó la verificación
            $table->decimal('latitud_verificacion', 10, 7)->nullable();
            $table->decimal('longitud_verificacion', 11, 8)->nullable();

            // Fecha y hora de la visita
            $table->datetime('fecha_visita')->nullable();

            // Checklist de validación (JSON)
            $table->longText('checklist_json')->nullable();

            // Evidencia fotográfica
            $table->string('foto_fachada')->nullable();
            $table->string('foto_ine_con_persona')->nullable();
            $table->string('foto_comprobante')->nullable();

            // Distancia calculada entre el domicilio y la verificación
            $table->decimal('distancia_metros', 10, 2)->nullable();

            // Timestamps manuales (como en el resto de tus tablas)
            $table->datetime('creado_en')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->datetime('actualizado_en')->default(DB::raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

            // Índices y únicos
            $table->unique('solicitud_id');
            $table->index('verificador_usuario_id');
            $table->index('resultado');
            $table->index('fecha_visita');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verificaciones_solicitud');
    }
};
