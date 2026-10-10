param([switch]$SemTestes)
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$logdir=Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Path $logdir -Force | Out-Null
$log=Join-Path $logdir ('build-windows-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.log')
function Step([string]$label,[string]$program,[string[]]$arguments) {
  Write-Host "`n==> $label" -ForegroundColor Cyan
  Add-Content -Path $log -Value "`n==> $label : $program $($arguments -join ' ')"
  # Executar processo nativo fora do pipeline PowerShell: avisos no stderr NAO sao excecoes.
  $outputFile = Join-Path $logdir ('npm-output-'+[guid]::NewGuid().ToString('N')+'.txt')
  try {
    $command = Get-Command $program -ErrorAction Stop
    $process = Start-Process -FilePath $command.Source -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outputFile -RedirectStandardError ($outputFile+'.err')
    foreach ($file in @($outputFile,($outputFile+'.err'))) {
      if (Test-Path $file) {
        Get-Content -Path $file | ForEach-Object { Add-Content -Path $log -Value $_; Write-Host $_ }
      }
    }
    if ($process.ExitCode -ne 0) { throw "$label falhou (codigo $($process.ExitCode)). Consulte $log" }
  } finally {
    Remove-Item -LiteralPath $outputFile,($outputFile+'.err') -Force -ErrorAction SilentlyContinue
  }
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
  Step 'Verificar Electron instalado' 'node' @('scripts/verify-electron.cjs')
  Step 'Verificacao desktop' 'npm.cmd' @('run','check:desktop')
  if (-not $SemTestes) { Step 'Testes' 'npm.cmd' @('test') }
  Step 'Build frontend' 'npm.cmd' @('run','build')
  if (Test-Path release) {Get-ChildItem release -Filter '*.exe' | Remove-Item -Force}
  # Sem assinatura ou edicao de recursos: evita extracao de winCodeSign e links .dylib do macOS.
  $env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
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
  Write-Host 'Se aparecer Electron sem binario, o npm pode ter bloqueado o install script. Execute npm approve-scripts electron (quando disponivel) e refaca o build.'
  Write-Host 'Se o log citar winCodeSign e libcrypto.dylib, confirme signAndEditExecutable=false no package.json e use este pacote em pasta limpa.'
  Write-Host 'Confira o log acima para identificar o erro real.'
  exit 1
}
