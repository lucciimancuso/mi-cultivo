@echo off
chcp 65001 >nul
title Mi Cultivo
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo  Falta Node.js. Se abre la pagina de descarga.
  start https://nodejs.org/es
  pause
  exit /b 1
)
if not exist node_modules (
  echo  Primera vez: preparando, tarda unos minutos...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo  Algo fallo. Sacale una captura a esta ventana y mandasela a Claude.
    pause
    exit /b 1
  )
)
call npm start
