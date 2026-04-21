<?php

namespace App\Http\Controllers\Gerente;

use App\Http\Controllers\Concerns\ResuelveSucursalActivaGerente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gerente\CambiarCategoriaDistribuidoraRequest;
use App\Models\CategoriaDistribuidora;
use App\Models\Distribuidora;
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

            $categoriaNueva = CategoriaDistribuidora::query()
                ->where('activo', true)
                ->findOrFail($categoriaNuevaId);

            $distribuidora->update(['categoria_id' => $categoriaNueva->id]);

            logger()->info('CATEGORIA_DISTRIBUIDORA_CAMBIADA', [
                'gerente_usuario_id' => $gerente->id,
                'distribuidora_id' => $distribuidora->id,
                'numero_distribuidora' => $distribuidora->numero_distribuidora,
                'categoria_anterior_id' => $categoriaAnteriorId,
                'categoria_nueva_id' => $categoriaNueva->id,
                'motivo' => $request->string('motivo')->toString(),
            ]);

            return redirect()
                ->route('gerente.credito.index')
                ->with('success', 'Categoria de la distribuidora actualizada correctamente.');
        });
    }
}
