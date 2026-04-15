<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('clientes_distribuidora', 'prevale_aprobado')) {
            Schema::table('clientes_distribuidora', function (Blueprint $table) {
                $table->boolean('prevale_aprobado')->default(false)->after('estado_relacion');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('clientes_distribuidora', 'prevale_aprobado')) {
            Schema::table('clientes_distribuidora', function (Blueprint $table) {
                $table->dropColumn('prevale_aprobado');
            });
        }
    }
};
