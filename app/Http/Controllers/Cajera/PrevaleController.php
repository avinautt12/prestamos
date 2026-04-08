<?php

namespace App\Http\Controllers\Cajera;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Solicitud;

class PrevaleController extends Controller
{
    public function index(Request $request)
    {
        // Esta es la lista que se debería abrir al picar la tarjeta
        $solicitudes = Solicitud::with(['persona', 'sucursal'])
            ->whereIn('estado', [
                Solicitud::ESTADO_VERIFICADA, 
                Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA
            ])
            ->where('prevale_aprobado', false)
            ->orderBy('actualizado_en', 'desc')
            ->paginate(10);

        return Inertia::render('Cajera/Prevale/Index', [
            'solicitudes' => $solicitudes,
            'filtros' => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        // Aquí ves el expediente
        $solicitud = Solicitud::with(['persona', 'cuentaBancaria', 'sucursal'])->findOrFail($id);
        
        return Inertia::render('Cajera/Prevale/Show', [
            'solicitud' => $solicitud
        ]);
    }

    public function aprobar(Request $request, $id)
    {
        $request->validate([
            'folio_transferencia' => 'required|string',
        ]);

        $solicitud = Solicitud::findOrFail($id);
        $solicitud->prevale_aprobado = true;
        $solicitud->estado = Solicitud::ESTADO_APROBADA; // O el estado que decidas
        $solicitud->save();

        // Aquí iría tu lógica extra (crear la distribuidora activa, etc.)

        return redirect()->route('cajera.prevale.index')->with('message', 'Prevale fondeado y aprobado exitosamente.');
    }

    public function rechazar(Request $request, $id)
    {
        $request->validate([
            'motivo_rechazo' => 'required|string',
        ]);

        $solicitud = Solicitud::findOrFail($id);
        $solicitud->estado = Solicitud::ESTADO_MODIFICADA; // Lo regresas
        $solicitud->observaciones_validacion = $request->motivo_rechazo;
        $solicitud->save();

        return redirect()->route('cajera.prevale.index')->with('error', 'Prevale rechazado y devuelto por correcciones.');
    }
}