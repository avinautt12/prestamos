<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos_cliente', function (Blueprint $table) {
            $table->timestamp('revertido_en')->nullable()->after('notas');
            $table->unsignedBigInteger('revertido_por_usuario_id')->nullable()->after('revertido_en');
            $table->text('motivo_reversion')->nullable()->after('revertido_por_usuario_id');

            $table->foreign('revertido_por_usuario_id')->references('id')->on('usuarios');
            $table->index('revertido_en');
        });
    }

    public function down(): void
    {
        Schema::table('pagos_cliente', function (Blueprint $table) {
            $table->dropForeign(['revertido_por_usuario_id']);
            $table->dropIndex(['revertido_en']);
            $table->dropColumn(['revertido_en', 'revertido_por_usuario_id', 'motivo_reversion']);
        });
    }
};
