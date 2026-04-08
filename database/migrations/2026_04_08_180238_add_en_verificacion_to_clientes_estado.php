<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE clientes MODIFY COLUMN estado ENUM('EN_VERIFICACION','ACTIVO','BLOQUEADO','MOROSO','INACTIVO') DEFAULT 'EN_VERIFICACION'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE clientes MODIFY COLUMN estado ENUM('ACTIVO','BLOQUEADO','MOROSO','INACTIVO') DEFAULT 'ACTIVO'");
    }
};