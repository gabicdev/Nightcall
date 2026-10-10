# Teste local e isolado: inicializa o portátil por até 12 segundos, sem instalar nada.
$ErrorActionPreference='Stop'
$release=Join-Path $PSScriptRoot 'release'
$exe=Get-ChildItem $release -Filter '*portable*.exe' -ErrorAction Stop | Select-Object -First 1
if(-not $exe){throw 'EXE portátil ausente. Execute GERAR-EXE-WINDOWS.cmd.'}
if($exe.Length -lt 10000000){throw 'Executável pequeno demais para Electron.'}
$env:NIGHTCALL_SERVER_URL='' # modo local para o smoke test
$p=Start-Process -FilePath $exe.FullName -PassThru
try {
  Start-Sleep -Seconds 12
  $running=Get-Process -Id $p.Id -ErrorAction SilentlyContinue
  if(-not $running){throw 'O processo encerrou antes do teste. Confira os logs de inicialização.'}
  Write-Host "Nightcall portátil iniciou. PID: $($p.Id). Validação de interface e mídia continua manual."
} finally {
  if(Get-Process -Id $p.Id -ErrorAction SilentlyContinue){Stop-Process -Id $p.Id -Force}
}
