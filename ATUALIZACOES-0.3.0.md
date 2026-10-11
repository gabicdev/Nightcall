# Nightcall 0.3.0 — resumo da entrega

Implementado: busca exata de usuários por @, solicitação/aceite/recusa/remoção de amizades, listagem de amigos e solicitações, conversas privadas entre amigos, histórico de até 100 mensagens recentes e persistência em SQLite. Interface de chat com atualização por polling a cada 4 segundos. Preferências locais por conta.

Validação: `npm test` -> 4 testes aprovados, 0 falhas; `npm run build` -> OK. Teste browser/Playwright não executado: dependência Playwright ausente.

Para executar: Node >=22.13, `npm start` e abrir `http://127.0.0.1:3000`. Dados persistentes no diretório `data/` (não incluído na distribuição). Para experimentar com duas contas no mesmo computador, use janela normal e anônima (cookies separados).

Pendente: WebRTC e chamadas reais, screen share, comunidades, presença, WebSocket, notificações, recuperação de senha, infraestrutura de rede externa e auditoria de segurança pública. Não expor diretamente à internet sem revisão adicional. A interface ainda tem comandos protótipos. Não há criptografia ponta a ponta.
