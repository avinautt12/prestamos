<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tablas = [
            'usuarios',
            'roles',
            'sucursales',
            'categorias_distribuidora',
            'productos_financieros',
        ];

        foreach ($tablas as $tabla) {
            if (!Schema::hasTable($tabla) || Schema::hasColumn($tabla, 'deleted_at')) {
                continue;
            }

            Schema::table($tabla, function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        $tablas = [
            'usuarios',
            'roles',
            'sucursales',
            'categorias_distribuidora',
            'productos_financieros',
        ];

        foreach ($tablas as $tabla) {
            if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, 'deleted_at')) {
                continue;
            }

            Schema::table($tabla, function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
