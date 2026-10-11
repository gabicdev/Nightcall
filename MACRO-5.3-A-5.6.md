# Nightcall 5.3 → 5.6

- 5.3: opções de resolução (480p, 720p, 1080p) e FPS (15, 30, 60) para compartilhamento de janela/tela; seleção da fonte continua no diálogo nativo do sistema.
- 5.4: solicitação opcional de áudio do sistema, quando a plataforma e a fonte suportarem a captura. Mistura microfone e áudio capturado e restaura o microfone ao encerrar.
- 5.5: limite de bitrate por configuração via RTCRtpSender, com fallback se a plataforma não suportar.
- 5.6: encerramento com limpeza de faixas capturadas, contexto de áudio e tratamento de erros.

Limitações: não existe recepção de duas transmissões independentes; chamadas e captura precisam de validação em Windows com duas máquinas. Áudio do sistema não é garantido pelo getDisplayMedia em todas as fontes e sistemas.
