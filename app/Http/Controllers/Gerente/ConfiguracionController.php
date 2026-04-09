<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\ActualizarCategoriaConfiguracionRequest;
use App\Http\Requests\Gerente\ActualizarProductoConfiguracionRequest;
use App\Http\Requests\Gerente\ActualizarSucursalConfiguracionRequest;
use App\Http\Requests\Gerente\CrearCategoriaConfiguracionRequest;
use App\Models\BitacoraConfiguracionSucursal;
use App\Models\CategoriaDistribuidora;
use App\Models\Corte;
use App\Models\ProductoFinanciero;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use App\Services\CorteService;
use App\Services\ServicioReglasNegocio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function __construct(
        private readonly CorteService $corteService,
        private readonly ServicioReglasNegocio $reglasNegocio
    ) {}

    public function index(): Response
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        $configuracion = $sucursal ? $this->obtenerOCrearConfiguracion($sucursal, $gerente) : null;

        $categorias = CategoriaDistribuidora::query()
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'porcentaje_comision',
                'activo',
            ]);

        $productos = ProductoFinanciero::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'numero_quincenas',
                'porcentaje_comision_empresa',
                'porcentaje_interes_quincenal',
            ]);

        if ($configuracion) {
            $productosConfig = (array) ($configuracion->productos_config_json ?? []);

            $productos = $productos->map(function (ProductoFinanciero $producto) use ($productosConfig) {
                $override = $productosConfig[(string) $producto->id] ?? null;

                if (is_array($override)) {
                    if (array_key_exists('porcentaje_comision_empresa', $override)) {
                        $producto->porcentaje_comision_empresa = $override['porcentaje_comision_empresa'];
                    }

                    if (array_key_exists('porcentaje_interes_quincenal', $override)) {
                        $producto->porcentaje_interes_quincenal = $override['porcentaje_interes_quincenal'];
                    }

                    if (array_key_exists('numero_quincenas', $override)) {
                        $producto->numero_quincenas = $override['numero_quincenas'];
                    }
                }

                return $producto;
            })->values();
        }

        $historialCambios = collect();

        if ($configuracion) {
            $historialCambios = BitacoraConfiguracionSucursal::query()
                ->where('sucursal_id', $sucursal->id)
                ->with(['actualizadoPor.persona'])
                ->orderByDesc('id')
                ->limit(20)
                ->get()
                ->map(function (BitacoraConfiguracionSucursal $cambio) {
                    return [
                        'id' => $cambio->id,
                        'tipo_evento' => $cambio->tipo_evento,
                        'referencia_id' => $cambio->referencia_id,
                        'cambios_antes_json' => $cambio->cambios_antes_json,
                        'cambios_despues_json' => $cambio->cambios_despues_json,
                        'creado_en' => $cambio->creado_en,
                        'actualizado_por' => [
                            'id' => $cambio->actualizadoPor?->id,
                            'nombre_usuario' => $cambio->actualizadoPor?->nombre_usuario,
                            'nombre_completo' => $cambio->actualizadoPor?->persona
                                ? trim(implode(' ', array_filter([
                                    $cambio->actualizadoPor->persona->primer_nombre,
                                    $cambio->actualizadoPor->persona->segundo_nombre,
                                    $cambio->actualizadoPor->persona->apellido_paterno,
                                    $cambio->actualizadoPor->persona->apellido_materno,
                                ])))
                                : null,
                        ],
                    ];
                })
                ->values();
        }

        return Inertia::render('Gerente/Configuraciones', [
            'sucursal' => $sucursal,
            'configuracionSucursal' => $configuracion,
            'categorias' => $categorias,
            'productos' => $productos,
            'historialCambios' => $historialCambios,
        ]);
    }

    public function actualizarSucursal(ActualizarSucursalConfiguracionRequest $request): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validated();

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $antes = [
            'dia_corte' => $configuracion->dia_corte,
            'hora_corte' => $configuracion->hora_corte,
            'frecuencia_pago_dias' => $configuracion->frecuencia_pago_dias,
            'plazo_pago_dias' => $configuracion->plazo_pago_dias,
            'linea_credito_default' => (float) $configuracion->linea_credito_default,
            'seguro_tabuladores_json' => $configuracion->seguro_tabuladores_json,
            'porcentaje_comision_apertura' => (float) $configuracion->porcentaje_comision_apertura,
            'porcentaje_interes_quincenal' => (float) $configuracion->porcentaje_interes_quincenal,
            'multa_incumplimiento_monto' => (float) $configuracion->multa_incumplimiento_monto,
            'factor_divisor_puntos' => (int) $configuracion->factor_divisor_puntos,
            'multiplicador_puntos' => (int) $configuracion->multiplicador_puntos,
            'valor_punto_mxn' => (float) $configuracion->valor_punto_mxn,
        ];

        $seguroTabuladores = $this->parseSeguroTabuladores($data['seguro_tabuladores_json'] ?? null);

        $despues = [
            'dia_corte' => $data['dia_corte'] ?? null,
            'hora_corte' => $data['hora_corte'] ?? null,
            'frecuencia_pago_dias' => (int) $data['frecuencia_pago_dias'],
            'plazo_pago_dias' => (int) $data['plazo_pago_dias'],
            'linea_credito_default' => (float) $data['linea_credito_default'],
            'seguro_tabuladores_json' => $seguroTabuladores,
            'porcentaje_comision_apertura' => (float) $data['porcentaje_comision_apertura'],
            'porcentaje_interes_quincenal' => (float) $data['porcentaje_interes_quincenal'],
            'multa_incumplimiento_monto' => (float) $data['multa_incumplimiento_monto'],
            'factor_divisor_puntos' => (int) $data['factor_divisor_puntos'],
            'multiplicador_puntos' => (int) $data['multiplicador_puntos'],
            'valor_punto_mxn' => (float) $data['valor_punto_mxn'],
        ];

        $configuracion->update([
            'dia_corte' => $despues['dia_corte'],
            'hora_corte' => $despues['hora_corte'],
            'frecuencia_pago_dias' => $despues['frecuencia_pago_dias'],
            'plazo_pago_dias' => $despues['plazo_pago_dias'],
            'linea_credito_default' => $despues['linea_credito_default'],
            'seguro_tabuladores_json' => $despues['seguro_tabuladores_json'],
            'porcentaje_comision_apertura' => $despues['porcentaje_comision_apertura'],
            'porcentaje_interes_quincenal' => $despues['porcentaje_interes_quincenal'],
            'multa_incumplimiento_monto' => $despues['multa_incumplimiento_monto'],
            'factor_divisor_puntos' => $despues['factor_divisor_puntos'],
            'multiplicador_puntos' => $despues['multiplicador_puntos'],
            'valor_punto_mxn' => $despues['valor_punto_mxn'],
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->corteService->sincronizarProximoCorteProgramado($sucursal, $configuracion->refresh());

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'SUCURSAL',
            null,
            $antes,
            $despues
        );

        return back()->with('success', 'Configuración de sucursal actualizada.');
    }

    public function actualizarCategoria(ActualizarCategoriaConfiguracionRequest $request, CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validated();

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $antes = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
        ];
        $despues = [
            'nombre' => trim((string) $data['nombre']),
            'porcentaje_comision' => (float) $data['porcentaje_comision'],
        ];

        $categoria->update([
            'nombre' => $despues['nombre'],
            'porcentaje_comision' => $despues['porcentaje_comision'],
            'actualizado_en' => now(),
        ]);

        $configuracion->update([
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'CATEGORIA',
            $categoria->id,
            $antes,
            $despues
        );

        return back()->with('success', 'Porcentaje de categoría actualizado para tu sucursal.');
    }

    public function crearCategoria(CrearCategoriaConfiguracionRequest $request): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validated();

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $nombre = trim((string) $data['nombre']);
        $codigoBase = strtoupper(preg_replace('/[^A-Z0-9]+/', '', substr(iconv('UTF-8', 'ASCII//TRANSLIT', $nombre) ?: $nombre, 0, 12)));
        $codigoBase = $codigoBase !== '' ? $codigoBase : 'CAT';
        $codigo = $codigoBase;
        $intento = 1;

        while (CategoriaDistribuidora::query()->where('codigo', $codigo)->exists()) {
            $intento++;
            $codigo = substr($codigoBase, 0, 10) . str_pad((string) $intento, 2, '0', STR_PAD_LEFT);
        }

        $categoria = CategoriaDistribuidora::query()->create([
            'codigo' => $codigo,
            'nombre' => $nombre,
            'porcentaje_comision' => (float) $data['porcentaje_comision'],
            'puntos_por_cada_1200' => 3,
            'valor_punto' => 2,
            'castigo_pct_atraso' => 20,
            'activo' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $configuracion->update([
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'CATEGORIA',
            $categoria->id,
            [],
            [
                'nombre' => $categoria->nombre,
                'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            ]
        );

        return back()->with('success', 'Categoría creada correctamente.');
    }

    public function eliminarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        if ($categoria->distribuidoras()->exists()) {
            return back()->withErrors([
                'general' => 'No se puede eliminar esta categoría porque ya está asignada a distribuidoras.',
            ]);
        }

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $antes = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'activo' => (bool) $categoria->activo,
        ];

        $categoria->delete();

        $despues = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'eliminado' => true,
        ];

        $configuracion->update([
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'CATEGORIA',
            $categoria->id,
            $antes,
            $despues
        );

        return back()->with('success', 'Categoría eliminada correctamente.');
    }

    public function inactivarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $antes = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'activo' => (bool) $categoria->activo,
        ];

        $categoria->update([
            'activo' => false,
            'actualizado_en' => now(),
        ]);

        $despues = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'activo' => false,
        ];

        $configuracion->update([
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'CATEGORIA',
            $categoria->id,
            $antes,
            $despues
        );

        return back()->with('success', 'Categoría inactivada correctamente.');
    }

    public function activarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);

        $antes = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'activo' => (bool) $categoria->activo,
        ];

        $categoria->update([
            'activo' => true,
            'actualizado_en' => now(),
        ]);

        $despues = [
            'nombre' => $categoria->nombre,
            'porcentaje_comision' => (float) $categoria->porcentaje_comision,
            'activo' => true,
        ];

        $configuracion->update([
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'CATEGORIA',
            $categoria->id,
            $antes,
            $despues
        );

        return back()->with('success', 'Categoría activada correctamente.');
    }

    public function actualizarProducto(ActualizarProductoConfiguracionRequest $request, ProductoFinanciero $producto): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validated();

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);
        $productosConfig = (array) ($configuracion->productos_config_json ?? []);

        $antes = (array) ($productosConfig[(string) $producto->id] ?? []);
        $despues = [
            'porcentaje_comision_empresa' => (float) $data['porcentaje_comision_empresa'],
            'porcentaje_interes_quincenal' => (float) $data['porcentaje_interes_quincenal'],
            'numero_quincenas' => (int) $data['numero_quincenas'],
        ];

        $productosConfig[(string) $producto->id] = [
            'porcentaje_comision_empresa' => $despues['porcentaje_comision_empresa'],
            'porcentaje_interes_quincenal' => $despues['porcentaje_interes_quincenal'],
            'numero_quincenas' => $despues['numero_quincenas'],
        ];

        $configuracion->update([
            'productos_config_json' => $productosConfig,
            'actualizado_por_usuario_id' => $gerente->id,
            'actualizado_en' => now(),
        ]);

        $this->registrarCambio(
            $configuracion,
            $sucursal,
            $gerente,
            'PRODUCTO',
            $producto->id,
            $antes,
            $despues
        );

        return back()->with('success', 'Parámetros del producto actualizados para tu sucursal.');
    }

    private function registrarCambio(
        SucursalConfiguracion $configuracion,
        Sucursal $sucursal,
        Usuario $usuario,
        string $tipoEvento,
        ?int $referenciaId,
        array $antes,
        array $despues
    ): void {
        if ($antes === $despues) {
            return;
        }

        BitacoraConfiguracionSucursal::query()->create([
            'sucursal_configuracion_id' => $configuracion->id,
            'sucursal_id' => $sucursal->id,
            'actualizado_por_usuario_id' => $usuario->id,
            'tipo_evento' => $tipoEvento,
            'referencia_id' => $referenciaId,
            'cambios_antes_json' => $antes,
            'cambios_despues_json' => $despues,
        ]);
    }

    private function parseSeguroTabuladores(mixed $input): array
    {
        if (is_string($input)) {
            $decoded = json_decode($input, true);

            return is_array($decoded) ? $this->reglasNegocio->normalizarTabuladoresSeguro($decoded) : [];
        }

        return is_array($input) ? $this->reglasNegocio->normalizarTabuladoresSeguro($input) : [];
    }

    private function obtenerOCrearConfiguracion(Sucursal $sucursal, Usuario $usuario): SucursalConfiguracion
    {
        $corteBase = Corte::query()
            ->where('sucursal_id', $sucursal->id)
            ->orderByDesc('fecha_programada')
            ->orderByDesc('id')
            ->first();

        return SucursalConfiguracion::query()->firstOrCreate(
            ['sucursal_id' => $sucursal->id],
            [
                'dia_corte' => $corteBase?->dia_base_mes,
                'hora_corte' => $corteBase?->hora_base,
                'frecuencia_pago_dias' => 14,
                'plazo_pago_dias' => 15,
                'linea_credito_default' => 0,
                'seguro_tabuladores_json' => $this->reglasNegocio->obtenerTabuladoresSeguroPorDefecto(),
                'porcentaje_comision_apertura' => 10,
                'porcentaje_interes_quincenal' => 5,
                'multa_incumplimiento_monto' => 300,
                'factor_divisor_puntos' => 1200,
                'multiplicador_puntos' => 3,
                'valor_punto_mxn' => 2,
                'categorias_config_json' => [],
                'productos_config_json' => [],
                'actualizado_por_usuario_id' => $usuario->id,
                'creado_en' => now(),
                'actualizado_en' => now(),
            ]
        );
    }
}
