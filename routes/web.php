<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ActivacionDistribuidoraController;
use App\Http\Controllers\Coordinador\SolicitudController;
use App\Http\Controllers\Gerente\AprobacionController;
use App\Http\Controllers\Gerente\DashboardController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\Cajera\ConciliacionController;
use App\Http\Controllers\Cajera\PrevaleController;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::redirect('/', '/login');

// Rutas de autenticación (Breeze)
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('/distribuidora/activar/{token}', [ActivacionDistribuidoraController::class, 'show'])
        ->middleware('throttle:30,1')
        ->name('distribuidora.activacion.show');
    Route::post('/distribuidora/activar/{token}', [ActivacionDistribuidoraController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('distribuidora.activacion.store');
});

// Rutas protegidas
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::get('/notificaciones', [NotificacionController::class, 'index'])
        ->name('notificaciones.index');
    Route::patch('/notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida'])
        ->name('notificaciones.marcar-leida');
    Route::patch('/notificaciones/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas'])
        ->name('notificaciones.marcar-todas-leidas');
});

// ============================================================
// RUTAS POR ROL - ADMIN
// ============================================================
Route::middleware(['auth', 'role:ADMIN'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/calendario', [App\Http\Controllers\Admin\DashboardController::class, 'calendario'])->name('calendario');
    Route::get('/reportes', [App\Http\Controllers\Admin\DashboardController::class, 'reportes'])->name('reportes');

    Route::get('/configuraciones', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'index'])->name('configuraciones');
    Route::put('/configuraciones/sucursal', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'actualizarSucursal'])->name('configuraciones.sucursal.update');
    Route::post('/configuraciones/categorias', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'crearCategoria'])->name('configuraciones.categorias.store');
    Route::put('/configuraciones/categorias/{categoria}', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'actualizarCategoria'])->name('configuraciones.categorias.update');
    Route::put('/configuraciones/categorias/{categoria}/inactivar', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'inactivarCategoria'])->name('configuraciones.categorias.inactivar');
    Route::put('/configuraciones/categorias/{categoria}/activar', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'activarCategoria'])->name('configuraciones.categorias.activar');
    Route::delete('/configuraciones/categorias/{categoria}', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'eliminarCategoria'])->name('configuraciones.categorias.delete');
    Route::put('/configuraciones/productos/{producto}', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'actualizarProducto'])->name('configuraciones.productos.update');
    Route::post('/configuraciones/productos', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'crearProducto'])->name('configuraciones.productos.store');
    Route::put('/configuraciones/productos/{producto}/inactivar', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'inactivarProducto'])->name('configuraciones.productos.inactivar');
    Route::put('/configuraciones/productos/{producto}/activar', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'activarProducto'])->name('configuraciones.productos.activar');
    Route::post('/configuraciones/productos/{producto}/restaurar', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'restaurarProducto'])->name('configuraciones.productos.restaurar');
    Route::delete('/configuraciones/productos/{producto}', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'eliminarProducto'])->name('configuraciones.productos.delete');

    Route::get('/usuarios', [App\Http\Controllers\Admin\UsuarioController::class, 'index'])->name('usuarios.index');
    Route::post('/usuarios', [App\Http\Controllers\Admin\UsuarioController::class, 'store'])->name('usuarios.store');
    Route::put('/usuarios/{usuario}/rol', [App\Http\Controllers\Admin\UsuarioController::class, 'actualizarRol'])->name('usuarios.rol.update');
    Route::patch('/usuarios/{usuario}/estado', [App\Http\Controllers\Admin\UsuarioController::class, 'actualizarEstado'])->name('usuarios.estado.update');
    Route::post('/usuarios/{usuario}/reenviar-activacion', [App\Http\Controllers\Admin\UsuarioController::class, 'reenviarActivacionDistribuidora'])->name('usuarios.reenviar-activacion');
});

// ============================================================
// RUTAS POR ROL - GERENTE
// ============================================================
Route::middleware(['auth', 'role:GERENTE'])->prefix('gerente')->name('gerente.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Gerente\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reportes', [App\Http\Controllers\Gerente\DashboardController::class, 'reportes'])->name('reportes');
    Route::get('/cortes', [App\Http\Controllers\Gerente\CorteController::class, 'index'])->name('cortes');
    Route::post('/cortes/{corte}/cerrar-manual', [App\Http\Controllers\Gerente\CorteController::class, 'cerrarManual'])
        ->middleware('gerente.secure-action')
        ->name('cortes.cerrar-manual');
    Route::get('/configuraciones', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'index'])->name('configuraciones');
    Route::get('/productos', [App\Http\Controllers\Gerente\ConfiguracionController::class, 'index'])->name('productos');
    Route::get('/distribuidoras', [App\Http\Controllers\Gerente\AprobacionController::class, 'index'])->name('distribuidoras');
    Route::get('/distribuidoras/rechazadas', [App\Http\Controllers\Gerente\AprobacionController::class, 'rechazadas'])->name('distribuidoras.rechazadas');
    Route::get('/distribuidoras/{id}', [App\Http\Controllers\Gerente\AprobacionController::class, 'show'])->name('distribuidoras.show');
    Route::post('/distribuidoras/{id}/aprobar', [App\Http\Controllers\Gerente\AprobacionController::class, 'aprobar'])
        ->middleware('gerente.secure-action')
        ->name('distribuidoras.aprobar');
    Route::post('/distribuidoras/{id}/rechazar', [AprobacionController::class, 'rechazar'])
        ->middleware('gerente.secure-action')
        ->name('distribuidoras.rechazar');
});

// ============================================================
// RUTAS POR ROL - COORDINADOR
// ============================================================
Route::middleware(['auth', 'role:COORDINADOR'])->prefix('coordinador')->name('coordinador.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Coordinador\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reportes', [App\Http\Controllers\Coordinador\DashboardController::class, 'reportes'])->name('reportes');

    // Gestión de clientes y distribuidoras
    Route::get('/clientes', [App\Http\Controllers\Coordinador\DashboardController::class, 'clientes'])->name('clientes');
    Route::get('/mis-distribuidoras', [App\Http\Controllers\Coordinador\DashboardController::class, 'misDistribuidoras'])->name('mis-distribuidoras');
    Route::get('/traspasos', [App\Http\Controllers\Coordinador\TraspasoClienteController::class, 'index'])->name('traspasos.index');
    Route::post('/traspasos/{traspaso}/aprobar', [App\Http\Controllers\Coordinador\TraspasoClienteController::class, 'aprobar'])->name('traspasos.aprobar');
    Route::post('/traspasos/{traspaso}/rechazar', [App\Http\Controllers\Coordinador\TraspasoClienteController::class, 'rechazar'])->name('traspasos.rechazar');

    // Gestión de solicitudes (nuevas rutas)
    Route::get('/solicitudes', [SolicitudController::class, 'index'])->name('solicitudes.index');
    Route::get('/solicitudes/create', [SolicitudController::class, 'create'])->name('solicitudes.create');
    Route::post('/solicitudes', [SolicitudController::class, 'store'])->name('solicitudes.store');
    Route::get('/solicitudes/{id}', [SolicitudController::class, 'show'])->name('solicitudes.show');
    Route::put('/solicitudes/{id}', [SolicitudController::class, 'update'])->name('solicitudes.update');
    Route::post('/solicitudes/{id}/enviar-verificacion', [SolicitudController::class, 'enviarVerificacion'])->name('solicitudes.enviar-verificacion');
    Route::get('/solicitudes/{id}/edit', [SolicitudController::class, 'edit'])->name('solicitudes.edit');
});

// ============================================================
// RUTAS POR ROL - VERIFICADOR
// ============================================================
Route::middleware(['auth', 'role:VERIFICADOR'])->prefix('verificador')->name('verificador.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Verificador\DashboardController::class, 'index'])->name('dashboard');

    // Rutas de solicitudes para verificación
    Route::get('/solicitudes', [App\Http\Controllers\Verificador\SolicitudController::class, 'index'])->name('solicitudes.index');
    Route::get('/solicitudes-por-revisar', [App\Http\Controllers\Verificador\SolicitudController::class, 'porRevisar'])->name('solicitudes.por-revisar');
    Route::get('/solicitudes/{id}', [App\Http\Controllers\Verificador\SolicitudController::class, 'show'])->name('solicitudes.show');
    Route::post('/solicitudes/{id}/verificar', [App\Http\Controllers\Verificador\SolicitudController::class, 'verificar'])->name('solicitudes.verificar');

    // Otras rutas del verificador
    Route::get('/solicitudes-pendientes', [App\Http\Controllers\Verificador\SolicitudController::class, 'index'])->name('solicitudes.pendientes');
    Route::get('/validaciones', [App\Http\Controllers\Verificador\DashboardController::class, 'validaciones'])->name('validaciones');

    // web.php - dentro del grupo del verificador
    Route::post('/solicitudes/{id}/tomar', [App\Http\Controllers\Verificador\SolicitudController::class, 'tomar'])->name('solicitudes.tomar');
    Route::get('/mapa-ruta', [App\Http\Controllers\Verificador\SolicitudController::class, 'mapaRuta'])->name('mapa-ruta');
});

// ============================================================
// RUTAS POR ROL - CAJERA
// ============================================================
Route::middleware(['auth', 'role:CAJERA'])->prefix('cajera')->name('cajera.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Cajera\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/conciliaciones', [ConciliacionController::class, 'index'])->name('conciliaciones');
    Route::get('/conciliaciones/exportar', [ConciliacionController::class, 'exportarHistorial'])->name('conciliaciones.exportar');
    Route::get('/conciliaciones/simular-archivo', [ConciliacionController::class, 'simularArchivoBancario'])->name('conciliaciones.simular-archivo');
    Route::post('/conciliaciones/importar', [ConciliacionController::class, 'importar'])->name('conciliaciones.importar');
    Route::post('/conciliaciones/manual', [ConciliacionController::class, 'conciliarManual'])->name('conciliaciones.manual');
    Route::get('/pagos-distribuidora', [App\Http\Controllers\Cajera\DashboardController::class, 'pagosDistribuidora'])->name('pagos-distribuidora');

    // Rutas de Prevale (Usando el controlador que creaste)
    Route::get('/prevale', [PrevaleController::class, 'index'])->name('prevale.index');
    Route::get('/prevale/{id}', [PrevaleController::class, 'show'])->name('prevale.show');

    // Y necesitamos las rutas POST para aprobar/rechazar que están en tu form
    Route::post('/prevale/{id}/aprobar', [PrevaleController::class, 'aprobar'])->name('prevale.aprobar');
    Route::post('/prevale/{id}/rechazar', [PrevaleController::class, 'rechazar'])->name('prevale.rechazar');

    // Rutas de Cobranza
    Route::get('/cobranza', [App\Http\Controllers\Cajera\CobranzaController::class, 'index'])->name('cobranza.index');
    Route::post('/cobranza/{distribuidora}/bloquear', [App\Http\Controllers\Cajera\CobranzaController::class, 'bloquear'])->name('cobranza.bloquear');
    Route::post('/cobranza/{distribuidora}/desbloquear', [App\Http\Controllers\Cajera\CobranzaController::class, 'desbloquear'])->name('cobranza.desbloquear');
});

// ============================================================
// RUTAS POR ROL - DISTRIBUIDORA
// ============================================================
Route::middleware(['auth', 'role:DISTRIBUIDORA'])->prefix('distribuidora')->name('distribuidora.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Distribuidora\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/vales', [App\Http\Controllers\Distribuidora\DashboardController::class, 'vales'])->name('vales');
    Route::get('/vales/crear', [App\Http\Controllers\Distribuidora\DashboardController::class, 'crearVale'])->name('vales.create');
    Route::post('/vales/crear', [App\Http\Controllers\Distribuidora\DashboardController::class, 'guardarPreVale'])->name('vales.store');
    Route::post('/vales/{vale}/cancelar', [App\Http\Controllers\Distribuidora\DashboardController::class, 'cancelarVale'])->name('vales.cancelar');
    Route::post('/vales/{vale}/pagos', [App\Http\Controllers\Distribuidora\DashboardController::class, 'registrarPagoCliente'])->name('vales.pagos.store');
    Route::get('/puntos', [App\Http\Controllers\Distribuidora\DashboardController::class, 'puntos'])->name('puntos');
    Route::post('/puntos/canjear', [App\Http\Controllers\Distribuidora\DashboardController::class, 'canjearPuntos'])->name('puntos.canjear');
    Route::get('/clientes', [App\Http\Controllers\Distribuidora\DashboardController::class, 'misClientes'])->name('clientes');
    Route::get('/traspasos', [App\Http\Controllers\Distribuidora\TraspasoClienteController::class, 'index'])->name('traspasos.index');
    Route::post('/traspasos', [App\Http\Controllers\Distribuidora\TraspasoClienteController::class, 'store'])->name('traspasos.store');
    Route::post('/traspasos/{traspaso}/confirmar', [App\Http\Controllers\Distribuidora\TraspasoClienteController::class, 'confirmar'])->name('traspasos.confirmar');
    Route::post('/traspasos/{traspaso}/cancelar', [App\Http\Controllers\Distribuidora\TraspasoClienteController::class, 'cancelar'])->name('traspasos.cancelar');
    Route::get('/estado-cuenta', [App\Http\Controllers\Distribuidora\DashboardController::class, 'estadoCuenta'])->name('estado-cuenta');
    Route::post('/relaciones/{relacion}/reportar-pago', [App\Http\Controllers\Distribuidora\DashboardController::class, 'reportarPago'])->name('relaciones.reportar-pago');
});

// Redirección por defecto según rol
Route::middleware(['auth'])->get('/dashboard', function () {
    /** @var Usuario $user */
    $user = Auth::user();
    $rol = $user->rol_principal ? strtolower($user->rol_principal->codigo) : 'sin-rol';

    switch ($rol) {
        case 'admin':
            return redirect()->route('admin.dashboard');
        case 'gerente':
            return redirect()->route('gerente.dashboard');
        case 'coordinador':
            return redirect()->route('coordinador.dashboard');
        case 'verificador':
            return redirect()->route('verificador.dashboard');
        case 'cajera':
            return redirect()->route('cajera.dashboard');
        case 'distribuidora':
            return redirect()->route('distribuidora.dashboard');
        default:
            return redirect()->route('login');
    }
})->name('dashboard');
