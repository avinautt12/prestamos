<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('verificaciones_solicitud', function (Blueprint $table) {
            $table->longText('justificaciones_json')->nullable()->after('checklist_json');
        });
    }

    public function down(): void
    {
        Schema::table('verificaciones_solicitud', function (Blueprint $table) {
            $table->dropColumn('justificaciones_json');
        });
    }
};