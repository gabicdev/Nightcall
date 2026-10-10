# Nightcall 4.4.0 — Macro 4.1 a 4.4

- 4.1: diagnóstico de erro de inicialização em `%APPDATA%\nightcall\startup-error.log` e mensagem clara.
- 4.2: leitura validada da configuração de servidor remoto HTTPS, com testes automatizados.
- 4.3: script `CONFIGURAR-SERVIDOR-WINDOWS.cmd` para escolher modo local ou servidor remoto.
- 4.4: gerador de instalador/portátil com validações, saída `release/` e hashes SHA-256.

## Limitações importantes

A compilação do `.exe` necessita de Electron e electron-builder instalados, e deve ser executada e testada no Windows. Ter scripts e testes passando **não comprova** que o instalador funciona no PC. Ainda falta um servidor HTTPS realmente hospedado e testes entre dois computadores. A URL no arquivo de configuração é origem, não credencial.

## Uso

1. Execute `GERAR-EXE-WINDOWS.cmd` no Windows para compilar o instalador e portátil.
2. Antes de usar uma hospedagem compartilhada, execute `CONFIGURAR-SERVIDOR-WINDOWS.cmd` e informe a origem HTTPS do servidor.
3. Após alteração de configuração, encerre o app pela bandeja e reabra-o.
