@echo off
setlocal
cd /d "%~dp0"
echo NIGHTCALL - DIAGNOSTICO (SEM ALTERAR O COMPUTADOR)
where node >nul 2>nul || (echo Node.js nao encontrado & exit /b 1)
node -v
call npm test
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
call npm run check:desktop
if errorlevel 1 exit /b 1
echo DIAGNOSTICO OK - NAO SUBSTITUI TESTE EM DOIS COMPUTADORES
