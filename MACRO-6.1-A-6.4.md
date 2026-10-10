# Nightcall 6.1 → 6.4 — endurecimento e validação

- 6.1: respostas HTTP com X-Frame-Options DENY e Referrer-Policy no-referrer.
- 6.2: máximo de quatro conexões SSE por usuário, para limitar consumo de recursos.
- 6.3: proteção adicional de arquivos estáticos contra caminhos não permitidos e métodos indevidos.
- 6.4: validação do payload de sinalização e teste automatizado de cabeçalhos e acesso estático.

## Verificação
24 testes automatizados aprovados, build frontend OK e `npm run check:desktop` OK.

## Limitações
Não houve compilação de EXE para Windows ou teste funcional entre dois PCs. Áudio de canais em grupo ainda não está implementado; presença em canal não transmite mídia. Não houve medição real de desempenho nem auditoria de segurança completa.
