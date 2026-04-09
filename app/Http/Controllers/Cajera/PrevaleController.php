<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Vale;
use App\Models\Cliente; 

class PrevaleController extends Controller
{
    public function index(Request $request)
    {
        // Traemos solo los VALES en estado BORRADOR (nuestros Prevales)
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
        ])->findOrFail($id);
        
        return Inertia::render('Cajera/Prevale/Show', [
            'vale' => $vale
        ]);
    }

    public function aprobar(Request $request, $id)
    {
        // Candados estrictos ampliados: Anti-fraude y PLD
        $request->validate([
            'check_identidad' => 'accepted',
            'check_direccion' => 'accepted',
            'check_parentesco' => 'accepted',
            'check_selfie' => 'accepted', 
            'check_vigencia' => 'accepted', 
            'check_titular_cuenta' => 'accepted', 
        ], [
            'accepted' => 'Debes confirmar esta verificación para continuar.'
        ]);

        try {
            DB::beginTransaction();

            $vale = Vale::findOrFail($id);
            $distribuidora = $vale->distribuidora;
            $cliente = $vale->cliente;

            if (!$distribuidora || !$cliente) {
                throw new \Exception('No se encontraron las referencias de cliente o distribuidora.');
            }

            $montoPrestamo = $vale->productoFinanciero ? $vale->productoFinanciero->monto_principal : $vale->monto_principal;

            // Validar Crédito
            if ($distribuidora->credito_disponible < $montoPrestamo) {
                return back()->withErrors(['error' => 'La distribuidora no tiene crédito suficiente para este vale.']);
            }

            // 1. Descontar Crédito a la Distribuidora
            $distribuidora->credito_disponible -= $montoPrestamo;
            $distribuidora->save();

            // 2. Activar Vale (De BORRADOR a ACTIVO)
            $vale->estado = Vale::ESTADO_ACTIVO;
            $vale->aprobado_por_usuario_id = Auth::id(); 
            $vale->notas = "Verificación completa (Identidad, Dirección, Parentesco, Prueba de Vida, Vigencia y Titularidad) realizada por la Cajera.";
            $vale->save();

            // 3. Activar Cliente (De EN_VERIFICACION a ACTIVO)
            $cliente->estado = Cliente::ESTADO_ACTIVO; 
            $cliente->save();

            // 4. Vincular formalmente a la distribuidora
            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $distribuidora->id,
                    'cliente_id' => $cliente->id,
                ],
                [
                    'estado_relacion' => 'ACTIVA',
                    'bloqueado_por_parentesco' => false,
                    'vinculado_en' => now(),
                    'desvinculado_en' => null,
                ]
            );

            DB::commit();

            return redirect()->route('cajera.prevale.index')
                ->with('message', 'Prevale aprobado. El Cliente y el Vale ahora están ACTIVOS y el monto fue descontado.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Ocurrió un error al procesar el prevale: ' . $e->getMessage()]);
        }
    }

    public function rechazar(Request $request, $id)
    {
        $request->validate([
            'motivo_rechazo' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $vale = Vale::findOrFail($id);
            $cliente = $vale->cliente;
            $motivo = $request->motivo_rechazo;

            if (!$cliente) {
                 throw new \Exception('No se encontró el cliente asociado a este vale.');
            }

            // 1. Rechazar Vale (De BORRADOR a RECHAZADO / CANCELADO)
            // Asegúrate de que el modelo Vale tenga esta constante, usualmente es CANCELADO si no declaraste RECHAZADO explícitamente en tu enum de la BD. 
            // Si la BD dice 'CANCELADO', usamos esa. Si agregaste 'RECHAZADO' a tu migración, cambialo aquí.
            $vale->estado = Vale::ESTADO_CANCELADO; 
            $vale->notas = "RECHAZADO POR CAJERA: " . $motivo;
            $vale->cancelado_en = now();
            $vale->save();

            // 2. Bloquear Cliente
            $cliente->estado = Cliente::ESTADO_BLOQUEADO; // Marcamos como bloqueado por fraude o problemas en prevale
            $cliente->notas = "Rechazado en etapa de prevale: " . $motivo;
            $cliente->save();

            // 3. Registrar posible parentesco en la tabla pivot
            $esParentesco = str_contains(strtolower($motivo), 'parentesco') || str_contains(strtolower($motivo), 'familiar');

            DB::table('clientes_distribuidora')->updateOrInsert(
                [
                    'distribuidora_id' => $vale->distribuidora_id,
                    'cliente_id' => $cliente->id,
                ],
                [
                    'estado_relacion' => 'BLOQUEADA',
                    'bloqueado_por_parentesco' => $esParentesco,
                    'observaciones_parentesco' => "Bloqueado en revisión de prevale. Motivo: " . $motivo,
                    'vinculado_en' => now(),
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