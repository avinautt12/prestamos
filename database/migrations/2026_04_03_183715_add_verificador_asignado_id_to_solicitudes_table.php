<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->foreignId('verificador_asignado_id')
                ->nullable()
                ->after('coordinador_usuario_id')
                ->constrained('usuarios')
                ->nullOnDelete();

            $table->index('verificador_asignado_id');
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->dropForeign(['verificador_asignado_id']);
            $table->dropColumn('verificador_asignado_id');
        });
    }
};
