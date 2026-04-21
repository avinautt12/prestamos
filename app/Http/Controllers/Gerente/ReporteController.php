<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Mail\ReportePeriodicoMail;
use App\Models\Corte;
use App\Models\Usuario;
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
 * Descarga de reportes ejecutivos para rol GERENTE.
 * La sucursal se resuelve automáticamente a partir del usuario logueado.
 */
class ReporteController extends Controller
{
    use ResuelveSucursalActivaGerente;

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
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $email = $gerente?->persona?->correo_electronico;

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
            Log::error('Error enviando reporte por correo (Gerente)', [
                'user_id' => $gerente?->id,
                'error' => $e->getMessage(),
            ]);
            return back()->withErrors(['general' => 'No se pudo enviar el reporte. Revisa los logs.']);
        }
    }

    /**
     * @return array{tipo:string,mes:?string,anio:?int,corte_id:?int}
     */
    private function validarParams(Request $request): array
    {
        return $request->validate([
            'tipo'     => ['required', 'in:mensual,anual,corte'],
            'mes'      => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
            'anio'     => ['nullable', 'integer', 'min:2020', 'max:2099'],
            'corte_id' => ['nullable', 'integer'],
        ]);
    }

    /**
     * @return array{builder:ReporteExcelBuilder,nombreArchivo:string,titulo:string,alcance:string,periodoEtiqueta:string}
     */
    private function construirContexto(array $data): array
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            abort(403, 'No tienes una sucursal asignada.');
        }

        $alcance = 'Sucursal ' . $sucursal->nombre;
        $tipo = $data['tipo'];

        [$desde, $hasta, $corte, $periodoEtiqueta, $titulo] = $this->resolverPeriodo($tipo, $data, $alcance, $sucursal->id);

        $builder = (new ReporteExcelBuilder())
            ->titulo($titulo)
            ->alcance($alcance)
            ->periodo($periodoEtiqueta, $desde, $hasta)
            ->morosas($this->service->distribuidorasMorosas($sucursal->id, $hasta))
            ->cortes($this->service->saldoCortes($sucursal->id, $desde, $hasta))
            ->puntos($this->service->saldoPuntosPorDistribuidora($sucursal->id, $corte?->id))
            ->presolicitudes($this->service->presolicitudes($sucursal->id, $desde, $hasta));

        return [
            'builder' => $builder,
            'nombreArchivo' => $this->nombreArchivo($tipo, $desde, $corte),
            'titulo' => $titulo,
            'alcance' => $alcance,
            'periodoEtiqueta' => $periodoEtiqueta,
        ];
    }

    /**
     * @return array{0: \Carbon\CarbonInterface, 1: \Carbon\CarbonInterface, 2: ?Corte, 3: string, 4: string}
     */
    private function resolverPeriodo(string $tipo, array $data, string $alcance, int $sucursalId): array
    {
        if ($tipo === 'corte') {
            $corte = Corte::where('id', $data['corte_id'] ?? 0)
                ->where('sucursal_id', $sucursalId)
                ->firstOrFail();
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
