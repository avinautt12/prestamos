<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('name', 150)->nullable()->after('persona_id');
            $table->string('email', 150)->nullable()->unique()->after('name');
        });

        DB::statement('ALTER TABLE usuarios MODIFY persona_id BIGINT UNSIGNED NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE usuarios MODIFY persona_id BIGINT UNSIGNED NOT NULL');

        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropColumn(['name', 'email']);
        });
    }
};
