param([string]$Servidor = "")
$ErrorActionPreference = "Stop"
$root = Join-Path $env:APPDATA "nightcall"
if (-not $Servidor) {
  Write-Host "Digite HTTPS do servidor compartilhado (Enter para modo local):"
  $Servidor = Read-Host "Servidor"
}
if ($Servidor -and ($Servidor -notmatch '^https://[^/@?#:]+(?::443)?/?$')) {
  throw "Use somente uma origem HTTPS (exemplo: https://chat.exemplo.com)."
}
if ($Servidor) {
  $uri=[Uri]$Servidor
  if ($uri.UserInfo -or $uri.AbsolutePath -ne '/' -or $uri.Query -or $uri.Fragment) { throw "URL remota inválida" }
  $Servidor=$uri.GetLeftPart([System.UriPartial]::Authority)
}
New-Item -ItemType Directory -Force -Path $root | Out-Null
$file=Join-Path $root 'server-config.json'
$data=@{serverUrl=$Servidor} | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($file,$data,[System.Text.UTF8Encoding]::new($false))
Write-Host "Configuração gravada: $file"
Write-Host "Feche completamente o Nightcall pela bandeja e reabra."
