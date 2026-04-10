<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos_financieros', function (Blueprint $table) {
            if (!Schema::hasColumn('productos_financieros', 'deleted_at')) {
                $table->softDeletes('deleted_at')->after('actualizado_en');
            }
        });
    }

    public function down(): void
    {
        Schema::table('productos_financieros', function (Blueprint $table) {
            if (Schema::hasColumn('productos_financieros', 'deleted_at')) {
                $table->dropSoftDeletes('deleted_at');
            }
        });
    }
};
