@echo off
title Umbra Build Executor
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Umbra Build Executor — entry point para build + logging
:: ============================================================
:: Uso:   executar [debug|release] [--clean] [--install]
::        executar --help      Exibe esta ajuda
::
:: Garante que APENAS UMA instancia rode por vez.
:: Captura TODO o output do build (stdout+stderr) em logs
:: estruturados com timestamps e categorizacao.
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "LOGS_DIR=%PROJECT_DIR%logs"
set "LOCK_FILE=%LOGS_DIR%\.build.lock"
set "SCRIPT=%PROJECT_DIR%scripts\log-build.ps1"
set "BUILD_ARGS=debug"

:: Help
if /i "%~1"=="--help" goto :usage
if /i "%~1"=="-h" goto :usage
if /i "%~1"=="/?" goto :usage

:: Pre-requisitos
if not exist "%SCRIPT%" (
    echo [ERRO] Script de logging nao encontrado: %SCRIPT%
    pause
    exit /b 1
)

:: Garantir que so uma instancia rode
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if exist "%LOCK_FILE%" (
    set /p LOCKED_PID=<"%LOCK_FILE%"
    if defined LOCKED_PID (
        tasklist /FI "PID eq !LOCKED_PID!" 2>nul | findstr /i "!LOCKED_PID!" >nul
        if !errorlevel! equ 0 (
            echo.
            echo ============================================================
            echo [ERRO] Ja existe uma sessao de build em andamento.
            echo        PID: !LOCKED_PID!
            echo        Aguarde a conclusao ou remova o arquivo:
            echo        %LOCK_FILE%
            echo ============================================================
            pause
            exit /b 1
        )
    )
    del "%LOCK_FILE%" 2>nul
)

:: Obtem PID atual via PowerShell e registra lock
for /f %%p in ('powershell -NoProfile -Command "$pid"') do set "MY_PID=%%p"
echo !MY_PID! > "%LOCK_FILE%"

:: Monta argumentos do build
if not "%~1"=="" (
    set "BUILD_ARGS=%~1"
    shift
)

:: Acumula extras (--clean, --install etc.)
set "EXTRA_ARGS="
:parse_loop
if "%~1"=="" goto :done_parse
if defined EXTRA_ARGS (set "EXTRA_ARGS=!EXTRA_ARGS! %~1") else (set "EXTRA_ARGS=%~1")
shift
goto :parse_loop
:done_parse

:: Executa
echo.
echo ============================================================
echo  Umbra Build Logger - Iniciando...
echo ============================================================
echo.

if defined EXTRA_ARGS (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" ^
        -ProjectDir "%PROJECT_DIR%" ^
        -BuildArgs "%BUILD_ARGS%" ^
        -ExtraArgs "%EXTRA_ARGS%"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" ^
        -ProjectDir "%PROJECT_DIR%" ^
        -BuildArgs "%BUILD_ARGS%"
)
set "EXIT_CODE=!errorlevel!"

:: Limpeza do lock
if exist "%LOCK_FILE%" del "%LOCK_FILE%" 2>nul

echo.
echo ============================================================
echo  Build finalizado. Codigo de saida: !EXIT_CODE!
echo  Logs em: %LOGS_DIR%
echo ============================================================

if "!EXIT_CODE!" neq "0" pause
exit /b !EXIT_CODE!

:usage
echo.
echo Uso: executar [debug^|release] [--clean] [--install]
echo.
echo  debug        Build de debug (padrao)
echo  release      Build de release
echo  --clean      Executa clean antes do build
echo  --install    Instala APK no dispositivo apos compilar
echo  --help       Exibe esta ajuda
echo.
echo Exemplos:
echo   executar
echo   executar release
echo   executar debug --clean --install
echo.
echo Logs sao salvos em: %LOGS_DIR%
echo.
exit /b 0
