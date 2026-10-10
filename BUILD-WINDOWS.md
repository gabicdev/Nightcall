# Nightcall para Windows (.exe)

Requisitos: Windows 10/11 x64, Node.js 22.13+ e acesso à internet para baixar o Electron.

1. Abra PowerShell na pasta do projeto.
2. Execute `npm install`.
3. Teste com `npm run desktop`.
4. Gere o instalador e o portátil: `npm run dist:win`.
5. Encontre os `.exe` na pasta `release`.

O app inicia automaticamente um servidor **local** e guarda contas e mensagens em `%APPDATA%/nightcall/nightcall.sqlite` (pasta de dados Electron, sujeita ao nome do app). O .exe sozinho **não cria um servidor público**: para duas pessoas em PCs diferentes conversarem, será necessário implementar hospedagem/endereçamento seguro e comunicação remota.

Aviso: `desktop/main.cjs` prepara a compilação; o arquivo .exe ainda depende de gerar os binários do Electron no Windows.
