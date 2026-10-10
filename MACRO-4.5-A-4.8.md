# Nightcall 4.8.0 — Macro 4.5 a 4.8

- **4.5:** `/api/network/status` autenticado para verificar conectividade e configuração STUN/TURN sem vazar credenciais.
- **4.6:** indicador de queda e retorno do canal de eventos; sincronização das mensagens quando o SSE reconecta.
- **4.7:** tolerância de 12 segundos a interrupções curtas de WebRTC; liberação do temporizador quando a chamada volta.
- **4.8:** testes automatizados de privacidade e recuperação, documentação de uso em duas instalações.

## Teste de duas instalações

1. Hospede um único servidor Node.js com banco persistente, HTTPS, hostname público e backup.
2. Configure os dois executáveis com a **mesma** URL HTTPS usando `CONFIGURAR-SERVIDOR-WINDOWS.cmd`.
3. Entre com duas contas distintas, crie amizade e confirme DMs nos dois PCs.
4. Confira `/api/network/status` autenticado e teste voz/tela em redes distintas; TURN será necessário em muitas redes.

**Não foi feito teste real em duas máquinas nem compilado EXE neste ambiente.** Nunca exponha a porta local sem TLS e autenticação.
