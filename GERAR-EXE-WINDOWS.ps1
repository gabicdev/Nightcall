param([switch]$SemTestes)
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$logdir=Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Path $logdir -Force | Out-Null
$log=Join-Path $logdir ('build-windows-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.log')
function Step([string]$label,[string]$program,[string[]]$arguments) {
  Write-Host "`n==> $label" -ForegroundColor Cyan
  "`n==> $label : $program $($arguments -join ' ')" | Out-File -FilePath $log -Append -Encoding utf8
  & $program @arguments 2>&1 | ForEach-Object { $s="$_"; Add-Content -Path $log -Value $s; Write-Host $s }
  if ($LASTEXITCODE -ne 0) { throw "$label falhou (codigo $LASTEXITCODE). Consulte $log" }
}
try {
  $node=Get-Command node -ErrorAction Stop
  $npm=Get-Command npm.cmd -ErrorAction Stop
  $v=& node -p 'process.versions.node'
  if ([version]$v -lt [version]'22.13.0') { throw "Node.js $v detectado; requer >= 22.13.0" }
  Step 'Versao Node' 'node' @('--version')
  Step 'Versao npm' 'npm.cmd' @('--version')
  if (Test-Path package-lock.json) {Step 'Dependencias' 'npm.cmd' @('ci','--no-audit','--no-fund')}
  else {Step 'Dependencias' 'npm.cmd' @('install','--no-audit','--no-fund')}
  Step 'Electron instalado' 'node' @('-e','const e=require("electron");console.log(e)')
  Step 'Verificacao desktop' 'npm.cmd' @('run','check:desktop')
  if (-not $SemTestes) { Step 'Testes' 'npm.cmd' @('test') }
  Step 'Build frontend' 'npm.cmd' @('run','build')
  if (Test-Path release) {Get-ChildItem release -Filter '*.exe' | Remove-Item -Force}
  Step 'Geracao instalador e portatil' 'npm.cmd' @('run','dist:win')
  Step 'Conferir arquivos .exe' 'npm.cmd' @('run','check:release')
  Write-Host "`nSUCESSO: executaveis em $PSScriptRoot\release" -ForegroundColor Green
  Write-Host "Log: $log"
  Start-Process explorer.exe -ArgumentList ('"'+(Join-Path $PSScriptRoot 'release')+'"')
} catch {
  $msg=$_.Exception.Message
  Add-Content -Path $log -Value "ERRO: $msg"
  Write-Host "`nERRO: $msg" -ForegroundColor Red
  Write-Host "Log de diagnostico: $log" -ForegroundColor Yellow
  Write-Host 'Se falhar em Dependencias, verifique conexao e bloqueio de downloads do Electron. Se falhar no empacotamento, envie o log.'
  exit 1
}
