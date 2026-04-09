<?php

namespace Database\Seeders;

use App\Models\CategoriaDistribuidora;
use App\Models\Cliente;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\VerificacionesSolicitud;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatosPruebaAmpliosSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = $this->crearSucursales();
        $roles = Rol::query()->pluck('id', 'codigo');
        $categorias = CategoriaDistribuidora::query()->pluck('id', 'codigo');

        if ($roles->isEmpty()) {
            $this->command?->warn('No hay roles cargados. Ejecuta RolesSeeder antes.');
            return;
        }

        if ($categorias->isEmpty()) {
            $this->command?->warn('No hay categorias cargadas. Ejecuta CategoriasDistribuidoraSeeder antes.');
            return;
        }

        $usuariosPorSucursal = [];
        foreach ($sucursales as $sucursal) {
            $usuariosPorSucursal[$sucursal->id] = $this->crearEquipoPorSucursal($sucursal, $roles->all());
        }

        $solicitudes = $this->crearSolicitudesConVerificacion($sucursales, $usuariosPorSucursal);
        $this->crearDistribuidorasYClientes($solicitudes, $usuariosPorSucursal, $categorias->all());

        $this->command?->info('DatosPruebaAmpliosSeeder completado: sucursales, equipo operativo, solicitudes, distribuidoras y clientes listos.');
    }

    private function crearSucursales()
    {
        $base = [
            [
                'codigo' => 'SUC-TRC-CENTRO',
                'nombre' => 'Sucursal Torreon Centro',
                'direccion_texto' => 'Av. Hidalgo 450 Sur, Centro, Torreon, Coahuila, Mexico',
                'telefono' => '8711000000',
            ],
            [
                'codigo' => 'SUC-TRC-ORIENTE',
                'nombre' => 'Sucursal Torreon Oriente',
                'direccion_texto' => 'Blvd. Revolucion 3200 Ote, Torreon, Coahuila, Mexico',
                'telefono' => '8711000001',
            ],
            [
                'codigo' => 'SUC-SALTILLO',
                'nombre' => 'Sucursal Saltillo Centro',
                'direccion_texto' => 'Calle Allende 210, Centro, Saltillo, Coahuila, Mexico',
                'telefono' => '8441000000',
            ],
            [
                'codigo' => 'SUC-MONCLOVA',
                'nombre' => 'Sucursal Monclova',
                'direccion_texto' => 'Blvd. Pape 1600, Monclova, Coahuila, Mexico',
                'telefono' => '8661000000',
            ],
        ];

        $sucursales = collect();
        foreach ($base as $item) {
            $sucursales->push(Sucursal::query()->updateOrCreate(
                ['codigo' => $item['codigo']],
                [
                    'nombre' => $item['nombre'],
                    'direccion_texto' => $item['direccion_texto'],
                    'telefono' => $item['telefono'],
                    'activo' => true,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            ));
        }

        return $sucursales;
    }

    private function crearEquipoPorSucursal(Sucursal $sucursal, array $roles): array
    {
        $config = [
            ['prefix' => 'gerente', 'rol' => 'GERENTE', 'sexo' => 'M', 'nombre' => 'Gerente'],
            ['prefix' => 'coordinador', 'rol' => 'COORDINADOR', 'sexo' => 'F', 'nombre' => 'Coordinador'],
            ['prefix' => 'verificador', 'rol' => 'VERIFICADOR', 'sexo' => 'M', 'nombre' => 'Verificador'],
            ['prefix' => 'cajera', 'rol' => 'CAJERA', 'sexo' => 'F', 'nombre' => 'Cajera'],
        ];

        $usuarios = [];
        foreach ($config as $i => $item) {
            $usuarioBase = null;
            if ($sucursal->codigo === 'SUC-TRC-CENTRO') {
                $usuarioBase = Usuario::query()
                    ->where('nombre_usuario', strtolower($item['prefix']))
                    ->first();
            }

            if ($usuarioBase) {
                DB::table('usuario_rol')->updateOrInsert(
                    [
                        'usuario_id' => $usuarioBase->id,
                        'rol_id' => $roles[$item['rol']],
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'asignado_en' => now(),
                        'revocado_en' => null,
                        'es_principal' => true,
                    ]
                );

                $usuarios[$item['rol']] = $usuarioBase;
                continue;
            }

            $username = strtolower($item['prefix'] . '_' . $sucursal->codigo);
            $correo = $username . '@prestamofacil.com';

            $persona = Persona::query()->updateOrCreate(
                ['correo_electronico' => $correo],
                [
                    'primer_nombre' => $item['nombre'],
                    'apellido_paterno' => 'Demo',
                    'apellido_materno' => $sucursal->codigo,
                    'sexo' => $item['sexo'],
                    'curp' => $this->curpFicticia(strtoupper(substr($item['rol'], 0, 3)), $sucursal->id, $i + 1),
                    'telefono_celular' => $this->telefonoBySucursal($sucursal->codigo, $i + 10),
                    'calle' => 'Zona Centro',
                    'numero_exterior' => (string) (100 + $i),
                    'colonia' => 'Centro',
                    'ciudad' => str_contains($sucursal->codigo, 'TRC') ? 'Torreon' : (str_contains($sucursal->codigo, 'SALTILLO') ? 'Saltillo' : 'Monclova'),
                    'estado' => 'Coahuila',
                    'codigo_postal' => str_contains($sucursal->codigo, 'TRC') ? '27000' : (str_contains($sucursal->codigo, 'SALTILLO') ? '25000' : '25700'),
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            $usuario = Usuario::query()->updateOrCreate(
                ['nombre_usuario' => $username],
                [
                    'persona_id' => $persona->id,
                    'clave_hash' => Hash::make('password123'),
                    'activo' => true,
                    'requiere_vpn' => $item['rol'] === 'GERENTE',
                    'canal_login' => 'WEB',
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );

            DB::table('usuario_rol')->updateOrInsert(
                [
                    'usuario_id' => $usuario->id,
                    'rol_id' => $roles[$item['rol']],
                    'sucursal_id' => $sucursal->id,
                ],
                [
                    'asignado_en' => now(),
                    'revocado_en' => null,
                    'es_principal' => true,
                ]
            );

            $usuarios[$item['rol']] = $usuario;
        }

        return $usuarios;
    }

    private function crearSolicitudesConVerificacion($sucursales, array $usuariosPorSucursal)
    {
        $solicitudes = collect();

        foreach ($sucursales as $sucursal) {
            $usuarios = $usuariosPorSucursal[$sucursal->id];

            for ($i = 1; $i <= 4; $i++) {
                $correo = 'solicitud_' . strtolower($sucursal->codigo) . '_' . $i . '@prestamofacil.com';

                $persona = Persona::query()->updateOrCreate(
                    ['correo_electronico' => $correo],
                    [
                        'primer_nombre' => 'Prospecto' . $i,
                        'apellido_paterno' => 'Sucursal',
                        'apellido_materno' => $sucursal->codigo,
                        'sexo' => $i % 2 === 0 ? 'M' : 'F',
                        'curp' => $this->curpFicticia('SOL', $sucursal->id, $i),
                        'telefono_celular' => $this->telefonoBySucursal($sucursal->codigo, 30 + $i),
                        'calle' => 'Av Principal',
                        'numero_exterior' => (string) (200 + $i),
                        'colonia' => 'Centro',
                        'ciudad' => str_contains($sucursal->codigo, 'TRC') ? 'Torreon' : (str_contains($sucursal->codigo, 'SALTILLO') ? 'Saltillo' : 'Monclova'),
                        'estado' => 'Coahuila',
                        'codigo_postal' => str_contains($sucursal->codigo, 'TRC') ? '27000' : (str_contains($sucursal->codigo, 'SALTILLO') ? '25000' : '25700'),
                        'latitud' => str_contains($sucursal->codigo, 'TRC') ? 25.54 + ($i * 0.001) : 25.42 + ($i * 0.001),
                        'longitud' => str_contains($sucursal->codigo, 'TRC') ? -103.40 - ($i * 0.001) : -100.99 - ($i * 0.001),
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $estado = match ($i) {
                    1 => Solicitud::ESTADO_EN_REVISION,
                    2 => Solicitud::ESTADO_VERIFICADA,
                    3 => Solicitud::ESTADO_APROBADA,
                    default => Solicitud::ESTADO_PRE,
                };

                $solicitud = Solicitud::query()->updateOrCreate(
                    [
                        'persona_solicitante_id' => $persona->id,
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'capturada_por_usuario_id' => $usuarios['COORDINADOR']->id,
                        'coordinador_usuario_id' => $usuarios['COORDINADOR']->id,
                        'verificador_asignado_id' => $usuarios['VERIFICADOR']->id,
                        'estado' => $estado,
                        'categoria_inicial_codigo' => 'COBRE',
                        'limite_credito_solicitado' => 3000 + ($i * 1000),
                        'datos_familiares_json' => json_encode(['dependientes' => $i]),
                        'afiliaciones_externas_json' => json_encode(['ingreso_aprox' => 4500 + ($i * 500)]),
                        'vehiculos_json' => json_encode(['tiene_vehiculo' => $i % 2 === 0]),
                        'resultado_buro' => $estado === Solicitud::ESTADO_APROBADA ? 'Apto / Buen historial' : 'SIN_REPORTE',
                        'prevale_aprobado' => $i >= 2,
                        'fotos_casa_completas' => $i >= 2,
                        'enviada_en' => now()->subDays(5 - $i),
                        'tomada_en' => now()->subDays(6 - $i),
                        'revisada_en' => $i >= 2 ? now()->subDays(4 - $i) : null,
                        'decidida_en' => $estado === Solicitud::ESTADO_APROBADA ? now()->subDays(1) : null,
                    ]
                );

                if (in_array($estado, [Solicitud::ESTADO_VERIFICADA, Solicitud::ESTADO_APROBADA], true)) {
                    VerificacionesSolicitud::query()->updateOrCreate(
                        ['solicitud_id' => $solicitud->id],
                        [
                            'verificador_usuario_id' => $usuarios['VERIFICADOR']->id,
                            'resultado' => VerificacionesSolicitud::RESULTADO_VERIFICADA,
                            'observaciones' => 'Validacion correcta para pruebas de flujo.',
                            'latitud_verificacion' => $persona->latitud,
                            'longitud_verificacion' => $persona->longitud,
                            'fecha_visita' => now()->subDays(2),
                            'checklist_json' => json_encode([
                                'domicilio_correcto' => true,
                                'persona_identificada' => true,
                                'vehiculos_visibles' => true,
                                'documentos_validos' => true,
                            ]),
                            'distancia_metros' => 35.50,
                            'creado_en' => now(),
                            'actualizado_en' => now(),
                        ]
                    );
                }

                $solicitudes->push($solicitud);
            }
        }

        return $solicitudes;
    }

    private function crearDistribuidorasYClientes($solicitudes, array $usuariosPorSucursal, array $categorias): void
    {
        $aprobadas = $solicitudes->filter(fn(Solicitud $s) => $s->estado === Solicitud::ESTADO_APROBADA)->values();

        foreach ($aprobadas as $index => $solicitud) {
            $categoriaId = array_values($categorias)[$index % max(1, count($categorias))];
            $numero = 'DIST-' . $solicitud->sucursal_id . '-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);

            $distribuidora = Distribuidora::query()->updateOrCreate(
                ['persona_id' => $solicitud->persona_solicitante_id],
                [
                    'solicitud_id' => $solicitud->id,
                    'sucursal_id' => $solicitud->sucursal_id,
                    'coordinador_usuario_id' => $solicitud->coordinador_usuario_id,
                    'categoria_id' => $categoriaId,
                    'numero_distribuidora' => $numero,
                    'estado' => Distribuidora::ESTADO_ACTIVA,
                    'limite_credito' => 8000,
                    'credito_disponible' => 8000,
                    'sin_limite' => false,
                    'puntos_actuales' => 0,
                    'puede_emitir_vales' => true,
                    'activada_en' => now()->subDays(1),
                ]
            );

            for ($c = 1; $c <= 4; $c++) {
                $correo = 'cliente_' . $distribuidora->id . '_' . $c . '@prestamofacil.com';

                $personaCliente = Persona::query()->updateOrCreate(
                    ['correo_electronico' => $correo],
                    [
                        'primer_nombre' => 'Cliente' . $c,
                        'apellido_paterno' => 'Dist' . $distribuidora->id,
                        'apellido_materno' => 'Prueba',
                        'sexo' => $c % 2 === 0 ? 'F' : 'M',
                        'curp' => $this->curpFicticia('CLI', $distribuidora->id, $c),
                        'telefono_celular' => '87155' . str_pad((string) (($distribuidora->id * 10) + $c), 5, '0', STR_PAD_LEFT),
                        'calle' => 'Calle Cliente',
                        'numero_exterior' => (string) (400 + $c),
                        'colonia' => 'Centro',
                        'ciudad' => 'Torreon',
                        'estado' => 'Coahuila',
                        'codigo_postal' => '27000',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                $cliente = Cliente::query()->updateOrCreate(
                    ['persona_id' => $personaCliente->id],
                    [
                        'codigo_cliente' => 'CLI-' . str_pad((string) $personaCliente->id, 6, '0', STR_PAD_LEFT),
                        'estado' => Cliente::ESTADO_ACTIVO,
                        'notas' => 'Cliente de datos de prueba amplios',
                        'creado_en' => now(),
                        'actualizado_en' => now(),
                    ]
                );

                DB::table('clientes_distribuidora')->updateOrInsert(
                    [
                        'distribuidora_id' => $distribuidora->id,
                        'cliente_id' => $cliente->id,
                    ],
                    [
                        'estado_relacion' => 'ACTIVA',
                        'bloqueado_por_parentesco' => false,
                        'observaciones_parentesco' => null,
                        'vinculado_en' => now(),
                        'desvinculado_en' => null,
                    ]
                );
            }
        }
    }

    private function telefonoBySucursal(string $codigo, int $indice): string
    {
        $prefijo = str_contains($codigo, 'TRC') ? '871' : (str_contains($codigo, 'SALTILLO') ? '844' : '866');
        return $prefijo . '2' . str_pad((string) $indice, 6, '0', STR_PAD_LEFT);
    }

    private function curpFicticia(string $prefijo, int $a, int $b): string
    {
        $base = strtoupper($prefijo) . str_pad((string) $a, 3, '0', STR_PAD_LEFT) . str_pad((string) $b, 3, '0', STR_PAD_LEFT) . 'HCL';
        return substr(str_pad($base . 'X9', 18, '0'), 0, 18);
    }
}
