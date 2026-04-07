<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE bitacora_decisiones_gerente MODIFY COLUMN tipo_evento ENUM('NUEVA_DISTRIBUIDORA','INCREMENTO_LIMITE','APROBACION','RECHAZO') NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE bitacora_decisiones_gerente MODIFY COLUMN tipo_evento ENUM('NUEVA_DISTRIBUIDORA','INCREMENTO_LIMITE','APROBACION') NOT NULL");
    }
};
