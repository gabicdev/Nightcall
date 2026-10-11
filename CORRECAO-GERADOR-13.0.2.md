# Nightcall 13.0.2 - Correcao de compilacao Windows

O erro `Unexpected end of input` ocorria no comando `node -e`, devido a escape de aspas ao passar por Start-Process. A verificacao foi substituida por `node scripts/verify-electron.cjs`.

Execute `GERAR-EXE-WINDOWS.cmd` na pasta extraida. Se aparecer que o Electron nao possui `path.txt`, o npm bloqueou o script postinstall. Revise o aviso `npm warn allow-scripts`, rode `npm approve-scripts electron` caso a versao suporte, e repita o gerador. O gerador interrompe em falhas reais e grava log em `logs`.

Ainda e necessario validar a compilacao e a execucao no Windows.
