<?php

namespace App\Http\Controllers\Coordinador;

use App\Events\SolicitudPendienteVerificacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Coordinador\PreSolicitudRequest;
use App\Models\Distribuidora;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Usuario;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SolicitudController extends Controller
{
    /**
     * Muestra el formulario de nueva solicitud
     */
    public function create()
    {
        /** @var Usuario $usuario */
        $usuario = auth()->user();

        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

        return Inertia::render('Coordinador/Solicitudes/Create', [
            'sucursal' => $sucursal,
            'usuario' => $usuario
        ]);
    }

    /**
     * Guarda una nueva pre-solicitud
     */
    public function store(PreSolicitudRequest $request)
    {
        try {
            $usuario = auth()->user();

            // 1. Validar si la persona ya existe (por CURP)
            $persona = Persona::where('curp', $request->curp)->first();

            // Anti-duplicado: no permitir pre-solicitud si ya existe una distribuidora activa
            $esDistribuidoraActiva = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
                ->whereHas('persona', function ($query) use ($request) {
                    $query->where('curp', $request->curp)
                        ->orWhere('rfc', $request->rfc);
                })
                ->exists();

            if ($esDistribuidoraActiva) {
                return back()->withErrors([
                    'curp' => 'Esta persona ya está registrada como distribuidora activa'
                ]);
            }

            DB::beginTransaction();

            if ($persona) {
                // Verificar si tiene solicitudes activas o es moroso
                $solicitudActiva = Solicitud::where('persona_solicitante_id', $persona->id)
                    ->whereIn('estado', ['PRE', 'EN_REVISION', 'VERIFICADA', 'APROBADA'])
                    ->exists();

                if ($solicitudActiva) {
                    return back()->withErrors([
                        'curp' => 'Esta persona ya tiene una solicitud activa en el sistema'
                    ]);
                }

                // Actualizar datos de la persona
                $persona->update($request->only([
                    'primer_nombre',
                    'segundo_nombre',
                    'apellido_paterno',
                    'apellido_materno',
                    'sexo',
                    'fecha_nacimiento',
                    'rfc',
                    'telefono_personal',
                    'telefono_celular',
                    'correo_electronico',
                    'calle',
                    'numero_exterior',
                    'colonia',
                    'ciudad',
                    'estado',
                    'codigo_postal',
                    'latitud',
                    'longitud'
                ]));
            } else {
                // Crear nueva persona
                $persona = Persona::create($request->only([
                    'primer_nombre',
                    'segundo_nombre',
                    'apellido_paterno',
                    'apellido_materno',
                    'sexo',
                    'fecha_nacimiento',
                    'curp',
                    'rfc',
                    'telefono_personal',
                    'telefono_celular',
                    'correo_electronico',
                    'calle',
                    'numero_exterior',
                    'colonia',
                    'ciudad',
                    'estado',
                    'codigo_postal',
                    'latitud',
                    'longitud'
                ]));
            }

            /** @var Usuario $usuario */
            // 2. Obtener la sucursal activa del coordinador
            $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

            if (!$sucursal) {
                throw new \Exception('No tienes una sucursal activa asignada para el rol de coordinador');
            }

            // 3. Crear la solicitud
            $solicitud = Solicitud::create([
                'persona_solicitante_id' => $persona->id,
                'sucursal_id' => $sucursal->id,
                'capturada_por_usuario_id' => $usuario->id,
                'coordinador_usuario_id' => $usuario->id,
                'estado' => 'PRE',
                'limite_credito_solicitado' => $request->limite_credito_solicitado,
                'datos_familiares_json' => $request->has('familiares') ? json_encode($request->familiares) : null,
                'afiliaciones_externas_json' => $request->has('afiliaciones') ? json_encode($request->afiliaciones) : null,
                'vehiculos_json' => $request->has('vehiculos') ? json_encode($request->vehiculos) : null,
                'enviada_en' => now(),
                'observaciones_validacion' => $request->observaciones,
            ]);

            // 4. Disparar evento para notificar al verificador
            // event(new SolicitudCreadaEvent($solicitud));

            // 5. Registrar log
            Log::info('Nueva solicitud creada', [
                'solicitud_id' => $solicitud->id,
                'coordinador_id' => $usuario->id,
                'persona_id' => $persona->id
            ]);

            DB::commit();

            return redirect()->route('coordinador.solicitudes.index')
                ->with('success', 'Solicitud guardada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al guardar solicitud: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Error al guardar la solicitud: ' . $e->getMessage()]);
        }
    }

    /**
     * Muestra el listado de solicitudes del coordinador
     */
    public function index(Request $request)
    {
        $usuario = auth()->user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $solicitudes = Solicitud::with(['persona', 'sucursal'])
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('persona', function ($q) use ($search) {
                    $q->where('primer_nombre', 'LIKE', "%{$search}%")
                        ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                        ->orWhere('curp', 'LIKE', "%{$search}%");
                });
            })
            ->when($request->estado, function ($query, $estado) {
                $query->where('estado', $estado);
            })
            ->orderBy('creado_en', 'desc')
            ->paginate(10)
            ->appends($request->query());

        return Inertia::render('Coordinador/Solicitudes/Index', [
            'solicitudes' => $solicitudes,
            'filters' => $request->only(['search', 'estado'])
        ]);
    }

    /**
     * Muestra los detalles de una solicitud específica
     */
    public function show($id)
    {
        $usuario = auth()->user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $solicitud = Solicitud::with(['persona', 'sucursal', 'capturador', 'verificacion'])
            ->where('id', $id)
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->firstOrFail();

        // Decodificar JSONs
        $solicitud->datos_familiares = $solicitud->datos_familiares_json ? json_decode($solicitud->datos_familiares_json, true) : null;
        $solicitud->afiliaciones = $solicitud->afiliaciones_externas_json ? json_decode($solicitud->afiliaciones_externas_json, true) : null;
        $solicitud->vehiculos = $solicitud->vehiculos_json ? json_decode($solicitud->vehiculos_json, true) : null;

        if ($solicitud->verificacion) {
            $spacesUrl = rtrim((string) config('filesystems.disks.spaces.url'), '/');

            $solicitud->verificacion->foto_fachada_url = $solicitud->verificacion->foto_fachada
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_fachada, '/')
                : null;
            $solicitud->verificacion->foto_ine_con_persona_url = $solicitud->verificacion->foto_ine_con_persona
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_ine_con_persona, '/')
                : null;
            $solicitud->verificacion->foto_comprobante_url = $solicitud->verificacion->foto_comprobante
                ? $spacesUrl . '/' . ltrim($solicitud->verificacion->foto_comprobante, '/')
                : null;
        }

        return Inertia::render('Coordinador/Solicitudes/Show', [
            'solicitud' => $solicitud,
            'edit_url' => route('coordinador.solicitudes.edit', $solicitud->id)
        ]);
    }

    /**
     * Actualiza una solicitud existente
     */
    public function update(PreSolicitudRequest $request, $id)
    {
        try {
            DB::beginTransaction();

            $usuario = auth()->user();
            $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
            $sucursalId = $sucursal?->id;

            $solicitud = Solicitud::where('id', $id)
                ->where(function ($query) use ($usuario, $sucursalId) {
                    $query->where('coordinador_usuario_id', $usuario->id);

                    if ($sucursalId) {
                        $query->orWhere('sucursal_id', $sucursalId);
                    }
                })
                ->firstOrFail();

            // Solo permitir actualizar si está en estado PRE o RECHAZADA
            if (!in_array($solicitud->estado, ['PRE', 'RECHAZADA'])) {
                DB::rollBack();
                return back()->withErrors(['error' => 'No se puede modificar una solicitud en proceso de verificación']);
            }

            // Actualizar persona
            $persona = $solicitud->persona;
            $persona->update($request->only([
                'primer_nombre',
                'segundo_nombre',
                'apellido_paterno',
                'apellido_materno',
                'sexo',
                'fecha_nacimiento',
                'rfc',
                'telefono_personal',
                'telefono_celular',
                'correo_electronico',
                'calle',
                'numero_exterior',
                'colonia',
                'ciudad',
                'estado',
                'codigo_postal',
                'latitud',
                'longitud'
            ]));

            // Actualizar solicitud
            $solicitud->update([
                'limite_credito_solicitado' => $request->limite_credito_solicitado,
                'datos_familiares_json' => $request->has('familiares') ? json_encode($request->familiares) : null,
                'afiliaciones_externas_json' => $request->has('afiliaciones') ? json_encode($request->afiliaciones) : null,
                'vehiculos_json' => $request->has('vehiculos') ? json_encode($request->vehiculos) : null,
                'observaciones_validacion' => $request->observaciones,
            ]);

            DB::commit();

            return redirect()->route('coordinador.solicitudes.show', $solicitud->id)
                ->with('success', 'Solicitud actualizada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar solicitud: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Error al actualizar la solicitud']);
        }
    }

    /**
     * Muestra el formulario de edición de una solicitud
     */
    public function edit($id)
    {
        /** @var Usuario $usuario */
        $usuario = auth()->user();
        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
        $sucursalId = $sucursal?->id;

        $solicitud = Solicitud::with(['persona'])
            ->where('id', $id)
            ->where(function ($query) use ($usuario, $sucursalId) {
                $query->where('coordinador_usuario_id', $usuario->id);

                if ($sucursalId) {
                    $query->orWhere('sucursal_id', $sucursalId);
                }
            })
            ->firstOrFail();

        // Solo permitir editar si está en PRE o RECHAZADA
        if (!in_array($solicitud->estado, ['PRE', 'RECHAZADA'])) {
            return redirect()->route('coordinador.solicitudes.show', $solicitud->id)
                ->with('error', 'No se puede editar una solicitud en proceso de verificación');
        }

        $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

        // Preparar datos para el formulario
        $formData = [
            // Datos personales
            'primer_nombre' => $solicitud->persona->primer_nombre,
            'segundo_nombre' => $solicitud->persona->segundo_nombre,
            'apellido_paterno' => $solicitud->persona->apellido_paterno,
            'apellido_materno' => $solicitud->persona->apellido_materno,
            'sexo' => $solicitud->persona->sexo,
            'fecha_nacimiento' => $solicitud->persona->fecha_nacimiento,
            'curp' => $solicitud->persona->curp,
            'rfc' => $solicitud->persona->rfc,
            'telefono_personal' => $solicitud->persona->telefono_personal,
            'telefono_celular' => $solicitud->persona->telefono_celular,
            'correo_electronico' => $solicitud->persona->correo_electronico,
            'limite_credito_solicitado' => $solicitud->limite_credito_solicitado,

            // Domicilio
            'calle' => $solicitud->persona->calle,
            'numero_exterior' => $solicitud->persona->numero_exterior,
            'numero_interior' => $solicitud->persona->numero_interior,
            'colonia' => $solicitud->persona->colonia,
            'ciudad' => $solicitud->persona->ciudad,
            'estado' => $solicitud->persona->estado,
            'codigo_postal' => $solicitud->persona->codigo_postal,
            'latitud' => $solicitud->persona->latitud,
            'longitud' => $solicitud->persona->longitud,

            // Datos familiares
            'familiares' => $solicitud->datos_familiares_json,

            // Referencias laborales
            'afiliaciones' => $solicitud->afiliaciones_externas_json,

            // Vehículos
            'vehiculos' => $solicitud->vehiculos_json,

            // Observaciones
            'observaciones' => $solicitud->observaciones_validacion,
        ];

        return Inertia::render('Coordinador/Solicitudes/Create', [
            'sucursal' => $sucursal,
            'usuario' => $usuario,
            'solicitud' => $solicitud,
            'formData' => $formData,
            'isEditing' => true
        ]);
    }
    /**
     * Envía la solicitud a verificación
     */
    public function enviarVerificacion($id)
    {
        try {
            DB::beginTransaction();

            $usuario = auth()->user();
            $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);
            $sucursalId = $sucursal?->id;

            $solicitud = Solicitud::where('id', $id)
                ->where(function ($query) use ($usuario, $sucursalId) {
                    $query->where('coordinador_usuario_id', $usuario->id);

                    if ($sucursalId) {
                        $query->orWhere('sucursal_id', $sucursalId);
                    }
                })
                ->firstOrFail();

            if ($solicitud->estado !== 'PRE') {
                DB::rollBack();
                return back()->withErrors(['error' => 'La solicitud ya fue enviada a verificación']);
            }

            // Validar que tenga todos los campos obligatorios
            if (!$this->validarCamposObligatorios($solicitud)) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Faltan campos obligatorios por llenar']);
            }

            $solicitud->update([
                'estado' => 'EN_REVISION',
                'enviada_en' => now()
            ]);

            $clienteNombre = trim(implode(' ', array_filter([
                $solicitud->persona?->primer_nombre,
                $solicitud->persona?->apellido_paterno,
                $solicitud->persona?->apellido_materno,
            ])));

            if ($solicitud->sucursal_id) {
                DB::afterCommit(function () use ($solicitud, $clienteNombre) {
                    event(new SolicitudPendienteVerificacion(
                        (int) $solicitud->sucursal_id,
                        (int) $solicitud->id,
                        $clienteNombre !== '' ? $clienteNombre : 'Cliente'
                    ));
                });
            }

            DB::commit();

            return redirect()->route('coordinador.solicitudes.index')
                ->with('success', 'Solicitud enviada a verificación correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al enviar solicitud a verificación: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Error al enviar la solicitud']);
        }
    }

    /**
     * Valida que la solicitud tenga los campos obligatorios
     */
    private function validarCamposObligatorios($solicitud)
    {
        $persona = $solicitud->persona;

        // Campos obligatorios
        $required = [
            $persona->curp,
            $persona->rfc,
            $persona->primer_nombre,
            $persona->apellido_paterno,
            $persona->telefono_celular,
            $persona->calle,
            $persona->colonia,
            $persona->codigo_postal
        ];

        foreach ($required as $field) {
            if (empty($field)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtiene la sucursal activa asociada al rol COORDINADOR del usuario.
     */
    private function obtenerSucursalActivaCoordinador(Usuario $usuario): ?Sucursal
    {
        $rolCoordinador = $usuario->roles()
            ->where('roles.codigo', 'COORDINADOR')
            ->wherePivotNull('revocado_en')
            ->whereNotNull('usuario_rol.sucursal_id')
            ->orderByDesc('usuario_rol.es_principal')
            ->orderByDesc('usuario_rol.asignado_en')
            ->first();

        if ($rolCoordinador && $rolCoordinador->pivot?->sucursal_id) {
            return Sucursal::find($rolCoordinador->pivot->sucursal_id);
        }

        // Fallback para entornos donde el usuario tiene rol pero sin sucursal_id en pivote.
        return Sucursal::where('activo', true)->orderBy('id')->first();
    }
}
