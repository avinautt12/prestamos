<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->decimal('limite_credito_solicitado', 12, 2)
                ->nullable()
                ->after('vehiculos_json')
                ->comment('Monto de crédito solicitado por el prospecto distribuidora');
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->dropColumn('limite_credito_solicitado');
        });
    }
};
