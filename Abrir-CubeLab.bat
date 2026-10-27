@echo off
chcp 65001 >nul
title CubeLab — Speedcubing 3x3

echo ===================================================================
echo   CubeLab — Speedcubing Timer, Stats ^& Algorithms 3x3
echo ===================================================================
echo.

cd /d "%~dp0"

:: Verifica se node_modules está instalado
if not exist "node_modules\" (
    echo [1/3] Instalando dependências pela primeira vez...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao instalar dependências com npm.
        echo Verifique se o Node.js está instalado no seu computador.
        pause
        exit /b 1
    )
)

echo [2/3] Abrindo o CubeLab no seu navegador...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:5173/"

echo [3/3] Iniciando servidor local do CubeLab...
echo.
echo ===================================================================
echo   CubeLab rodando em: http://127.0.0.1:5173/
echo   Para encerrar o CubeLab, feche esta janela ou aperte Ctrl+C.
echo ===================================================================
echo.

call npm.cmd run dev -- --host 127.0.0.1 --port 5173

if errorlevel 1 (
    echo.
    echo Tentando com 'npx vite'...
    call npx.cmd vite --host 127.0.0.1 --port 5173
)

pause
