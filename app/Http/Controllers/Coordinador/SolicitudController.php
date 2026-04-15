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
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

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

        ini_set('max_execution_time', 120);

        try {
            Log::info('¿Qué archivos llegaron a Laravel?', [
                'archivos' => $request->allFiles(),
                'ine_frente_valido' => $request->hasFile('ine_frente') ? $request->file('ine_frente')->isValid() : false
            ]);

            $usuario = auth()->user();

            $persona = Persona::where('curp', $request->curp)
                ->orWhere('rfc', $request->rfc)
                ->first();

            $esDistribuidoraActiva = Distribuidora::where('estado', Distribuidora::ESTADO_ACTIVA)
                ->where(function ($query) use ($persona) {
                    if ($persona) {
                        $query->where('persona_id', $persona->id);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                })
                ->exists();

            if ($esDistribuidoraActiva) {
                return back()->withErrors([
                    'curp' => 'Esta persona ya está registrada como distribuidora activa'
                ]);
            }

            DB::beginTransaction();

            if ($persona) {
                $solicitudActiva = Solicitud::where('persona_solicitante_id', $persona->id)
                    ->whereIn('estado', ['PRE', 'EN_REVISION', 'VERIFICADA', 'APROBADA'])
                    ->exists();

                if ($solicitudActiva) {
                    DB::rollBack();
                    return back()->withErrors([
                        'curp' => 'Esta persona ya tiene una solicitud activa en el sistema'
                    ]);
                }

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

            $sucursal = $this->obtenerSucursalActivaCoordinador($usuario);

            if (!$sucursal) {
                throw new \Exception('No tienes una sucursal activa asignada para el rol de coordinador');
            }

            $solicitud = Solicitud::create([
                'persona_solicitante_id' => $persona->id,
                'sucursal_id' => $sucursal->id,
                'capturada_por_usuario_id' => $usuario->id,
                'coordinador_usuario_id' => $usuario->id,
                'estado' => Solicitud::ESTADO_EN_REVISION,
                'categoria_inicial_codigo' => 'COBRE',
                'limite_credito_solicitado' => 0,
                'datos_familiares_json' => $request->has('familiares') ? json_encode($request->familiares) : null,
                'afiliaciones_externas_json' => $request->has('afiliaciones') ? json_encode($request->afiliaciones) : null,
                'vehiculos_json' => $request->has('vehiculos') ? json_encode($request->vehiculos) : null,
                'ine_frente_path' => $this->subirDocumentoSolicitud($request->file('ine_frente'), 'ine_frente'),
                'ine_reverso_path' => $this->subirDocumentoSolicitud($request->file('ine_reverso'), 'ine_reverso'),
                'comprobante_domicilio_path' => $this->subirDocumentoSolicitud($request->file('comprobante_domicilio'), 'comprobante_domicilio'),
                'reporte_buro_path' => $this->subirDocumentoSolicitud($request->file('reporte_buro'), 'reporte_buro'),
                'enviada_en' => now(),
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

            Log::info('Nueva solicitud creada', [
                'solicitud_id' => $solicitud->id,
                'coordinador_id' => $usuario->id,
                'persona_id' => $persona->id
            ]);

            DB::commit();

            return redirect()->route('coordinador.solicitudes.index')
                ->with('success', 'Solicitud enviada a verificación correctamente');
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

        $solicitudes = Solicitud::with(['persona', 'sucursal', 'verificacion'])
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

        $solicitud->datos_familiares = $solicitud->datos_familiares_json;
        $solicitud->afiliaciones     = $solicitud->afiliaciones_externas_json;
        $solicitud->vehiculos        = $solicitud->vehiculos_json;

        if ($solicitud->verificacion) {
            $solicitudArray['verificacion']['foto_fachada_url'] = $this->generarUrlEvidencia($solicitud->verificacion->foto_fachada);
            $solicitudArray['verificacion']['foto_ine_con_persona_url'] = $this->generarUrlEvidencia($solicitud->verificacion->foto_ine_con_persona);
            $solicitudArray['verificacion']['foto_comprobante_url'] = $this->generarUrlEvidencia($solicitud->verificacion->foto_comprobante);
        }

        $solicitudArray['ine_frente_url'] = $this->generarUrlEvidencia($solicitud->ine_frente_path);
        $solicitudArray['ine_reverso_url'] = $this->generarUrlEvidencia($solicitud->ine_reverso_path);
        $solicitudArray['comprobante_domicilio_url'] = $this->generarUrlEvidencia($solicitud->comprobante_domicilio_path);
        $solicitudArray['reporte_buro_url'] = $this->generarUrlEvidencia($solicitud->reporte_buro_path);

        return Inertia::render('Coordinador/Solicitudes/Show', [
            'solicitud' => $solicitudArray,
            'edit_url' => route('coordinador.solicitudes.edit', $solicitud->id)
        ]);
    }

    /**
     * Actualiza una solicitud existente
     */
    public function update(PreSolicitudRequest $request, $id)
    {

        ini_set('max_execution_time', 120);

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
            $ineFrentePath = $request->hasFile('ine_frente')
                ? $this->subirDocumentoSolicitud($request->file('ine_frente'), 'ine_frente')
                : $solicitud->ine_frente_path;
            $ineReversoPath = $request->hasFile('ine_reverso')
                ? $this->subirDocumentoSolicitud($request->file('ine_reverso'), 'ine_reverso')
                : $solicitud->ine_reverso_path;
            $comprobanteDomicilioPath = $request->hasFile('comprobante_domicilio')
                ? $this->subirDocumentoSolicitud($request->file('comprobante_domicilio'), 'comprobante_domicilio')
                : $solicitud->comprobante_domicilio_path;
            $reporteBuroPath = $request->hasFile('reporte_buro')
                ? $this->subirDocumentoSolicitud($request->file('reporte_buro'), 'reporte_buro')
                : $solicitud->reporte_buro_path;

            if (!$ineFrentePath || !$ineReversoPath || !$comprobanteDomicilioPath || !$reporteBuroPath) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Debes completar todos los documentos obligatorios para reenviar la solicitud.']);
            }

            $solicitud->update([
                'estado' => Solicitud::ESTADO_EN_REVISION,
                'limite_credito_solicitado' => 0,
                'categoria_inicial_codigo' => $solicitud->categoria_inicial_codigo ?: 'COBRE',
                'datos_familiares_json' => $request->has('familiares') ? json_encode($request->familiares) : null,
                'afiliaciones_externas_json' => $request->has('afiliaciones') ? json_encode($request->afiliaciones) : null,
                'vehiculos_json' => $request->has('vehiculos') ? json_encode($request->vehiculos) : null,
                'ine_frente_path' => $ineFrentePath,
                'ine_reverso_path' => $ineReversoPath,
                'comprobante_domicilio_path' => $comprobanteDomicilioPath,
                'reporte_buro_path' => $reporteBuroPath,
                'enviada_en' => now(),
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
                ->with('success', 'Solicitud actualizada y reenviada a verificación correctamente');
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

        $formData = [
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
            'limite_credito_solicitado' => 0,

            'calle' => $solicitud->persona->calle,
            'numero_exterior' => $solicitud->persona->numero_exterior,
            'numero_interior' => $solicitud->persona->numero_interior,
            'colonia' => $solicitud->persona->colonia,
            'ciudad' => $solicitud->persona->ciudad,
            'estado' => $solicitud->persona->estado,
            'codigo_postal' => $solicitud->persona->codigo_postal,
            'latitud' => $solicitud->persona->latitud,
            'longitud' => $solicitud->persona->longitud,

            'familiares' => $solicitud->datos_familiares_json,
            'afiliaciones' => $solicitud->afiliaciones_externas_json,
            'vehiculos' => $solicitud->vehiculos_json,
            'ine_frente_path' => $solicitud->ine_frente_path,
            'ine_reverso_path' => $solicitud->ine_reverso_path,
            'comprobante_domicilio_path' => $solicitud->comprobante_domicilio_path,
            'reporte_buro_path' => $solicitud->reporte_buro_path,
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

        $required = [
            $persona->curp,
            $persona->rfc,
            $persona->primer_nombre,
            $persona->apellido_paterno,
            $persona->telefono_celular,
            $persona->calle,
            $persona->colonia,
            $persona->codigo_postal,
            $solicitud->ine_frente_path,
            $solicitud->ine_reverso_path,
            $solicitud->comprobante_domicilio_path,
            $solicitud->reporte_buro_path,
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

    private function generarUrlEvidencia(?string $ruta): ?string
    {
        if (!$ruta) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('spaces');
        $expiraEnMinutos = (int) config('filesystems.disks.spaces.signed_url_ttl', 15);

        try {
            return $disk->temporaryUrl($ruta, now()->addMinutes($expiraEnMinutos));
        } catch (\Throwable $e) {
            return $disk->url($ruta);
        }
    }
    private function subirDocumentoSolicitud(?UploadedFile $archivo, string $tipo): ?string
    {
        if (!$archivo) {
            Log::warning("No se recibió archivo para el tipo: " . $tipo);
            return null;
        }

        // 1. Aseguramos que la extensión siempre sea válida (sobre todo si viene comprimida del canvas)
        $extension = $archivo->getClientOriginalExtension();
        if (empty($extension)) {
            $extension = $archivo->guessExtension() ?? 'jpg'; // Forzamos jpg si no la adivina
        }
        
        $nombre = sprintf('%s_%s.%s', $tipo, now()->format('YmdHisv'), $extension);
        $rutaCompleta = 'solicitudes/documentos/' . $tipo . '/' . $nombre;

        try {
            // 2. Usamos Storage de manera explícita para tener más control
            $archivoFisico = file_get_contents($archivo->getRealPath());
            
            // Guardamos en Spaces
            $guardado = Storage::disk('spaces')->put($rutaCompleta, $archivoFisico, 'public');

            if ($guardado) {
                Log::info("ÉXITO: Archivo subido a Digital Ocean en: " . $rutaCompleta);
                return $rutaCompleta;
            } else {
                Log::error("ERROR DESCONOCIDO: Digital Ocean Spaces rechazó el archivo: " . $nombre);
                return null;
            }
        } catch (\Exception $e) {
            // 3. ¡Atrapamos el error real de AWS/Digital Ocean!
            Log::error("ERROR FATAL AL SUBIR A SPACES: " . $e->getMessage());
            return null;
        }
    }
}
