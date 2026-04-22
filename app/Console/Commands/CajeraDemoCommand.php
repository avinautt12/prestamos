<?php

namespace App\Console\Commands;

use App\Models\Corte;
use App\Models\MovimientoBancario;
use App\Models\Distribuidora;
use App\Models\PagoDistribuidora;
use App\Models\RelacionCorte;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use Carbon\Carbon;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CajeraDemoCommand extends Command
{
    protected $signature = 'app:cajera-demo
                            {--monto= : Monto del pago ficticio}
                            {--distribuidora= : ID de distribuidora}
                            {--fecha= : Fecha del pago (default: hoy)}
                            {--crear-relacion : Crear también RelacionCorte vinculada}
                            {--test-cases : Crea todos los casos de prueba para conciliación}
                            {--generar-excel : Genera archivo Excel para probar conciliación}';

    protected $description = 'Crea datos ficticios de pagos para pruebas del módulo de cajera';

    public function handle(): int
    {
        if ($this->option('test-cases')) {
            return $this->crearCasosPrueba();
        }

        if ($this->option('generar-excel')) {
            return $this->generarExcelPrueba();
        }

        $monto = (float) ($this->option('monto') ?: 1000);
        $distribuidoraId = (int) ($this->option('distribuidora') ?: 0);
        $fechaPago = $this->option('fecha')
            ? Carbon::parse($this->option('fecha'))
            : Carbon::now();
        $crearRelacion = $this->option('crear-relacion');

        return $this->crearPagoDemo($monto, $distribuidoraId, $fechaPago, $crearRelacion);
    }

    private function crearCasosPrueba(): int
    {
        $this->info('========================================');
        $this->info('CREANDO CASOS DE PRUEBA');
        $this->info('========================================' . PHP_EOL);

        $sucursal = Sucursal::first();
        if (!$sucursal) {
            $this->error('No hay sucursales en el sistema.');
            return Command::FAILURE;
        }

        $distribuidoras = Distribuidora::where('sucursal_id', $sucursal->id)->limit(10)->get();
        if ($distribuidoras->isEmpty()) {
            $this->error('No hay distribuidoras en el sistema.');
            return Command::FAILURE;
        }

        $fechaPago = Carbon::now();
        $anio = (int) $fechaPago->year;
        $mes = (int) $fechaPago->month;
        $diaCorte = 14;
        $fechaCorte = Carbon::create($anio, $mes, $diaCorte)->startOfDay();

        $casos = [
            [
                'nombre' => '1. PAGO EXACTO - Se Concilia Automático',
                'descripcion' => 'Referencia + monto exactos',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'resultado' => 'AUTO',
            ],
            [
                'nombre' => '2. MONTO MAYOR - Queda Pendiente',
                'descripcion' => 'Referencia coincide pero monto mayor',
                'monto' => 1000,
                'monto_movimiento' => 1200,
                'resultado' => 'MANUAL',
            ],
            [
                'nombre' => '3. MONTO MENOR - Queda Pendiente',
                'descripcion' => 'Referencia coincide pero monto menor',
                'monto' => 1000,
                'monto_movimiento' => 800,
                'resultado' => 'MANUAL',
            ],
            [
                'nombre' => '4. REFERENCIA DIFERENTE - Queda Pendiente',
                'descripcion' => 'Monto coincide pero referencia diferente',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'referencia_diff' => true,
                'resultado' => 'MANUAL',
            ],
            [
                'nombre' => '5. PAGO PARCIAL 1/2 - Queda Pendiente',
                'descripcion' => 'Primer pago parcial (mitad)',
                'monto' => 2000,
                'monto_movimiento' => 1000,
                'parcial' => 1,
                'resultado' => 'MANUAL',
            ],
            [
                'nombre' => '6. PAGO PARCIAL 2/2 - Queda Pagada',
                'descripcion' => 'Segundo pago parcial completa el total',
                'monto' => 2000,
                'monto_movimiento' => 1000,
                'parcial' => 2,
                'resultado' => 'AUTO',
            ],
            [
                'nombre' => '7. PAGO TARDÍO - Se Concilia',
                'descripcion' => 'Paga después de fecha límite',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'tardio' => true,
                'resultado' => 'AUTO',
            ],
            [
                'nombre' => '8. SIN REFERENCIA - Queda Pendiente',
                'descripcion' => 'Movimiento sin referencia',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'sin_referencia' => true,
                'resultado' => 'MANUAL',
            ],
            [
                'nombre' => '9. YA CONCILIADA - No Concilia',
                'descripcion' => 'Relación ya tiene pago conciliado',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'ya_conciliada' => true,
                'resultado' => 'NINGUNO',
            ],
            [
                'nombre' => '10. PAGO REPORTADO ACTUALIZA',
                'descripcion' => 'Ya existe pago reportado, se actualiza',
                'monto' => 1000,
                'monto_movimiento' => 1000,
                'ya_reportado' => true,
                'resultado' => 'AUTO',
            ],
        ];

        $idx = 0;
        foreach ($casos as $caso) {
            $idx++;
            $distribuidora = $distribuidoras->random();

            $this->line("Creando: {$caso['nombre']}");

            $referencia = 'TEST-' . str_pad($idx, 2, '0', STR_PAD_LEFT) . '-' . uniqid();
            $montoRelacion = $caso['monto'];

            $corte = Corte::create([
                'sucursal_id' => $sucursal->id,
                'tipo_corte' => Corte::TIPO_PAGOS,
                'dia_base_mes' => $diaCorte,
                'hora_base' => '09:00:00',
                'fecha_programada' => $fechaCorte,
                'estado' => Corte::ESTADO_EJECUTADO,
            ]);

            $relacion = RelacionCorte::create([
                'corte_id' => $corte->id,
                'distribuidora_id' => $distribuidora->id,
                'numero_relacion' => 'TEST-' . str_pad($idx, 2, '0', STR_PAD_LEFT),
                'referencia_pago' => $referencia,
                'fecha_limite_pago' => $fechaCorte->copy()->addDays(15),
                'limite_credito_snapshot' => 10000,
                'credito_disponible_snapshot' => 10000,
                'puntos_snapshot' => 0,
                'total_comision' => 0,
                'total_pago' => $montoRelacion,
                'total_recargos' => 0,
                'total_a_pagar' => $montoRelacion,
                'estado' => RelacionCorte::ESTADO_GENERADA,
            ]);

            $fechaPagoCaso = $fechaPago;
            if (!empty($caso['tardio'])) {
                $fechaPagoCaso = $fechaCorte->copy()->addDays(20);
            }

            if (!empty($caso['ya_reportado'])) {
                PagoDistribuidora::create([
                    'relacion_corte_id' => $relacion->id,
                    'distribuidora_id' => $distribuidora->id,
                    'monto' => $montoRelacion,
                    'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
                    'referencia_reportada' => 'REPORTADO-' . $referencia,
                    'fecha_pago' => $fechaPagoCaso,
                    'estado' => PagoDistribuidora::ESTADO_REPORTADO,
                ]);
            }

            if (!empty($caso['ya_conciliada'])) {
                $pagoConciliado = PagoDistribuidora::create([
                    'relacion_corte_id' => $relacion->id,
                    'distribuidora_id' => $distribuidora->id,
                    'monto' => $montoRelacion,
                    'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
                    'referencia_reportada' => 'CONC-' . $referencia,
                    'fecha_pago' => $fechaPagoCaso,
                    'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
                ]);

                $relacion->update(['estado' => RelacionCorte::ESTADO_PAGADA]);

                $this->line("  -> Relación ID {$relacion->id} ya pagada, saltando...");
                continue;
            }

            $refMovimiento = $referencia;
            if (!empty($caso['referencia_diff'])) {
                $refMovimiento = $referencia . '-OTRO';
            }
            if (!empty($caso['sin_referencia'])) {
                $refMovimiento = null;
            }

            MovimientoBancario::create([
                'cuenta_banco_empresa_id' => null,
                'referencia' => $refMovimiento,
                'fecha_movimiento' => $fechaPagoCaso->toDateString(),
                'hora_movimiento' => $fechaPagoCaso->format('H:i:s'),
                'monto' => $caso['monto_movimiento'],
                'tipo_movimiento' => 'TRANSFERENCIA',
                'folio' => 'FOLIO-' . $idx . '-' . uniqid(),
                'nombre_pagador' => $distribuidora->persona->primer_nombre ?? 'Demo',
                'concepto_raw' => 'Test: ' . $caso['nombre'],
            ]);

            $this->line("  -> Relación ID: {$relacion->id}, Ref: {$referencia}, Monto: \${$montoRelacion}");
        }

        $this->info(PHP_EOL . '========================================');
        $this->info('CASOS CREADOS: ' . count($casos));
        $this->info('========================================');
        $this->info(PHP_EOL . 'INSTRUCCIONES:');
        $this->line('1. Ve a la interfaz de Cajera -> Importar');
        $this->line('2. Descarga el Excel simulado o');
        $this->line('3. Crea un archivo con estos movimientos:');
        $this->line(PHP_EOL . '   | referencia           | folio          | monto | fecha       |');
        $this->line('   |---------------------|---------------|---------|------------|');

        foreach ($casos as $idx => $caso) {
            $ref = $caso['referencia_diff'] ? 'TEST-' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT) . '-XXXX' : 'TEST-' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT);
            $monto = $caso['monto_movimiento'];
            $fecha = $caso['tardio'] ? $fechaCorte->copy()->addDays(20)->format('Y-m-d') : $fechaPago->format('Y-m-d');
            $this->line("   | {$ref} | FOLIO-" . ($idx + 1) . " | {$monto} | {$fecha} |");
        }

        $this->line(PHP_EOL . '4. Importa el archivo y observa los resultados');
        $this->line('5. Revisa el historial de conciliaciones');

        return Command::SUCCESS;
    }

    private function crearPagoDemo(float $monto, int $distribuidoraId, Carbon $fechaPago, bool $crearRelacion): int
    {
        $sucursal = Sucursal::first();
        if (!$sucursal) {
            $this->error('No hay sucursales en el sistema. Crea una primero.');
            return Command::FAILURE;
        }

        $config = SucursalConfiguracion::where('sucursal_id', $sucursal->id)->first();
        $diaCorte = (int) ($config?->dia_corte ?? 15);

        $anio = (int) $fechaPago->year;
        $mes = (int) $fechaPago->month;
        $diasMes = $fechaPago->copy()->endOfMonth()->day;
        $diaCorteAjustado = min($diaCorte, $diasMes);

        $fechaCorte = Carbon::create($anio, $mes, $diaCorteAjustado)->startOfDay();

        if ($distribuidoraId > 0) {
            $distribuidora = Distribuidora::find($distribuidoraId);
        } else {
            $distribuidora = Distribuidora::where('sucursal_id', $sucursal->id)->first();
        }

        if (!$distribuidora) {
            $this->error('No se encontró distribuidora.');
            return Command::FAILURE;
        }

        $corte = Corte::create([
            'sucursal_id' => $sucursal->id,
            'tipo_corte' => Corte::TIPO_PAGOS,
            'dia_base_mes' => $diaCorte,
            'hora_base' => '09:00:00',
            'fecha_programada' => $fechaCorte,
            'estado' => Corte::ESTADO_EJECUTADO,
        ]);

        $relacion = RelacionCorte::create([
            'corte_id' => $corte->id,
            'distribuidora_id' => $distribuidora->id,
            'numero_relacion' => 'DEMO-' . $corte->id . '-' . $distribuidora->id,
            'referencia_pago' => 'DEMO-REF-' . uniqid(),
            'fecha_limite_pago' => $fechaCorte->copy()->addDays(15),
            'limite_credito_snapshot' => 10000,
            'credito_disponible_snapshot' => 10000,
            'puntos_snapshot' => 0,
            'total_comision' => 0,
            'total_pago' => $monto,
            'total_recargos' => 0,
            'total_a_pagar' => $monto,
            'estado' => RelacionCorte::ESTADO_GENERADA,
        ]);

        $pago = PagoDistribuidora::create([
            'relacion_corte_id' => $relacion->id,
            'distribuidora_id' => $distribuidora->id,
            'monto' => $monto,
            'metodo_pago' => PagoDistribuidora::METODO_TRANSFERENCIA,
            'referencia_reportada' => 'DEMO-PAGO-' . uniqid(),
            'fecha_pago' => $fechaPago,
            'estado' => PagoDistribuidora::ESTADO_REPORTADO,
        ]);

        $this->info('========================================');
        $this->info('DATOS DE DEMO CREADOS');
        $this->info('========================================');
        $this->line("Corte ID:        {$corte->id}");
        $this->line("Relación ID:     {$relacion->id}");
        $this->line("Número:         {$relacion->numero_relacion}");
        $this->line("Referencia:       {$relacion->referencia_pago}");
        $this->line("Fecha corte:      {$fechaCorte->toDateString()}");
        $this->line("Fecha límite:    {$fechaCorte->copy()->addDays(15)->toDateString()}");
        $this->line("Pago ID:       {$pago->id}");
        $this->line("Monto:          \${$monto}");
        $this->line("Fecha pago:      {$fechaPago->toDateString()}");
        $this->line("Estado:         {$pago->estado}");

        return Command::SUCCESS;
    }

    private function generarExcelPrueba(): int
    {
        $relaciones = RelacionCorte::where('numero_relacion', 'like', 'TEST-%')
            ->orderBy('id')
            ->get();

        if ($relaciones->isEmpty()) {
            $this->error('No hay casos de prueba. Ejecuta primero: php artisan app:cajera-demo --test-cases');
            return Command::FAILURE;
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Conciliacion Pruebas');

        $sheet->fromArray([
            'referencia',
            'folio',
            'monto',
            'fecha',
            'hora',
            'tipo_pago',
            'nombre_pagador',
            'concepto',
        ], null, 'A1');

        $fila = 2;
        $fechaPago = Carbon::now();
        $fechaCorte = Carbon::create(2026, 4, 14);

        foreach ($relaciones as $relacion) {
            $refArchivo = $relacion->referencia_pago;
            $montoArchivo = (float) $relacion->total_a_pagar;
            $descripcion = '';
            $fechaMov = $fechaPago->toDateString();

            $numTest = (int) str_replace('TEST-', '', $relacion->numero_relacion);

            switch ($numTest) {
                case 2:
                    $montoArchivo = 1200;
                    $descripcion = 'MONTO MAYOR';
                    break;
                case 3:
                    $montoArchivo = 800;
                    $descripcion = 'MONTO MENOR';
                    break;
                case 4:
                    $refArchivo = $relacion->referencia_pago . '-OTRO';
                    $descripcion = 'REFERENCIA DIFERENTE';
                    break;
                case 5:
                    $montoArchivo = 1000;
                    $descripcion = 'PARCIAL 1/2';
                    break;
                case 6:
                    $montoArchivo = 1000;
                    $descripcion = 'PARCIAL 2/2';
                    break;
                case 7:
                    $fechaMov = $fechaCorte->copy()->addDays(20)->toDateString();
                    $descripcion = 'PAGO TARDIO';
                    break;
                case 8:
                    $refArchivo = null;
                    $descripcion = 'SIN REFERENCIA';
                    break;
                case 9:
                    continue 2;
                case 10:
                    $descripcion = 'ACTUALIZA REPORTADO';
                    break;
                default:
                    $descripcion = 'PAGO EXACTO';
            }

            $sheet->fromArray([
                $refArchivo,
                'FOLIO-' . $numTest,
                $montoArchivo,
                $fechaMov,
                '12:00:00',
                'TRANSFERENCIA',
                'Distribuidora Demo',
                "TEST-{$numTest}: {$descripcion}",
            ], null, "A{$fila}");
            $fila++;
        }

        $filename = 'prueba_conciliacion_' . date('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($filename);

        $this->info('========================================');
        $this->info('ARCHIVO EXCEL CREADO');
        $this->info('========================================');
        $this->line("Archivo: {$filename}");
        $this->line('Ubicación: ' . base_path($filename));
        $this->line('');
        $this->line('INSTRUCCIONES:');
        $this->line('1. Ve a Cajera -> Importar');
        $this->line('2. Sube este archivo');
        $this->line('3. Observa los resultados en el historial');

        return Command::SUCCESS;
    }
}