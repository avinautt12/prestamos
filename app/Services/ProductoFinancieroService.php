<?php

namespace App\Services;

use App\Models\ProductoFinanciero;
use Illuminate\Validation\ValidationException;

/**
 * Servicio para validar y procesar productos financieros
 * 
 * Responsabilidades:
 * - Validar que productos estén activos y con datos completos
 * - Calcular snapshots para vales
 * - Validar configuraciones de producto
 * - Crear excepciones con mensajes claros
 */
class ProductoFinancieroService
{
    public function __construct(private readonly ServicioReglasNegocio $reglasNegocio) {}

    /**
     * Obtiene un producto activo validado
     * 
     * @param int $productoId ID del producto
     * @return ProductoFinanciero Producto validado
     * @throws ValidationException Si el producto no es válido
     */
    public function obtenerProductoActivoValidado(int $productoId): ProductoFinanciero
    {
        $producto = ProductoFinanciero::withTrashed()
            ->where('id', $productoId)
            ->first();

        if (!$producto) {
            throw ValidationException::withMessages([
                'producto_id' => 'El producto seleccionado no existe.'
            ]);
        }

        // Validar que esté activo
        if (!$producto->activo) {
            throw ValidationException::withMessages([
                'producto_id' => 'El producto seleccionado está inactivo. Solo puedes usar productos activos.'
            ]);
        }

        // Validar que no esté eliminado
        if ($producto->trashed()) {
            throw ValidationException::withMessages([
                'producto_id' => 'El producto seleccionado ha sido eliminado. Contacta al gerente.'
            ]);
        }

        // Validar que tenga monto configurado
        if ((float) $producto->monto_principal <= 0) {
            throw ValidationException::withMessages([
                'producto_id' => 'El producto seleccionado no tiene monto principal configurado.'
            ]);
        }

        // Validar que tenga quincenas configuradas
        if ((int) $producto->numero_quincenas <= 0 || (int) $producto->numero_quincenas > 72) {
            throw ValidationException::withMessages([
                'producto_id' => 'El producto seleccionado no tiene un número válido de quincenas.'
            ]);
        }

        return $producto;
    }

    /**
     * Valida que todos los campos de un producto sean configurables
     * 
     * @param ProductoFinanciero $producto
     * @return array Array con validaciones
     */
    public function validarConfiguracionCompleta(ProductoFinanciero $producto): array
    {
        $errores = [];

        if ((float) $producto->monto_principal < 1) {
            $errores['monto_principal'] = 'El monto principal debe ser mayor a 0.';
        }

        if ((int) $producto->numero_quincenas < 1 || (int) $producto->numero_quincenas > 72) {
            $errores['numero_quincenas'] = 'El número de quincenas debe estar entre 1 y 72.';
        }

        if ((float) $producto->porcentaje_comision_empresa < 0 || (float) $producto->porcentaje_comision_empresa > 100) {
            $errores['porcentaje_comision_empresa'] = 'La comisión debe estar entre 0% y 100%.';
        }

        if ((float) $producto->monto_seguro < 0) {
            $errores['monto_seguro'] = 'El seguro debe ser mayor o igual a 0.';
        }

        if ((float) $producto->porcentaje_interes_quincenal < 0 || (float) $producto->porcentaje_interes_quincenal > 100) {
            $errores['porcentaje_interes_quincenal'] = 'El interés debe estar entre 0% y 100%.';
        }

        return $errores;
    }

    /**
     * Crea un snapshot de producto para un vale
     * Esto preserva los valores actuales del producto en el momento de creación del vale
     * 
     * @param ProductoFinanciero $producto
     * @return array Datos snapshots listos para guardar en Vale
     */
    public function crearSnapshotProducto(ProductoFinanciero $producto): array
    {
        return [
            'producto_financiero_id' => $producto->id,
            'nombre_producto_snapshot' => $producto->nombre,
            'codigo_producto_snapshot' => $producto->codigo,
            'porcentaje_comision_empresa_snap' => (float) $producto->porcentaje_comision_empresa,
            'monto_seguro_snap' => (float) $producto->monto_seguro,
            'porcentaje_interes_snap' => (float) $producto->porcentaje_interes_quincenal,
            'monto_multa_snap' => (float) $producto->monto_multa_tardia,
            'quincenas_totales' => (int) $producto->numero_quincenas,
            'monto_principal' => (float) $producto->monto_principal,
        ];
    }

    /**
     * Obtiene todos los productos activos ordenados por nombre
     * 
     * @return \Illuminate\Database\Eloquent\Collection Colección de productos
     */
    public function obtenerProductosActivos()
    {
        return ProductoFinanciero::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Obtiene todos los productos (incluyendo inactivos y eliminados)
     * Útil para reportes y administración
     * 
     * @return \Illuminate\Database\Eloquent\Collection Colección de productos
     */
    public function obtenerTodosLosProductos()
    {
        return ProductoFinanciero::withTrashed()
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Verifica si un producto puede ser editado
     * Un producto NO puede ser editado si:
     * - Tiene vales basados en él en estado activo o moroso
     * - Está eliminado
     * 
     * @param ProductoFinanciero $producto
     * @return array Array con ['puede_editar' => bool, 'razon' => string|null]
     */
    public function verificarEditabilidad(ProductoFinanciero $producto): array
    {
        if ($producto->trashed()) {
            return [
                'puede_editar' => false,
                'razon' => 'No puedes editar un producto eliminado. Restauralo primero.'
            ];
        }

        $valesActivos = $producto->vales()
            ->whereIn('estado', [
                \App\Models\Vale::ESTADO_ACTIVO,
                \App\Models\Vale::ESTADO_PAGO_PARCIAL,
                \App\Models\Vale::ESTADO_MOROSO
            ])
            ->count();

        if ($valesActivos > 0) {
            return [
                'puede_editar' => false,
                'razon' => "No puedes editar este producto porque tiene {$valesActivos} vales activos. Los cambios afectarían solo a nuevos vales."
            ];
        }

        return [
            'puede_editar' => true,
            'razon' => null
        ];
    }

    /**
     * Calcula los montos derivados de un producto
     * 
     * @param float $montoPrincipal
     * @param float $porcentajeComision
     * @param float $montoSeguro
     * @param float $porcentajeInteres
     * @param int $numQuincenas
     * @return array Cálculos completos
     */
    public function calcularMontosDelProducto(
        float $montoPrincipal,
        float $porcentajeComision,
        float $montoSeguro,
        float $porcentajeInteres,
        int $numQuincenas
    ): array {
        $comisionEmpresa = $this->reglasNegocio->calcularComisionApertura($montoPrincipal, $porcentajeComision);
        $interes = $this->reglasNegocio->calcularInteresTotal($montoPrincipal, $porcentajeInteres, $numQuincenas);
        $seguro = round($montoSeguro, 2);
        $totalDeuda = round($montoPrincipal + $comisionEmpresa + $seguro + $interes, 2);
        $montoQuincenal = $numQuincenas > 0 ? round($totalDeuda / $numQuincenas, 2) : $totalDeuda;

        return [
            'monto_principal' => $montoPrincipal,
            'comision_empresa' => $comisionEmpresa,
            'seguro' => $seguro,
            'interes_total' => $interes,
            'total_deuda' => $totalDeuda,
            'monto_quincenal' => $montoQuincenal,
            'quincenas_totales' => $numQuincenas,
        ];
    }

    /**
     * Ganancia de distribuidora calculada sobre el monto principal del producto.
     */
    public function calcularGananciaDistribuidora(float $montoPrincipal, float $porcentajeCategoria): float
    {
        return $this->reglasNegocio->calcularComisionDistribuidora($montoPrincipal, $porcentajeCategoria);
    }
}
