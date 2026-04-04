<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('primer_nombre', 100);
            $table->string('segundo_nombre', 100)->nullable();
            $table->string('apellido_paterno', 100);
            $table->string('apellido_materno', 100)->nullable();
            $table->enum('sexo', ['M', 'F', 'OTRO'])->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->string('curp', 18)->nullable()->unique();
            $table->string('rfc', 13)->nullable();
            $table->string('telefono_personal', 30)->nullable();
            $table->string('telefono_celular', 30)->nullable();
            $table->string('correo_electronico', 150)->nullable();
            $table->string('calle', 150)->nullable();
            $table->string('numero_exterior', 30)->nullable();
            $table->string('colonia', 120)->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->string('estado', 120)->nullable();
            $table->string('codigo_postal', 10)->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->text('notas')->nullable();
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->index(['apellido_paterno', 'apellido_materno', 'primer_nombre']);
            $table->index('rfc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personas');
    }
};
