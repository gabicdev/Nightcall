# Nightcall 10.4.0 — macro 9.7 a 10.4

- 9.7–9.8: dois transceptores WebRTC para vídeo por chamada, negociados na oferta inicial.
- 9.9: identificação independente das duas faixas recebidas.
- 10.0: captura separada da segunda tela ou janela com prévia local.
- 10.1: iniciar e encerrar cada envio sem substituir o outro vídeo.
- 10.2: liberar capturas ao finalizar chamada e quando o compartilhamento termina.
- 10.3: limitar áudio do sistema à primeira transmissão; a segunda captura apenas vídeo.
- 10.4: testes de regressão da estrutura de transmissão dupla.

## Estado de validação
Testes de código e build **não** comprovam conexão, recepção nem qualidade de áudio/vídeo entre dois computadores. Também falta compilar o instalador .exe em Windows, configurar hospedagem HTTPS e medir FPS/RAM no jogo. O gerador GERAR-EXE-WINDOWS.cmd continua disponível.

## Teste manual necessário
1. Instalar/abrir Nightcall em dois PCs configurados para o mesmo servidor.
2. Iniciar chamada e compartilhar duas fontes distintas; verificar ambas do outro lado.
3. Encerrar cada fonte isoladamente e conferir que a outra continua ativa.
4. Encerrar a chamada e conferir se a captura de tela/microfone foi liberada.
