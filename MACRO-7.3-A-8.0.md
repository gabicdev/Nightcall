# Nightcall 8.0.0 — macro 7.3 a 8.0

7.3 — Corrigido o comando final que abre a pasta release no gerador Windows.
7.4 — Proteção contra entradas simultâneas no mesmo canal de voz.
7.5 — Limite defensivo de quatro conexões WebRTC por cliente (cinco pessoas no total).
7.6 — Aviso de capacidade ultrapassada nas sessões de voz.
7.7 — Cancelamento e limpeza de entrada no canal em caso de erro.
7.8 — Cancelamento automático de eco, supressão de ruído e ganho automático do microfone.
7.9 — Evita configurar bitrate de um sender sem track.
8.0 — Prévia local explicitamente silenciada e novos testes de regressão.

## Ainda pendente
- Dois GoLive simultâneos não implementados nesta macro.
- EXE real não gerado: requer Electron/electron-builder e ambiente de build Windows.
- Chamadas, tela, áudio, CPU/RAM/FPS ainda exigem testes ponta a ponta no Windows.
