<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vales', function (Blueprint $table) {
            $table->index(['distribuidora_id', 'estado'], 'vales_dist_estado_idx');
            $table->index(['distribuidora_id', 'cliente_id', 'estado'], 'vales_dist_cliente_estado_idx');
            $table->index(['distribuidora_id', 'fecha_emision', 'id'], 'vales_dist_emision_id_idx');
            $table->index(['distribuidora_id', 'fecha_limite_pago', 'fecha_emision'], 'vales_dist_limite_emision_idx');
            $table->index(['sucursal_id', 'estado'], 'vales_sucursal_estado_idx');
        });

        Schema::table('relaciones_corte', function (Blueprint $table) {
            $table->index(['distribuidora_id', 'estado'], 'rel_corte_dist_estado_idx');
            $table->index(['estado', 'fecha_limite_pago'], 'rel_corte_estado_limite_idx');
            $table->index(['referencia_pago', 'estado'], 'rel_corte_ref_estado_idx');
        });

        Schema::table('pagos_distribuidora', function (Blueprint $table) {
            $table->index(['relacion_corte_id', 'estado'], 'pagos_dist_rel_estado_idx');
            $table->index(['distribuidora_id', 'estado'], 'pagos_dist_dist_estado_idx');
            $table->index(['distribuidora_id', 'fecha_pago'], 'pagos_dist_dist_fecha_idx');
            $table->index(['referencia_reportada', 'estado'], 'pagos_dist_ref_estado_idx');
        });

        Schema::table('clientes_distribuidora', function (Blueprint $table) {
            $table->index(['distribuidora_id', 'estado_relacion'], 'clientes_dist_estado_rel_idx');
            $table->index(['distribuidora_id', 'bloqueado_por_parentesco'], 'clientes_dist_parentesco_idx');
        });

        Schema::table('movimientos_bancarios', function (Blueprint $table) {
            $table->index(['fecha_movimiento', 'id'], 'mov_banc_fecha_id_idx');
            $table->index(['referencia', 'fecha_movimiento', 'monto'], 'mov_banc_ref_fecha_monto_idx');
        });

        Schema::table('solicitudes', function (Blueprint $table) {
            $table->index(['sucursal_id', 'estado'], 'solicitudes_sucursal_estado_idx');
            $table->index(['coordinador_usuario_id', 'estado'], 'solicitudes_coord_estado_idx');
        });
    }

    public function down(): void
    {
        $this->dropIndexIfExists('solicitudes', 'solicitudes_sucursal_estado_idx');
        // En MySQL, el índice compuesto de coordinador puede terminar sosteniendo la FK.
        // Se asegura un índice base antes de eliminar el compuesto para permitir migrate:refresh.
        $this->ensureLeftmostIndexExists('solicitudes', 'coordinador_usuario_id', 'solicitudes_coord_fk_idx');
        $this->dropIndexIfExists('solicitudes', 'solicitudes_coord_estado_idx');

        $this->dropIndexIfExists('movimientos_bancarios', 'mov_banc_fecha_id_idx');
        $this->dropIndexIfExists('movimientos_bancarios', 'mov_banc_ref_fecha_monto_idx');

        $this->dropIndexIfExists('clientes_distribuidora', 'clientes_dist_estado_rel_idx');
        $this->dropIndexIfExists('clientes_distribuidora', 'clientes_dist_parentesco_idx');

        $this->dropIndexIfExists('pagos_distribuidora', 'pagos_dist_rel_estado_idx');
        $this->dropIndexIfExists('pagos_distribuidora', 'pagos_dist_dist_estado_idx');
        $this->dropIndexIfExists('pagos_distribuidora', 'pagos_dist_dist_fecha_idx');
        $this->dropIndexIfExists('pagos_distribuidora', 'pagos_dist_ref_estado_idx');

        $this->dropIndexIfExists('relaciones_corte', 'rel_corte_dist_estado_idx');
        $this->dropIndexIfExists('relaciones_corte', 'rel_corte_estado_limite_idx');
        $this->dropIndexIfExists('relaciones_corte', 'rel_corte_ref_estado_idx');

        $this->dropIndexIfExists('vales', 'vales_dist_estado_idx');
        $this->dropIndexIfExists('vales', 'vales_dist_cliente_estado_idx');
        $this->dropIndexIfExists('vales', 'vales_dist_emision_id_idx');
        $this->dropIndexIfExists('vales', 'vales_dist_limite_emision_idx');
        $this->ensureLeftmostIndexExists('vales', 'sucursal_id', 'vales_sucursal_fk_idx');
        $this->dropIndexIfExists('vales', 'vales_sucursal_estado_idx');
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        $exists = DB::table('information_schema.statistics')
            ->whereRaw('TABLE_SCHEMA = DATABASE()')
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $index)
            ->exists();

        if ($exists) {
            DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$index}`");
        }
    }

    private function ensureLeftmostIndexExists(string $table, string $column, string $index): void
    {
        $exists = DB::table('information_schema.statistics')
            ->whereRaw('TABLE_SCHEMA = DATABASE()')
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $index)
            ->exists();

        if (! $exists) {
            DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$index}` (`{$column}`)");
        }
    }
};
