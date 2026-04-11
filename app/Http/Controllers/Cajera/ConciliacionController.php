<?php

namespace App\Http\Controllers\Cajera;

use App\Events\AlertaMorosidad;
use App\Http\Controllers\Controller;
use App\Models\Conciliacion;
use App\Models\MovimientoBancario;
use App\Models\PagoDistribuidora;
use App\Models\RelacionCorte;
use App\Models\Vale;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use App\Notifications\ConciliacionProcesadaNotification;
use App\Services\Cajera\ConciliacionHistorialService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ConciliacionController extends Controller
{
    public function __construct(private readonly ConciliacionHistorialService $historialService) {}

    public function index(Request $request): Response
    {
        $filtros = [
            'mov_q' => trim((string) $request->string('mov_q', '')),
            'mov_fecha' => trim((string) $request->string('mov_fecha', '')),
            'rel_q' => trim((string) $request->string('rel_q', '')),
            'rel_estado' => trim((string) $request->string('rel_estado', 'TODAS')),
            'hist_q' => trim((string) $request->string('hist_q', '')),
            'hist_estado' => trim((string) $request->string('hist_estado', 'TODOS')),
            'hist_desde' => trim((string) $request->string('hist_desde', '')),
            'hist_hasta' => trim((string) $request->string('hist_hasta', '')),
            'hist_page' => (int) $request->integer('hist_page', 1),
        ];

        $movimientosPendientesQuery = MovimientoBancario::query()
            ->with('cuentaEmpresa:id,banco,nombre_titular')
            ->whereDoesntHave('conciliacion')
            ->when($filtros['mov_q'] !== '', function ($query) use ($filtros) {
                $term = $filtros['mov_q'];
                $query->where(function ($sub) use ($term) {
                    $sub->where('referencia', 'like', "%{$term}%")
                        ->orWhere('folio', 'like', "%{$term}%")
                        ->orWhere('nombre_pagador', 'like', "%{$term}%")
                        ->orWhere('concepto_raw', 'like', "%{$term}%");
                });
            })
            ->when($filtros['mov_fecha'] !== '', function ($query) use ($filtros) {
                $query->whereDate('fecha_movimiento', $filtros['mov_fecha']);
            });

        $movimientosPendientes = $movimientosPendientesQuery
            ->orderByDesc('fecha_movimiento')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(function (MovimientoBancario $movimiento) {
                return [
                    'id' => $movimiento->id,
                    'referencia' => $movimiento->referencia,
                    'fecha_movimiento' => optional($movimiento->fecha_movimiento)->toDateString(),
                    'hora_movimiento' => $movimiento->hora_movimiento,
                    'monto' => (float) $movimiento->monto,
                    'tipo_movimiento' => $movimiento->tipo_movimiento,
                    'folio' => $movimiento->folio,
                    'nombre_pagador' => $movimiento->nombre_pagador,
                    'concepto_raw' => $movimiento->concepto_raw,
                    'cuenta_empresa' => $movimiento->cuentaEmpresa ? [
                        'id' => $movimiento->cuentaEmpresa->id,
                        'banco' => $movimiento->cuentaEmpresa->banco,
                        'nombre_titular' => $movimiento->cuentaEmpresa->nombre_titular,
                    ] : null,
                ];
            })
            ->values();

        $relacionesPendientesQuery = RelacionCorte::query()
            ->with([
                'distribuidora.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'corte:id,fecha_programada,tipo_corte',
            ])
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->when($filtros['rel_estado'] !== 'TODAS', function ($query) use ($filtros) {
                $query->where('estado', $filtros['rel_estado']);
            })
            ->when($filtros['rel_q'] !== '', function ($query) use ($filtros) {
                $term = $filtros['rel_q'];
                $query->where(function ($sub) use ($term) {
                    $sub->where('numero_relacion', 'like', "%{$term}%")
                        ->orWhere('referencia_pago', 'like', "%{$term}%");
                });
            });

        $relacionesPendientes = $relacionesPendientesQuery
            ->orderBy('fecha_limite_pago')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(function (RelacionCorte $relacion) {
                return [
                    'id' => $relacion->id,
                    'numero_relacion' => $relacion->numero_relacion,
                    'referencia_pago' => $relacion->referencia_pago,
                    'fecha_limite_pago' => optional($relacion->fecha_limite_pago)->toDateString(),
                    'total_a_pagar' => (float) $relacion->total_a_pagar,
                    'estado' => $relacion->estado,
                    'distribuidora' => [
                        'id' => $relacion->distribuidora?->id,
                        'nombre' => trim(implode(' ', array_filter([
                            $relacion->distribuidora?->persona?->primer_nombre,
                            $relacion->distribuidora?->persona?->segundo_nombre,
                            $relacion->distribuidora?->persona?->apellido_paterno,
                            $relacion->distribuidora?->persona?->apellido_materno,
                        ]))),
                        'numero_distribuidora' => $relacion->distribuidora?->numero_distribuidora,
                    ],
                    'corte' => [
                        'fecha_programada' => optional($relacion->corte?->fecha_programada)->toDateTimeString(),
                        'tipo_corte' => $relacion->corte?->tipo_corte,
                    ],
                ];
            })
            ->values();

        $hoy = now()->toDateString();

        $resumen = [
            'movimientos_pendientes' => MovimientoBancario::query()->whereDoesntHave('conciliacion')->count(),
            'relaciones_pendientes' => RelacionCorte::query()->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])->count(),
            'conciliadas_hoy' => Conciliacion::query()->whereDate('conciliado_en', $hoy)->count(),
            'monto_conciliado_hoy' => (float) Conciliacion::query()->whereDate('conciliado_en', $hoy)->sum('monto_conciliado'),
            'con_diferencia_hoy' => Conciliacion::query()->whereDate('conciliado_en', $hoy)->where('estado', Conciliacion::ESTADO_CON_DIFERENCIA)->count(),
            'rechazadas_hoy' => Conciliacion::query()->whereDate('conciliado_en', $hoy)->where('estado', Conciliacion::ESTADO_RECHAZADA)->count(),
        ];

        $alertas = $this->historialService->buildAlertas($resumen);

        $historialPaginator = $this->historialService->buildQuery($filtros)
            ->paginate(15, ['*'], 'hist_page', max(1, $filtros['hist_page']))
            ->appends($request->query());

        $historialConciliaciones = $this->historialService->mapCollection(collect($historialPaginator->items()));

        return Inertia::render('Cajera/Conciliaciones', [
            'resumen' => $resumen,
            'alertas' => $alertas,
            'filtros' => $filtros,
            'movimientosPendientes' => $movimientosPendientes,
            'relacionesPendientes' => $relacionesPendientes,
            'historialConciliaciones' => $historialConciliaciones,
            'historialMeta' => [
                'current_page' => $historialPaginator->currentPage(),
                'last_page' => $historialPaginator->lastPage(),
                'per_page' => $historialPaginator->perPage(),
                'total' => $historialPaginator->total(),
            ],
            'ventanaCorte' => $this->calcularEstadoVentanaCorte(),
        ]);
    }

    public function exportarHistorial(Request $request): StreamedResponse
    {
        $filtros = [
            'hist_q' => trim((string) $request->string('hist_q', '')),
            'hist_estado' => trim((string) $request->string('hist_estado', 'TODOS')),
            'hist_desde' => trim((string) $request->string('hist_desde', '')),
            'hist_hasta' => trim((string) $request->string('hist_hasta', '')),
        ];

        $format = strtolower((string) $request->string('format', 'csv'));
        if (!in_array($format, ['csv', 'xlsx'], true)) {
            $format = 'csv';
        }

        return $this->historialService->exportar($filtros, $format);
    }

    /**
     * Calcula el estado de la ventana de corte para el día de hoy.
     *
     * Reglas de Charly:
     * - Día de corte = dia_corte configurado en sucursal_configuraciones
     * - Ventana 1 (principal): días dia_corte, +1, +2 — Excel con pagos cuya fecha <= dia_corte
     * - Ventana 2 (tardíos): día dia_corte + 5 — Excel con pagos del dia_corte+1 al dia_corte+5
     * - Fuera de ventana: cajera no puede descargar nada
     *
     * Retorna: ['ventana' => 'PRINCIPAL'|'TARDIOS'|'FUERA', 'fecha_corte' => Carbon, 'desde' => Carbon, 'hasta' => Carbon, 'mensaje' => string]
     */
    private function calcularEstadoVentanaCorte(): array
    {
        // Usar la primera sucursal con configuración activa (para desarrollo).
        // En producción podría usarse la sucursal del cajero logueado.
        $sucursal = Sucursal::first();
        $config = $sucursal ? SucursalConfiguracion::where('sucursal_id', $sucursal->id)->first() : null;
        $diaCorte = (int) ($config?->dia_corte ?? 15);

        $hoy = now()->startOfDay();
        $anio = (int) $hoy->year;
        $mes = (int) $hoy->month;
        $diasMes = $hoy->copy()->endOfMonth()->day;
        $diaCorteAjustado = min($diaCorte, $diasMes);

        $fechaCorte = Carbon::create($anio, $mes, $diaCorteAjustado)->startOfDay();
        $ventanaPrincipalInicio = $fechaCorte->copy();
        $ventanaPrincipalFin = $fechaCorte->copy()->addDays(2);
        $ventanaTardiosDia = $fechaCorte->copy()->addDays(5);

        if ($hoy->between($ventanaPrincipalInicio, $ventanaPrincipalFin)) {
            return [
                'ventana' => 'PRINCIPAL',
                'fecha_corte' => $fechaCorte->toDateString(),
                'desde' => null,
                'hasta' => $fechaCorte->toDateString(),
                'mensaje' => "Ventana principal del corte del {$fechaCorte->format('d/m/Y')}. Se incluyen pagos hasta esa fecha.",
            ];
        }

        if ($hoy->equalTo($ventanaTardiosDia)) {
            return [
                'ventana' => 'TARDIOS',
                'fecha_corte' => $fechaCorte->toDateString(),
                'desde' => $fechaCorte->copy()->addDay()->toDateString(),
                'hasta' => $ventanaTardiosDia->toDateString(),
                'mensaje' => "Ventana de pagos tardíos del corte del {$fechaCorte->format('d/m/Y')}. Se incluyen pagos del {$fechaCorte->copy()->addDay()->format('d/m')} al {$ventanaTardiosDia->format('d/m/Y')}.",
            ];
        }

        // Fuera de ventana: calcular próxima descarga disponible
        $proximoCorte = $hoy->greaterThan($ventanaTardiosDia)
            ? Carbon::create($anio, $mes, $diaCorteAjustado)->addMonthNoOverflow()
            : $fechaCorte;

        return [
            'ventana' => 'FUERA',
            'fecha_corte' => $fechaCorte->toDateString(),
            'desde' => null,
            'hasta' => null,
            'mensaje' => "Hoy no hay corte disponible para descarga. Próxima descarga: {$proximoCorte->format('d/m/Y')}.",
        ];
    }

    /**
     * Genera un archivo Excel simulando un extracto bancario con los pagos
     * que las distribuidoras han REPORTADO y aún no están conciliados.
     *
     * Respeta las ventanas de corte definidas por Charly (ver calcularEstadoVentanaCorte).
     */
    public function simularArchivoBancario(Request $request): StreamedResponse|RedirectResponse
    {
        $estado = $this->calcularEstadoVentanaCorte();

        if ($estado['ventana'] === 'FUERA') {
            return back()->withErrors(['general' => $estado['mensaje']]);
        }

        $query = PagoDistribuidora::query()
            ->with([
                'relacionCorte:id,numero_relacion,referencia_pago',
                'distribuidora.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
            ])
            ->where('estado', PagoDistribuidora::ESTADO_REPORTADO);

        if ($estado['ventana'] === 'PRINCIPAL') {
            // Pagos con fecha <= fecha de corte
            $query->whereDate('fecha_pago', '<=', $estado['hasta']);
        } else {
            // TARDIOS: pagos del día siguiente al corte hasta corte + 5
            $query->whereDate('fecha_pago', '>=', $estado['desde'])
                ->whereDate('fecha_pago', '<=', $estado['hasta']);
        }

        $pagosReportados = $query->orderBy('fecha_pago')->get();

        $timestamp = now()->format('Ymd_His');
        $ventanaLabel = $estado['ventana'] === 'PRINCIPAL' ? 'principal' : 'tardios';
        $filename = "simulacion_banco_{$ventanaLabel}_{$timestamp}.xlsx";

        return response()->streamDownload(function () use ($pagosReportados) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Simulacion Banco');

            // Headers (mismas columnas que espera el importador)
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
            foreach ($pagosReportados as $pago) {
                $persona = $pago->distribuidora?->persona;
                $nombreDist = trim(implode(' ', array_filter([
                    $persona?->primer_nombre,
                    $persona?->segundo_nombre,
                    $persona?->apellido_paterno,
                    $persona?->apellido_materno,
                ]))) ?: ('DIST-' . $pago->distribuidora_id);

                $fechaPago = $pago->fecha_pago instanceof Carbon ? $pago->fecha_pago : Carbon::parse($pago->fecha_pago);
                $referencia = $pago->referencia_reportada
                    ?? $pago->relacionCorte?->referencia_pago
                    ?? ('SIM-' . $pago->id);
                $numeroRelacion = $pago->relacionCorte?->numero_relacion ?? 'N/A';

                $sheet->fromArray([
                    $referencia,
                    'SIM-' . $pago->id . '-' . now()->format('His'),
                    (float) $pago->monto,
                    $fechaPago->toDateString(),
                    $fechaPago->format('H:i:s'),
                    $pago->metodo_pago ?: 'TRANSFERENCIA',
                    $nombreDist,
                    "Pago simulado relacion {$numeroRelacion}",
                ], null, "A{$fila}");
                $fila++;
            }

            // Si no hay pagos reportados en la ventana, agregar fila demo para que el archivo no esté vacío
            if ($pagosReportados->isEmpty()) {
                $sheet->fromArray([
                    'SIN-PAGOS-REPORTADOS',
                    'SIM-EMPTY',
                    0,
                    now()->toDateString(),
                    now()->format('H:i:s'),
                    'TRANSFERENCIA',
                    'Sin distribuidoras',
                    'No hay pagos reportados dentro de la ventana actual',
                ], null, 'A2');
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importar(Request $request): RedirectResponse
    {
        // Validación explícita
        if (!$request->hasFile('archivo')) {
            return back()->withErrors([
                'archivo' => 'No se recibió archivo. Por favor, selecciona un archivo antes de continuar.',
            ]);
        }

        $archivo = $request->file('archivo');

        if (!$archivo->isValid()) {
            return back()->withErrors([
                'archivo' => 'El archivo no se subió correctamente. Intenta nuevamente.',
            ]);
        }

        $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:10240'], // 10MB max
        ]);

        $nombreArchivo = $archivo->getClientOriginalName();
        $extension = strtolower((string) $archivo->getClientOriginalExtension());

        try {
            $rows = $this->parseBankFile(
                $archivo->getRealPath(),
                $extension
            );
        } catch (Throwable $e) {
            return back()->withErrors([
                'archivo' => "No se pudo leer '{$nombreArchivo}'. Verifica que sea un archivo válido. Detalle: {$e->getMessage()}",
            ]);
        }

        if (count($rows) === 0) {
            return back()->with('error', "El archivo '{$nombreArchivo}' no contiene filas válidas para conciliar. Verifica el formato y los encabezados.");
        }

        $stats = [
            'procesadas' => 0,
            'conciliadas' => 0,
            'pendientes' => 0,
            'duplicadas' => 0,
            'invalidas' => 0,
        ];
        $detalleFilas = [];

        foreach ($rows as $idx => $row) {
            $stats['procesadas']++;

            $monto = $this->parseMonto($row['monto'] ?? null);
            $fecha = $this->parseFecha($row['fecha'] ?? null);
            $hora = $this->parseHora($row['hora'] ?? null);

            if ($monto === null || !$fecha) {
                $stats['invalidas']++;
                $detalleFilas[] = [
                    'fila' => $idx + 2,
                    'referencia' => $this->sanitize($row['referencia'] ?? null),
                    'folio' => $this->sanitize($row['folio'] ?? null),
                    'monto' => $row['monto'] ?? null,
                    'fecha' => $this->normalizeFechaTexto((string) ($row['fecha'] ?? '')),
                    'resultado' => 'INVALIDA',
                    'motivo' => 'Monto o fecha no reconocidos',
                ];
                continue;
            }

            $referencia = $this->sanitize($row['referencia'] ?? null);
            $folio = $this->sanitize($row['folio'] ?? null);
            $resultadoFila = null;

            try {
                $resultadoFila = DB::transaction(function () use ($referencia, $folio, $fecha, $monto, $hora, $row) {
                    $duplicado = $this->esMovimientoDuplicado(
                        referencia: $referencia,
                        folio: $folio,
                        fechaMovimiento: $fecha->toDateString(),
                        monto: $monto,
                        concepto: $this->sanitize($row['concepto'] ?? null)
                    );

                    if ($duplicado) {
                        return [
                            'resultado' => 'DUPLICADA',
                            'motivo' => 'Ya existe un movimiento con esos datos',
                        ];
                    }

                    $movimiento = MovimientoBancario::create([
                        'cuenta_banco_empresa_id' => null,
                        'referencia' => $referencia,
                        'fecha_movimiento' => $fecha->toDateString(),
                        'hora_movimiento' => $hora,
                        'monto' => $monto,
                        'tipo_movimiento' => $this->sanitize($row['tipo_pago'] ?? null),
                        'folio' => $folio,
                        'nombre_pagador' => $this->sanitize($row['nombre_pagador'] ?? null),
                        'concepto_raw' => $this->sanitize($row['concepto'] ?? null),
                    ]);

                    if ($this->conciliarAutomaticoExacto($movimiento)) {
                        return [
                            'resultado' => 'CONCILIADA_AUTOMATICA',
                            'motivo' => 'Coincidencia exacta por referencia + monto',
                        ];
                    }

                    return [
                        'resultado' => 'PENDIENTE_MANUAL',
                        'motivo' => 'No hubo coincidencia exacta automatica',
                    ];
                }, 3);
            } catch (QueryException $e) {
                if ($this->isUniqueConciliacionException($e)) {
                    $stats['duplicadas']++;
                    $detalleFilas[] = [
                        'fila' => $idx + 2,
                        'referencia' => $referencia,
                        'folio' => $folio,
                        'monto' => $monto,
                        'fecha' => $fecha->toDateString(),
                        'resultado' => 'DUPLICADA',
                        'motivo' => 'El movimiento ya fue conciliado durante el procesamiento',
                    ];
                    continue;
                }

                $stats['invalidas']++;
                $detalleFilas[] = [
                    'fila' => $idx + 2,
                    'referencia' => $referencia,
                    'folio' => $folio,
                    'monto' => $monto,
                    'fecha' => $fecha->toDateString(),
                    'resultado' => 'INVALIDA',
                    'motivo' => 'Error interno al procesar la fila',
                ];
                continue;
            } catch (Throwable $e) {
                $stats['invalidas']++;
                $detalleFilas[] = [
                    'fila' => $idx + 2,
                    'referencia' => $referencia,
                    'folio' => $folio,
                    'monto' => $monto,
                    'fecha' => $fecha->toDateString(),
                    'resultado' => 'INVALIDA',
                    'motivo' => 'Error interno al procesar la fila',
                ];
                continue;
            }

            if (($resultadoFila['resultado'] ?? null) === 'DUPLICADA') {
                $stats['duplicadas']++;
            } elseif (($resultadoFila['resultado'] ?? null) === 'CONCILIADA_AUTOMATICA') {
                $stats['conciliadas']++;
            } else {
                $stats['pendientes']++;
            }

            $detalleFilas[] = [
                'fila' => $idx + 2,
                'referencia' => $referencia,
                'folio' => $folio,
                'monto' => $monto,
                'fecha' => $fecha->toDateString(),
                'resultado' => $resultadoFila['resultado'] ?? 'PENDIENTE_MANUAL',
                'motivo' => $resultadoFila['motivo'] ?? 'Procesado sin detalle',
            ];
        }

        $detalles = [
            "Archivo: {$nombreArchivo} ({$extension})",
            "Procesadas: {$stats['procesadas']} movimientos",
            "Conciliadas automaticamente: {$stats['conciliadas']}",
            "Pendientes de revision manual: {$stats['pendientes']}",
            "Duplicadas: {$stats['duplicadas']}",
            "Invalidas (sin monto o fecha): {$stats['invalidas']}",
        ];
        $mensaje = implode(' | ', $detalles);

        /** @var \App\Models\Usuario|null $usuarioAuth */
        $usuarioAuth = Auth::user();
        $sucursalId = $usuarioAuth?->sucursales()->first()?->id;
        if ($sucursalId) {
            $this->notificarGerentesSucursal(
                (int) $sucursalId,
                'Resumen de importacion bancaria',
                "{$stats['procesadas']} procesadas, {$stats['conciliadas']} conciliadas, {$stats['pendientes']} pendientes.",
                [
                    'procesadas' => $stats['procesadas'],
                    'conciliadas' => $stats['conciliadas'],
                    'pendientes' => $stats['pendientes'],
                    'duplicadas' => $stats['duplicadas'],
                    'invalidas' => $stats['invalidas'],
                ]
            );

            if ($stats['pendientes'] > 0) {
                event(new AlertaMorosidad(
                    (int) $sucursalId,
                    'Pendientes de conciliacion',
                    null,
                    'Se detectaron pagos pendientes por revisar en la importacion bancaria.'
                ));
            }
        }

        return redirect()
            ->route('cajera.conciliaciones')
            ->with('message', $mensaje)
            ->with('import_result', [
                'archivo' => $nombreArchivo,
                'stats' => $stats,
                'rows' => array_slice($detalleFilas, 0, 50),
            ]);
    }

    public function conciliarManual(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'movimiento_bancario_id' => ['required', 'integer', 'exists:movimientos_bancarios,id'],
            'relacion_corte_id' => ['required', 'integer', 'exists:relaciones_corte,id'],
            'estado' => ['required', 'in:CONCILIADA,CON_DIFERENCIA,RECHAZADA'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ]);

        $movimiento = MovimientoBancario::query()
            ->where('id', $data['movimiento_bancario_id'])
            ->firstOrFail();

        if ($movimiento->conciliacion()->exists()) {
            return back()->with('error', 'Ese movimiento ya está conciliado.');
        }

        $relacion = RelacionCorte::query()->with(['distribuidora.persona'])->findOrFail($data['relacion_corte_id']);

        $diferencia = round((float) $movimiento->monto - (float) $relacion->total_a_pagar, 2);
        $estadoConciliacion = $data['estado'];

        if ($estadoConciliacion === Conciliacion::ESTADO_CONCILIADA && abs($diferencia) > 0.009) {
            $estadoConciliacion = Conciliacion::ESTADO_CON_DIFERENCIA;
        }

        try {
            DB::transaction(function () use ($relacion, $movimiento, $estadoConciliacion, $data, $diferencia) {
                $pago = PagoDistribuidora::create([
                    'relacion_corte_id' => $relacion->id,
                    'distribuidora_id' => $relacion->distribuidora_id,
                    'cuenta_banco_empresa_id' => $movimiento->cuenta_banco_empresa_id,
                    'monto' => $movimiento->monto,
                    'metodo_pago' => $this->mapMetodoPago($movimiento->tipo_movimiento),
                    'referencia_reportada' => $movimiento->referencia,
                    'fecha_pago' => $this->buildFechaPagoDesdeMovimiento($movimiento),
                    'estado' => $estadoConciliacion === Conciliacion::ESTADO_RECHAZADA
                        ? PagoDistribuidora::ESTADO_RECHAZADO
                        : PagoDistribuidora::ESTADO_CONCILIADO,
                    'observaciones' => $data['observaciones'] ?: 'Conciliación manual por cajera.',
                ]);

                Conciliacion::create([
                    'pago_distribuidora_id' => $pago->id,
                    'movimiento_bancario_id' => $movimiento->id,
                    'conciliado_por_usuario_id' => $this->authUserPk(),
                    'conciliado_en' => now(),
                    'monto_conciliado' => $movimiento->monto,
                    'diferencia_monto' => $diferencia,
                    'estado' => $estadoConciliacion,
                    'observaciones' => $data['observaciones'],
                ]);

                if ($estadoConciliacion !== Conciliacion::ESTADO_RECHAZADA) {
                    $this->actualizarEstadoRelacionPorPagos($relacion);
                }
            }, 3);
        } catch (QueryException $e) {
            if ($this->isUniqueConciliacionException($e)) {
                return back()->with('error', 'Ese movimiento ya fue conciliado por otro usuario. Actualiza la pantalla.');
            }

            throw $e;
        }

        $sucursalId = $relacion->distribuidora?->sucursal_id;
        if ($sucursalId) {
            $nombreDistribuidora = $this->nombreDistribuidora($relacion);

            DB::afterCommit(function () use ($sucursalId, $relacion, $estadoConciliacion, $nombreDistribuidora) {
                $this->notificarGerentesSucursal(
                    (int) $sucursalId,
                    'Conciliacion manual aplicada',
                    "Relacion {$relacion->numero_relacion} conciliada con estado {$estadoConciliacion} ({$nombreDistribuidora}).",
                    [
                        'relacion_corte_id' => (int) $relacion->id,
                        'numero_relacion' => (string) $relacion->numero_relacion,
                        'estado_conciliacion' => (string) $estadoConciliacion,
                    ]
                );

                if ($estadoConciliacion === Conciliacion::ESTADO_RECHAZADA || $relacion->estado === RelacionCorte::ESTADO_VENCIDA) {
                    event(new AlertaMorosidad(
                        (int) $sucursalId,
                        $nombreDistribuidora,
                        (int) $relacion->id,
                        'Conciliacion rechazada o relacion en estado vencida.'
                    ));
                }
            });
        }

        return redirect()->route('cajera.conciliaciones')->with('message', 'Conciliación manual aplicada correctamente.');
    }

    private function notificarGerentesSucursal(int $sucursalId, string $titulo, string $mensaje, array $meta = []): void
    {
        $gerentes = Usuario::query()
            ->whereIn('id', function ($query) use ($sucursalId) {
                $query->select('usuario_rol.usuario_id')
                    ->from('usuario_rol')
                    ->join('roles', 'roles.id', '=', 'usuario_rol.rol_id')
                    ->where('roles.codigo', 'GERENTE')
                    ->where('usuario_rol.sucursal_id', $sucursalId)
                    ->whereNull('usuario_rol.revocado_en');
            })
            ->get();

        foreach ($gerentes as $gerente) {
            $gerente->notify(new ConciliacionProcesadaNotification($titulo, $mensaje, $meta));
        }
    }

    private function nombreDistribuidora(RelacionCorte $relacion): string
    {
        $nombre = trim(implode(' ', array_filter([
            $relacion->distribuidora?->persona?->primer_nombre,
            $relacion->distribuidora?->persona?->segundo_nombre,
            $relacion->distribuidora?->persona?->apellido_paterno,
            $relacion->distribuidora?->persona?->apellido_materno,
        ])));

        if ($nombre !== '') {
            return $nombre;
        }

        return $relacion->distribuidora?->numero_distribuidora ?: 'Distribuidora';
    }

    private function conciliarAutomaticoExacto(MovimientoBancario $movimiento): bool
    {
        if (!$movimiento->referencia) {
            return false;
        }

        $relacion = RelacionCorte::query()
            ->where('referencia_pago', $movimiento->referencia)
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->orderByDesc('id')
            ->first();

        if (!$relacion) {
            return false;
        }

        if ($this->relacionYaTienePagoConciliado($relacion->id)) {
            return false;
        }

        if (round((float) $relacion->total_a_pagar, 2) !== round((float) $movimiento->monto, 2)) {
            return false;
        }

        $pago = PagoDistribuidora::create([
            'relacion_corte_id' => $relacion->id,
            'distribuidora_id' => $relacion->distribuidora_id,
            'cuenta_banco_empresa_id' => $movimiento->cuenta_banco_empresa_id,
            'monto' => $movimiento->monto,
            'metodo_pago' => $this->mapMetodoPago($movimiento->tipo_movimiento),
            'referencia_reportada' => $movimiento->referencia,
            'fecha_pago' => $this->buildFechaPagoDesdeMovimiento($movimiento),
            'estado' => PagoDistribuidora::ESTADO_CONCILIADO,
            'observaciones' => 'Conciliación automática exacta (referencia + monto).',
        ]);

        Conciliacion::create([
            'pago_distribuidora_id' => $pago->id,
            'movimiento_bancario_id' => $movimiento->id,
            'conciliado_por_usuario_id' => $this->authUserPk(),
            'conciliado_en' => now(),
            'monto_conciliado' => $movimiento->monto,
            'diferencia_monto' => 0,
            'estado' => Conciliacion::ESTADO_CONCILIADA,
            'observaciones' => 'Aplicación automática por coincidencia exacta.',
        ]);

        $this->actualizarEstadoRelacionPorPagos($relacion);

        return true;
    }

    private function esMovimientoDuplicado(?string $referencia, ?string $folio, string $fechaMovimiento, float $monto, ?string $concepto): bool
    {
        if ($folio) {
            return MovimientoBancario::query()->where('folio', $folio)->exists();
        }

        if ($referencia) {
            return MovimientoBancario::query()
                ->where('referencia', $referencia)
                ->whereDate('fecha_movimiento', $fechaMovimiento)
                ->where('monto', $monto)
                ->exists();
        }

        return MovimientoBancario::query()
            ->whereDate('fecha_movimiento', $fechaMovimiento)
            ->where('monto', $monto)
            ->when($concepto, fn($query) => $query->where('concepto_raw', $concepto))
            ->exists();
    }

    private function actualizarEstadoRelacionPorPagos(RelacionCorte $relacion): void
    {
        $estadoAnterior = $relacion->estado;

        $montoConciliado = (float) PagoDistribuidora::query()
            ->where('relacion_corte_id', $relacion->id)
            ->where('estado', PagoDistribuidora::ESTADO_CONCILIADO)
            ->sum('monto');

        $totalEsperado = (float) $relacion->total_a_pagar;

        if ($montoConciliado <= 0) {
            return;
        }

        if ($montoConciliado + 0.009 >= $totalEsperado) {
            $relacion->estado = RelacionCorte::ESTADO_PAGADA;
        } else {
            $relacion->estado = RelacionCorte::ESTADO_PARCIAL;
        }

        $relacion->save();

        if ($estadoAnterior !== RelacionCorte::ESTADO_PAGADA && $relacion->estado === RelacionCorte::ESTADO_PAGADA) {
            $this->restaurarCreditoDistribuidoraPorRelacion($relacion);
        }
    }

    private function restaurarCreditoDistribuidoraPorRelacion(RelacionCorte $relacion): void
    {
        $relacion->loadMissing('partidas.vale');

        $creditoArestaurar = (float) $relacion->partidas->sum(function ($partida) {
            return (float) ($partida->vale?->monto_principal ?? 0);
        });

        if ($creditoArestaurar <= 0) {
            return;
        }

        $relacion->distribuidora?->increment('credito_disponible', $creditoArestaurar);
    }

    private function relacionYaTienePagoConciliado(int $relacionId): bool
    {
        return PagoDistribuidora::query()
            ->where('relacion_corte_id', $relacionId)
            ->where('estado', PagoDistribuidora::ESTADO_CONCILIADO)
            ->exists();
    }

    private function mapMetodoPago(?string $tipoMovimiento): string
    {
        $texto = strtoupper((string) $tipoMovimiento);

        if (str_contains($texto, 'DEPOSITO') || str_contains($texto, 'VENTANILLA')) {
            return PagoDistribuidora::METODO_DEPOSITO;
        }

        if (str_contains($texto, 'TRANSFER') || str_contains($texto, 'SPEI')) {
            return PagoDistribuidora::METODO_TRANSFERENCIA;
        }

        return PagoDistribuidora::METODO_OTRO;
    }

    private function parseCsv(string $path): array
    {
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [];
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return [];
        }

        $delimiter = $this->detectDelimiter($firstLine);
        rewind($handle);

        $header = fgetcsv($handle, 0, $delimiter);
        if (!$header) {
            fclose($handle);
            return [];
        }

        $headerMap = array_map(fn($value) => $this->normalizeHeader((string) $value), $header);

        $rows = [];
        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (count(array_filter($line, fn($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            $row = [];
            foreach ($headerMap as $index => $normalizedKey) {
                $row[$normalizedKey] = $line[$index] ?? null;
            }

            $rows[] = [
                'referencia' => $this->pickByKeys($row, ['referencia', 'linea_referencia', 'linea_de_referencia', 'ref']),
                'monto' => $this->pickByKeys($row, ['pago', 'monto', 'importe', 'abono']),
                'fecha' => $this->pickByKeys($row, ['fecha_pago', 'fecha_de_pago', 'fecha', 'fecha_movimiento']),
                'hora' => $this->pickByKeys($row, ['hora']),
                'folio' => $this->pickByKeys($row, ['folio_pago', 'folio_de_pago', 'folio']),
                'tipo_pago' => $this->pickByKeys($row, ['tipo_pago', 'tipo_de_pago', 'tipo_movimiento']),
                'concepto' => $this->pickByKeys($row, ['concepto', 'descripcion']),
                'nombre_pagador' => $this->pickByKeys($row, ['nombre_pagador', 'pagador', 'cliente']),
            ];
        }

        fclose($handle);

        return $rows;
    }

    private function parseBankFile(string $path, string $extension): array
    {
        if (in_array($extension, ['xlsx', 'xls'], true)) {
            return $this->parseSpreadsheet($path);
        }

        return $this->parseCsv($path);
    }

    private function parseSpreadsheet(string $path): array
    {
        if (!class_exists(IOFactory::class)) {
            throw new \RuntimeException('PhpSpreadsheet no esta disponible. Instala la dependencia con: composer require phpoffice/phpspreadsheet');
        }

        try {
            $spreadsheet = IOFactory::load($path);
        } catch (Throwable $e) {
            throw new \RuntimeException("No se pudo cargar el archivo Excel: {$e->getMessage()}");
        }

        $sheet = $spreadsheet->getActiveSheet();
        // Usamos valores sin formato para evitar fechas localizadas (ej. caracteres asiaticos).
        $rowsRaw = $sheet->toArray(null, true, false, true);

        if (count($rowsRaw) < 2) {
            throw new \RuntimeException('El archivo Excel debe tener al menos encabezados + 1 fila de datos');
        }

        $headerRow = array_shift($rowsRaw);
        $headerValues = array_values($headerRow);
        $headerMap = array_map(fn($value) => $this->normalizeHeader((string) $value), $headerValues);

        $rows = [];
        foreach ($rowsRaw as $line) {
            $lineValues = array_values($line);
            if (count(array_filter($lineValues, fn($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            $row = [];
            foreach ($headerMap as $index => $normalizedKey) {
                $row[$normalizedKey] = $lineValues[$index] ?? null;
            }

            $rows[] = [
                'referencia' => $this->pickByKeys($row, ['referencia', 'linea_referencia', 'linea_de_referencia', 'ref']),
                'monto' => $this->pickByKeys($row, ['pago', 'monto', 'importe', 'abono']),
                'fecha' => $this->pickByKeys($row, ['fecha_pago', 'fecha_de_pago', 'fecha', 'fecha_movimiento']),
                'hora' => $this->pickByKeys($row, ['hora']),
                'folio' => $this->pickByKeys($row, ['folio_pago', 'folio_de_pago', 'folio']),
                'tipo_pago' => $this->pickByKeys($row, ['tipo_pago', 'tipo_de_pago', 'tipo_movimiento']),
                'concepto' => $this->pickByKeys($row, ['concepto', 'descripcion']),
                'nombre_pagador' => $this->pickByKeys($row, ['nombre_pagador', 'pagador', 'cliente']),
            ];
        }

        return $rows;
    }

    private function detectDelimiter(string $line): string
    {
        $delimiters = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $maxParts = 0;

        foreach ($delimiters as $delimiter) {
            $parts = str_getcsv($line, $delimiter);
            if (count($parts) > $maxParts) {
                $maxParts = count($parts);
                $bestDelimiter = $delimiter;
            }
        }

        return $bestDelimiter;
    }

    private function normalizeHeader(string $value): string
    {
        $value = trim($value);
        $value = strtolower($value);
        $value = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $value);
        $value = preg_replace('/[^a-z0-9]+/i', '_', $value) ?: '';

        return trim($value, '_');
    }

    private function pickByKeys(array $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && trim((string) $row[$key]) !== '') {
                return trim((string) $row[$key]);
            }
        }

        return null;
    }

    private function parseMonto(?string $raw): ?float
    {
        if ($raw === null) {
            return null;
        }

        $clean = trim($raw);
        if ($clean === '') {
            return null;
        }

        $clean = preg_replace('/[^0-9,\.\-]/', '', $clean) ?: '';

        $hasComma = str_contains($clean, ',');
        $hasDot = str_contains($clean, '.');

        if ($hasComma && $hasDot) {
            // Si existen ambos, el ultimo separador suele ser el decimal.
            if (strrpos($clean, ',') > strrpos($clean, '.')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            // 1.234,56 o 560,50
            if (preg_match('/,\d{1,2}$/', $clean)) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot) {
            // 1,234.56 o 2.100 (miles)
            if (!preg_match('/\.\d{1,2}$/', $clean)) {
                $clean = str_replace('.', '', $clean);
            }
        }

        if (!is_numeric($clean)) {
            return null;
        }

        return round((float) $clean, 2);
    }

    private function parseFecha($raw): ?Carbon
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (is_numeric($raw)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $raw))->startOfDay();
            } catch (\Throwable) {
                // Continuar con parser de texto.
            }
        }

        $value = $this->normalizeFechaTexto((string) $raw);
        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'd/m/y', 'j/n/Y'];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->startOfDay();
            } catch (\Throwable) {
                // Ignorar e intentar siguiente formato
            }
        }

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    private function normalizeFechaTexto(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return $value;
        }

        // Convierte formatos como 2026年11月2日 a 2026-11-02.
        if (preg_match('/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/u', $value, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
        }

        return str_replace(['年', '月', '日'], ['-', '-', ''], $value);
    }

    private function parseHora($raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (is_numeric($raw)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $raw))->format('H:i:s');
            } catch (\Throwable) {
                // Continuar con parser de texto.
            }
        }

        $value = trim((string) $raw);

        try {
            return Carbon::parse($value)->format('H:i:s');
        } catch (\Throwable) {
            return null;
        }
    }

    private function sanitize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function buildFechaPagoDesdeMovimiento(MovimientoBancario $movimiento): Carbon
    {
        $fecha = $movimiento->fecha_movimiento instanceof Carbon
            ? $movimiento->fecha_movimiento->toDateString()
            : (string) $movimiento->fecha_movimiento;

        $hora = $movimiento->hora_movimiento ?: '00:00:00';

        return Carbon::parse(trim($fecha . ' ' . $hora));
    }

    private function authUserPk(): ?int
    {
        $id = Auth::id();
        return is_numeric($id) ? (int) $id : null;
    }

    private function isUniqueConciliacionException(QueryException $e): bool
    {
        $mensaje = strtolower($e->getMessage());
        $sqlState = (string) ($e->errorInfo[0] ?? '');

        if ($sqlState === '23000') {
            return str_contains($mensaje, 'conciliaciones_movimiento_unique')
                || str_contains($mensaje, 'conciliaciones_pago_unique')
                || str_contains($mensaje, 'movimiento_bancario_id')
                || str_contains($mensaje, 'pago_distribuidora_id');
        }

        return false;
    }
}
