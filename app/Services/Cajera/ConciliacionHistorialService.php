<?php

namespace App\Services\Cajera;

use App\Models\Conciliacion;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConciliacionHistorialService
{
    public function buildQuery(array $filtros)
    {
        return Conciliacion::query()
            ->with([
                'pagoDistribuidora.relacionCorte:id,numero_relacion,referencia_pago',
                'movimientoBancario:id,referencia,folio,nombre_pagador',
                'conciliador:id,nombre_usuario',
            ])
            ->when(($filtros['hist_estado'] ?? 'TODOS') !== 'TODOS', function ($query) use ($filtros) {
                $query->where('estado', $filtros['hist_estado']);
            })
            ->when(($filtros['hist_desde'] ?? '') !== '', function ($query) use ($filtros) {
                $query->whereDate('conciliado_en', '>=', $filtros['hist_desde']);
            })
            ->when(($filtros['hist_hasta'] ?? '') !== '', function ($query) use ($filtros) {
                $query->whereDate('conciliado_en', '<=', $filtros['hist_hasta']);
            })
            ->when(($filtros['hist_q'] ?? '') !== '', function ($query) use ($filtros) {
                $term = $filtros['hist_q'];
                $query->where(function ($sub) use ($term) {
                    $sub->where('estado', 'like', "%{$term}%")
                        ->orWhere('observaciones', 'like', "%{$term}%")
                        ->orWhereHas('movimientoBancario', function ($movQuery) use ($term) {
                            $movQuery->where('referencia', 'like', "%{$term}%")
                                ->orWhere('folio', 'like', "%{$term}%")
                                ->orWhere('nombre_pagador', 'like', "%{$term}%");
                        })
                        ->orWhereHas('pagoDistribuidora.relacionCorte', function ($relQuery) use ($term) {
                            $relQuery->where('numero_relacion', 'like', "%{$term}%")
                                ->orWhere('referencia_pago', 'like', "%{$term}%");
                        })
                        ->orWhereHas('conciliador', function ($usrQuery) use ($term) {
                            $usrQuery->where('nombre_usuario', 'like', "%{$term}%");
                        });
                });
            })
            ->orderByDesc('conciliado_en')
            ->orderByDesc('id');
    }

    public function mapCollection(Collection $registros): Collection
    {
        return $registros
            ->map(fn(Conciliacion $conciliacion) => $this->mapRegistro($conciliacion))
            ->values();
    }

    public function buildAlertas(array $resumen): array
    {
        $alertas = [];

        if (($resumen['movimientos_pendientes'] ?? 0) >= 25) {
            $alertas[] = [
                'nivel' => 'warning',
                'mensaje' => 'Acumulacion alta de movimientos pendientes. Revisa la cola manual para evitar rezagos.',
            ];
        }

        if (($resumen['con_diferencia_hoy'] ?? 0) >= 5) {
            $alertas[] = [
                'nivel' => 'warning',
                'mensaje' => 'Hoy hay multiples conciliaciones con diferencia. Conviene revisar referencias y montos esperados.',
            ];
        }

        if (($resumen['rechazadas_hoy'] ?? 0) >= 1) {
            $alertas[] = [
                'nivel' => 'danger',
                'mensaje' => 'Existen conciliaciones rechazadas hoy. Verifica cada caso para seguimiento operativo.',
            ];
        }

        return $alertas;
    }

    public function exportar(array $filtros, string $format): StreamedResponse
    {
        $registros = $this->buildQuery($filtros)
            ->limit(5000)
            ->get();

        if ($format === 'xlsx') {
            return $this->exportarXlsx($registros);
        }

        return $this->exportarCsv($registros);
    }

    private function mapRegistro(Conciliacion $conciliacion): array
    {
        return [
            'id' => $conciliacion->id,
            'estado' => $conciliacion->estado,
            'monto_conciliado' => (float) $conciliacion->monto_conciliado,
            'diferencia_monto' => (float) $conciliacion->diferencia_monto,
            'conciliado_en' => optional($conciliacion->conciliado_en)->toDateTimeString(),
            'observaciones' => $conciliacion->observaciones,
            'usuario' => $conciliacion->conciliador?->nombre_usuario,
            'relacion' => [
                'numero_relacion' => $conciliacion->pagoDistribuidora?->relacionCorte?->numero_relacion,
                'referencia_pago' => $conciliacion->pagoDistribuidora?->relacionCorte?->referencia_pago,
            ],
            'movimiento' => [
                'referencia' => $conciliacion->movimientoBancario?->referencia,
                'folio' => $conciliacion->movimientoBancario?->folio,
                'nombre_pagador' => $conciliacion->movimientoBancario?->nombre_pagador,
            ],
        ];
    }

    private function exportarCsv(Collection $registros): StreamedResponse
    {
        $timestamp = now()->format('Ymd_His');
        $filename = "historial_conciliaciones_{$timestamp}.csv";

        return response()->streamDownload(function () use ($registros) {
            $output = fopen('php://output', 'w');
            if ($output === false) {
                return;
            }

            // BOM UTF-8 para mejor compatibilidad en Excel.
            fwrite($output, "\xEF\xBB\xBF");

            $headers = [
                'fecha_conciliacion',
                'estado',
                'numero_relacion',
                'referencia_relacion',
                'referencia_movimiento',
                'folio_movimiento',
                'monto_conciliado',
                'diferencia_monto',
                'usuario',
                'observaciones',
            ];

            fputcsv($output, $headers, ';');

            foreach ($registros as $conciliacion) {
                fputcsv($output, [
                    optional($conciliacion->conciliado_en)?->toDateTimeString(),
                    $conciliacion->estado,
                    $conciliacion->pagoDistribuidora?->relacionCorte?->numero_relacion,
                    $conciliacion->pagoDistribuidora?->relacionCorte?->referencia_pago,
                    $conciliacion->movimientoBancario?->referencia,
                    $conciliacion->movimientoBancario?->folio,
                    (float) $conciliacion->monto_conciliado,
                    (float) $conciliacion->diferencia_monto,
                    $conciliacion->conciliador?->nombre_usuario,
                    $conciliacion->observaciones,
                ], ';');
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function exportarXlsx(Collection $registros): StreamedResponse
    {
        $timestamp = now()->format('Ymd_His');
        $filename = "historial_conciliaciones_{$timestamp}.xlsx";

        return response()->streamDownload(function () use ($registros) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            $sheet->fromArray([
                'fecha_conciliacion',
                'estado',
                'numero_relacion',
                'referencia_relacion',
                'referencia_movimiento',
                'folio_movimiento',
                'monto_conciliado',
                'diferencia_monto',
                'usuario',
                'observaciones',
            ], null, 'A1');

            $fila = 2;
            foreach ($registros as $conciliacion) {
                $sheet->fromArray([
                    optional($conciliacion->conciliado_en)?->toDateTimeString(),
                    $conciliacion->estado,
                    $conciliacion->pagoDistribuidora?->relacionCorte?->numero_relacion,
                    $conciliacion->pagoDistribuidora?->relacionCorte?->referencia_pago,
                    $conciliacion->movimientoBancario?->referencia,
                    $conciliacion->movimientoBancario?->folio,
                    (float) $conciliacion->monto_conciliado,
                    (float) $conciliacion->diferencia_monto,
                    $conciliacion->conciliador?->nombre_usuario,
                    $conciliacion->observaciones,
                ], null, "A{$fila}");
                $fila++;
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
