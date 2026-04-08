<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos_financieros', function (Blueprint $table) {
            $table->decimal('monto_principal', 12, 2)->default(0.00)->after('descripcion');
        });

        if (Schema::hasColumn('vales', 'monto_principal')) {
            DB::statement("
                UPDATE productos_financieros pf
                JOIN (
                    SELECT producto_financiero_id, MAX(monto_principal) AS monto_principal
                    FROM vales
                    GROUP BY producto_financiero_id
                ) v ON v.producto_financiero_id = pf.id
                SET pf.monto_principal = v.monto_principal
            ");

            Schema::table('vales', function (Blueprint $table) {
                $table->dropColumn('monto_principal');
            });
        }
    }

    public function down(): void
    {
        Schema::table('vales', function (Blueprint $table) {
            $table->decimal('monto_principal', 12, 2)->default(0.00)->after('estado');
        });

        if (Schema::hasColumn('productos_financieros', 'monto_principal')) {
            DB::statement("
                UPDATE vales v
                JOIN productos_financieros pf ON pf.id = v.producto_financiero_id
                SET v.monto_principal = pf.monto_principal
            ");

            Schema::table('productos_financieros', function (Blueprint $table) {
                $table->dropColumn('monto_principal');
            });
        }
    }
};
