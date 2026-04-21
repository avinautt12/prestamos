<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Models\Corte;
use App\Models\Usuario;
use App\Services\CorteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CorteController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function __construct(private readonly CorteService $corteService) {}

    public function index(Request $request): Response
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        $proximoCorte = $sucursal ? $this->corteService->obtenerProximoCorte($sucursal) : null;
        $cortesMes = $sucursal ? $this->corteService->obtenerCortesMes($sucursal) : collect();

        return Inertia::render('Gerente/Cortes', [
            'sucursal' => $sucursal,
            'proximoCorte' => $proximoCorte,
            'cortesMes' => $cortesMes->map(function (Corte $corte) {
                return [
                    'id' => $corte->id,
                    'tipo_corte' => $corte->tipo_corte,
                    'estado' => $corte->estado,
                    'dia_base_mes' => $corte->dia_base_mes,
                    'hora_base' => $corte->hora_base,
                    'fecha_programada' => $corte->fecha_programada,
                    'fecha_ejecucion' => $corte->fecha_ejecucion,
                    'observaciones' => $corte->observaciones,
                ];
            })->values(),
        ]);
    }

    public function cerrarManual(Request $request, Corte $corte): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal || $corte->sucursal_id !== $sucursal->id) {
            abort(403, 'No puedes cerrar cortes de otra sucursal.');
        }

        if ($corte->estado !== Corte::ESTADO_PROGRAMADO) {
            return back()->withErrors([
                'general' => 'Solo se pueden cerrar manualmente los cortes programados.',
            ]);
        }

        $corteCerrado = $this->corteService->cerrarManual($corte, $gerente, $request->string('observaciones')->toString());

        // Generar automáticamente las RelacionCorte para todas las distribuidoras activas de la sucursal
        $relacionesGeneradas = $this->corteService->generarRelacionesParaCorte($corteCerrado);

        $mensaje = $relacionesGeneradas > 0
            ? "Corte cerrado. Se generaron {$relacionesGeneradas} relaciones de pago."
            : 'Corte cerrado. No había distribuidoras con vales activos para generar relaciones.';

        // Disparar envío de reporte por correo a ADMINs y al gerente de la sucursal.
        // Aislado en try/catch: si falla el correo, el corte sigue cerrado.
        try {
            Artisan::call('reportes:periodicos', [
                '--tipo' => 'corte',
                '--corte-id' => $corteCerrado->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo enviar el reporte por correo tras cerrar corte', [
                'corte_id' => $corteCerrado->id,
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', $mensaje);
    }
}
