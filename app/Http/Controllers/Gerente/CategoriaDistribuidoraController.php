<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\CambiarCategoriaDistribuidoraRequest;
use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
use App\Services\Distribuidora\DistribuidoraNotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CategoriaDistribuidoraController extends Controller
{
    use ResuelveSucursalActivaGerente;

    public function update(CambiarCategoriaDistribuidoraRequest $request, int $id)
    {
        return DB::transaction(function () use ($request, $id) {
            /** @var \App\Models\Usuario $gerente */
            $gerente = Auth::user();
            $sucursalId = $this->obtenerSucursalActivaGerente($gerente)?->id;

            $distribuidora = Distribuidora::query()
                ->where('sucursal_id', $sucursalId)
                ->whereIn('estado', [Distribuidora::ESTADO_ACTIVA, Distribuidora::ESTADO_MOROSA])
                ->findOrFail($id);

            $categoriaAnteriorId = (int) $distribuidora->categoria_id;
            $categoriaNuevaId = (int) $request->categoria_id;

            if ($categoriaAnteriorId === $categoriaNuevaId) {
                return back()->withErrors([
                    'categoria_id' => 'La categoria seleccionada es la misma que la actual.',
                ]);
            }

            $categoriaAnterior = CategoriaDistribuidora::query()->find($categoriaAnteriorId);
            $categoriaNueva = CategoriaDistribuidora::query()
                ->where('activo', true)
                ->findOrFail($categoriaNuevaId);

            $distribuidora->update(['categoria_id' => $categoriaNueva->id]);

            $porcentajeAnterior = (float) ($categoriaAnterior?->porcentaje_comision ?? 0);
            $porcentajeNuevo = (float) $categoriaNueva->porcentaje_comision;
            $direccion = $porcentajeNuevo > $porcentajeAnterior ? 'SUBIDA' : 'BAJADA';
            $motivo = $request->string('motivo')->toString();

            logger()->info('CATEGORIA_DISTRIBUIDORA_CAMBIADA', [
                'gerente_usuario_id' => $gerente->id,
                'distribuidora_id' => $distribuidora->id,
                'numero_distribuidora' => $distribuidora->numero_distribuidora,
                'categoria_anterior_id' => $categoriaAnteriorId,
                'categoria_nueva_id' => $categoriaNueva->id,
                'direccion' => $direccion,
                'motivo' => $motivo,
            ]);

            DB::afterCommit(function () use ($distribuidora, $categoriaAnterior, $categoriaNueva, $porcentajeAnterior, $porcentajeNuevo, $direccion, $motivo) {
                $nombreAnterior = $categoriaAnterior?->nombre ?? 'Sin categoria';
                $nombreNuevo = (string) $categoriaNueva->nombre;

                $tipo = $direccion === 'SUBIDA' ? 'CATEGORIA_SUBIDA' : 'CATEGORIA_BAJADA';
                $titulo = $direccion === 'SUBIDA'
                    ? "Tu categoria subio a {$nombreNuevo}"
                    : "Tu categoria bajo a {$nombreNuevo}";
                $mensaje = sprintf(
                    'Pasaste de %s (%s%%) a %s (%s%%). Motivo: %s',
                    $nombreAnterior,
                    number_format($porcentajeAnterior, 2),
                    $nombreNuevo,
                    number_format($porcentajeNuevo, 2),
                    $motivo
                );

                (new DistribuidoraNotificationService())->notificar(
                    $distribuidora,
                    $tipo,
                    $titulo,
                    $mensaje,
                    [
                        'categoria_anterior_id' => $categoriaAnterior?->id,
                        'categoria_anterior_nombre' => $nombreAnterior,
                        'categoria_nueva_id' => (int) $categoriaNueva->id,
                        'categoria_nueva_nombre' => $nombreNuevo,
                        'porcentaje_anterior' => $porcentajeAnterior,
                        'porcentaje_nuevo' => $porcentajeNuevo,
                        'direccion' => $direccion,
                    ]
                );
            });

            return redirect()
                ->route('gerente.credito.index')
                ->with('success', 'Categoria de la distribuidora actualizada correctamente.');
        });
    }
}
