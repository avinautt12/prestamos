<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Models\Corte;
use App\Models\Sucursal;
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
            'securityPolicy' => [
                'requires_vpn' => (bool) config('security.gerente.require_vpn', false),
            ],
        ]);
    }

    public function cerrarManual(Request $request, Corte $corte): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$usuario->tieneRol('ADMIN')) {
            $sucursal = $this->obtenerSucursalActivaGerente($usuario);
            if (!$sucursal || $corte->sucursal_id !== $sucursal->id) {
                abort(403, 'No puedes cerrar cortes de otra sucursal.');
            }
        }

        if ($corte->estado !== Corte::ESTADO_PROGRAMADO) {
            return back()->withErrors([
                'general' => 'Solo se pueden cerrar manualmente los cortes programados.',
            ]);
        }

        $corteCerrado = $this->corteService->cerrarManual($corte, $usuario, $request->string('observaciones')->toString());

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

    public function cerrarManualGlobal(Request $request): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$usuario->tieneRol('ADMIN')) {
            abort(403, 'Solo el administrador puede cerrar cortes globales.');
        }

        $sucursales = Sucursal::query()->where('activo', true)->get();

        $totalCortesCerrados = 0;
        $totalRelacionesGeneradas = 0;
        $sucursalesSinCorte = 0;

        foreach ($sucursales as $sucursal) {
            $proximo = $this->corteService->obtenerProximoCorte($sucursal);

            if (!$proximo || $proximo->estado !== Corte::ESTADO_PROGRAMADO) {
                $sucursalesSinCorte++;
                continue;
            }

            // Refetch limpio para descartar atributos transitorios (ej. es_atrasado) que no son columnas reales.
            $corte = Corte::find($proximo->id);
            if (!$corte) {
                continue;
            }

            $corteCerrado = $this->corteService->cerrarManual($corte, $usuario);
            $totalRelacionesGeneradas += $this->corteService->generarRelacionesParaCorte($corteCerrado);
            $totalCortesCerrados++;

            try {
                Artisan::call('reportes:periodicos', [
                    '--tipo' => 'corte',
                    '--corte-id' => $corteCerrado->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('No se pudo enviar el reporte por correo tras cerrar corte global', [
                    'corte_id' => $corteCerrado->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($totalCortesCerrados === 0) {
            return back()->with('success', 'No había cortes programados pendientes en ninguna sucursal.');
        }

        return back()->with('success', "Cierre global ejecutado. {$totalCortesCerrados} cortes cerrados y {$totalRelacionesGeneradas} relaciones generadas.");
    }
}
