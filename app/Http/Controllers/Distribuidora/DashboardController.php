<?php

namespace App\Http\Controllers\Distribuidora;

use App\Http\Controllers\Controller;
use App\Http\Requests\Distribuidora\StorePreValeRequest;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\MovimientoPunto;
use App\Models\PagoDistribuidora;
use App\Models\Persona;
use App\Models\ProductoFinanciero;
use App\Models\RelacionCorte;
use App\Models\Vale;
use App\Services\Distribuidora\DistribuidoraContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DistribuidoraContextService $contextService
    ) {
    }

    public function index(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/DistribuidoraDashboard', $this->payloadSinDistribuidora());
        }

        $resumen = $this->obtenerResumenBase((int) $distribuidora->id);

        $relacionActual = RelacionCorte::query()
            ->with(['pagosDistribuidora.conciliacion'])
            ->withCount('partidas')
            ->where('distribuidora_id', $distribuidora->id)
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->orderByRaw("CASE estado WHEN 'VENCIDA' THEN 0 WHEN 'PARCIAL' THEN 1 ELSE 2 END")
            ->orderBy('fecha_limite_pago')
            ->orderByDesc('generada_en')
            ->first();

        if (!$relacionActual) {
            $relacionActual = RelacionCorte::query()
                ->with(['pagosDistribuidora.conciliacion'])
                ->withCount('partidas')
                ->where('distribuidora_id', $distribuidora->id)
                ->orderByDesc('generada_en')
                ->orderByDesc('id')
                ->first();
        }

        $ultimosVales = Vale::query()
            ->with([
                'cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'productoFinanciero:id,codigo,nombre,monto_principal',
            ])
            ->where('distribuidora_id', $distribuidora->id)
            ->orderByDesc('fecha_emision')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Vale $vale) => $this->transformarVale($vale))
            ->values();

        $proximosVencimientos = Vale::query()
            ->with([
                'cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'productoFinanciero:id,codigo,nombre,monto_principal',
            ])
            ->where('distribuidora_id', $distribuidora->id)
            ->whereIn('estado', [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
                Vale::ESTADO_MOROSO,
            ])
            ->orderByRaw('fecha_limite_pago IS NULL')
            ->orderBy('fecha_limite_pago')
            ->limit(4)
            ->get()
            ->map(fn (Vale $vale) => $this->transformarVale($vale))
            ->values();

        $pagosRecientes = PagoDistribuidora::query()
            ->with(['relacionCorte:id,numero_relacion', 'conciliacion'])
            ->where('distribuidora_id', $distribuidora->id)
            ->orderByDesc('fecha_pago')
            ->orderByDesc('id')
            ->limit(4)
            ->get()
            ->map(fn (PagoDistribuidora $pago) => $this->transformarPagoDistribuidora($pago))
            ->values();

        return Inertia::render('Distribuidora/DistribuidoraDashboard', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'stats' => [
                'puntos_actuales' => (float) $distribuidora->puntos_actuales,
                'vales_activos' => $resumen['vales_activos'],
                'credito_disponible' => (float) $distribuidora->credito_disponible,
                'clientes_activos' => $resumen['clientes_activos'],
                'relaciones_abiertas' => $resumen['relaciones_abiertas'],
                'pagos_pendientes_conciliar' => $resumen['pagos_pendientes_conciliar'],
            ],
            'relacionActual' => $this->transformarRelacion($relacionActual),
            'ultimosVales' => $ultimosVales,
            'proximosVencimientos' => $proximosVencimientos,
            'pagosRecientes' => $pagosRecientes,
            'alertas' => [
                'puede_emitir_vales' => (bool) $distribuidora->puede_emitir_vales,
                'distribuidora_activa' => $distribuidora->estado === Distribuidora::ESTADO_ACTIVA,
                'pagos_pendientes_conciliar' => $resumen['pagos_pendientes_conciliar'],
                'relaciones_abiertas' => $resumen['relaciones_abiertas'],
            ],
        ]);
    }

    public function vales(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/Vales/Index', $this->payloadSinDistribuidora());
        }

        $filtros = [
            'q' => trim((string) $request->string('q', '')),
            'estado' => (string) $request->string('estado', 'TODOS'),
            'cliente_id' => (string) $request->string('cliente_id', ''),
            'seleccionado' => (string) $request->string('seleccionado', ''),
        ];

        $resumenEstados = Vale::query()
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->where('distribuidora_id', $distribuidora->id)
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $query = Vale::query()
            ->with([
                'cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
                'productoFinanciero:id,codigo,nombre,monto_principal',
                'pagos:id,vale_id,monto,fecha_pago,metodo_pago',
            ])
            ->where('distribuidora_id', $distribuidora->id);

        if ($filtros['estado'] !== 'TODOS') {
            $query->where('estado', $filtros['estado']);
        }

        if (filled($filtros['cliente_id'])) {
            $query->where('cliente_id', (int) $filtros['cliente_id']);
        }

        if (filled($filtros['q'])) {
            $termino = $filtros['q'];
            $query->where(function ($sub) use ($termino) {
                $sub->where('numero_vale', 'like', "%{$termino}%")
                    ->orWhereHas('cliente.persona', function ($personaQuery) use ($termino) {
                        $personaQuery->whereRaw("CONCAT_WS(' ', primer_nombre, segundo_nombre, apellido_paterno, apellido_materno) LIKE ?", ["%{$termino}%"]);
                    })
                    ->orWhereHas('productoFinanciero', function ($productoQuery) use ($termino) {
                        $productoQuery->where('nombre', 'like', "%{$termino}%")
                            ->orWhere('codigo', 'like', "%{$termino}%");
                    });
            });
        }

        $vales = $query
            ->orderByRaw('fecha_limite_pago IS NULL')
            ->orderBy('fecha_limite_pago')
            ->orderByDesc('fecha_emision')
            ->limit(60)
            ->get()
            ->map(fn (Vale $vale) => $this->transformarVale($vale))
            ->values();

        $valeSeleccionado = $vales->firstWhere('id', (int) $filtros['seleccionado']) ?: $vales->first();

        $clientesOpciones = DB::table('clientes_distribuidora as cd')
            ->join('clientes as c', 'c.id', '=', 'cd.cliente_id')
            ->join('personas as p', 'p.id', '=', 'c.persona_id')
            ->where('cd.distribuidora_id', $distribuidora->id)
            ->select([
                'c.id',
                'c.codigo_cliente',
                'p.primer_nombre',
                'p.segundo_nombre',
                'p.apellido_paterno',
                'p.apellido_materno',
            ])
            ->orderBy('p.primer_nombre')
            ->get()
            ->map(fn ($cliente) => [
                'id' => $cliente->id,
                'label' => trim(($cliente->codigo_cliente ? $cliente->codigo_cliente . ' · ' : '') . $this->nombreCompletoDesdePartes(
                    $cliente->primer_nombre,
                    $cliente->segundo_nombre,
                    $cliente->apellido_paterno,
                    $cliente->apellido_materno,
                )),
            ])
            ->values();

        return Inertia::render('Distribuidora/Vales/Index', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'resumen' => [
                'total' => (int) $vales->count(),
                'activos' => (int) ($resumenEstados[Vale::ESTADO_ACTIVO] ?? 0),
                'parciales' => (int) ($resumenEstados[Vale::ESTADO_PAGO_PARCIAL] ?? 0),
                'morosos' => (int) ($resumenEstados[Vale::ESTADO_MOROSO] ?? 0),
                'pagados' => (int) ($resumenEstados[Vale::ESTADO_PAGADO] ?? 0),
                'cancelados' => (int) ($resumenEstados[Vale::ESTADO_CANCELADO] ?? 0),
            ],
            'filtros' => $filtros,
            'opciones' => [
                'estados' => [
                    'TODOS',
                    Vale::ESTADO_ACTIVO,
                    Vale::ESTADO_PAGO_PARCIAL,
                    Vale::ESTADO_MOROSO,
                    Vale::ESTADO_PAGADO,
                    Vale::ESTADO_CANCELADO,
                    Vale::ESTADO_RECLAMADO,
                ],
                'clientes' => $clientesOpciones,
            ],
            'vales' => $vales,
            'valeSeleccionado' => $valeSeleccionado,
        ]);
    }

    public function crearVale(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/Vales/Create', $this->payloadSinDistribuidora());
        }

        $resumen = $this->obtenerResumenBase((int) $distribuidora->id);

        $productos = ProductoFinanciero::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'descripcion',
                'monto_principal',
                'numero_quincenas',
                'porcentaje_comision_empresa',
                'monto_seguro',
                'porcentaje_interes_quincenal',
                'monto_multa_tardia',
                'modo_desembolso',
            ])
            ->map(fn (ProductoFinanciero $producto) => [
                'id' => $producto->id,
                'codigo' => $producto->codigo,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'monto_principal' => (float) $producto->monto_principal,
                'numero_quincenas' => $producto->numero_quincenas,
                'porcentaje_comision_empresa' => (float) $producto->porcentaje_comision_empresa,
                'monto_seguro' => (float) $producto->monto_seguro,
                'porcentaje_interes_quincenal' => (float) $producto->porcentaje_interes_quincenal,
                'monto_multa_tardia' => (float) $producto->monto_multa_tardia,
                'modo_desembolso' => $producto->modo_desembolso,
            ])
            ->values();

        $clientes = $this->obtenerClientesParaEmision((int) $distribuidora->id, (bool) $distribuidora->puede_emitir_vales, $distribuidora->estado);

        $seleccion = [
            'cliente_id' => (string) $request->string('cliente_id', ''),
            'producto_id' => (string) $request->string('producto_id', ''),
        ];

        $clienteSeleccionado = $clientes->firstWhere('id', (int) $seleccion['cliente_id']);
        $productoSeleccionado = $productos->firstWhere('id', (int) $seleccion['producto_id']);
        $simulacion = $this->simularEmision($distribuidora, $productoSeleccionado);
        $bloqueos = $this->obtenerBloqueosEmision(
            $distribuidora,
            $clienteSeleccionado,
            $productoSeleccionado,
            $resumen['pagos_pendientes_conciliar']
        );

        return Inertia::render('Distribuidora/Vales/Create', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'prevalidacion' => [
                'estado' => $distribuidora->estado,
                'puede_emitir_vales' => (bool) $distribuidora->puede_emitir_vales,
                'sin_limite' => (bool) $distribuidora->sin_limite,
                'credito_disponible' => (float) $distribuidora->credito_disponible,
                'relaciones_abiertas' => $resumen['relaciones_abiertas'],
                'pagos_pendientes_conciliar' => $resumen['pagos_pendientes_conciliar'],
                'clientes_activos' => $resumen['clientes_activos'],
            ],
            'productos' => $productos,
            'clientes' => [
                'todos' => $clientes->values(),
                'elegibles' => $clientes->where('puede_solicitar_vale', true)->values(),
                'observados' => $clientes->where('puede_solicitar_vale', false)->values(),
            ],
            'seleccion' => $seleccion,
            'simulacion' => $simulacion,
            'bloqueos' => $bloqueos,
            'puedeContinuar' => empty($bloqueos) && $simulacion !== null,
        ]);
    }

    public function guardarPreVale(StorePreValeRequest $request): RedirectResponse
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return back()->withErrors(['general' => 'No se encontró una distribuidora ligada a tu acceso.']);
        }

        if ($distribuidora->estado !== Distribuidora::ESTADO_ACTIVA) {
            return back()->withErrors(['general' => 'Tu distribuidora no está en estado ACTIVA.']);
        }

        if (!(bool) $distribuidora->puede_emitir_vales) {
            return back()->withErrors(['general' => 'Tu cuenta no tiene habilitada la emisión de vales.']);
        }

        $producto = ProductoFinanciero::query()
            ->where('id', $request->producto_id)
            ->where('activo', true)
            ->first();

        if (!$producto) {
            return back()->withErrors(['producto_id' => 'El producto seleccionado no es válido o no está activo.']);
        }

        $montoPrincipal = round((float) $producto->monto_principal, 2);

        if ($montoPrincipal <= 0) {
            return back()->withErrors(['producto_id' => 'El producto seleccionado no tiene monto principal configurado.']);
        }

        if (!(bool) $distribuidora->sin_limite && $montoPrincipal > (float) $distribuidora->credito_disponible) {
            return back()->withErrors(['general' => 'El monto fijo del producto supera el crédito disponible actual.']);
        }

        if (!$distribuidora->categoria) {
            return back()->withErrors(['general' => 'Tu distribuidora no tiene una categoría asignada. Contacta al gerente.']);
        }

        try {
        $numeroVale = DB::transaction(function () use ($request, $distribuidora, $producto, $montoPrincipal) {
            $esClienteExistente = $request->filled('cliente_id');

            if ($esClienteExistente) {
                // Cliente existente: validar que pertenece a esta distribuidora
                $cliente = Cliente::findOrFail($request->cliente_id);
                $relacion = DB::table('clientes_distribuidora')
                    ->where('distribuidora_id', $distribuidora->id)
                    ->where('cliente_id', $cliente->id)
                    ->where('estado_relacion', 'ACTIVA')
                    ->first();

                if (!$relacion) {
                    throw new \Exception('El cliente no está vinculado a tu distribuidora.');
                }

                // Verificar que no tenga vales abiertos con esta distribuidora
                $valesAbiertos = Vale::where('distribuidora_id', $distribuidora->id)
                    ->where('cliente_id', $cliente->id)
                    ->whereIn('estado', [Vale::ESTADO_BORRADOR, Vale::ESTADO_ACTIVO, Vale::ESTADO_PAGO_PARCIAL, Vale::ESTADO_MOROSO])
                    ->exists();

                if ($valesAbiertos) {
                    throw new \Exception('El cliente tiene deuda abierta con tu distribuidora.');
                }
            } else {
                // Cliente nuevo: crear Persona + Cliente + relación
                $persona = Persona::create([
                    'primer_nombre'      => $request->primer_nombre,
                    'segundo_nombre'     => $request->segundo_nombre,
                    'apellido_paterno'   => $request->apellido_paterno,
                    'apellido_materno'   => $request->apellido_materno,
                    'sexo'               => $request->sexo,
                    'fecha_nacimiento'   => $request->fecha_nacimiento,
                    'curp'               => $request->curp,
                    'telefono_celular'   => $request->telefono_celular,
                    'correo_electronico' => $request->correo_electronico,
                    'calle'              => $request->calle,
                    'numero_exterior'    => $request->numero_exterior,
                    'colonia'            => $request->colonia,
                    'ciudad'             => $request->ciudad,
                    'estado'             => $request->estado_direccion,
                    'codigo_postal'      => $request->codigo_postal,
                ]);

                // Subir fotos
                $fotoIneFrente = $request->file('foto_ine_frente')?->store('clientes/ine_frente', 'spaces');
                $fotoIneReverso = $request->file('foto_ine_reverso')?->store('clientes/ine_reverso', 'spaces');
                $fotoSelfieIne = $request->file('foto_selfie_ine')?->store('clientes/selfie_ine', 'spaces');

                $cliente = Cliente::create([
                    'persona_id'       => $persona->id,
                    'codigo_cliente'   => $this->generarCodigoCliente(),
                    'estado'           => Cliente::ESTADO_EN_VERIFICACION,
                    'foto_ine_frente'  => $fotoIneFrente,
                    'foto_ine_reverso' => $fotoIneReverso,
                    'foto_selfie_ine'  => $fotoSelfieIne,
                    'cuenta_banco'     => $request->cuenta_banco,
                    'cuenta_clabe'     => $request->cuenta_clabe,
                    'cuenta_titular'   => $request->cuenta_titular,
                ]);

                DB::table('clientes_distribuidora')->insert([
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id'       => $cliente->id,
                    'estado_relacion'  => 'ACTIVA',
                    'vinculado_en'     => now(),
                ]);
            }

            // Calcular montos server-side
            $comisionEmpresa = round($montoPrincipal * ((float) $producto->porcentaje_comision_empresa / 100), 2);
            $interes = round($montoPrincipal * ((float) $producto->porcentaje_interes_quincenal / 100) * (int) $producto->numero_quincenas, 2);
            $seguro = round((float) $producto->monto_seguro, 2);
            $gananciaDistribuidora = round($montoPrincipal * (((float) ($distribuidora->categoria?->porcentaje_comision ?? 0)) / 100), 2);
            $totalDeuda = round($montoPrincipal + $comisionEmpresa + $seguro + $interes, 2);
            $montoQuincenal = round($totalDeuda / max(1, (int) $producto->numero_quincenas), 2);

            // 5. Generar numero_vale único
            do {
                $numeroVale = 'VALE-' . now()->format('ymdHis') . '-' . random_int(100, 999);
            } while (Vale::where('numero_vale', $numeroVale)->exists());

            // 6. Crear Vale en estado BORRADOR
            Vale::create([
                'numero_vale'                      => $numeroVale,
                'distribuidora_id'                 => $distribuidora->id,
                'cliente_id'                       => $cliente->id,
                'producto_financiero_id'           => $producto->id,
                'sucursal_id'                      => $distribuidora->sucursal_id,
                'creado_por_usuario_id'            => auth()->user()->id,
                'estado'                           => Vale::ESTADO_BORRADOR,
                'porcentaje_comision_empresa_snap' => $producto->porcentaje_comision_empresa,
                'monto_comision_empresa'           => $comisionEmpresa,
                'monto_seguro_snap'                => $seguro,
                'porcentaje_interes_snap'          => $producto->porcentaje_interes_quincenal,
                'monto_interes'                    => $interes,
                'porcentaje_ganancia_dist_snap'    => $distribuidora->categoria?->porcentaje_comision ?? 0,
                'monto_ganancia_distribuidora'     => $gananciaDistribuidora,
                'monto_multa_snap'                 => $producto->monto_multa_tardia,
                'monto_total_deuda'                => $totalDeuda,
                'monto_quincenal'                  => $montoQuincenal,
                'quincenas_totales'                => $producto->numero_quincenas,
                'pagos_realizados'                 => 0,
                'saldo_actual'                     => $totalDeuda,
                'fecha_emision'                    => now(),
            ]);

            return $numeroVale;
        });

        return redirect()
            ->route('distribuidora.vales')
            ->with('success', "Pre vale {$numeroVale} creado exitosamente.");
        } catch (\Exception $e) {
            $mensaje = str_starts_with($e->getMessage(), 'El cliente')
                ? $e->getMessage()
                : 'Ocurrió un error al crear el pre vale. Intenta de nuevo.';
            return back()->withErrors(['general' => $mensaje]);
        }
    }

    private function generarCodigoCliente(): string
    {
        do {
            $codigo = 'CLI-' . now()->format('ymdHis') . '-' . random_int(100, 999);
        } while (Cliente::where('codigo_cliente', $codigo)->exists());

        return $codigo;
    }

    public function puntos(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/Puntos', $this->payloadSinDistribuidora());
        }

        $filtros = [
            'tipo' => (string) $request->string('tipo', 'TODOS'),
            'direccion' => (string) $request->string('direccion', 'TODOS'),
            'q' => trim((string) $request->string('q', '')),
        ];

        $query = MovimientoPunto::query()
            ->with(['vale:id,numero_vale'])
            ->where('distribuidora_id', $distribuidora->id);

        if ($filtros['tipo'] !== 'TODOS') {
            $query->where('tipo_movimiento', $filtros['tipo']);
        }

        if ($filtros['direccion'] === 'POSITIVOS') {
            $query->where('puntos', '>', 0);
        }

        if ($filtros['direccion'] === 'NEGATIVOS') {
            $query->where('puntos', '<', 0);
        }

        if (filled($filtros['q'])) {
            $termino = $filtros['q'];
            $query->where(function ($sub) use ($termino) {
                $sub->where('motivo', 'like', "%{$termino}%")
                    ->orWhere('tipo_movimiento', 'like', "%{$termino}%")
                    ->orWhereHas('vale', function ($valeQuery) use ($termino) {
                        $valeQuery->where('numero_vale', 'like', "%{$termino}%");
                    });
            });
        }

        $movimientos = $query
            ->orderByDesc('fecha_movimiento')
            ->orderByDesc('id')
            ->limit(60)
            ->get()
            ->map(fn (MovimientoPunto $movimiento) => [
                'id' => $movimiento->id,
                'tipo_movimiento' => $movimiento->tipo_movimiento,
                'puntos' => (float) $movimiento->puntos,
                'valor_punto_snapshot' => (float) $movimiento->valor_punto_snapshot,
                'motivo' => $movimiento->motivo,
                'fecha_movimiento' => optional($movimiento->fecha_movimiento)->toDateTimeString(),
                'vale_numero' => $movimiento->vale?->numero_vale,
            ])
            ->values();

        $positivos = (float) $movimientos->where('puntos', '>', 0)->sum('puntos');
        $negativos = (float) abs($movimientos->where('puntos', '<', 0)->sum('puntos'));

        return Inertia::render('Distribuidora/Puntos', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'resumen' => [
                'saldo_actual' => (float) $distribuidora->puntos_actuales,
                'movimientos' => $movimientos->count(),
                'valor_estimado' => $movimientos->first()['valor_punto_snapshot'] ?? (float) ($distribuidora->categoria?->valor_punto ?? 2),
                'positivos' => $positivos,
                'negativos' => $negativos,
            ],
            'filtros' => $filtros,
            'opciones' => [
                'tipos' => [
                    'TODOS',
                    MovimientoPunto::TIPO_GANADO_ANTICIPADO,
                    MovimientoPunto::TIPO_GANADO_PUNTUAL,
                    MovimientoPunto::TIPO_PENALIZACION_ATRASO,
                    MovimientoPunto::TIPO_AJUSTE_MANUAL,
                    MovimientoPunto::TIPO_REVERSO,
                    MovimientoPunto::TIPO_CANJE,
                ],
            ],
            'movimientos' => $movimientos,
        ]);
    }

    public function misClientes(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/MisClientes', $this->payloadSinDistribuidora());
        }

        $filtros = [
            'q' => trim((string) $request->string('q', '')),
            'estado_relacion' => (string) $request->string('estado_relacion', 'TODOS'),
            'elegibilidad' => (string) $request->string('elegibilidad', 'TODOS'),
        ];

        $subVales = Vale::query()
            ->selectRaw('cliente_id, COUNT(*) as vales_abiertos, COALESCE(SUM(saldo_actual), 0) as saldo_pendiente, MIN(fecha_limite_pago) as siguiente_vencimiento')
            ->where('distribuidora_id', $distribuidora->id)
            ->whereNotIn('estado', [
                Vale::ESTADO_PAGADO,
                Vale::ESTADO_CANCELADO,
                Vale::ESTADO_REVERSADO,
            ])
            ->groupBy('cliente_id');

        $clientes = DB::table('clientes_distribuidora as cd')
            ->join('clientes as c', 'c.id', '=', 'cd.cliente_id')
            ->join('personas as p', 'p.id', '=', 'c.persona_id')
            ->leftJoinSub($subVales, 'resumen_vales', function ($join) {
                $join->on('resumen_vales.cliente_id', '=', 'c.id');
            })
            ->where('cd.distribuidora_id', $distribuidora->id)
            ->orderByRaw("CASE WHEN cd.estado_relacion = 'ACTIVA' THEN 0 ELSE 1 END")
            ->orderBy('p.primer_nombre')
            ->select([
                'c.id',
                'c.codigo_cliente',
                'c.estado as estado_cliente',
                'cd.estado_relacion',
                'cd.bloqueado_por_parentesco',
                'cd.observaciones_parentesco',
                'cd.vinculado_en',
                'p.primer_nombre',
                'p.segundo_nombre',
                'p.apellido_paterno',
                'p.apellido_materno',
                DB::raw('COALESCE(resumen_vales.vales_abiertos, 0) as vales_abiertos'),
                DB::raw('COALESCE(resumen_vales.saldo_pendiente, 0) as saldo_pendiente'),
                DB::raw('resumen_vales.siguiente_vencimiento as siguiente_vencimiento'),
            ])
            ->get()
            ->map(function ($cliente) use ($distribuidora) {
                $puedeSolicitar = $cliente->estado_relacion === 'ACTIVA'
                    && $cliente->estado_cliente === Cliente::ESTADO_ACTIVO
                    && !(bool) $cliente->bloqueado_por_parentesco
                    && (int) $cliente->vales_abiertos === 0
                    && (float) $cliente->saldo_pendiente <= 0
                    && $distribuidora->estado === Distribuidora::ESTADO_ACTIVA
                    && (bool) $distribuidora->puede_emitir_vales;

                return [
                    'id' => $cliente->id,
                    'codigo_cliente' => $cliente->codigo_cliente,
                    'nombre' => $this->nombreCompletoDesdePartes(
                        $cliente->primer_nombre,
                        $cliente->segundo_nombre,
                        $cliente->apellido_paterno,
                        $cliente->apellido_materno,
                    ),
                    'estado_cliente' => $cliente->estado_cliente,
                    'estado_relacion' => $cliente->estado_relacion,
                    'bloqueado_por_parentesco' => (bool) $cliente->bloqueado_por_parentesco,
                    'observaciones_parentesco' => $cliente->observaciones_parentesco,
                    'vinculado_en' => $cliente->vinculado_en,
                    'vales_abiertos' => (int) $cliente->vales_abiertos,
                    'saldo_pendiente' => (float) $cliente->saldo_pendiente,
                    'siguiente_vencimiento' => $cliente->siguiente_vencimiento,
                    'puede_solicitar_vale' => $puedeSolicitar,
                ];
            })
            ->filter(function (array $cliente) use ($filtros) {
                if ($filtros['estado_relacion'] !== 'TODOS' && $cliente['estado_relacion'] !== $filtros['estado_relacion']) {
                    return false;
                }

                if ($filtros['elegibilidad'] === 'ELEGIBLES' && !$cliente['puede_solicitar_vale']) {
                    return false;
                }

                if ($filtros['elegibilidad'] === 'OBSERVADOS' && $cliente['puede_solicitar_vale']) {
                    return false;
                }

                if ($filtros['elegibilidad'] === 'CON_SALDO' && $cliente['saldo_pendiente'] <= 0) {
                    return false;
                }

                if ($filtros['elegibilidad'] === 'SIN_DEUDA' && $cliente['saldo_pendiente'] > 0) {
                    return false;
                }

                if (!filled($filtros['q'])) {
                    return true;
                }

                $texto = mb_strtolower($filtros['q']);
                $stack = mb_strtolower(implode(' ', [
                    $cliente['nombre'],
                    $cliente['codigo_cliente'],
                    $cliente['estado_cliente'],
                    $cliente['estado_relacion'],
                ]));

                return str_contains($stack, $texto);
            })
            ->values();

        return Inertia::render('Distribuidora/MisClientes', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'resumen' => [
                'total' => $clientes->count(),
                'activos' => $clientes->where('estado_relacion', 'ACTIVA')->count(),
                'bloqueados' => $clientes->where('estado_relacion', 'BLOQUEADA')->count(),
                'elegibles' => $clientes->where('puede_solicitar_vale', true)->count(),
                'con_saldo' => $clientes->where('saldo_pendiente', '>', 0)->count(),
            ],
            'filtros' => $filtros,
            'clientes' => $clientes,
        ]);
    }

    public function estadoCuenta(Request $request): Response
    {
        $distribuidora = $this->obtenerDistribuidoraActual();

        if (!$distribuidora) {
            return Inertia::render('Distribuidora/EstadoCuenta', $this->payloadSinDistribuidora());
        }

        $filtros = [
            'estado' => (string) $request->string('estado', 'TODAS'),
            'q' => trim((string) $request->string('q', '')),
            'relacion_id' => (string) $request->string('relacion_id', ''),
        ];

        $relacionesQuery = RelacionCorte::query()
            ->with([
                'pagosDistribuidora.conciliacion',
                'partidas.vale:id,numero_vale,estado',
                'partidas.cliente.persona:id,primer_nombre,segundo_nombre,apellido_paterno,apellido_materno',
            ])
            ->where('distribuidora_id', $distribuidora->id);

        if ($filtros['estado'] !== 'TODAS') {
            $relacionesQuery->where('estado', $filtros['estado']);
        }

        if (filled($filtros['q'])) {
            $termino = $filtros['q'];
            $relacionesQuery->where(function ($sub) use ($termino) {
                $sub->where('numero_relacion', 'like', "%{$termino}%")
                    ->orWhere('referencia_pago', 'like', "%{$termino}%");
            });
        }

        $relaciones = $relacionesQuery
            ->orderByRaw('fecha_limite_pago IS NULL')
            ->orderBy('fecha_limite_pago')
            ->orderByDesc('generada_en')
            ->limit(20)
            ->get();

        $relacionesTransformadas = $relaciones
            ->map(fn (RelacionCorte $relacion) => $this->transformarRelacion($relacion, true))
            ->values();

        $relacionSeleccionada = $relacionesTransformadas->firstWhere('id', (int) $filtros['relacion_id'])
            ?: $relacionesTransformadas->first();

        $pagosQuery = PagoDistribuidora::query()
            ->with(['relacionCorte:id,numero_relacion,estado', 'conciliacion'])
            ->where('distribuidora_id', $distribuidora->id);

        if ($relacionSeleccionada) {
            $pagosQuery->where('relacion_corte_id', $relacionSeleccionada['id']);
        }

        $pagos = $pagosQuery
            ->orderByDesc('fecha_pago')
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn (PagoDistribuidora $pago) => $this->transformarPagoDistribuidora($pago))
            ->values();

        $totalPendiente = RelacionCorte::query()
            ->where('distribuidora_id', $distribuidora->id)
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->sum('total_a_pagar');

        return Inertia::render('Distribuidora/EstadoCuenta', [
            'distribuidora' => $this->transformarDistribuidora($distribuidora),
            'resumen' => [
                'relaciones_abiertas' => $relacionesTransformadas
                    ->whereIn('estado', [
                        RelacionCorte::ESTADO_GENERADA,
                        RelacionCorte::ESTADO_PARCIAL,
                        RelacionCorte::ESTADO_VENCIDA,
                    ])
                    ->count(),
                'total_pendiente' => (float) $totalPendiente,
                'ultima_relacion' => $relacionesTransformadas->first(),
                'pagos_pendientes' => $pagos->whereIn('estado', [
                    PagoDistribuidora::ESTADO_REPORTADO,
                    PagoDistribuidora::ESTADO_DETECTADO,
                ])->count(),
            ],
            'filtros' => $filtros,
            'opciones' => [
                'estados' => [
                    'TODAS',
                    RelacionCorte::ESTADO_GENERADA,
                    RelacionCorte::ESTADO_PARCIAL,
                    RelacionCorte::ESTADO_VENCIDA,
                    RelacionCorte::ESTADO_PAGADA,
                    RelacionCorte::ESTADO_CERRADA,
                ],
            ],
            'relaciones' => $relacionesTransformadas,
            'relacionSeleccionada' => $relacionSeleccionada,
            'pagos' => $pagos,
        ]);
    }

    private function obtenerDistribuidoraActual()
    {
        /** @var \App\Models\Usuario|null $usuario */
        $usuario = Auth::user();

        return $this->contextService->resolveForUser($usuario);
    }

    private function payloadSinDistribuidora(): array
    {
        return [
            'distribuidora' => null,
            'stats' => [
                'puntos_actuales' => 0,
                'vales_activos' => 0,
                'credito_disponible' => 0,
                'clientes_activos' => 0,
                'relaciones_abiertas' => 0,
                'pagos_pendientes_conciliar' => 0,
            ],
            'resumen' => [
                'total' => 0,
                'activos' => 0,
                'bloqueados' => 0,
                'saldo_actual' => 0,
                'movimientos' => 0,
                'valor_estimado' => 0,
                'positivos' => 0,
                'negativos' => 0,
                'relaciones_abiertas' => 0,
                'total_pendiente' => 0,
                'ultima_relacion' => null,
                'pagos_pendientes' => 0,
                'elegibles' => 0,
                'con_saldo' => 0,
                'cancelados' => 0,
            ],
            'filtros' => [
                'q' => '',
                'estado' => 'TODOS',
                'tipo' => 'TODOS',
                'direccion' => 'TODOS',
                'cliente_id' => '',
                'estado_relacion' => 'TODOS',
                'elegibilidad' => 'TODOS',
                'relacion_id' => '',
                'seleccionado' => '',
            ],
            'opciones' => [
                'estados' => [],
                'tipos' => [],
                'clientes' => [],
            ],
            'relacionActual' => null,
            'ultimosVales' => [],
            'proximosVencimientos' => [],
            'pagosRecientes' => [],
            'alertas' => [
                'puede_emitir_vales' => false,
                'distribuidora_activa' => false,
                'pagos_pendientes_conciliar' => 0,
                'relaciones_abiertas' => 0,
            ],
            'vales' => [],
            'valeSeleccionado' => null,
            'clientes' => [
                'todos' => [],
                'elegibles' => [],
                'observados' => [],
            ],
            'movimientos' => [],
            'relaciones' => [],
            'relacionSeleccionada' => null,
            'pagos' => [],
            'prevalidacion' => [
                'estado' => null,
                'puede_emitir_vales' => false,
                'sin_limite' => false,
                'credito_disponible' => 0,
                'relaciones_abiertas' => 0,
                'pagos_pendientes_conciliar' => 0,
                'clientes_activos' => 0,
            ],
            'productos' => [],
            'seleccion' => [
                'cliente_id' => '',
                'producto_id' => '',
                'monto' => null,
            ],
            'simulacion' => null,
            'bloqueos' => [],
            'puedeContinuar' => false,
        ];
    }

    private function obtenerResumenBase(int $distribuidoraId): array
    {
        $clientesActivos = DB::table('clientes_distribuidora')
            ->where('distribuidora_id', $distribuidoraId)
            ->where('estado_relacion', 'ACTIVA')
            ->count();

        $valesActivos = Vale::query()
            ->where('distribuidora_id', $distribuidoraId)
            ->whereIn('estado', [
                Vale::ESTADO_ACTIVO,
                Vale::ESTADO_PAGO_PARCIAL,
                Vale::ESTADO_MOROSO,
            ])
            ->count();

        $relacionesAbiertas = RelacionCorte::query()
            ->where('distribuidora_id', $distribuidoraId)
            ->whereIn('estado', [
                RelacionCorte::ESTADO_GENERADA,
                RelacionCorte::ESTADO_PARCIAL,
                RelacionCorte::ESTADO_VENCIDA,
            ])
            ->count();

        $pagosPendientesConciliar = PagoDistribuidora::query()
            ->where('distribuidora_id', $distribuidoraId)
            ->whereIn('estado', [
                PagoDistribuidora::ESTADO_REPORTADO,
                PagoDistribuidora::ESTADO_DETECTADO,
            ])
            ->count();

        return [
            'clientes_activos' => $clientesActivos,
            'vales_activos' => $valesActivos,
            'relaciones_abiertas' => $relacionesAbiertas,
            'pagos_pendientes_conciliar' => $pagosPendientesConciliar,
        ];
    }

    private function obtenerClientesParaEmision(int $distribuidoraId, bool $puedeEmitirVales, string $estadoDistribuidora): Collection
    {
        $subVales = Vale::query()
            ->selectRaw('cliente_id, COUNT(*) as vales_abiertos, COALESCE(SUM(saldo_actual), 0) as saldo_pendiente')
            ->where('distribuidora_id', $distribuidoraId)
            ->whereNotIn('estado', [
                Vale::ESTADO_PAGADO,
                Vale::ESTADO_CANCELADO,
                Vale::ESTADO_REVERSADO,
            ])
            ->groupBy('cliente_id');

        return DB::table('clientes_distribuidora as cd')
            ->join('clientes as c', 'c.id', '=', 'cd.cliente_id')
            ->join('personas as p', 'p.id', '=', 'c.persona_id')
            ->leftJoinSub($subVales, 'resumen_vales', function ($join) {
                $join->on('resumen_vales.cliente_id', '=', 'c.id');
            })
            ->where('cd.distribuidora_id', $distribuidoraId)
            ->orderByRaw("CASE WHEN cd.estado_relacion = 'ACTIVA' THEN 0 ELSE 1 END")
            ->orderBy('p.primer_nombre')
            ->select([
                'c.id',
                'c.codigo_cliente',
                'c.estado as estado_cliente',
                'cd.estado_relacion',
                'cd.bloqueado_por_parentesco',
                'cd.observaciones_parentesco',
                'p.primer_nombre',
                'p.segundo_nombre',
                'p.apellido_paterno',
                'p.apellido_materno',
                DB::raw('COALESCE(resumen_vales.vales_abiertos, 0) as vales_abiertos'),
                DB::raw('COALESCE(resumen_vales.saldo_pendiente, 0) as saldo_pendiente'),
            ])
            ->get()
            ->map(function ($cliente) use ($puedeEmitirVales, $estadoDistribuidora) {
                $motivos = [];

                if ($estadoDistribuidora !== Distribuidora::ESTADO_ACTIVA) {
                    $motivos[] = 'Tu distribuidora no está activa.';
                }

                if (!$puedeEmitirVales) {
                    $motivos[] = 'La emisión está deshabilitada para tu cuenta.';
                }

                if ($cliente->estado_relacion !== 'ACTIVA') {
                    $motivos[] = 'La relación con el cliente no está activa.';
                }

                if ($cliente->estado_cliente !== Cliente::ESTADO_ACTIVO) {
                    $motivos[] = 'El cliente no está en estado ACTIVO.';
                }

                if ((bool) $cliente->bloqueado_por_parentesco) {
                    $motivos[] = $cliente->observaciones_parentesco ?: 'Cliente bloqueado por parentesco.';
                }

                if ((int) $cliente->vales_abiertos > 0 || (float) $cliente->saldo_pendiente > 0) {
                    $motivos[] = 'El cliente todavía tiene deuda abierta con esta distribuidora.';
                }

                return [
                    'id' => $cliente->id,
                    'codigo_cliente' => $cliente->codigo_cliente,
                    'nombre' => $this->nombreCompletoDesdePartes(
                        $cliente->primer_nombre,
                        $cliente->segundo_nombre,
                        $cliente->apellido_paterno,
                        $cliente->apellido_materno,
                    ),
                    'estado_cliente' => $cliente->estado_cliente,
                    'estado_relacion' => $cliente->estado_relacion,
                    'bloqueado_por_parentesco' => (bool) $cliente->bloqueado_por_parentesco,
                    'vales_abiertos' => (int) $cliente->vales_abiertos,
                    'saldo_pendiente' => (float) $cliente->saldo_pendiente,
                    'puede_solicitar_vale' => empty($motivos),
                    'motivos' => $motivos,
                ];
            })
            ->values();
    }

    private function simularEmision($distribuidora, ?array $producto): ?array
    {
        if (!$producto) {
            return null;
        }

        $montoPrincipal = round((float) ($producto['monto_principal'] ?? 0), 2);

        if ($montoPrincipal <= 0) {
            return null;
        }
        $comisionEmpresa = round($montoPrincipal * ((float) $producto['porcentaje_comision_empresa'] / 100), 2);
        $interes = round($montoPrincipal * ((float) $producto['porcentaje_interes_quincenal'] / 100) * (int) $producto['numero_quincenas'], 2);
        $seguro = round((float) $producto['monto_seguro'], 2);
        $multa = round((float) $producto['monto_multa_tardia'], 2);
        $gananciaDistribuidora = round($montoPrincipal * (((float) ($distribuidora->categoria?->porcentaje_comision ?? 0)) / 100), 2);
        $totalDeuda = round($montoPrincipal + $comisionEmpresa + $seguro + $interes, 2);
        $montoQuincenal = round($totalDeuda / max(1, (int) $producto['numero_quincenas']), 2);
        $consumoCredito = $distribuidora->sin_limite ? 0 : $montoPrincipal;
        $creditoRestante = $distribuidora->sin_limite ? null : round((float) $distribuidora->credito_disponible - $montoPrincipal, 2);

        return [
            'monto_principal' => $montoPrincipal,
            'comision_empresa' => $comisionEmpresa,
            'seguro' => $seguro,
            'interes_total' => $interes,
            'ganancia_distribuidora' => $gananciaDistribuidora,
            'multa_base' => $multa,
            'total_deuda' => $totalDeuda,
            'monto_quincenal' => $montoQuincenal,
            'quincenas_totales' => (int) $producto['numero_quincenas'],
            'consumo_credito' => $consumoCredito,
            'credito_restante' => $creditoRestante,
        ];
    }

    private function obtenerBloqueosEmision($distribuidora, ?array $cliente, ?array $producto, int $pagosPendientesConciliar): array
    {
        $bloqueos = [];

        if ($distribuidora->estado !== Distribuidora::ESTADO_ACTIVA) {
            $bloqueos[] = 'Tu distribuidora no está en estado ACTIVA.';
        }

        if (!(bool) $distribuidora->puede_emitir_vales) {
            $bloqueos[] = 'Tu cuenta no tiene habilitada la emisión de vales.';
        }

        if ($pagosPendientesConciliar > 0) {
            $bloqueos[] = 'Tienes pagos reportados o detectados pendientes de conciliación.';
        }

        if ($cliente && !(bool) $cliente['puede_solicitar_vale']) {
            $bloqueos[] = $cliente['motivos'][0] ?? 'El cliente seleccionado no cumple las reglas mínimas.';
        }

        if (!$producto) {
            $bloqueos[] = 'Debes seleccionar un producto financiero.';
        }

        if ($producto) {
            $montoProducto = (float) ($producto['monto_principal'] ?? 0);

            if ($montoProducto <= 0) {
                $bloqueos[] = 'El producto seleccionado no tiene monto principal configurado.';
            } elseif (!(bool) $distribuidora->sin_limite && $montoProducto > (float) $distribuidora->credito_disponible) {
                $bloqueos[] = 'El monto fijo del producto supera el crédito disponible actual.';
            }
        }

        return array_values(array_unique($bloqueos));
    }

    private function transformarDistribuidora($distribuidora): array
    {
        return [
            'id' => $distribuidora->id,
            'numero_distribuidora' => $distribuidora->numero_distribuidora,
            'nombre' => $this->nombreCompletoDesdePartes(
                $distribuidora->persona?->primer_nombre,
                $distribuidora->persona?->segundo_nombre,
                $distribuidora->persona?->apellido_paterno,
                $distribuidora->persona?->apellido_materno,
            ),
            'estado' => $distribuidora->estado,
            'limite_credito' => (float) $distribuidora->limite_credito,
            'credito_disponible' => (float) $distribuidora->credito_disponible,
            'sin_limite' => (bool) $distribuidora->sin_limite,
            'puntos_actuales' => (float) $distribuidora->puntos_actuales,
            'puede_emitir_vales' => (bool) $distribuidora->puede_emitir_vales,
            'activada_en' => optional($distribuidora->activada_en)->toDateTimeString(),
            'categoria' => $distribuidora->categoria ? [
                'id' => $distribuidora->categoria->id,
                'codigo' => $distribuidora->categoria->codigo,
                'nombre' => $distribuidora->categoria->nombre,
                'porcentaje_comision' => (float) $distribuidora->categoria->porcentaje_comision,
                'valor_punto' => (float) ($distribuidora->categoria->valor_punto ?? 2),
            ] : null,
            'sucursal' => $distribuidora->sucursal ? [
                'id' => $distribuidora->sucursal->id,
                'codigo' => $distribuidora->sucursal->codigo,
                'nombre' => $distribuidora->sucursal->nombre,
            ] : null,
            'cuenta_bancaria' => $distribuidora->cuentaBancaria ? [
                'banco' => $distribuidora->cuentaBancaria->banco,
                'nombre_titular' => $distribuidora->cuentaBancaria->nombre_titular,
                'numero_cuenta_mascarado' => $distribuidora->cuentaBancaria->numero_cuenta_mascarado,
                'clabe' => $distribuidora->cuentaBancaria->clabe,
                'convenio' => $distribuidora->cuentaBancaria->convenio,
                'referencia_base' => $distribuidora->cuentaBancaria->referencia_base,
            ] : null,
        ];
    }

    private function transformarRelacion(?RelacionCorte $relacion, bool $withPartidas = false): ?array
    {
        if (!$relacion) {
            return null;
        }

        return [
            'id' => $relacion->id,
            'numero_relacion' => $relacion->numero_relacion,
            'referencia_pago' => $relacion->referencia_pago,
            'fecha_limite_pago' => optional($relacion->fecha_limite_pago)->toDateString(),
            'fecha_inicio_pago_anticipado' => optional($relacion->fecha_inicio_pago_anticipado)->toDateString(),
            'fecha_fin_pago_anticipado' => optional($relacion->fecha_fin_pago_anticipado)->toDateString(),
            'total_a_pagar' => (float) $relacion->total_a_pagar,
            'total_pago' => (float) $relacion->total_pago,
            'total_recargos' => (float) $relacion->total_recargos,
            'puntos_snapshot' => (float) $relacion->puntos_snapshot,
            'estado' => $relacion->estado,
            'generada_en' => optional($relacion->generada_en)->toDateTimeString(),
            'pagos_count' => $relacion->pagosDistribuidora->count(),
            'partidas_count' => $relacion->partidas_count ?? $relacion->partidas->count(),
            'pagos' => $relacion->pagosDistribuidora
                ->map(fn (PagoDistribuidora $pago) => $this->transformarPagoDistribuidora($pago))
                ->values(),
            'partidas' => $withPartidas
                ? $relacion->partidas->map(function ($partida) {
                    return [
                        'id' => $partida->id,
                        'nombre_producto_snapshot' => $partida->nombre_producto_snapshot,
                        'pagos_realizados' => (int) $partida->pagos_realizados,
                        'pagos_totales' => (int) $partida->pagos_totales,
                        'monto_pago' => (float) $partida->monto_pago,
                        'monto_recargo' => (float) $partida->monto_recargo,
                        'monto_total_linea' => (float) $partida->monto_total_linea,
                        'cliente_nombre' => $this->nombreCompletoDesdePartes(
                            $partida->cliente?->persona?->primer_nombre,
                            $partida->cliente?->persona?->segundo_nombre,
                            $partida->cliente?->persona?->apellido_paterno,
                            $partida->cliente?->persona?->apellido_materno,
                        ),
                        'vale_numero' => $partida->vale?->numero_vale,
                        'vale_estado' => $partida->vale?->estado,
                    ];
                })->values()
                : [],
        ];
    }

    private function transformarPagoDistribuidora(PagoDistribuidora $pago): array
    {
        return [
            'id' => $pago->id,
            'monto' => (float) $pago->monto,
            'metodo_pago' => $pago->metodo_pago,
            'referencia_reportada' => $pago->referencia_reportada,
            'fecha_pago' => optional($pago->fecha_pago)->toDateTimeString(),
            'estado' => $pago->estado,
            'relacion_id' => $pago->relacion_corte_id,
            'relacion_numero' => $pago->relacionCorte?->numero_relacion,
            'conciliacion_estado' => $pago->conciliacion?->estado,
            'diferencia_monto' => (float) ($pago->conciliacion?->diferencia_monto ?? 0),
            'monto_conciliado' => (float) ($pago->conciliacion?->monto_conciliado ?? 0),
        ];
    }

    private function transformarVale(Vale $vale): array
    {
        $ultimoPago = $vale->relationLoaded('pagos')
            ? $vale->pagos->sortByDesc('fecha_pago')->first()
            : null;

        return [
            'id' => $vale->id,
            'numero_vale' => $vale->numero_vale,
            'estado' => $vale->estado,
            'monto_principal' => (float) ($vale->productoFinanciero?->monto_principal ?? 0),
            'monto_total_deuda' => (float) $vale->monto_total_deuda,
            'monto_quincenal' => (float) $vale->monto_quincenal,
            'saldo_actual' => (float) $vale->saldo_actual,
            'pagos_realizados' => (int) $vale->pagos_realizados,
            'quincenas_totales' => (int) $vale->quincenas_totales,
            'fecha_emision' => optional($vale->fecha_emision)->toDateTimeString(),
            'fecha_limite_pago' => optional($vale->fecha_limite_pago)->toDateString(),
            'fecha_inicio_pago_anticipado' => optional($vale->fecha_inicio_pago_anticipado)->toDateString(),
            'fecha_fin_pago_anticipado' => optional($vale->fecha_fin_pago_anticipado)->toDateString(),
            'motivo_reclamo' => $vale->motivo_reclamo,
            'notas' => $vale->notas,
            'cliente_id' => $vale->cliente_id,
            'cliente_nombre' => $this->nombreCompletoDesdePartes(
                $vale->cliente?->persona?->primer_nombre,
                $vale->cliente?->persona?->segundo_nombre,
                $vale->cliente?->persona?->apellido_paterno,
                $vale->cliente?->persona?->apellido_materno,
            ),
            'producto_nombre' => $vale->productoFinanciero?->nombre,
            'producto_codigo' => $vale->productoFinanciero?->codigo,
            'ultimo_pago' => $ultimoPago ? [
                'monto' => (float) $ultimoPago->monto,
                'fecha_pago' => optional($ultimoPago->fecha_pago)->toDateTimeString(),
                'metodo_pago' => $ultimoPago->metodo_pago,
            ] : null,
        ];
    }

    private function nombreCompletoDesdePartes(?string ...$partes): string
    {
        $partesFiltradas = array_filter($partes, fn (?string $parte) => filled($parte));

        return trim(implode(' ', $partesFiltradas));
    }
}
