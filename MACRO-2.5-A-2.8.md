# Nightcall 2.8.0 — Macro Desktop

- 2.5: notificações nativas (Electron Notification) quando janela não está focada, IPC validado e sem expor Node ao frontend.
- 2.6: integração de bandeja: abrir, minimizar e sair; contador de notificações no tooltip.
- 2.7: Picture-in-Picture nativo de vídeo remoto durante chamada quando há faixa de vídeo.
- 2.8: integração de chamada recebida às notificações desktop; melhorias de limpeza da janela PiP e fluxo de mensagens.

**Limitações:** vídeo simultâneo de duas pessoas, captura de áudio do sistema, chamada entre redes e instalador EXE **não foram validados/implementados** nesta macro. Para EXE, execute GERAR-EXE-WINDOWS.cmd num Windows com Node instalado. Notificações só funcionam no Electron e dependem de permissões do sistema. Não há validação ponta a ponta Windows realizada aqui.
