# Nightcall 1.6.0 — Macro 1.3 a 1.6

## Alterações efetivas
- 1.3: Controle de microfone (silenciar/reativar) sem interromper a chamada.
- 1.4: Captura de tela por getDisplayMedia e substituição da trilha de vídeo WebRTC (replaceTrack).
- 1.5: Prévia local e reprodução do vídeo recebido; botão para encerrar transmissão e limpeza de trilhas.
- 1.6: Ajustes de layout das mídias, tratamento de falhas/permissões e teste automatizado de presença dos controles.

## Limites
- Compartilhamento inclui **vídeo da tela, não áudio do sistema**.
- A mídia só pode ser recebida quando os dois clientes acessam o **mesmo servidor Nightcall**, com sessão autenticada e sinalização funcional.
- STUN público não substitui TURN e não garante conexão em NAT/rede restrita.
- A transmissão, a voz e a integração Electron **não foram testadas ponta a ponta em dois PCs**.
- O pacote é código-fonte e gerador Windows; **não contém instalador EXE compilado**.
- Sem chamada de grupo, comunidades, streaming simultâneo nem hospedagem pública neste pacote.

## Validação
Execute `npm test` e `npm run build`. Para gerar EXE no Windows, execute `GERAR-EXE-WINDOWS.cmd` (depende de Node/dependências e ambiente compatível).
