# Nightcall 4.0 — conexão entre computadores

O aplicativo opera em **modo local** por padrão. Cada instalação possui banco próprio.

Para conectar duas instalações ao mesmo serviço, implante o backend num servidor HTTPS e configure em cada Windows:

1. Crie o arquivo `server-config.json` na pasta de dados Electron (`%APPDATA%\nightcall` ou `%APPDATA%\Nightcall`, conforme o nome instalado), com:

```json
{"serverUrl":"https://seu-dominio.example"}
```

2. Feche totalmente o app pela bandeja e reabra.

Alternativamente, inicialize o aplicativo com a variável `NIGHTCALL_SERVER_URL=https://seu-dominio.example`. O endereço deve usar HTTPS e não incluir caminhos, tokens ou senhas.

**Importante:** isso não hospeda o servidor, não instala TURN e não comprova áudio ou vídeo entre redes. É necessário configurar infraestrutura compartilhada e fazer testes de ponta a ponta.

Para criar o `.exe` no Windows, use `GERAR-EXE-WINDOWS.cmd` com Node.js instalado e acesso à internet para dependências. O instalador ainda não foi validado em uma máquina Windows.
