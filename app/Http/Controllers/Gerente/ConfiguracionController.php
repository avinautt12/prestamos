<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Controller;
use App\Models\BitacoraConfiguracionSucursal;
use App\Models\CategoriaDistribuidora;
use App\Models\Corte;
use App\Models\ProductoFinanciero;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use App\Services\CorteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    public function __construct(private readonly CorteService $corteService) {}

    public function index(): Response
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        $configuracion = $sucursal ? $this->obtenerOCrearConfiguracion($sucursal, $gerente) : null;

        $categorias = CategoriaDistribuidora::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'porcentaje_comision',
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

        $categoriasConfig = (array) ($configuracion?->categorias_config_json ?? []);
        $productosConfig = (array) ($configuracion?->productos_config_json ?? []);

        $categorias = $categorias->map(function (CategoriaDistribuidora $categoria) use ($categoriasConfig) {
            $override = $categoriasConfig[(string) $categoria->id] ?? null;
            if (is_array($override) && array_key_exists('porcentaje_comision', $override)) {
                $categoria->porcentaje_comision = $override['porcentaje_comision'];
            }

            return $categoria;
        });

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
        });

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

    public function actualizarSucursal(Request $request): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validate([
            'dia_corte' => ['nullable', 'integer', 'between:1,31'],
            'hora_corte' => ['nullable', 'date_format:H:i'],
            'frecuencia_pago_dias' => ['required', 'integer', 'between:1,90'],
            'plazo_pago_dias' => ['required', 'integer', 'between:1,180'],
            'linea_credito_default' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'seguro_tabuladores_json' => ['nullable'],
            'porcentaje_comision_apertura' => ['required', 'numeric', 'min:0', 'max:100'],
            'porcentaje_interes_quincenal' => ['required', 'numeric', 'min:0', 'max:100'],
            'multa_incumplimiento_monto' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'factor_divisor_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'multiplicador_puntos' => ['required', 'integer', 'min:1', 'max:999999'],
            'valor_punto_mxn' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ]);

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

    public function actualizarCategoria(Request $request, CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validate([
            'porcentaje_comision' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $gerente);
        $categoriasConfig = (array) ($configuracion->categorias_config_json ?? []);

        $antes = (array) ($categoriasConfig[(string) $categoria->id] ?? []);
        $despues = [
            'porcentaje_comision' => (float) $data['porcentaje_comision'],
        ];

        $categoriasConfig[(string) $categoria->id] = [
            'porcentaje_comision' => $despues['porcentaje_comision'],
        ];

        $configuracion->update([
            'categorias_config_json' => $categoriasConfig,
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

    public function actualizarProducto(Request $request, ProductoFinanciero $producto): RedirectResponse
    {
        /** @var Usuario $gerente */
        $gerente = Auth::user();
        $sucursal = $this->obtenerSucursalActivaGerente($gerente);

        if (!$sucursal) {
            return back()->withErrors([
                'general' => 'No tienes una sucursal activa asignada.',
            ]);
        }

        $data = $request->validate([
            'porcentaje_comision_empresa' => ['required', 'numeric', 'min:0', 'max:100'],
            'porcentaje_interes_quincenal' => ['required', 'numeric', 'min:0', 'max:100'],
            'numero_quincenas' => ['required', 'integer', 'between:1,72'],
        ]);

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

            return is_array($decoded) ? $decoded : [];
        }

        return is_array($input) ? $input : [];
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
                'seguro_tabuladores_json' => [
                    ['desde' => 0, 'hasta' => 5000, 'monto' => 50],
                    ['desde' => 5001, 'hasta' => 15000, 'monto' => 100],
                    ['desde' => 15001, 'hasta' => null, 'monto' => 150],
                ],
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

    private function obtenerSucursalActivaGerente(Usuario $usuario): ?Sucursal
    {
        return $usuario->sucursales()
            ->wherePivotNull('revocado_en')
            ->orderByDesc('usuario_rol.es_principal')
            ->orderByDesc('usuario_rol.asignado_en')
            ->first();
    }
}
