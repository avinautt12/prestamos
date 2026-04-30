<?php

namespace Database\Seeders;

use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RentabilidadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Genera datos históricos de rentabilidad para los últimos 6 meses.
     */
    public function run(): void
    {
        $sucursales = Sucursal::all();
        if ($sucursales->isEmpty()) {
            $this->command?->warn('No hay sucursales para seedear rentabilidad.');
            return;
        }

        $distribuidoras = Distribuidora::all();
        if ($distribuidoras->isEmpty()) {
            $this->command?->warn('No hay distribuidoras para seedear rentabilidad.');
            return;
        }

        $this->command?->info('Generando datos históricos de rentabilidad (6 meses)...');

        // Generar datos para los últimos 6 meses
        for ($i = 0; $i < 6; $i++) {
            $fechaMes = Carbon::now()->subMonths($i);
            
            foreach ($sucursales as $sucursal) {
                // Generar 2 cortes por mes (quincenales)
                $this->crearCorteHistorico($sucursal, $fechaMes->copy()->day(14), $distribuidoras);
                $this->crearCorteHistorico($sucursal, $fechaMes->copy()->endOfMonth(), $distribuidoras);
            }
        }

        $this->command?->info('Rentabilidad seedeada con éxito.');
    }

    private function crearCorteHistorico(Sucursal $sucursal, Carbon $fecha, $distribuidorasPool)
    {
        // Crear el corte
        $corte = Corte::create([
            'sucursal_id' => $sucursal->id,
            'tipo_corte' => 'PAGOS',
            'fecha_programada' => $fecha->copy()->subDays(1),
            'fecha_ejecucion' => $fecha,
            'estado' => 'CERRADO',
            'observaciones' => 'Corte histórico generado por RentabilidadSeeder',
        ]);

        // Seleccionar unas cuantas distribuidoras al azar para este corte
        $distribuidorasCorte = $distribuidorasPool->where('sucursal_id', $sucursal->id)->random(min(3, $distribuidorasPool->where('sucursal_id', $sucursal->id)->count() ?: 1));

        foreach ($distribuidorasCorte as $dist) {
            $comision = rand(2000, 15000);
            $pago = rand(10000, 50000);
            $recargos = rand(0, 1) ? rand(50, 500) : 0;
            $total = $comision + $pago + $recargos;

            RelacionCorte::create([
                'corte_id' => $corte->id,
                'distribuidora_id' => $dist->id,
                'numero_relacion' => 'REL-' . strtoupper(Str::random(8)),
                'referencia_pago' => 'REF-' . strtoupper(Str::random(10)),
                'fecha_limite_pago' => $fecha->copy()->addDays(5)->toDateString(),
                'total_comision' => $comision,
                'total_pago' => $pago,
                'total_recargos' => $recargos,
                'total_a_pagar' => $total,
                'estado' => 'PAGADA',
                'generada_en' => $fecha->copy()->subDays(1),
            ]);
        }
    }
}
