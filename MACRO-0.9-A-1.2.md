# Nightcall 1.2.0 — Macro 0.9 a 1.2

## Implementado
- 0.9: Endpoint autenticado de sinalização de chamadas `/api/calls/signal` com autorização por amizade, bloqueio e limite de taxa. Transporte por SSE direcionado apenas à conta de destino.
- 1.0: Controle de chamada de voz WebRTC com microfone, SDP offer/answer, candidatos ICE e STUN público.
- 1.1: Fluxo de aceitar, recusar, ocupado, desligar e timeout (45 s). Limpeza de recursos de mídia.
- 1.2: Controles de voz na conversa; feedback de status e tratamento de falhas, testes automatizados de privacidade de sinalização.

## Resultados e limites
- 7 testes automatizados passaram e build JS passou no Linux.
- Não houve teste manual de voz entre dois aparelhos nem validação do microfone, e o binário Windows não foi produzido.
- Somente voz foi implementada: compartilhamento de tela/áudio do sistema ainda NÃO está implementado.
- Electron mantém servidor local isolado. Duas instalações com seus próprios servidores locais NÃO compartilham contas, DMs ou chamadas.
- Para acesso pela internet precisa hospedar **uma instância central** em endereço HTTPS válido, configurar reverse proxy/WebSocket/event-stream e TURN para NAT restritivo; STUN sozinho não garante conexão.
- Servidor de desenvolvimento escuta somente em 127.0.0.1, de propósito. NÃO exponha porta diretamente à internet sem HTTPS, proteções e auditoria de implantação.
- O script existente GERAR-EXE-WINDOWS.cmd tenta gerar instalador e portátil em Windows, não foi executado nem validado aqui.

## Próximas prioridades
1. Teste real de áudio em duas sessões apontando para servidor comum; aperfeiçoar UI e acessibilidade.
2. Servidor HTTPS hospedado, configuração TURN e monitoramento de conexões.
3. Captura de tela com controle explícito e áudio opcional; qualidade e reconexão.
4. Compilar, assinar se possível, e validar o instalador Windows.
