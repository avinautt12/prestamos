<?php

namespace App\Console\Commands;

use App\Models\Distribuidora;
use App\Models\Usuario;
use App\Notifications\DistribuidoraOperacionNotification;
use App\Services\Distribuidora\CategoriaScoreService;
use App\Services\Distribuidora\DistribuidoraNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EvaluarCategoriaMensual extends Command
{
    protected $signature = 'categoria:evaluar-mensual {--dry-run : Reporta los cambios sin aplicarlos}';

    protected $description = 'Evalua y aplica cambios automaticos de categoria a distribuidoras activas y morosas segun score mensual';

    public function handle(CategoriaScoreService $scoreService, DistribuidoraNotificationService $notificationService): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('[DRY-RUN] No se aplicaran cambios, solo reporte.');
        }

        $distribuidoras = Distribuidora::query()
            ->with(['categoria', 'sucursal'])
            ->whereIn('estado', [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA])
            ->get();

        if ($distribuidoras->isEmpty()) {
            $this->info('No hay distribuidoras activas o morosas para evaluar.');
            return self::SUCCESS;
        }

        $filas = [];
        $cambiosAplicados = 0;

        foreach ($distribuidoras as $distribuidora) {
            $eval = $scoreService->evaluar($distribuidora);

            $filas[] = [
                $distribuidora->id,
                $distribuidora->numero_distribuidora,
                $eval['categoria_actual']?->nombre ?? '-',
                $eval['score'],
                $eval['categoria_sugerida']?->nombre ?? '-',
                $eval['direccion'],
            ];

            if ($eval['direccion'] === 'SIN_CAMBIO') {
                continue;
            }

            if ($dryRun) {
                continue;
            }

            $this->aplicarCambio($distribuidora, $eval, $notificationService);
            $cambiosAplicados++;
        }

        $this->table(
            ['Dist. ID', 'Numero', 'Categoria Actual', 'Score', 'Categoria Sugerida', 'Direccion'],
            $filas
        );

        $total = count($distribuidoras);
        $sinCambio = $total - collect($filas)->where(5, '!=', 'SIN_CAMBIO')->count();

        if ($dryRun) {
            $pendientes = $total - $sinCambio;
            $this->info("[DRY-RUN] Evaluadas: {$total} | Cambios pendientes: {$pendientes}");
        } else {
            $this->info("Evaluadas: {$total} | Cambios aplicados: {$cambiosAplicados}");
        }

        return self::SUCCESS;
    }

    private function aplicarCambio(
        Distribuidora $distribuidora,
        array $eval,
        DistribuidoraNotificationService $notificationService
    ): void {
        $categoriaActual = $eval['categoria_actual'];
        $categoriaSugerida = $eval['categoria_sugerida'];
        $direccion = $eval['direccion'];
        $score = $eval['score'];
        $factores = $eval['factores'];

        DB::transaction(function () use ($distribuidora, $categoriaSugerida) {
            $distribuidora->update(['categoria_id' => $categoriaSugerida->id]);
        });

        logger()->info('CATEGORIA_DISTRIBUIDORA_CAMBIADA_AUTO', [
            'distribuidora_id' => $distribuidora->id,
            'numero_distribuidora' => $distribuidora->numero_distribuidora,
            'sucursal_id' => $distribuidora->sucursal_id,
            'categoria_anterior_id' => $categoriaActual?->id,
            'categoria_anterior_nombre' => $categoriaActual?->nombre,
            'categoria_nueva_id' => $categoriaSugerida->id,
            'categoria_nueva_nombre' => $categoriaSugerida->nombre,
            'score' => $score,
            'direccion' => $direccion,
            'factores' => $factores,
        ]);

        $this->notificarDistribuidora(
            $distribuidora,
            $categoriaActual,
            $categoriaSugerida,
            $direccion,
            $score,
            $notificationService
        );

        $this->notificarGerentes(
            $distribuidora,
            $categoriaActual,
            $categoriaSugerida,
            $direccion,
            $score
        );
    }

    private function notificarDistribuidora(
        Distribuidora $distribuidora,
        $categoriaActual,
        $categoriaSugerida,
        string $direccion,
        int $score,
        DistribuidoraNotificationService $notificationService
    ): void {
        $nombreAnterior = $categoriaActual?->nombre ?? 'Sin categoria';
        $nombreNuevo = $categoriaSugerida->nombre;
        $porcentajeAnterior = (float) ($categoriaActual?->porcentaje_comision ?? 0);
        $porcentajeNuevo = (float) $categoriaSugerida->porcentaje_comision;

        $tipo = $direccion === 'SUBIDA' ? 'CATEGORIA_SUBIDA_AUTO' : 'CATEGORIA_BAJADA_AUTO';
        $titulo = $direccion === 'SUBIDA'
            ? "Tu categoria subio a {$nombreNuevo}"
            : "Tu categoria bajo a {$nombreNuevo}";
        $mensaje = sprintf(
            'Por evaluacion mensual, pasaste de %s (%s%%) a %s (%s%%). Score obtenido: %d.',
            $nombreAnterior,
            number_format($porcentajeAnterior, 2),
            $nombreNuevo,
            number_format($porcentajeNuevo, 2),
            $score
        );

        $notificationService->notificar(
            $distribuidora,
            $tipo,
            $titulo,
            $mensaje,
            [
                'categoria_anterior_id' => $categoriaActual?->id,
                'categoria_anterior_nombre' => $nombreAnterior,
                'categoria_nueva_id' => $categoriaSugerida->id,
                'categoria_nueva_nombre' => $nombreNuevo,
                'porcentaje_anterior' => $porcentajeAnterior,
                'porcentaje_nuevo' => $porcentajeNuevo,
                'direccion' => $direccion,
                'score' => $score,
                'origen' => 'AUTO',
            ]
        );
    }

    private function notificarGerentes(
        Distribuidora $distribuidora,
        $categoriaActual,
        $categoriaSugerida,
        string $direccion,
        int $score
    ): void {
        $gerentes = Usuario::query()
            ->where('activo', true)
            ->whereHas('roles', function ($q) use ($distribuidora) {
                $q->where('codigo', 'GERENTE')
                    ->whereNull('usuario_rol.revocado_en')
                    ->where('usuario_rol.sucursal_id', $distribuidora->sucursal_id);
            })
            ->get();

        if ($gerentes->isEmpty()) {
            return;
        }

        $nombreDistribuidora = trim(sprintf(
            '%s %s',
            $distribuidora->persona?->primer_nombre ?? '',
            $distribuidora->persona?->apellido_paterno ?? ''
        )) ?: ($distribuidora->numero_distribuidora ?? '(sin nombre)');

        $nombreAnterior = $categoriaActual?->nombre ?? 'Sin categoria';
        $nombreNuevo = $categoriaSugerida->nombre;

        $tipo = 'CAMBIO_CATEGORIA_AUTO_GERENTE';
        $titulo = sprintf('Cambio automatico: %s %s a %s', $nombreDistribuidora, $direccion === 'SUBIDA' ? 'subio' : 'bajo', $nombreNuevo);
        $mensaje = sprintf(
            'La distribuidora %s (%s) paso de %s a %s por evaluacion mensual. Score: %d.',
            $nombreDistribuidora,
            $distribuidora->numero_distribuidora,
            $nombreAnterior,
            $nombreNuevo,
            $score
        );

        $meta = [
            'distribuidora_id' => (int) $distribuidora->id,
            'numero_distribuidora' => (string) $distribuidora->numero_distribuidora,
            'categoria_anterior_id' => $categoriaActual?->id,
            'categoria_anterior_nombre' => $nombreAnterior,
            'categoria_nueva_id' => $categoriaSugerida->id,
            'categoria_nueva_nombre' => $nombreNuevo,
            'direccion' => $direccion,
            'score' => $score,
            'origen' => 'AUTO',
        ];

        foreach ($gerentes as $gerente) {
            $gerente->notify(new DistribuidoraOperacionNotification($tipo, $titulo, $mensaje, $meta));
        }
    }
}
