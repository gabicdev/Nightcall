# Nightcall 7.2 — Macro 6.9 a 7.2

- 6.9: retentativa com intervalo mínimo de 5 segundos após falha de conexão WebRTC, sem laço agressivo.
- 7.0: reconciliação de participantes no canal, descarte de conexões órfãs e fila de candidatos ICE limitada.
- 7.1: volume individual de participantes (0–100%) e ensurdecer, sem alterar volume do sistema.
- 7.2: controles de microfone/ensurdecer preservam o estado ao atualizar a lista do canal; revisão da rotina de limpeza.

Limitações: não foi possível validar áudio em dois computadores Windows, capturar áudio do sistema ou compilar/testar o instalador Windows neste ambiente. Não foram implementadas duas transmissões simultâneas nesta macro. A sinalização e o servidor compartilhado ainda exigem implantação e testes reais.

Gerador do EXE: GERAR-EXE-WINDOWS.cmd (compilação requer Windows com acesso às dependências).
