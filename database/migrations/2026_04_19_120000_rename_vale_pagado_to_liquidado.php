<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE vales MODIFY COLUMN estado ENUM('BORRADOR','APROBADO','TRANSFERIDO','ACTIVO','PAGO_PARCIAL','PAGADO','LIQUIDADO','MOROSO','RECLAMADO','CANCELADO','REVERSADO') NOT NULL DEFAULT 'BORRADOR'");

        DB::statement("UPDATE vales SET estado = 'LIQUIDADO' WHERE estado = 'PAGADO'");

        DB::statement("ALTER TABLE vales MODIFY COLUMN estado ENUM('BORRADOR','APROBADO','TRANSFERIDO','ACTIVO','PAGO_PARCIAL','LIQUIDADO','MOROSO','RECLAMADO','CANCELADO','REVERSADO') NOT NULL DEFAULT 'BORRADOR'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE vales MODIFY COLUMN estado ENUM('BORRADOR','APROBADO','TRANSFERIDO','ACTIVO','PAGO_PARCIAL','PAGADO','LIQUIDADO','MOROSO','RECLAMADO','CANCELADO','REVERSADO') NOT NULL DEFAULT 'BORRADOR'");

        DB::statement("UPDATE vales SET estado = 'PAGADO' WHERE estado = 'LIQUIDADO'");

        DB::statement("ALTER TABLE vales MODIFY COLUMN estado ENUM('BORRADOR','APROBADO','TRANSFERIDO','ACTIVO','PAGO_PARCIAL','PAGADO','MOROSO','RECLAMADO','CANCELADO','REVERSADO') NOT NULL DEFAULT 'BORRADOR'");
    }
};
