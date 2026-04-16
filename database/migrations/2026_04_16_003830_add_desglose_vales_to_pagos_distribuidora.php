<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pagos_distribuidora', function (Blueprint $table) {
            $table->json('desglose_vales')->nullable()->after('observaciones');
            $table->boolean('desglose_aplicado')->default(false)->after('desglose_vales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos_distribuidora', function (Blueprint $table) {
            $table->dropColumn('desglose_vales');
        });
    }
};
