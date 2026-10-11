# Nightcall 3.2.0 — infraestrutura remota

- 2.9: servidor com endereço de escuta parametrizado; mantém localhost por padrão.
- 3.0: origem HTTPS permitida para requisições mutáveis; cookie Secure quando em modo remoto.
- 3.1: endpoint de configuração WebRTC autenticado e suporte a STUN/TURN por variável de ambiente.
- 3.2: exemplos de Caddy e implantação, testes de segurança e integridade.

## Implantação remota

1. Provisionar servidor com Node.js 22+, DNS, firewall e certificado TLS.
2. Instalar Caddy e configurar `deployment/Caddyfile.example` com domínio válido. Encaminhar apenas localhost:3000 pelo proxy.
3. Definir NIGHTCALL_PUBLIC_ORIGIN=https://dominio, NIGHTCALL_HOST=127.0.0.1, PORT=3000 e caminho persistente ao SQLite.
4. Iniciar `npm start` no servidor; acessar o domínio HTTPS de dois computadores.
5. Para chamadas em redes restritivas, hospedar TURN (por exemplo coturn), usar credenciais temporárias, definir NIGHTCALL_ICE_SERVERS_JSON e verificar chamadas reais.
6. Para Electron remoto, a versão desktop **ainda requer um seletor seguro de servidor**. O aplicativo atual continua iniciando seu backend local.

**Não incluído:** domínio, hospedagem, TURN ativo, proteção contra DDoS, backup automatizado, auditoria de segurança completa e chamadas testadas em computadores diferentes. O endpoint RTC expõe credenciais aos usuários logados, como é esperado para ICE; use credenciais curtas/temporárias e permissões adequadas.
