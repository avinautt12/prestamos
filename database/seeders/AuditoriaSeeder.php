<?php

namespace Database\Seeders;

use App\Models\BitacoraAuditoria;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class AuditoriaSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::whereHas('roles', fn($q) => $q->where('codigo', 'ADMIN'))->first();
        $gerente = Usuario::whereHas('roles', fn($q) => $q->where('codigo', 'GERENTE'))->first();
        $cajera = Usuario::whereHas('roles', fn($q) => $q->where('codigo', 'CAJERA'))->first();
        
        $sucursal = Sucursal::first();

        $auditorias = [
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_LOGIN,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $admin,
                'sucursal' => null,
                'modulo' => BitacoraAuditoria::MODULO_AUTENTICACION,
                'descripcion' => 'Inicio de sesión exitoso',
                'datos_extra' => ['metodo' => 'password'],
                'creado_en' => now()->subDays(10),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_LOGIN,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $gerente,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_AUTENTICACION,
                'descripcion' => 'Inicio de sesión exitoso',
                'datos_extra' => ['metodo' => 'password'],
                'creado_en' => now()->subDays(9),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_CAMBIO_CONFIG,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $admin,
                'sucursal' => null,
                'modulo' => BitacoraAuditoria::MODULO_CONFIGURACION,
                'descripcion' => 'Actualización de configuración global de sucursales',
                'datos_extra' => [
                    'campos' => ['dia_corte', 'hora_corte', 'plazo_pago_dias'],
                    'valores_previos' => ['dia_corte' => 15, 'hora_corte' => '18:00:00', 'plazo_pago_dias' => 15],
                    'valores_nuevos' => ['dia_corte' => 20, 'hora_corte' => '19:00:00', 'plazo_pago_dias' => 14],
                ],
                'creado_en' => now()->subDays(8),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_CAMBIO_CONFIG,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $gerente,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_CONFIGURACION,
                'descripcion' => 'Cambio de categoría de distribuidora',
                'datos_extra' => [
                    'distribuidora_id' => 1,
                    'categoria_anterior' => 'PLATA',
                    'categoria_nueva' => 'ORO',
                ],
                'creado_en' => now()->subDays(7),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_APROBAR,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $gerente,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_APROBACIONES,
                'descripcion' => 'Aprobación de solicitud de nueva distribuidora',
                'datos_extra' => [
                    'solicitud_id' => 1,
                    'distribuidora_nombre' => 'Maria Lopez',
                    'limite_credito' => 25000.00,
                ],
                'creado_en' => now()->subDays(6),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_RECHAZAR,
                'nivel' => BitacoraAuditoria::NIVEL_WARNING,
                'usuario' => $gerente,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_APROBACIONES,
                'descripcion' => 'Rechazo de solicitud de distribuidora',
                'datos_extra' => [
                    'solicitud_id' => 2,
                    'motivo' => 'Documentación incompleta',
                ],
                'creado_en' => now()->subDays(5),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_CIERRE_CORTE,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $cajera,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_CORTE,
                'descripcion' => 'Cierre de corte manual',
                'datos_extra' => [
                    'corte_id' => 1,
                    'total_pagos' => 15000.00,
                    'numero_transacciones' => 12,
                ],
                'creado_en' => now()->subDays(4),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_ERROR_SISTEMA,
                'nivel' => BitacoraAuditoria::NIVEL_ERROR,
                'usuario' => $gerente,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_DISTRIBUIDORA,
                'descripcion' => 'Error al procesar pago: conexión fallida con banco',
                'datos_extra' => [
                    'distribuidora_id' => 3,
                    'codigo_error' => 'BANK_CONN_ERROR',
                    'intento_reintento' => 1,
                ],
                'creado_en' => now()->subDays(3),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_ERROR_SISTEMA,
                'nivel' => BitacoraAuditoria::NIVEL_WARNING,
                'usuario' => null,
                'sucursal' => null,
                'modulo' => BitacoraAuditoria::MODULO_REPORTES,
                'descripcion' => 'Error al generar reporte: timeout de base de datos',
                'datos_extra' => [
                    'reporte' => 'EstadoCuentaGlobal',
                    'timeout_seconds' => 30,
                ],
                'creado_en' => now()->subDays(2),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_CREAR,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $admin,
                'sucursal' => null,
                'modulo' => BitacoraAuditoria::MODULO_USUARIOS,
                'descripcion' => 'Creación de nuevo usuario',
                'datos_extra' => [
                    'usuario_id' => 100,
                    'nombre_usuario' => 'nuevo.verificador',
                    'rol' => 'VERIFICADOR',
                ],
                'creado_en' => now()->subDays(1),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_LOGOUT,
                'nivel' => BitacoraAuditoria::NIVEL_INFO,
                'usuario' => $admin,
                'sucursal' => null,
                'modulo' => BitacoraAuditoria::MODULO_AUTENTICACION,
                'descripcion' => 'Cierre de sesión',
                'datos_extra' => ['session_duration_minutes' => 120],
                'creado_en' => now()->subHours(2),
            ],
            [
                'tipo_evento' => BitacoraAuditoria::TIPO_ERROR_SISTEMA,
                'nivel' => BitacoraAuditoria::NIVEL_CRITICO,
                'usuario' => null,
                'sucursal' => $sucursal,
                'modulo' => BitacoraAuditoria::MODULO_CORTE,
                'descripcion' => 'Fallo crítico en proceso de corte: base de datos no responde',
                'datos_extra' => [
                    'corte_id' => null,
                    'exception' => 'Illuminate\\Database\\QueryException',
                    'sql_state' => 'HY000',
                ],
                'creado_en' => now()->subHours(1),
            ],
        ];

        foreach ($auditorias as $data) {
            BitacoraAuditoria::create([
                'tipo_evento' => $data['tipo_evento'],
                'nivel' => $data['nivel'],
                'usuario_id' => $data['usuario']?->id,
                'usuario_nombre' => $data['usuario']?->persona?->nombre_completo ?? $data['usuario']?->email ?? 'Sistema',
                'usuario_rol' => $data['usuario']?->rol_principal?->codigo,
                'sucursal_id' => $data['sucursal']?->id,
                'modulo' => $data['modulo'],
                'descripcion' => $data['descripcion'],
                'datos_extra' => $data['datos_extra'],
                'ip_address' => '192.168.1.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'creado_en' => $data['creado_en'],
            ]);
        }

        $this->command?->info('Auditorías creadas: ' . count($auditorias) . ' registros de ejemplo.');
    }
}