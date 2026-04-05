<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->string('categoria_inicial_codigo', 20)->default('COBRE')->after('estado');
            $table->string('ine_frente_path')->nullable()->after('vehiculos_json');
            $table->string('ine_reverso_path')->nullable()->after('ine_frente_path');
            $table->string('comprobante_domicilio_path')->nullable()->after('ine_reverso_path');
            $table->string('reporte_buro_path')->nullable()->after('comprobante_domicilio_path');

            $table->index('categoria_inicial_codigo');
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes', function (Blueprint $table) {
            $table->dropIndex(['categoria_inicial_codigo']);
            $table->dropColumn([
                'categoria_inicial_codigo',
                'ine_frente_path',
                'ine_reverso_path',
                'comprobante_domicilio_path',
                'reporte_buro_path',
            ]);
        });
    }
};
