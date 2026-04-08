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
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('foto_ine_frente')->nullable()->after('notas');
            $table->string('foto_ine_reverso')->nullable()->after('foto_ine_frente');
            $table->string('foto_selfie_ine')->nullable()->after('foto_ine_reverso');
            $table->string('cuenta_banco')->nullable()->after('foto_selfie_ine');
            $table->string('cuenta_clabe', 18)->nullable()->after('cuenta_banco');
            $table->string('cuenta_titular')->nullable()->after('cuenta_clabe');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn([
                'foto_ine_frente',
                'foto_ine_reverso',
                'foto_selfie_ine',
                'cuenta_banco',
                'cuenta_clabe',
                'cuenta_titular',
            ]);
        });
    }
};
