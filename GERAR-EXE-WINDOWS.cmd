@echo off
setlocal
cd /d "%~dp0"
echo NIGHTCALL - GERADOR DE INSTALADOR E PORTATIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0GERAR-EXE-WINDOWS.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Falhou. Consulte a pasta logs e envie o arquivo build-windows mais recente.
pause
exit /b %RESULT%
