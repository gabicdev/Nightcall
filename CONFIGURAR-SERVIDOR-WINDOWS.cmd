@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CONFIGURAR-NIGHTCALL-WINDOWS.ps1"
if errorlevel 1 (echo Configuracao nao aplicada.)
pause
