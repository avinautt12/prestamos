<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BitacoraAuditoria;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditoriaController extends Controller
{
    public function index(Request $request): Response
    {
        $query = BitacoraAuditoria::query()
            ->orderByDesc('creado_en');

        $tipo = $request->string('tipo')->toString();
        if ($tipo && $tipo !== 'todos') {
            $query->where('tipo_evento', $tipo);
        }

        $nivel = $request->string('nivel')->toString();
        if ($nivel && $nivel !== 'todos') {
            $query->where('nivel', $nivel);
        }

        $modulo = $request->string('modulo')->toString();
        if ($modulo && $modulo !== 'todos') {
            $query->where('modulo', $modulo);
        }

        $busqueda = $request->string('busqueda')->toString();
        if ($busqueda) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('descripcion', 'like', "%{$busqueda}%")
                  ->orWhere('usuario_nombre', 'like', "%{$busqueda}%");
            });
        }

        $fechaInicio = $request->string('fecha_inicio')->toString();
        $fechaFin = $request->string('fecha_fin')->toString();

        if ($fechaInicio) {
            $query->where('creado_en', '>=', Carbon::parse($fechaInicio)->startOfDay());
        }

        if ($fechaFin) {
            $query->where('creado_en', '<=', Carbon::parse($fechaFin)->endOfDay());
        }

        $perPage = $request->integer('per_page', 10);
        $auditorias = $query->paginate($perPage)->withQueryString();

        $tipos = BitacoraAuditoria::query()
            ->selectRaw('DISTINCT tipo_evento')
            ->pluck('tipo_evento');

        $niveles = [
            ['value' => BitacoraAuditoria::NIVEL_INFO, 'label' => 'Info'],
            ['value' => BitacoraAuditoria::NIVEL_WARNING, 'label' => 'Advertencia'],
            ['value' => BitacoraAuditoria::NIVEL_ERROR, 'label' => 'Error'],
            ['value' => BitacoraAuditoria::NIVEL_CRITICO, 'label' => 'Crítico'],
        ];

        $modulos = [
            ['value' => BitacoraAuditoria::MODULO_AUTENTICACION, 'label' => 'Autenticación'],
            ['value' => BitacoraAuditoria::MODULO_CONFIGURACION, 'label' => 'Configuración'],
            ['value' => BitacoraAuditoria::MODULO_CORTE, 'label' => 'Corte'],
            ['value' => BitacoraAuditoria::MODULO_DISTRIBUIDORA, 'label' => 'Distribuidora'],
            ['value' => BitacoraAuditoria::MODULO_USUARIOS, 'label' => 'Usuarios'],
            ['value' => BitacoraAuditoria::MODULO_SOLICITUDES, 'label' => 'Solicitudes'],
            ['value' => BitacoraAuditoria::MODULO_APROBACIONES, 'label' => 'Aprobaciones'],
            ['value' => BitacoraAuditoria::MODULO_REPORTES, 'label' => 'Reportes'],
        ];

        return Inertia::render('Admin/Auditorias', [
            'auditorias' => $auditorias,
            'filtros' => [
                'tipo' => $tipo,
                'nivel' => $nivel,
                'modulo' => $modulo,
                'busqueda' => $busqueda,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
            'opciones' => [
                'tipos' => $tipos->map(fn($v) => ['value' => $v, 'label' => $v]),
                'niveles' => $niveles,
                'modulos' => $modulos,
            ],
        ]);
    }
}