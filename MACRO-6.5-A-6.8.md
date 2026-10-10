# Nightcall 6.8.0 — macro 6.5 a 6.8

- 6.5: sinalização WebRTC de canal autenticada, permitida apenas a usuários presentes no mesmo canal.
- 6.6: WebRTC em malha para até cinco participantes; recebimento e reprodução de áudio remoto.
- 6.7: controles para silenciar microfone, ensurdecer e sair; recursos liberados na saída.
- 6.8: teste automatizado de autorização de sinalização de grupo; integração na interface de comunidades.

## Limitações

Áudio real e reconexão ainda não validados em dois computadores. O limite de cinco reduz mas não elimina consumo de CPU. É preciso HTTPS (ou localhost), permissões de microfone, infraestrutura TURN configurada quando a rede exigir, e servidor compartilhado. O `.exe` continua dependente de compilação no Windows. Não há medição de FPS.

## Validação

25 testes automatizados passaram, build do frontend OK, sintaxe do Electron OK. Teste de UI e chamada física pendentes.
