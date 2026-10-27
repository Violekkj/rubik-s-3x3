@echo off
chcp 65001 >nul
title CubeLab (Modo Producao)

echo ===================================================================
echo   CubeLab — Speedcubing 3x3 (Modo Producao Otimizado)
echo ===================================================================
echo.

cd /d "%~dp0"

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:4173/"

call npm.cmd run preview -- --host 127.0.0.1 --port 4173

pause
