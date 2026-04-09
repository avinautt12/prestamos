<?php

namespace App\Services;

use App\Models\Corte;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CorteService
{
    public function sincronizarProximoCorteProgramado(Sucursal $sucursal, SucursalConfiguracion $configuracion): ?Corte
    {
        $diaCorte = $configuracion->dia_corte;
        $horaCorte = $configuracion->hora_corte;

        if (!$diaCorte || !$horaCorte) {
            return null;
        }

        $fechaProgramada = $this->calcularFechaProgramada((int) $diaCorte, (string) $horaCorte);

        return Corte::query()->updateOrCreate(
            [
                'sucursal_id' => $sucursal->id,
                'estado' => Corte::ESTADO_PROGRAMADO,
                'observaciones' => 'AUTO_CONFIG_SUCURSAL',
            ],
            [
                'tipo_corte' => Corte::TIPO_PAGOS,
                'dia_base_mes' => (int) $diaCorte,
                'hora_base' => $horaCorte,
                'fecha_programada' => $fechaProgramada,
                'mantener_fecha_en_inhabil' => true,
            ]
        );
    }

    public function obtenerProximoCorte(Sucursal $sucursal): ?Corte
    {
        $proximo = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Corte::ESTADO_PROGRAMADO)
            ->whereDate('fecha_programada', '>=', today())
            ->orderBy('fecha_programada')
            ->first();

        if ($proximo) {
            $proximo->setAttribute('es_atrasado', false);
            return $proximo;
        }

        $atrasado = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', Corte::ESTADO_PROGRAMADO)
            ->orderBy('fecha_programada')
            ->first();

        if ($atrasado) {
            $atrasado->setAttribute('es_atrasado', true);
        }

        return $atrasado;
    }

    public function obtenerCortesMes(Sucursal $sucursal, ?Carbon $mes = null): Collection
    {
        $mes = $mes ?? now();
        $inicio = $mes->copy()->startOfMonth();
        $fin = $mes->copy()->endOfMonth();

        return Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->whereBetween('fecha_programada', [$inicio, $fin])
            ->orderBy('fecha_programada')
            ->get();
    }

    public function cerrarManual(Corte $corte, Usuario $usuario, ?string $observaciones = null): Corte
    {
        $corte->update([
            'estado' => Corte::ESTADO_EJECUTADO,
            'fecha_ejecucion' => now(),
            'observaciones' => trim((string) $observaciones) !== ''
                ? trim((string) $observaciones)
                : $corte->observaciones,
        ]);

        return $corte->refresh();
    }

    private function calcularFechaProgramada(int $diaCorte, string $horaCorte): Carbon
    {
        $ahora = now();
        $diasMesActual = $ahora->copy()->endOfMonth()->day;

        $fechaProgramada = $ahora->copy()
            ->day(min($diaCorte, $diasMesActual))
            ->setTimeFromTimeString($horaCorte . ':00');

        if ($fechaProgramada->lessThanOrEqualTo($ahora)) {
            $siguienteMes = $ahora->copy()->addMonthNoOverflow();
            $diasSiguienteMes = $siguienteMes->copy()->endOfMonth()->day;

            $fechaProgramada = $siguienteMes
                ->day(min($diaCorte, $diasSiguienteMes))
                ->setTimeFromTimeString($horaCorte . ':00');
        }

        return $fechaProgramada;
    }
}
