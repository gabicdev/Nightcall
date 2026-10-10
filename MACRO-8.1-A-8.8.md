# Nightcall — macro 8.1 a 8.8

Base: Nightcall 8.0.0. Versão resultante: 8.8.0.

1. 8.1 — salvar resolução selecionada da transmissão no armazenamento local.
2. 8.2 — salvar FPS selecionado da transmissão.
3. 8.3 — salvar preferência de solicitação de áudio compartilhado.
4. 8.4 — salvar seleção de microfone para próximas chamadas.
5. 8.5 — preservar seleção ao atualizar dispositivos, com fallback para microfone padrão quando removido.
6. 8.6 — restaurar saída de áudio e limpar prévia ao encerrar chamadas.
7. 8.7 — impedir tentativas paralelas de iniciar captura e reabilitar botão mesmo com erro.
8. 8.8 — limitar os valores lidos de FPS e resolução aos perfis aceitos; adicionar cinco testes de regressão.

Validação no ambiente de desenvolvimento: 33/33 testes de Node aprovados, build frontend OK, check:desktop OK, sintaxe js/calls.js OK.

Não verificado: instalador/executável Windows compilado, transmissão simultânea de duas telas, captura real de áudio do sistema, áudio WebRTC em dois computadores, medição real de FPS/CPU/RAM e uso externo por internet.

Para tentar gerar o instalador no Windows, execute `GERAR-EXE-WINDOWS.cmd` na pasta do projeto; isso requer dependências e acesso ao ambiente Windows.
