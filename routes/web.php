<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\AuthenticatedSessionController;


// Rutas públicas
Route::redirect('/', '/login');

// Rutas de autenticación (Breeze)
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

// Rutas protegidas
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

// ============================================================
// RUTAS POR ROL - GERENTE
// ============================================================
Route::middleware(['auth', 'role:GERENTE'])->prefix('gerente')->name('gerente.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Gerente\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reportes', [App\Http\Controllers\Gerente\DashboardController::class, 'reportes'])->name('reportes');
    Route::get('/sucursales', [App\Http\Controllers\Gerente\DashboardController::class, 'sucursales'])->name('sucursales');
    Route::get('/distribuidoras', [App\Http\Controllers\Gerente\AprobacionController::class, 'index'])->name('distribuidoras');
    Route::get('/distribuidoras/{id}', [App\Http\Controllers\Gerente\AprobacionController::class, 'show'])->name('distribuidoras.show');
    Route::post('/distribuidoras/{id}/aprobar', [App\Http\Controllers\Gerente\AprobacionController::class, 'aprobar'])->name('distribuidoras.aprobar');
    Route::post('/distribuidoras/{id}/rechazar', [App\Http\Controllers\Gerente\AprobacionController::class, 'rechazar'])->name('distribuidoras.rechazar');
});

// ============================================================
// RUTAS POR ROL - COORDINADOR
// ============================================================
Route::middleware(['auth', 'role:COORDINADOR'])->prefix('coordinador')->name('coordinador.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Coordinador\DashboardController::class, 'index'])->name('dashboard');

    // Gestión de clientes y distribuidoras
    Route::get('/clientes', [App\Http\Controllers\Coordinador\DashboardController::class, 'clientes'])->name('clientes');
    Route::get('/mis-distribuidoras', [App\Http\Controllers\Coordinador\DashboardController::class, 'misDistribuidoras'])->name('mis-distribuidoras');

    // Gestión de solicitudes (nuevas rutas)
    Route::get('/solicitudes', [App\Http\Controllers\Coordinador\SolicitudController::class, 'index'])->name('solicitudes.index');
    Route::get('/solicitudes/create', [App\Http\Controllers\Coordinador\SolicitudController::class, 'create'])->name('solicitudes.create');
    Route::post('/solicitudes', [App\Http\Controllers\Coordinador\SolicitudController::class, 'store'])->name('solicitudes.store');
    Route::get('/solicitudes/{id}', [App\Http\Controllers\Coordinador\SolicitudController::class, 'show'])->name('solicitudes.show');
    Route::put('/solicitudes/{id}', [App\Http\Controllers\Coordinador\SolicitudController::class, 'update'])->name('solicitudes.update');
    Route::post('/solicitudes/{id}/enviar-verificacion', [App\Http\Controllers\Coordinador\SolicitudController::class, 'enviarVerificacion'])->name('solicitudes.enviar-verificacion');
    Route::get('/solicitudes/{id}/edit', [App\Http\Controllers\Coordinador\SolicitudController::class, 'edit'])->name('solicitudes.edit');
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
    Route::get('/cobros', [App\Http\Controllers\Cajera\DashboardController::class, 'cobros'])->name('cobros');
    Route::get('/conciliaciones', [App\Http\Controllers\Cajera\DashboardController::class, 'conciliaciones'])->name('conciliaciones');
    Route::get('/pagos-distribuidora', [App\Http\Controllers\Cajera\DashboardController::class, 'pagosDistribuidora'])->name('pagos-distribuidora');
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
    Route::get('/puntos', [App\Http\Controllers\Distribuidora\DashboardController::class, 'puntos'])->name('puntos');
    Route::get('/clientes', [App\Http\Controllers\Distribuidora\DashboardController::class, 'misClientes'])->name('clientes');
    Route::get('/estado-cuenta', [App\Http\Controllers\Distribuidora\DashboardController::class, 'estadoCuenta'])->name('estado-cuenta');
});

// Redirección por defecto según rol
Route::middleware(['auth'])->get('/dashboard', function () {
    /** @var \App\Models\Usuario $user */
    $user = Auth::user();
    $rol = $user->getRolNombreAttribute();

    switch ($rol) {
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
