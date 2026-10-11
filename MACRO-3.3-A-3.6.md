# Nightcall 3.6.0 — Estabilidade e desktop

- 3.3: proteção de backpressure em eventos SSE, desligando clientes com mais de 256 KiB pendentes.
- 3.4: limpeza periódica de registros efêmeros de autenticação, presença e sinalização.
- 3.5: trava de instância única no Electron; nova abertura traz janela existente ao foco.
- 3.6: script Windows valida sintaxe desktop, testes, build e só depois tenta empacotar NSIS/portable.

## Limites
Não foram medidos FPS/RAM reais, não foi compilado um EXE neste ambiente e não houve validação em dois PCs. A trava não altera o modo de execução do servidor remoto.
