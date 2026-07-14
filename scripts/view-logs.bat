@echo off
title Umbra Log Viewer
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Umbra Log Viewer — visualiza logs de build salvos
:: ============================================================
:: Uso: view-logs            Lista todos os logs
::      view-logs <n>        Mostra o log mais recente ou n-esimo
::      view-logs --last     Mostra apenas o ultimo log
::      view-logs --errors   Mostra apenas erros do ultimo log
::      view-logs --summary  Mostra sumario JSON do ultimo build
:: ============================================================

set "LOGS_DIR=%~dp0..\logs"
if not exist "%LOGS_DIR%" (
    echo [INFO] Nenhum log encontrado (diretorio logs/ vazio ou inexistente).
    pause
    exit /b 0
)

pushd "%LOGS_DIR%"

set "ACTION=list"
if /i "%~1"=="--last" set "ACTION=last"
if /i "%~1"=="--errors" set "ACTION=errors"
if /i "%~1"=="--summary" set "ACTION=summary"
if /i "%~1"=="--help" goto :usage
if /i "%~1"=="-h" goto :usage

if "%ACTION%"=="list" (
    echo.
    echo ============================================================
    echo  Logs de Build Disponiveis
    echo ============================================================
    echo.
    set "IDX=0"
    for /f "delims=" %%f in ('dir /b /o-d build_*.log 2^>nul') do (
        set /a IDX+=1
        set "FILE=%%f"
        for %%s in ("%LOGS_DIR%\%%f") do set "FSIZE=%%~zs"
        if !IDX! lss 10 (set "PADD= !IDX!") else (set "PADD=!IDX!")
        echo  !PADD!. %%f (!FSIZE! bytes^)
    )
    echo.
    if !IDX! equ 0 echo  (nenhum log encontrado)
    echo.
    echo Use: view-logs [1-9] para ver um log especifico
    echo      view-logs --last     para ver apenas o ultimo
    echo      view-logs --errors   para ver apenas erros do ultimo
    echo      view-logs --summary  para ver o sumario do ultimo build
    echo.
    goto :end
)

set "TARGET_FILE="
if "%ACTION%"=="last" (
    for /f "delims=" %%f in ('dir /b /o-d build_*.log 2^>nul') do set "TARGET_FILE=%%f" & goto :show_log
    goto :no_logs
)
if "%ACTION%"=="errors" (
    for /f "delims=" %%f in ('dir /b /o-d build_*.log 2^>nul') do set "TARGET_FILE=%%f" & goto :show_errors
    goto :no_logs
)
if "%ACTION%"=="summary" (
    for /f "delims=" %%f in ('dir /b /o-d build_*.summary.json 2^>nul') do set "TARGET_FILE=%%f" & goto :show_summary
    goto :no_logs
)

:: Numeric arg: show specific log by index
set "REQ_IDX=%~1"
set "IDX=0"
for /f "delims=" %%f in ('dir /b /o-d build_*.log 2^>nul') do (
    set /a IDX+=1
    if "!IDX!"=="%REQ_IDX%" set "TARGET_FILE=%%f" & goto :show_log
)
echo [ERRO] Indice %REQ_IDX% nao encontrado.
goto :end

:show_log
type "%TARGET_FILE%" | more
goto :end

:show_errors
echo.
echo ============================================================
echo  Erros e Warnings do ultimo build
echo ============================================================
echo.
findstr /r "\[ERROR\] \[WARN\] \[STDERR\]" "%TARGET_FILE%" 2>nul
if !errorlevel! neq 0 echo  (nenhum erro ou warning encontrado)
echo.
goto :end

:show_summary
type "%TARGET_FILE%" 2>nul
if !errorlevel! neq 0 echo [ERRO] Sumario nao encontrado.
echo.
goto :end

:no_logs
echo [INFO] Nenhum log encontrado.
goto :end

:usage
echo.
echo Uso: view-labs [opcao]
echo.
echo  Opcoes:
echo    (sem args)   Lista todos os logs disponiveis
echo    [1-9]        Exibe o log pelo indice na lista
echo    --last       Exibe o log mais recente
echo    --errors     Exibe apenas erros/warnings do ultimo log
echo    --summary    Exibe o sumario JSON do ultimo build
echo    --help       Exibe esta ajuda
echo.
goto :end

:end
popd
if not "%1"=="" (
    echo.
    pause
)
exit /b 0
