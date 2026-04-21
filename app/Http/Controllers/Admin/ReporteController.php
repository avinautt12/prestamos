<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\ReportePeriodicoMail;
use App\Models\Corte;
use App\Models\Sucursal;
use App\Services\Reportes\ReporteExcelBuilder;
use App\Services\Reportes\ReporteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Descarga de reportes ejecutivos para rol ADMIN.
 * Cuando no se especifica sucursal_id, el reporte es global (todas las sucursales).
 */
class ReporteController extends Controller
{
    public function __construct(
        private readonly ReporteService $service,
    ) {}

    public function descargar(Request $request): StreamedResponse
    {
        $contexto = $this->construirContexto($this->validarParams($request));
        return $this->streamExcel($contexto['builder'], $contexto['nombreArchivo']);
    }

    public function enviar(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $email = $user?->persona?->correo_electronico;

        if (!$email) {
            return back()->withErrors(['general' => 'Tu usuario no tiene correo electrónico configurado.']);
        }

        try {
            $contexto = $this->construirContexto($this->validarParams($request));

            $spreadsheet = $contexto['builder']->build();
            $writer = new Xlsx($spreadsheet);
            ob_start();
            $writer->save('php://output');
            $bytes = (string) ob_get_clean();

            Mail::to($email)->send(new ReportePeriodicoMail(
                titulo: $contexto['titulo'],
                alcance: $contexto['alcance'],
                periodoEtiqueta: $contexto['periodoEtiqueta'],
                excelContents: $bytes,
                nombreArchivo: $contexto['nombreArchivo'],
            ));

            return back()->with('success', "Reporte enviado a {$email}.");
        } catch (\Throwable $e) {
            Log::error('Error enviando reporte por correo (Admin)', [
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
            ]);
            return back()->withErrors(['general' => 'No se pudo enviar el reporte. Revisa los logs.']);
        }
    }

    /**
     * @return array{tipo:string,mes:?string,anio:?int,corte_id:?int,sucursal_id:?int}
     */
    private function validarParams(Request $request): array
    {
        return $request->validate([
            'tipo'        => ['required', 'in:mensual,anual,corte'],
            'mes'         => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
            'anio'        => ['nullable', 'integer', 'min:2020', 'max:2099'],
            'corte_id'    => ['nullable', 'integer'],
            'sucursal_id' => ['nullable', 'integer'],
        ]);
    }

    /**
     * @return array{builder:ReporteExcelBuilder,nombreArchivo:string,titulo:string,alcance:string,periodoEtiqueta:string}
     */
    private function construirContexto(array $data): array
    {
        $tipo = $data['tipo'];
        $sucursalId = $data['sucursal_id'] ?? null;

        $sucursal = $sucursalId ? Sucursal::find($sucursalId) : null;
        $alcance = $sucursal
            ? 'Sucursal ' . $sucursal->nombre
            : 'Global (todas las sucursales)';

        [$desde, $hasta, $corte, $periodoEtiqueta, $titulo] = $this->resolverPeriodo($tipo, $data, $alcance);

        $builder = (new ReporteExcelBuilder())
            ->titulo($titulo)
            ->alcance($alcance)
            ->periodo($periodoEtiqueta, $desde, $hasta)
            ->morosas($this->service->distribuidorasMorosas($sucursalId, $hasta))
            ->cortes($this->service->saldoCortes($sucursalId, $desde, $hasta))
            ->puntos($this->service->saldoPuntosPorDistribuidora($sucursalId, $corte?->id))
            ->presolicitudes($this->service->presolicitudes($sucursalId, $desde, $hasta));

        return [
            'builder' => $builder,
            'nombreArchivo' => $this->nombreArchivo($tipo, $desde, $corte),
            'titulo' => $titulo,
            'alcance' => $alcance,
            'periodoEtiqueta' => $periodoEtiqueta,
        ];
    }

    /**
     * Resuelve rango de fechas, corte (si aplica), etiqueta y título según tipo.
     *
     * @return array{0: \Carbon\CarbonInterface, 1: \Carbon\CarbonInterface, 2: ?Corte, 3: string, 4: string}
     */
    private function resolverPeriodo(string $tipo, array $data, string $alcance): array
    {
        if ($tipo === 'corte') {
            $corte = Corte::findOrFail($data['corte_id'] ?? 0);
            $fecha = $corte->fecha_ejecucion ?: $corte->fecha_programada ?: Carbon::now();
            $desde = Carbon::parse($fecha)->startOfDay();
            $hasta = Carbon::parse($fecha)->endOfDay();
            $etiqueta = 'Corte #' . $corte->id . ' (' . $corte->tipo_corte . ')';
            $titulo = "Reporte por corte — {$alcance}";
            return [$desde, $hasta, $corte, $etiqueta, $titulo];
        }

        if ($tipo === 'mensual') {
            $ancla = isset($data['mes']) ? Carbon::createFromFormat('Y-m', $data['mes']) : Carbon::now();
            $desde = $ancla->copy()->startOfMonth();
            $hasta = $ancla->copy()->endOfMonth();
            $etiqueta = $ancla->locale('es')->isoFormat('MMMM YYYY');
            $titulo = "Reporte mensual — {$alcance}";
            return [$desde, $hasta, null, $etiqueta, $titulo];
        }

        // anual
        $anio = (int) ($data['anio'] ?? Carbon::now()->year);
        $desde = Carbon::create($anio, 1, 1)->startOfDay();
        $hasta = Carbon::create($anio, 12, 31)->endOfDay();
        $etiqueta = 'Año ' . $anio;
        $titulo = "Reporte anual — {$alcance}";
        return [$desde, $hasta, null, $etiqueta, $titulo];
    }

    private function nombreArchivo(string $tipo, \Carbon\CarbonInterface $desde, ?Corte $corte): string
    {
        return match ($tipo) {
            'corte'   => 'reporte_corte_' . ($corte?->id ?? 'X') . '_' . $desde->format('Ymd') . '.xlsx',
            'mensual' => 'reporte_mensual_' . $desde->format('Y_m') . '.xlsx',
            'anual'   => 'reporte_anual_' . $desde->format('Y') . '.xlsx',
        };
    }

    private function streamExcel(ReporteExcelBuilder $builder, string $nombreArchivo): StreamedResponse
    {
        $spreadsheet = $builder->build();

        $response = new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $nombreArchivo . '"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}
