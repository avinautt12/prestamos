<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\ActualizarCategoriaConfiguracionRequest;
use App\Http\Requests\Gerente\ActualizarProductoConfiguracionRequest;
use App\Http\Requests\Gerente\ActualizarSucursalConfiguracionRequest;
use App\Http\Requests\Gerente\CrearCategoriaConfiguracionRequest;
use App\Http\Requests\Gerente\CrearProductoConfiguracionRequest;
use App\Models\BitacoraConfiguracionSucursal;
use App\Models\CategoriaDistribuidora;
use App\Models\Corte;
use App\Models\Distribuidora;
use App\Models\ProductoFinanciero;
use App\Models\Sucursal;
use App\Models\SucursalConfiguracion;
use App\Models\Usuario;
use App\Services\CorteService;
use App\Services\Distribuidora\DistribuidoraNotificationService;
use App\Services\ProductoFinancieroService;
use App\Services\ServicioReglasNegocio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function __construct(
        private readonly CorteService $corteService,
        private readonly ServicioReglasNegocio $reglasNegocio,
        private readonly ProductoFinancieroService $productoService,
        private readonly DistribuidoraNotificationService $distribuidoraNotificationService
    ) {}

    public function index(): Response
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();
        $esAdmin = $this->esAdmin($usuario);
        $sucursalSolicitada = request()->integer('sucursal_id');
        $sucursal = $this->resolverSucursalConfiguracion($usuario, $sucursalSolicitada);

        $configuracion = $sucursal ? $this->obtenerOCrearConfiguracion($sucursal, $usuario) : null;
        $categoriasOverrides = (array) ($configuracion?->categorias_config_json ?? []);
        $productosOverrides = (array) ($configuracion?->productos_config_json ?? []);

        $categorias = CategoriaDistribuidora::query()
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'porcentaje_comision',
                'activo',
            ])
            ->map(function (CategoriaDistribuidora $categoria) use ($categoriasOverrides) {
                $override = $categoriasOverrides[(string) $categoria->id] ?? null;

                if (is_array($override)) {
                    if (array_key_exists('nombre', $override)) {
                        $categoria->nombre = (string) $override['nombre'];
                    }

                    if (array_key_exists('porcentaje_comision', $override)) {
                        $categoria->porcentaje_comision = (float) $override['porcentaje_comision'];
                    }

                    if (array_key_exists('activo', $override)) {
                        $categoria->activo = (bool) $override['activo'];
                    }
                }

                return $categoria;
            })
            ->values();

        $productos = ProductoFinanciero::query()
            ->withTrashed()
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'monto_principal',
                'monto_seguro',
                'numero_quincenas',
                'porcentaje_comision_empresa',
                'porcentaje_interes_quincenal',
                'activo',
                'deleted_at',
            ])
            ->map(function (ProductoFinanciero $producto) use ($productosOverrides) {
                $override = $productosOverrides[(string) $producto->id] ?? null;

                if (is_array($override)) {
                    if (array_key_exists('monto_principal', $override)) {
                        $producto->setAttribute('monto_principal', $override['monto_principal']);
                    }

                    if (array_key_exists('monto_seguro', $override)) {
                        $producto->setAttribute('monto_seguro', $override['monto_seguro']);
                    }

                    if (array_key_exists('porcentaje_comision_empresa', $override)) {
                        $producto->porcentaje_comision_empresa = (float) $override['porcentaje_comision_empresa'];
                    }

                    if (array_key_exists('porcentaje_interes_quincenal', $override)) {
                        $producto->porcentaje_interes_quincenal = (float) $override['porcentaje_interes_quincenal'];
                    }

                    if (array_key_exists('numero_quincenas', $override)) {
                        $producto->numero_quincenas = (int) $override['numero_quincenas'];
                    }

                    if (array_key_exists('activo', $override)) {
                        $producto->activo = (bool) $override['activo'];
                    }
                }

                return $producto;
            })
            ->values();

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
            'sucursales' => $esAdmin
                ? Sucursal::query()->where('activo', true)->orderBy('nombre')->get(['id', 'nombre'])
                : [],
            'sucursalSeleccionadaId' => $sucursal?->id,
            'esAdmin' => $esAdmin,
            'puedeEditar' => $esAdmin,
            'soloLecturaProductos' => !$esAdmin,
            'routePrefix' => $esAdmin ? 'admin' : 'gerente',
            'configuracionSucursal' => $configuracion,
            'categorias' => $categorias,
            'productos' => $productos,
            'historialCambios' => $historialCambios,
        ]);
    }

    public function actualizarSucursal(ActualizarSucursalConfiguracionRequest $request): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede actualizar configuraciones.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $data = $request->validated();

        $despues = [
            'dia_corte' => $data['dia_corte'] ?? null,
            'hora_corte' => CorteService::HORA_CORTE_FIJA,
            'factor_divisor_puntos' => (int) $data['factor_divisor_puntos'],
            'multiplicador_puntos' => (int) $data['multiplicador_puntos'],
            'valor_punto_mxn' => (float) $data['valor_punto_mxn'],
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);

                $antes = [
                    'dia_corte' => $configuracion->dia_corte,
                    'hora_corte' => $configuracion->hora_corte,
                    'factor_divisor_puntos' => (int) $configuracion->factor_divisor_puntos,
                    'multiplicador_puntos' => (int) $configuracion->multiplicador_puntos,
                    'valor_punto_mxn' => (float) $configuracion->valor_punto_mxn,
                ];

                $configuracion->update([
                    'dia_corte' => $despues['dia_corte'],
                    'hora_corte' => $despues['hora_corte'],
                    'factor_divisor_puntos' => $despues['factor_divisor_puntos'],
                    'multiplicador_puntos' => $despues['multiplicador_puntos'],
                    'valor_punto_mxn' => $despues['valor_punto_mxn'],
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->corteService->sincronizarProximoCorteProgramado($sucursal, $configuracion->refresh());

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'SUCURSAL',
                    null,
                    $antes,
                    $despues
                );
            }
        });

        return back()->with('success', 'Configuración actualizada para todas las sucursales activas.');
    }

    public function actualizarCategoria(ActualizarCategoriaConfiguracionRequest $request, CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede actualizar categorías.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $data = $request->validated();

        $despues = [
            'nombre' => trim((string) $data['nombre']),
            'porcentaje_comision' => (float) $data['porcentaje_comision'],
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $categoria, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $categoriasConfig = (array) ($configuracion->categorias_config_json ?? []);
                $overrideActual = (array) ($categoriasConfig[(string) $categoria->id] ?? []);

                $antes = [
                    'nombre' => (string) ($overrideActual['nombre'] ?? $categoria->nombre),
                    'porcentaje_comision' => (float) ($overrideActual['porcentaje_comision'] ?? $categoria->porcentaje_comision),
                ];

                $categoriasConfig[(string) $categoria->id] = array_merge($overrideActual, $despues);

                $configuracion->update([
                    'categorias_config_json' => $categoriasConfig,
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'CATEGORIA',
                    $categoria->id,
                    $antes,
                    $despues
                );
            }
        });

        return back()->with('success', 'Categoría actualizada para todas las sucursales activas.');
    }

    public function crearCategoria(CrearCategoriaConfiguracionRequest $request): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede crear categorías.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $data = $request->validated();

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

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $categoria) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'CATEGORIA',
                    $categoria->id,
                    [],
                    [
                        'nombre' => $categoria->nombre,
                        'porcentaje_comision' => (float) $categoria->porcentaje_comision,
                    ]
                );
            }
        });

        return back()->with('success', 'Categoría creada para todas las sucursales activas.');
    }

    public function crearProducto(CrearProductoConfiguracionRequest $request): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede crear productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $data = $request->validated();

        $nombre = trim((string) $data['nombre']);
        $codigoBase = strtoupper(preg_replace('/[^A-Z0-9]+/', '', substr(iconv('UTF-8', 'ASCII//TRANSLIT', $nombre) ?: $nombre, 0, 12)));
        $codigoBase = $codigoBase !== '' ? $codigoBase : 'PROD';
        $codigo = $codigoBase;
        $intento = 1;

        while (ProductoFinanciero::withTrashed()->where('codigo', $codigo)->exists()) {
            $intento++;
            $codigo = substr($codigoBase, 0, 10) . str_pad((string) $intento, 2, '0', STR_PAD_LEFT);
        }

        $producto = ProductoFinanciero::query()->create([
            'codigo' => $codigo,
            'nombre' => $nombre,
            'monto_principal' => (float) $data['monto_principal'],
            'numero_quincenas' => (int) $data['numero_quincenas'],
            'porcentaje_comision_empresa' => (float) $data['porcentaje_comision_empresa'],
            'monto_seguro' => (float) $data['monto_seguro'],
            'porcentaje_interes_quincenal' => (float) $data['porcentaje_interes_quincenal'],
            'activo' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    [],
                    [
                        'nombre' => $producto->nombre,
                        'monto_principal' => (float) $producto->monto_principal,
                        'numero_quincenas' => (int) $producto->numero_quincenas,
                        'porcentaje_comision_empresa' => (float) $producto->porcentaje_comision_empresa,
                        'monto_seguro' => (float) $producto->monto_seguro,
                        'porcentaje_interes_quincenal' => (float) $producto->porcentaje_interes_quincenal,
                    ]
                );

                $this->notificarAjusteProducto('PRODUCTO_CREADO', 'Nuevo producto disponible para oferta', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Producto creado para todas las sucursales activas.');
    }

    public function eliminarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede eliminar categorías.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        if ($categoria->distribuidoras()->exists()) {
            return back()->withErrors([
                'general' => 'No se puede eliminar esta categoría porque ya está asignada a distribuidoras.',
            ]);
        }

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

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $categoria, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'CATEGORIA',
                    $categoria->id,
                    $antes,
                    $despues
                );
            }
        });

        return back()->with('success', 'Categoría eliminada para todas las sucursales activas.');
    }

    public function inactivarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede inactivar categorías.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

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

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $categoria, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'CATEGORIA',
                    $categoria->id,
                    $antes,
                    $despues
                );
            }
        });

        return back()->with('success', 'Categoría inactivada para todas las sucursales activas.');
    }

    public function activarCategoria(CategoriaDistribuidora $categoria): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede activar categorías.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

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

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $categoria, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'CATEGORIA',
                    $categoria->id,
                    $antes,
                    $despues
                );
            }
        });

        return back()->with('success', 'Categoría activada para todas las sucursales activas.');
    }

    public function actualizarProducto(ActualizarProductoConfiguracionRequest $request, ProductoFinanciero $producto): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede editar productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $data = $request->validated();

        // Verificar que el producto existe y no está eliminado
        if ($producto->trashed()) {
            return back()->withErrors([
                'general' => 'No puedes editar un producto eliminado. Restauralo primero.'
            ]);
        }

        $despues = [
            'monto_principal' => (float) $data['monto_principal'],
            'monto_seguro' => (float) $data['monto_seguro'],
            'porcentaje_comision_empresa' => (float) $data['porcentaje_comision_empresa'],
            'porcentaje_interes_quincenal' => (float) $data['porcentaje_interes_quincenal'],
            'numero_quincenas' => (int) $data['numero_quincenas'],
        ];

        $productoValidacion = clone $producto;
        $validacionNuevos = $this->productoService->validarConfiguracionCompleta(
            $productoValidacion->fill($despues)
        );

        if (!empty($validacionNuevos)) {
            return back()->withErrors($validacionNuevos);
        }

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $productosConfig = (array) ($configuracion->productos_config_json ?? []);
                $overrideActual = (array) ($productosConfig[(string) $producto->id] ?? []);

                $antes = [
                    'monto_principal' => (float) ($overrideActual['monto_principal'] ?? $producto->monto_principal),
                    'monto_seguro' => (float) ($overrideActual['monto_seguro'] ?? $producto->monto_seguro),
                    'porcentaje_comision_empresa' => (float) ($overrideActual['porcentaje_comision_empresa'] ?? $producto->porcentaje_comision_empresa),
                    'porcentaje_interes_quincenal' => (float) ($overrideActual['porcentaje_interes_quincenal'] ?? $producto->porcentaje_interes_quincenal),
                    'numero_quincenas' => (int) ($overrideActual['numero_quincenas'] ?? $producto->numero_quincenas),
                ];

                $productosConfig[(string) $producto->id] = array_merge($overrideActual, $despues);

                $configuracion->update([
                    'productos_config_json' => $productosConfig,
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    $antes,
                    $despues
                );

                $this->notificarAjusteProducto('PRODUCTO_ACTUALIZADO', 'Producto actualizado para oferta', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Parámetros del producto actualizados para todas las sucursales activas.');
    }

    public function activarProducto(Request $request, ProductoFinanciero $producto): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede activar productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $antes = [
            'activo' => (bool) $producto->activo,
            'deleted_at' => $producto->deleted_at,
        ];

        if ($producto->trashed()) {
            $producto->restore();
        }

        $producto->update([
            'activo' => true,
            'actualizado_en' => now(),
        ]);

        $despues = [
            'activo' => true,
            'deleted_at' => null,
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    $antes,
                    $despues
                );

                $this->notificarAjusteProducto('PRODUCTO_ACTIVADO', 'Producto reactivado para oferta', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Producto activado para todas las sucursales activas.');
    }

    public function inactivarProducto(Request $request, ProductoFinanciero $producto): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede inactivar productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $antes = [
            'activo' => (bool) $producto->activo,
            'deleted_at' => $producto->deleted_at,
        ];

        $producto->update([
            'activo' => false,
            'actualizado_en' => now(),
        ]);

        $despues = [
            'activo' => false,
            'deleted_at' => $producto->deleted_at,
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    $antes,
                    $despues
                );

                $this->notificarAjusteProducto('PRODUCTO_INACTIVADO', 'Producto inactivado en catálogo', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Producto inactivado para todas las sucursales activas.');
    }

    public function eliminarProducto(Request $request, int $productoId): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede eliminar productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $producto = ProductoFinanciero::withTrashed()->findOrFail($productoId);

        $antes = [
            'nombre' => $producto->nombre,
            'activo' => (bool) $producto->activo,
            'deleted_at' => $producto->deleted_at,
        ];

        $producto->delete();

        $despues = [
            'nombre' => $producto->nombre,
            'activo' => (bool) $producto->activo,
            'deleted_at' => $producto->fresh()?->deleted_at,
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    $antes,
                    $despues
                );

                $this->notificarAjusteProducto('PRODUCTO_ARCHIVADO', 'Producto archivado en catálogo', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Producto archivado para todas las sucursales activas.');
    }

    public function restaurarProducto(Request $request, int $productoId): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = Auth::user();

        if (!$this->esAdmin($usuario)) {
            return back()->withErrors([
                'general' => 'Solo Admin puede restaurar productos.',
            ]);
        }

        $sucursalesObjetivo = $this->obtenerSucursalesObjetivoAdmin();

        if ($sucursalesObjetivo->isEmpty()) {
            return back()->withErrors([
                'general' => 'No hay sucursales activas para aplicar cambios.',
            ]);
        }

        $producto = ProductoFinanciero::withTrashed()->findOrFail($productoId);

        $antes = [
            'nombre' => $producto->nombre,
            'activo' => (bool) $producto->activo,
            'deleted_at' => $producto->deleted_at,
        ];

        $producto->restore();
        $producto->update([
            'activo' => true,
            'actualizado_en' => now(),
        ]);

        $despues = [
            'nombre' => $producto->nombre,
            'activo' => true,
            'deleted_at' => null,
        ];

        DB::transaction(function () use ($sucursalesObjetivo, $usuario, $producto, $antes, $despues) {
            foreach ($sucursalesObjetivo as $sucursal) {
                $configuracion = $this->obtenerOCrearConfiguracion($sucursal, $usuario);
                $configuracion->update([
                    'actualizado_por_usuario_id' => $usuario->id,
                    'actualizado_en' => now(),
                ]);

                $this->registrarCambio(
                    $configuracion,
                    $sucursal,
                    $usuario,
                    'PRODUCTO',
                    $producto->id,
                    $antes,
                    $despues
                );

                $this->notificarAjusteProducto('PRODUCTO_RESTAURADO', 'Producto restaurado para oferta', $producto, $sucursal, $usuario);
            }
        });

        return back()->with('success', 'Producto restaurado para todas las sucursales activas.');
    }

    private function esAdmin(Usuario $usuario): bool
    {
        return $usuario->tieneRol('ADMIN');
    }

    private function resolverSucursalConfiguracion(Usuario $usuario, ?int $sucursalId): ?Sucursal
    {
        if ($this->esAdmin($usuario)) {
            if ($sucursalId) {
                return Sucursal::query()->where('id', $sucursalId)->first();
            }

            return Sucursal::query()->where('activo', true)->orderBy('nombre')->first();
        }

        return $this->obtenerSucursalActivaGerente($usuario);
    }

    private function obtenerSucursalesObjetivoAdmin(): Collection
    {
        return Sucursal::query()
            ->where('activo', true)
            ->orderBy('id')
            ->get();
    }

    private function notificarAjusteProducto(
        string $tipo,
        string $titulo,
        ProductoFinanciero $producto,
        Sucursal $sucursal,
        Usuario $usuario
    ): void {
        $distribuidoras = Distribuidora::query()
            ->where('estado', Distribuidora::ESTADO_ACTIVA)
            ->where('sucursal_id', $sucursal->id)
            ->get();

        foreach ($distribuidoras as $distribuidora) {
            $this->distribuidoraNotificationService->notificar(
                $distribuidora,
                $tipo,
                $titulo,
                "{$producto->nombre} ({$producto->codigo}) fue actualizado por Admin.",
                [
                    'producto_id' => (int) $producto->id,
                    'producto_codigo' => (string) $producto->codigo,
                    'producto_nombre' => (string) $producto->nombre,
                    'sucursal_id' => (int) $sucursal->id,
                    'sucursal_nombre' => (string) $sucursal->nombre,
                    'actualizado_por_usuario_id' => (int) $usuario->id,
                ]
            );
        }
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
                'hora_corte' => CorteService::HORA_CORTE_FIJA,
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
