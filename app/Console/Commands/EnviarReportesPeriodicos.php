<?php

namespace App\Console\Commands;

use App\Mail\ReportePeriodicoMail;
use App\Models\Corte;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Services\Reportes\ReporteExcelBuilder;
use App\Services\Reportes\ReporteService;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class EnviarReportesPeriodicos extends Command
{
    protected $signature = 'reportes:periodicos
        {--tipo=mensual : Tipo de reporte (mensual|anual|corte)}
        {--mes= : YYYY-MM (solo tipo=mensual, default: mes pasado)}
        {--anio= : YYYY (solo tipo=anual, default: año pasado)}
        {--corte-id= : ID del corte (solo tipo=corte)}';

    protected $description = 'Envía por correo el reporte ejecutivo (4 hojas) a ADMINs (global) y a cada GERENTE con su sucursal.';

    public function __construct(private readonly ReporteService $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $tipo = (string) $this->option('tipo');
        if (!in_array($tipo, ['mensual', 'anual', 'corte'], true)) {
            $this->error("Tipo inválido: {$tipo}");
            return self::FAILURE;
        }

        $this->info("Generando reportes {$tipo}...");

        $enviadosAdmin = $this->enviarAAdmins($tipo);
        $enviadosGerente = $this->enviarAGerentes($tipo);

        $this->info("Completado. Enviados a {$enviadosAdmin} admins y {$enviadosGerente} gerentes.");
        return self::SUCCESS;
    }

    private function enviarAAdmins(string $tipo): int
    {
        $admins = Usuario::query()
            ->where('activo', true)
            ->whereHas('roles', fn ($q) => $q->where('codigo', 'ADMIN'))
            ->with('persona:id,correo_electronico,primer_nombre,apellido_paterno')
            ->get();

        $enviados = 0;
        foreach ($admins as $admin) {
            $email = $admin->persona?->correo_electronico;
            if (!$email) {
                $this->warn("Admin {$admin->nombre_usuario} sin correo. Skip.");
                continue;
            }

            [$desde, $hasta, $corte, $periodoEtiqueta, $titulo] = $this->resolverPeriodo($tipo, null);

            $bytes = $this->generarExcel(
                sucursalId: null,
                titulo: $titulo . ' — Global',
                alcance: 'Global (todas las sucursales)',
                periodoEtiqueta: $periodoEtiqueta,
                desde: $desde,
                hasta: $hasta,
                corte: $corte,
            );

            $nombreArchivo = $this->nombreArchivo($tipo, $desde, $corte, 'global');

            Mail::to($email)->send(new ReportePeriodicoMail(
                titulo: $titulo,
                alcance: 'Global (todas las sucursales)',
                periodoEtiqueta: $periodoEtiqueta,
                excelContents: $bytes,
                nombreArchivo: $nombreArchivo,
            ));

            $enviados++;
        }

        return $enviados;
    }

    private function enviarAGerentes(string $tipo): int
    {
        $rolGerente = Rol::where('codigo', 'GERENTE')->first();
        if (!$rolGerente) {
            return 0;
        }

        $enviados = 0;

        // Por cada sucursal activa, localizar al gerente principal y enviarle su reporte.
        $sucursales = Sucursal::where('activo', true)->orderBy('id')->get();

        foreach ($sucursales as $sucursal) {
            $gerente = Usuario::query()
                ->where('activo', true)
                ->whereHas('roles', fn ($q) => $q->where('codigo', 'GERENTE'))
                ->whereHas('sucursales', fn ($q) => $q
                    ->where('sucursales.id', $sucursal->id)
                    ->whereNull('usuario_rol.revocado_en'))
                ->with('persona:id,correo_electronico,primer_nombre,apellido_paterno')
                ->first();

            if (!$gerente) {
                $this->warn("Sucursal {$sucursal->codigo} sin gerente activo. Skip.");
                continue;
            }

            $email = $gerente->persona?->correo_electronico;
            if (!$email) {
                $this->warn("Gerente {$gerente->nombre_usuario} sin correo. Skip.");
                continue;
            }

            [$desde, $hasta, $corte, $periodoEtiqueta, $titulo] = $this->resolverPeriodo($tipo, $sucursal->id);

            // En caso de corte, solo enviar si el corte pertenece a la sucursal del gerente
            if ($tipo === 'corte' && $corte && (int) $corte->sucursal_id !== (int) $sucursal->id) {
                continue;
            }

            $alcance = 'Sucursal ' . $sucursal->nombre;

            $bytes = $this->generarExcel(
                sucursalId: $sucursal->id,
                titulo: $titulo . ' — ' . $alcance,
                alcance: $alcance,
                periodoEtiqueta: $periodoEtiqueta,
                desde: $desde,
                hasta: $hasta,
                corte: $corte,
            );

            $nombreArchivo = $this->nombreArchivo($tipo, $desde, $corte, 'suc' . $sucursal->id);

            Mail::to($email)->send(new ReportePeriodicoMail(
                titulo: $titulo,
                alcance: $alcance,
                periodoEtiqueta: $periodoEtiqueta,
                excelContents: $bytes,
                nombreArchivo: $nombreArchivo,
            ));

            $enviados++;
        }

        return $enviados;
    }

    /**
     * @return array{0: CarbonInterface, 1: CarbonInterface, 2: ?Corte, 3: string, 4: string}
     */
    private function resolverPeriodo(string $tipo, ?int $sucursalIdFiltro): array
    {
        if ($tipo === 'corte') {
            $corteId = (int) $this->option('corte-id');
            $corte = $corteId > 0 ? Corte::find($corteId) : null;
            if (!$corte) {
                // Si no se especifica corte, toma el último EJECUTADO (global o de la sucursal)
                $q = Corte::query()
                    ->whereIn('estado', [Corte::ESTADO_EJECUTADO, Corte::ESTADO_CERRADO])
                    ->orderByDesc('fecha_ejecucion');
                if ($sucursalIdFiltro) {
                    $q->where('sucursal_id', $sucursalIdFiltro);
                }
                $corte = $q->first();
            }
            if (!$corte) {
                // fallback rango del día de hoy
                $desde = Carbon::now()->startOfDay();
                $hasta = Carbon::now()->endOfDay();
                return [$desde, $hasta, null, 'Sin corte disponible', 'Reporte por corte'];
            }
            $fecha = $corte->fecha_ejecucion ?: $corte->fecha_programada ?: Carbon::now();
            $desde = Carbon::parse($fecha)->startOfDay();
            $hasta = Carbon::parse($fecha)->endOfDay();
            $etiqueta = 'Corte #' . $corte->id . ' (' . $corte->tipo_corte . ')';
            return [$desde, $hasta, $corte, $etiqueta, 'Reporte por corte'];
        }

        if ($tipo === 'mensual') {
            $mes = $this->option('mes');
            $ancla = $mes
                ? Carbon::createFromFormat('Y-m', $mes)
                : Carbon::now()->subMonthNoOverflow();
            $desde = $ancla->copy()->startOfMonth();
            $hasta = $ancla->copy()->endOfMonth();
            $etiqueta = $ancla->locale('es')->isoFormat('MMMM YYYY');
            return [$desde, $hasta, null, $etiqueta, 'Reporte mensual'];
        }

        // anual
        $anio = (int) ($this->option('anio') ?: Carbon::now()->subYear()->year);
        $desde = Carbon::create($anio, 1, 1)->startOfDay();
        $hasta = Carbon::create($anio, 12, 31)->endOfDay();
        return [$desde, $hasta, null, 'Año ' . $anio, 'Reporte anual'];
    }

    private function generarExcel(
        ?int $sucursalId,
        string $titulo,
        string $alcance,
        string $periodoEtiqueta,
        CarbonInterface $desde,
        CarbonInterface $hasta,
        ?Corte $corte,
    ): string {
        $builder = (new ReporteExcelBuilder())
            ->titulo($titulo)
            ->alcance($alcance)
            ->periodo($periodoEtiqueta, $desde, $hasta)
            ->morosas($this->service->distribuidorasMorosas($sucursalId, $hasta))
            ->cortes($this->service->saldoCortes($sucursalId, $desde, $hasta))
            ->puntos($this->service->saldoPuntosPorDistribuidora($sucursalId, $corte?->id))
            ->presolicitudes($this->service->presolicitudes($sucursalId, $desde, $hasta));

        $spreadsheet = $builder->build();
        $writer = new Xlsx($spreadsheet);

        ob_start();
        $writer->save('php://output');
        return (string) ob_get_clean();
    }

    private function nombreArchivo(string $tipo, CarbonInterface $desde, ?Corte $corte, string $scope): string
    {
        return match ($tipo) {
            'corte'   => "reporte_corte_{$scope}_" . ($corte?->id ?? 'X') . '_' . $desde->format('Ymd') . '.xlsx',
            'mensual' => "reporte_mensual_{$scope}_" . $desde->format('Y_m') . '.xlsx',
            'anual'   => "reporte_anual_{$scope}_" . $desde->format('Y') . '.xlsx',
        };
    }
}
