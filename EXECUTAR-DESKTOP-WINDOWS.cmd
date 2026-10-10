@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale Node.js 22.13+ & pause & exit /b 1)
if not exist node_modules\electron (call npm install --no-audit --no-fund || (pause & exit /b 1))
call npm run desktop
if errorlevel 1 pause
