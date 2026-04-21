<?php

namespace App\Http\Controllers;

use App\Models\SolicitudPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PasswordAuthorizationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $query = SolicitudPassword::with(['usuario.persona', 'aprobadaPor.persona'])
            ->orderByRaw("FIELD(estado, 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'EXPIRADA')")
            ->orderBy('created_at', 'desc');

        if ($user->tieneRol('ADMIN')) {
            // Admin gets all
        } else {
            // Gerente Solo puede ver las solicitudes de los usuarios que pertenezcan a alguna de sus sucursales
            $sucursalesIds = $user->sucursales()->pluck('sucursales.id');
            $query->whereHas('usuario.sucursales', function ($q) use ($sucursalesIds) {
                $q->whereIn('sucursales.id', $sucursalesIds);
            });
        }

        $solicitudes = $query->paginate(20)->through(function ($item) {
            return [
                'id' => $item->id,
                'usuario' => $item->usuario->persona ? 
                             $item->usuario->persona->primer_nombre . ' ' . $item->usuario->persona->apellido_paterno : 
                             $item->usuario->nombre_usuario,
                'nombre_usuario' => $item->usuario->nombre_usuario,
                'rol_usuario' => $item->usuario->rol_nombre,
                'estado' => $item->estado,
                'creada_en' => $item->created_at->setTimezone('America/Mexico_City')->format('d/m/Y h:i A'),
                'expira_en' => $item->expira_en ? $item->expira_en->setTimezone('America/Mexico_City')->format('d/m/Y h:i A') : null,
                'aprobada_por' => $item->aprobadaPor ? 
                                  ($item->aprobadaPor->persona ? $item->aprobadaPor->persona->primer_nombre : $item->aprobadaPor->nombre_usuario) : null,
            ];
        });

        return Inertia::render('Admin/SolicitudesPassword', [
            'solicitudes' => $solicitudes
        ]);
    }

    public function aprobar(Request $request, $id)
    {
        $solicitud = SolicitudPassword::findOrFail($id);

        if ($solicitud->estado !== 'PENDIENTE') {
            return back()->with('error', 'Esta solicitud ya no está pendiente.');
        }

        DB::transaction(function () use ($solicitud) {
            // Generar token seguro de 60 chars
            $token = Str::random(60);
            
            $solicitud->update([
                'estado' => 'APROBADA',
                'aprobado_por_id' => Auth::user()->id,
                'token_generado' => $token,
                'expira_en' => now()->addMinutes(10),
            ]);

            // Enviar Correo Electrónico
            $correo = $solicitud->usuario->persona->correo_electronico ?? null;
            if ($correo) {
                Mail::to($correo)->send(new \App\Mail\PasswordResetMail($solicitud->usuario, $token));
            }
        });

        return back()->with('success', 'Se ha aprobado la solicitud y enviado el acceso seguro al correo del usuario exitosamente.');
    }

    public function rechazar(Request $request, $id)
    {
        $solicitud = SolicitudPassword::findOrFail($id);

        if ($solicitud->estado !== 'PENDIENTE') {
            return back()->with('error', 'Esta solicitud ya no está pendiente.');
        }

        $solicitud->update([
            'estado' => 'RECHAZADA',
            'aprobado_por_id' => Auth::user()->id,
        ]);

        return back()->with('success', 'Solicitud rechazada correctamente.');
    }

    public function aprobarTodas(Request $request)
    {
        $user = Auth::user();
        $query = SolicitudPassword::where('estado', 'PENDIENTE')->with('usuario.persona');

        if (!$user->tieneRol('ADMIN')) {
            $sucursalesIds = $user->sucursales()->pluck('sucursales.id');
            $query->whereHas('usuario.sucursales', function ($q) use ($sucursalesIds) {
                $q->whereIn('sucursales.id', $sucursalesIds);
            });
        }

        $solicitudes = $query->get();

        if ($solicitudes->isEmpty()) {
            return back()->with('info', 'No hay solicitudes pendientes para aprobar.');
        }

        $aprobados = 0;
        foreach ($solicitudes as $solicitud) {
            DB::transaction(function () use ($solicitud) {
                $token = Str::random(60);
                
                $solicitud->update([
                    'estado' => 'APROBADA',
                    'aprobado_por_id' => Auth::user()->id,
                    'token_generado' => $token,
                    'expira_en' => now()->addMinutes(10),
                ]);

                $correo = $solicitud->usuario->persona->correo_electronico ?? null;
                if ($correo) {
                    Mail::to($correo)->send(new \App\Mail\PasswordResetMail($solicitud->usuario, $token));
                }
            });
            $aprobados++;
        }

        return back()->with('success', "Se han aprobado $aprobados solicitudes y enviado los accesos seguros exitosamente.");
    }
}
