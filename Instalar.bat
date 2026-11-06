@echo off
chcp 65001 >nul
title Instalar Mi Cultivo
cd /d "%~dp0"
echo.
echo  Instalando Mi Cultivo. La primera vez tarda unos minutos porque baja Electron.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Falta Node.js para armar el instalador. Se abre la pagina de descarga.
  start https://nodejs.org/es
  pause
  exit /b 1
)
call npm install --no-audit --no-fund
if errorlevel 1 goto fallo
call npm run dist
if errorlevel 1 (
  echo.
  echo  Reintentando sin editar el icono del exe...
  call npm run dist:simple
  if errorlevel 1 goto fallo
)
for %%f in ("dist\*Setup*.exe") do (
  echo.
  echo  Listo. Abriendo el instalador...
  start "" "%%f"
  exit /b 0
)
:fallo
echo.
echo  Algo fallo. Sacale una captura a esta ventana y mandasela a Claude.
pause
exit /b 1
