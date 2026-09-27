@echo off
echo ========================================================
echo   Instalador del Backend - Portfolio Leon Feldman
echo ========================================================
echo.
echo Instalando dependencias de Node.js...
call npm install

if not exist "uploads" (
    echo Creando carpeta uploads...
    mkdir uploads
)

if not exist "data" (
    echo Creando carpeta data...
    mkdir data
)

echo.
echo ========================================================
echo   Instalacion completada con exito!
echo   Podes ejecutar run.bat para iniciar el servidor.
echo ========================================================
pause
