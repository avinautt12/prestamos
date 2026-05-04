@echo off
setlocal

echo.
echo ============================================
echo   PRESTAMO FACIL - Servidor LAN
echo ============================================
echo.

echo [INFO] Detectando IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set "IP=%%a"
    goto :found
)
:found
set IP=%IP: =%

echo.
echo Tu IP local: %IP%
echo.
echo Para abrir desde celular en la misma red Wi-Fi:
echo   http://%IP%:8000
echo.
echo Desde esta computadora:
echo   http://localhost:8000
echo.
echo ============================================
echo Iniciando servidor en 0.0.0.0:8000...
echo Pulsa Ctrl+C para detener.
echo ============================================
echo.

php artisan serve --host=0.0.0.0 --port=8000

endlocal
