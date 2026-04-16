<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;
use Inertia\Inertia;
use App\Models\Vale;
use App\Models\Cliente;
use App\Models\EgresoEmpresaSimulado;
use App\Services\Distribuidora\DistribuidoraNotificationService;

class PrevaleController extends Controller
{
    public function __construct(
        private readonly DistribuidoraNotificationService $distribuidoraNotificationService
    ) {}

    public function index(Request $request)
    {
        $vales = Vale::with([
            'cliente.persona',
            'distribuidora.persona',
            'sucursal'
        ])
            ->where('estado', Vale::ESTADO_BORRADOR)
            ->orderBy('creado_en', 'desc')
            ->paginate(10);

        return Inertia::render('Cajera/Prevale/Index', [
            'vales' => $vales,
            'filtros' => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        $vale = Vale::with([
            'cliente.persona',
            'distribuidora.persona',
            'productoFinanciero'
        ])->where('estado', Vale::ESTADO_BORRADOR)->findOrFail($id);

        $cliente = $vale->cliente;
        if ($cliente) {
            /** @var FilesystemAdapter $spacesDisk */
            $spacesDisk = Storage::disk('spaces');

            $cliente->ine_frente_url = $cliente->foto_ine_frente
                ? $spacesDisk->url($cliente->foto_ine_frente)
                : null;

            $cliente->ine_reverso_url = $cliente->foto_ine_reverso
                ? $spacesDisk->url($cliente->foto_ine_reverso)
                : null;

            $cliente->selfie_url = $cliente->foto_selfie_ine
                ? $spacesDisk->url($cliente->foto_selfie_ine)
                : null;
        }

        return Inertia::render('Cajera/Prevale/Show', [
            'vale' => $vale
        ]);
    }

    public function aprobar(Request $request, $id)
    {
        $request->validate([
            'check_identidad'  => 'accepted',
            'check_domicilio'  => 'accepted',
            'check_parentesco' => 'accepted',
            'check_biometria'  => 'accepted',
            'check_pld'        => 'accepted',
        ]);

        try {
            DB::beginTransaction();

            $vale          = Vale::where('id', $id)->where('estado', Vale::ESTADO_BORRADOR)->firstOrFail();
            $distribuidora = $vale->distribuidora;
            $cliente       = $vale->cliente;
            $fechaTransferencia = now();
            $referenciaTransferencia = 'INT-' . $vale->numero_vale . '-' . $fechaTransferencia->format('YmdHis');

            if (!$distribuidora || !$cliente) {
                throw new \Exception('Faltan relaciones del vale.');
            }

            // ✅ Cast explícito – usar 'monto' porque 'monto_principal' ya no existe en vales
            $montoPrestamo     = (float) $vale->monto;
            $creditoDisponible = (float) $distribuidora->credito_disponible;

            if ($creditoDisponible < $montoPrestamo) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Crédito insuficiente.']);
            }

            // 1. Descontar crédito de la distribuidora (no se reservó al crear BORRADOR)
            $distribuidora->decrement('credito_disponible', $montoPrestamo);

            // 2. Vale: BORRADOR -> ACTIVO
            $valeActualizado = DB::table('vales')
                ->where('id', $id)
                ->where('estado', Vale::ESTADO_BORRADOR)
                ->update([
                    'estado'                   => Vale::ESTADO_ACTIVO,
                    'aprobado_por_usuario_id'  => Auth::user()->id,
                    'fecha_emision'            => now(),
                    'fecha_transferencia'      => $fechaTransferencia,
                    'referencia_transferencia' => $referenciaTransferencia,
                    'actualizado_en'           => now(),
                ]);

            if ($valeActualizado === 0) {
                throw new \Exception('El vale ya no está disponible para aprobación.');
            }

            // 3. Cliente: EN_VERIFICACION -> ACTIVO
            DB::table('clientes')->where('id', $cliente->id)->update([
                'estado'         => Cliente::ESTADO_ACTIVO,
                'actualizado_en' => now(),
            ]);

            // 4. Pivot
            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id'       => $cliente->id,
                ],
                [
                    'estado_relacion'  => 'ACTIVA',
                    'prevale_aprobado' => true,
                    'vinculado_en'     => now(),
                ]
            );

            EgresoEmpresaSimulado::updateOrCreate(
                ['vale_id' => $vale->id],
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id' => $cliente->id,
                    'ejecutado_por_usuario_id' => Auth::id(),
                    'origen' => 'VALE_FERIADO',
                    'referencia_interna' => $referenciaTransferencia,
                    'monto' => $montoPrestamo,
                    'fecha_operacion' => $fechaTransferencia,
                    'notas' => 'Desembolso interno simulado al feriar el vale.',
                ]
            );

            DB::commit();

            DB::afterCommit(function () use ($distribuidora, $vale, $referenciaTransferencia) {
                $this->distribuidoraNotificationService->notificar(
                    $distribuidora,
                    'VALE_FERIADO',
                    'Tu vale fue feriado',
                    "El vale {$vale->numero_vale} ya fue dispersado internamente y activado.",
                    [
                        'vale_id' => (int) $vale->id,
                        'numero_vale' => (string) $vale->numero_vale,
                        'referencia_transferencia' => $referenciaTransferencia,
                    ]
                );
            });

            return Inertia::location(route('cajera.prevale.index'));
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error aprobando prevale ID ' . $id . ': ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error crítico: ' . $e->getMessage()]);
        }
    }

    public function rechazar(Request $request, $id)
    {
        $request->validate([
            'motivo_rechazo' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $vale   = Vale::where('id', $id)->where('estado', Vale::ESTADO_BORRADOR)->firstOrFail();
            $cliente = $vale->cliente;
            $motivo  = $request->motivo_rechazo;

            if (!$cliente) {
                throw new \Exception('No se encontró el cliente asociado a este vale.');
            }

            // 1. Vale: BORRADOR -> CANCELADO
            $vale->estado      = Vale::ESTADO_CANCELADO;
            $vale->notas       = "RECHAZADO POR CAJERA: " . $motivo;
            $vale->cancelado_en = now();
            $vale->save();

            // Nota: NO se devuelve crédito porque nunca se descontó al crear el BORRADOR.
            // El crédito solo se descuenta en aprobar(), no al crear el prevale.

            // 2. Cliente: EN_VERIFICACION -> BLOQUEADO
            $cliente->estado = Cliente::ESTADO_BLOQUEADO;
            $cliente->notas  = "Rechazado en etapa de prevale: " . $motivo;
            $cliente->save();

            // 3. Pivot
            $esParentesco = str_contains(strtolower($motivo), 'parentesco')
                || str_contains(strtolower($motivo), 'familiar');

            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $vale->distribuidora_id,
                    'cliente_id'       => $cliente->id,
                ],
                [
                    'estado_relacion'          => 'BLOQUEADA',
                    'prevale_aprobado'         => false,
                    'bloqueado_por_parentesco' => $esParentesco,
                    'observaciones_parentesco' => "Bloqueado en revisión de prevale. Motivo: " . $motivo,
                    'vinculado_en'             => now(),
                ]
            );

            DB::commit();

            return redirect()->route('cajera.prevale.index')
                ->with('error', 'Prevale rechazado. Se canceló el vale y se bloqueó el expediente del cliente.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Ocurrió un error al rechazar el prevale: ' . $e->getMessage()]);
        }
    }
}
