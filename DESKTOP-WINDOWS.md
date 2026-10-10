# Nightcall 0.4.0 — Windows Desktop

## Para compilar o instalador `.exe`

1. Instale o **Node.js 22.13 ou superior** (uma vez), com acesso à internet para baixar as dependências.
2. Extraia o arquivo ZIP em uma pasta normal (evite executar dentro do ZIP).
3. Dê dois cliques em `GERAR-EXE-WINDOWS.cmd`.
4. Se todas as etapas concluírem, os executáveis estarão na pasta `release/`: instalador NSIS e versão portátil.

Para testar o desktop sem empacotar, execute `EXECUTAR-DESKTOP-WINDOWS.cmd`.

**Importante:** este ZIP contém o projeto e o mecanismo de empacotamento, **não contém ainda um `.exe` compilado**. O empacotamento não foi validado num Windows real. As dependências devem ser baixadas durante a compilação. Um executável sem assinatura digital pode apresentar alerta SmartScreen. Não desative recursos de segurança do Windows para contornar esse alerta.

**Escopo:** a janela do Electron usa um servidor local, banco privado em `userData` e abre a interface desktop. Não constitui ainda um serviço para duas pessoas conversarem entre computadores distintos: isso exige servidor compartilhado, conexão autenticada pela internet, infraestrutura de voz e testes ponta a ponta.
