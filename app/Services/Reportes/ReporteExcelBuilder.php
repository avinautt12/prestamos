<?php

namespace App\Services\Reportes;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Builder del reporte ejecutivo en Excel (.xlsx).
 *
 * Estructura del libro:
 *   - Hoja 1: "Portada" con identidad, alcance, periodo y totales resumidos
 *   - Hoja 2: "Morosas"
 *   - Hoja 3: "Cortes"
 *   - Hoja 4: "Puntos"
 *   - Hoja 5: "Presolicitudes"
 *
 * Uso:
 *   $sheet = (new ReporteExcelBuilder())
 *       ->titulo('Reporte Mensual - Abril 2026')
 *       ->alcance('Sucursal Torreon Centro')
 *       ->periodo('Mensual', $desde, $hasta)
 *       ->morosas($service->distribuidorasMorosas(...))
 *       ->cortes($service->saldoCortes(...))
 *       ->puntos($service->saldoPuntosPorDistribuidora(...))
 *       ->presolicitudes($service->presolicitudes(...))
 *       ->build();
 */
class ReporteExcelBuilder
{
    private const COLOR_PRIMARIO   = '1FA62D';
    private const COLOR_HEADER_BG  = '16803C';
    private const COLOR_FILA_ALT   = 'F3F4F6';
    private const COLOR_MOROSO_BG  = 'FEE2E2';
    private const COLOR_EXITO_BG   = 'D1FAE5';
    private const COLOR_BORDE      = 'D1D5DB';

    private string $titulo = 'Reporte Ejecutivo';
    private string $alcance = 'Global';
    private string $periodoEtiqueta = 'Personalizado';
    private ?CarbonInterface $desde = null;
    private ?CarbonInterface $hasta = null;

    private Collection $morosas;
    private Collection $cortes;
    private Collection $puntos;
    private Collection $presolicitudes;

    public function __construct()
    {
        $this->morosas = collect();
        $this->cortes = collect();
        $this->puntos = collect();
        $this->presolicitudes = collect();
    }

    public function titulo(string $titulo): self
    {
        $this->titulo = $titulo;
        return $this;
    }

    public function alcance(string $alcance): self
    {
        $this->alcance = $alcance;
        return $this;
    }

    public function periodo(string $etiqueta, ?CarbonInterface $desde = null, ?CarbonInterface $hasta = null): self
    {
        $this->periodoEtiqueta = $etiqueta;
        $this->desde = $desde;
        $this->hasta = $hasta;
        return $this;
    }

    public function morosas(Collection $data): self
    {
        $this->morosas = $data;
        return $this;
    }

    public function cortes(Collection $data): self
    {
        $this->cortes = $data;
        return $this;
    }

    public function puntos(Collection $data): self
    {
        $this->puntos = $data;
        return $this;
    }

    public function presolicitudes(Collection $data): self
    {
        $this->presolicitudes = $data;
        return $this;
    }

    public function build(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();

        $spreadsheet->getProperties()
            ->setCreator('Sistema PrestamoFacil')
            ->setTitle($this->titulo)
            ->setSubject($this->titulo)
            ->setDescription('Reporte ejecutivo generado automaticamente');

        // Hoja 1 ya existe por default; la uso como Portada
        $portada = $spreadsheet->getActiveSheet();
        $portada->setTitle('Portada');
        $this->armarPortada($portada);

        $morosasSheet = $spreadsheet->createSheet();
        $morosasSheet->setTitle('Morosas');
        $this->armarMorosas($morosasSheet);

        $cortesSheet = $spreadsheet->createSheet();
        $cortesSheet->setTitle('Cortes');
        $this->armarCortes($cortesSheet);

        $puntosSheet = $spreadsheet->createSheet();
        $puntosSheet->setTitle('Puntos');
        $this->armarPuntos($puntosSheet);

        $presolSheet = $spreadsheet->createSheet();
        $presolSheet->setTitle('Presolicitudes');
        $this->armarPresolicitudes($presolSheet);

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    // =========================================================
    // HOJAS
    // =========================================================

    private function armarPortada(Worksheet $sheet): void
    {
        $sheet->getDefaultColumnDimension()->setWidth(20);
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(28);
        $sheet->getColumnDimension('D')->setWidth(28);
        $sheet->getColumnDimension('E')->setWidth(28);
        $sheet->getColumnDimension('F')->setWidth(6);

        // Banner
        $sheet->mergeCells('B2:E3');
        $sheet->setCellValue('B2', 'PrestamoFacil — Reporte Ejecutivo');
        $sheet->getStyle('B2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 22, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::COLOR_HEADER_BG]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);

        // Bloque de metadata
        $sheet->setCellValue('B5', 'Titulo:');
        $sheet->setCellValue('C5', $this->titulo);
        $sheet->setCellValue('B6', 'Alcance:');
        $sheet->setCellValue('C6', $this->alcance);
        $sheet->setCellValue('B7', 'Periodo:');
        $sheet->setCellValue('C7', $this->formatoPeriodoDetalle());
        $sheet->setCellValue('B8', 'Generado:');
        $sheet->setCellValue('C8', Carbon::now()->toDateTimeString());

        $sheet->getStyle('B5:B8')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '374151']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $sheet->getStyle('C5:C8')->applyFromArray([
            'font' => ['color' => ['rgb' => '111827']],
        ]);

        // Resumen de totales
        $sheet->setCellValue('B10', 'Resumen');
        $sheet->mergeCells('B10:E10');
        $sheet->getStyle('B10')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => self::COLOR_PRIMARIO]],
        ]);

        $resumen = $this->calcularResumen();

        $sheet->setCellValue('B12', 'Distribuidoras morosas');
        $sheet->setCellValue('C12', $resumen['morosas_total']);
        $sheet->setCellValue('D12', 'Saldo moroso acumulado');
        $sheet->setCellValue('E12', $resumen['morosas_saldo']);
        $sheet->getStyle('E12')->getNumberFormat()->setFormatCode('"$"#,##0.00');

        $sheet->setCellValue('B13', 'Cortes en periodo');
        $sheet->setCellValue('C13', $resumen['cortes_total']);
        $sheet->setCellValue('D13', 'Total a pagar acumulado');
        $sheet->setCellValue('E13', $resumen['cortes_total_a_pagar']);
        $sheet->getStyle('E13')->getNumberFormat()->setFormatCode('"$"#,##0.00');

        $sheet->setCellValue('B14', 'Total conciliado');
        $sheet->setCellValue('C14', $resumen['cortes_total_conciliado']);
        $sheet->getStyle('C14')->getNumberFormat()->setFormatCode('"$"#,##0.00');
        $sheet->setCellValue('D14', '% cobranza');
        $sheet->setCellValue('E14', $resumen['cortes_pct_cobranza'] / 100);
        $sheet->getStyle('E14')->getNumberFormat()->setFormatCode('0.00%');

        $sheet->setCellValue('B15', 'Puntos totales activos');
        $sheet->setCellValue('C15', $resumen['puntos_totales']);
        $sheet->setCellValue('D15', 'Valor en pesos');
        $sheet->setCellValue('E15', $resumen['puntos_valor_pesos']);
        $sheet->getStyle('E15')->getNumberFormat()->setFormatCode('"$"#,##0.00');

        $sheet->setCellValue('B16', 'Presolicitudes pendientes');
        $sheet->setCellValue('C16', $resumen['presol_pendientes']);
        $sheet->setCellValue('D16', 'Presolicitudes aprobadas');
        $sheet->setCellValue('E16', $resumen['presol_aprobadas']);

        $sheet->getStyle('B12:B16')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '374151']],
        ]);
        $sheet->getStyle('D12:D16')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '374151']],
        ]);
        $sheet->getStyle('C12:C16')->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->getStyle('E12:E16')->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);

        // Borde sutil al bloque de resumen
        $sheet->getStyle('B10:E16')->applyFromArray([
            'borders' => [
                'outline' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDE]],
            ],
        ]);

        // Footer
        $this->agregarFooter($sheet, 20, 'B', 'E');
    }

    private function armarMorosas(Worksheet $sheet): void
    {
        $headers = [
            'Sucursal', 'Num. Distribuidora', 'Persona', 'Estado', 'Categoria',
            'Credito disponible', 'Vales morosos', 'Saldo pendiente', 'Dias atraso',
            'Fecha ultimo pago', 'Monto ultimo pago',
        ];

        $this->escribirTabla(
            $sheet,
            'Distribuidoras morosas y saldos',
            $headers,
            $this->morosas->map(fn($r) => [
                $r['sucursal'] ?? '-',
                $r['numero_distribuidora'] ?? '-',
                $r['persona'] ?? '-',
                $r['estado_distribuidora'] ?? '-',
                $r['categoria'] ?? '-',
                $r['credito_disponible'] ?? 0,
                $r['vales_morosos'] ?? 0,
                $r['saldo_pendiente_total'] ?? 0,
                $r['dias_atraso_max'] ?? 0,
                $r['fecha_ultimo_pago'] ?? '-',
                $r['monto_ultimo_pago'] ?? '-',
            ])->toArray(),
            formatosColumnas: [
                'F' => '"$"#,##0.00',
                'H' => '"$"#,##0.00',
                'K' => '"$"#,##0.00',
            ],
            resaltarFila: fn($data) => ($data[6] ?? 0) > 0,
            colorResaltado: self::COLOR_MOROSO_BG,
        );
    }

    private function armarCortes(Worksheet $sheet): void
    {
        $headers = [
            'Sucursal', 'ID Corte', 'Tipo', 'Estado', 'Fecha programada', 'Fecha ejecucion',
            'Relaciones', 'Total a pagar', 'Conciliado', 'Pendiente', '% cobranza',
            'Dists. pagaron', 'Dists. sin pago',
        ];

        $this->escribirTabla(
            $sheet,
            'Saldo de cortes',
            $headers,
            $this->cortes->map(fn($r) => [
                $r['sucursal'] ?? '-',
                $r['corte_id'] ?? '-',
                $r['tipo_corte'] ?? '-',
                $r['estado_corte'] ?? '-',
                $r['fecha_programada'] ?? '-',
                $r['fecha_ejecucion'] ?? '-',
                $r['relaciones_generadas'] ?? 0,
                $r['total_a_pagar'] ?? 0,
                $r['total_conciliado'] ?? 0,
                $r['pendiente'] ?? 0,
                ($r['porcentaje_cobranza'] ?? 0) / 100,
                $r['distribuidoras_pagaron'] ?? 0,
                $r['distribuidoras_sin_pago'] ?? 0,
            ])->toArray(),
            formatosColumnas: [
                'H' => '"$"#,##0.00',
                'I' => '"$"#,##0.00',
                'J' => '"$"#,##0.00',
                'K' => '0.00%',
            ],
        );
    }

    private function armarPuntos(Worksheet $sheet): void
    {
        $headers = [
            'Sucursal', 'Num. Distribuidora', 'Persona',
            'Ganados anticipado', 'Ganados puntual', 'Penalizados',
            'Canjeados', 'Ajustes', 'Puntos actuales', 'Valor en pesos',
        ];

        $this->escribirTabla(
            $sheet,
            'Saldo de puntos por distribuidora',
            $headers,
            $this->puntos->map(fn($r) => [
                $r['sucursal'] ?? '-',
                $r['numero_distribuidora'] ?? '-',
                $r['persona'] ?? '-',
                $r['puntos_ganados_anticipado'] ?? 0,
                $r['puntos_ganados_puntual'] ?? 0,
                $r['puntos_penalizados'] ?? 0,
                $r['puntos_canjeados'] ?? 0,
                $r['puntos_ajustes'] ?? 0,
                $r['puntos_actuales'] ?? 0,
                $r['valor_en_pesos'] ?? 0,
            ])->toArray(),
            formatosColumnas: [
                'J' => '"$"#,##0.00',
            ],
        );
    }

    private function armarPresolicitudes(Worksheet $sheet): void
    {
        $headers = [
            'Sucursal', 'ID Solicitud', 'Fecha captura', 'Coordinador', 'Verificador',
            'Estado', 'Persona solicitante', 'Categoria inicial', 'Limite solicitado',
            'Dictamen', 'Motivo rechazo', 'Dias en flujo',
        ];

        $this->escribirTabla(
            $sheet,
            'Presolicitudes pendientes y validadas',
            $headers,
            $this->presolicitudes->map(fn($r) => [
                $r['sucursal'] ?? '-',
                $r['solicitud_id'] ?? '-',
                $r['fecha_captura'] ?? '-',
                $r['coordinador'] ?? '-',
                $r['verificador'] ?? '-',
                $r['estado'] ?? '-',
                $r['persona_solicitante'] ?? '-',
                $r['categoria_inicial'] ?? '-',
                $r['limite_solicitado'] ?? 0,
                $r['dictamen'] ?? '-',
                $r['motivo_rechazo'] ?? '-',
                $r['dias_en_flujo'] ?? 0,
            ])->toArray(),
            formatosColumnas: [
                'I' => '"$"#,##0.00',
            ],
            resaltarFila: fn($data) => ($data[5] ?? '') === 'APROBADA',
            colorResaltado: self::COLOR_EXITO_BG,
        );
    }

    // =========================================================
    // HELPERS
    // =========================================================

    /**
     * @param array<array<int, mixed>> $filas
     * @param array<string, string> $formatosColumnas letra de columna => format code
     * @param callable|null $resaltarFila fn(array $fila): bool
     */
    private function escribirTabla(
        Worksheet $sheet,
        string $titulo,
        array $headers,
        array $filas,
        array $formatosColumnas = [],
        ?callable $resaltarFila = null,
        ?string $colorResaltado = null,
    ): void {
        $totalColumnas = count($headers);
        $letraUltimaColumna = $this->letraColumna($totalColumnas);

        // Titulo
        $sheet->setCellValue('A1', $titulo);
        $sheet->mergeCells("A1:{$letraUltimaColumna}1");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => self::COLOR_PRIMARIO]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(26);

        // Subtitulo con alcance
        $sheet->setCellValue('A2', "{$this->alcance}  ·  {$this->periodoEtiqueta}");
        $sheet->mergeCells("A2:{$letraUltimaColumna}2");
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'color' => ['rgb' => '6B7280']],
        ]);

        // Headers en fila 4
        $filaHeader = 4;
        foreach ($headers as $i => $header) {
            $letra = $this->letraColumna($i + 1);
            $sheet->setCellValue("{$letra}{$filaHeader}", $header);
        }
        $sheet->getStyle("A{$filaHeader}:{$letraUltimaColumna}{$filaHeader}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::COLOR_HEADER_BG]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDE]]],
        ]);
        $sheet->getRowDimension($filaHeader)->setRowHeight(22);

        // Filas de datos
        $filaActual = $filaHeader + 1;
        $filaInicio = $filaActual;

        foreach ($filas as $indice => $fila) {
            foreach ($fila as $i => $valor) {
                $letra = $this->letraColumna($i + 1);
                $sheet->setCellValue("{$letra}{$filaActual}", $valor);
            }

            $esResaltada = $resaltarFila && $resaltarFila($fila);
            $colorFondo = $esResaltada
                ? $colorResaltado
                : ($indice % 2 === 1 ? self::COLOR_FILA_ALT : 'FFFFFF');

            $sheet->getStyle("A{$filaActual}:{$letraUltimaColumna}{$filaActual}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $colorFondo]],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDE]]],
            ]);

            $filaActual++;
        }

        // Sin filas: mensaje vacio
        if (empty($filas)) {
            $sheet->setCellValue("A{$filaActual}", 'Sin datos en el periodo seleccionado.');
            $sheet->mergeCells("A{$filaActual}:{$letraUltimaColumna}{$filaActual}");
            $sheet->getStyle("A{$filaActual}")->applyFromArray([
                'font' => ['italic' => true, 'color' => ['rgb' => '9CA3AF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $filaActual++;
        }

        // Formatos por columna
        foreach ($formatosColumnas as $letra => $formato) {
            $sheet->getStyle("{$letra}{$filaInicio}:{$letra}" . ($filaActual - 1))
                ->getNumberFormat()
                ->setFormatCode($formato);
        }

        // Freeze row del header
        $sheet->freezePane("A" . ($filaHeader + 1));

        // Autosize
        for ($i = 1; $i <= $totalColumnas; $i++) {
            $sheet->getColumnDimension($this->letraColumna($i))->setAutoSize(true);
        }

        // Filtros en headers
        $sheet->setAutoFilter("A{$filaHeader}:{$letraUltimaColumna}{$filaHeader}");

        // Footer
        $this->agregarFooter($sheet, $filaActual + 1, 'A', $letraUltimaColumna);
    }

    private function agregarFooter(Worksheet $sheet, int $fila, string $colIni, string $colFin): void
    {
        $sheet->setCellValue("{$colIni}{$fila}", 'Generado ' . Carbon::now()->toDateTimeString() . '  ·  Sistema PrestamoFacil');
        $sheet->mergeCells("{$colIni}{$fila}:{$colFin}{$fila}");
        $sheet->getStyle("{$colIni}{$fila}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '9CA3AF']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
    }

    private function letraColumna(int $numero): string
    {
        return \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($numero);
    }

    private function formatoPeriodoDetalle(): string
    {
        if (!$this->desde || !$this->hasta) {
            return $this->periodoEtiqueta;
        }
        return sprintf(
            '%s (%s a %s)',
            $this->periodoEtiqueta,
            $this->desde->toDateString(),
            $this->hasta->toDateString()
        );
    }

    private function calcularResumen(): array
    {
        $morosasTotal = $this->morosas->count();
        $morosasSaldo = (float) $this->morosas->sum('saldo_pendiente_total');

        $cortesTotal = $this->cortes->count();
        $cortesAPagar = (float) $this->cortes->sum('total_a_pagar');
        $cortesConciliado = (float) $this->cortes->sum('total_conciliado');
        $cortesPct = $cortesAPagar > 0
            ? round(($cortesConciliado / $cortesAPagar) * 100, 2)
            : 0.0;

        $puntosTotales = (float) $this->puntos->sum('puntos_actuales');
        $puntosValor = (float) $this->puntos->sum('valor_en_pesos');

        $presolPendientes = $this->presolicitudes->whereIn('estado', [
            'PRE', 'MODIFICADA', 'EN_REVISION', 'VERIFICADA', 'POSIBLE_DISTRIBUIDORA',
        ])->count();
        $presolAprobadas = $this->presolicitudes->where('estado', 'APROBADA')->count();

        return [
            'morosas_total'            => $morosasTotal,
            'morosas_saldo'            => round($morosasSaldo, 2),
            'cortes_total'             => $cortesTotal,
            'cortes_total_a_pagar'     => round($cortesAPagar, 2),
            'cortes_total_conciliado'  => round($cortesConciliado, 2),
            'cortes_pct_cobranza'      => $cortesPct,
            'puntos_totales'           => round($puntosTotales, 2),
            'puntos_valor_pesos'       => round($puntosValor, 2),
            'presol_pendientes'        => $presolPendientes,
            'presol_aprobadas'         => $presolAprobadas,
        ];
    }
}
