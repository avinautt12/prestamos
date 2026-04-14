<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personas', function (Blueprint $table) {
            $table->dropIndex('personas_rfc_index');
            $table->unique('rfc');
        });

        Schema::table('clientes_distribuidora', function (Blueprint $table) {
            $table->index('estado_relacion');
        });
    }

    public function down(): void
    {
        Schema::table('clientes_distribuidora', function (Blueprint $table) {
            $table->dropIndex(['estado_relacion']);
        });

        Schema::table('personas', function (Blueprint $table) {
            $table->dropUnique(['rfc']);
            $table->index('rfc', 'personas_rfc_index');
        });
    }
};
