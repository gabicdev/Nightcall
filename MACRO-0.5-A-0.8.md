# Nightcall — macro 0.5 a 0.8

Implementações agrupadas nesta entrega (não são quatro releases testados separadamente):

- 0.5: `/api/events` com Server-Sent Events autenticados e notificação a contas envolvidas em novas mensagens.
- 0.6: eventos de amizade/bloqueio, atualização reativa da UI; polling de segurança a cada 15 s.
- 0.7: endpoint `/api/presence` com presença aproximada enquanto o SSE estiver conectado.
- 0.8: comportamento de minimizar para a bandeja e opções Abrir/Sair no app Electron.

## Validação

- `npm test`: 6/6 aprovados, incluindo SSE, autenticação e privacidade.
- `npm run build`: OK.
- **Não houve teste visual desktop nem produção de executável Windows nesta máquina.**

## Windows

1. Extraia o ZIP.
2. Execute `GERAR-EXE-WINDOWS.cmd` com internet para baixar Electron e electron-builder.
3. Confira a pasta `release` para instalador e versão portátil.

## Limites atuais

O processo Electron inicia um **servidor local por instalação**. Contas criadas em PCs diferentes não se conectam entre si automaticamente. Para conversas entre redes distintas será necessária uma instalação de servidor compartilhado, TLS/HTTPS e configuração de deploy. Chamadas/WebRTC e streaming de tela **não foram implementados nesta macro**. SSE é fluxo servidor->cliente para atualização de mensagens; não é comunicação de voz nem WebSocket.
