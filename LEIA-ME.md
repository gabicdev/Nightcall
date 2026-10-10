# Nightcall 0.2.0 — contas e perfis no servidor

Continuação exclusiva do Nightcall-main.zip organizado. Não mistura as antigas versões rc.

## Abrir

Use Node.js 22.13 ou superior (testado com 24.19). Na pasta do projeto, execute `npm start` e abra http://127.0.0.1:3000. Não há dependências de produção para instalar. Crie sua conta na tela inicial; senhas têm no mínimo 10 caracteres.

O banco SQLite é criado em `data/nightcall.sqlite`. Contas, perfis e sessões sobrevivem ao reinício. Não apague essa pasta se quiser manter os dados. Para backup, pare o servidor e copie a pasta inteira. Ela está excluída do Git; nunca compartilhe o banco com o código.

O servidor escuta somente no computador local. Esta entrega não foi publicada nem preparada como implantação pública. Recuperação de senha ainda não existe.

## Onde eu mexo?

| Quero mudar | Arquivo |
|---|---|
| Estrutura das telas e formulários | index.html |
| Inicialização dos módulos | js/app.js |
| Cadastro, login, sessão e logout na interface | js/auth.js |
| Requisições da interface ao servidor | js/api.js |
| Navegação e estado local | js/navigation.js |
| Listas, busca e modal de amigos | js/friends.js |
| Diretório de conversas (comunicação ainda pendente) | js/messages.js |
| Edição e salvamento do perfil | js/profile.js |
| Seções das configurações | js/settings.js |
| Teste de microfone e preferências locais de áudio | js/audio.js |
| Preferências e avisos locais | js/preferences.js |
| Aparência do login | css/auth.css |
| Layout, amigos, mensagens, responsividade e configurações | Arquivos correspondentes em css/ |
| Rotas HTTP e validação dos dados | backend/server.js |
| Senhas, cookies e sessões | backend/accounts.js |
| Estrutura do banco | backend/database.js |
| Inicialização do servidor | scripts/start.js |

O HTML permanece estático, sem fetch de fragmentos. app.js apenas autentica e inicia os módulos uma vez. Senhas são derivadas com scrypt e salt; sessões usam tokens aleatórios, guardados como hash no banco, com validade de sete dias. Cookies são HttpOnly e SameSite=Strict. Não altere contas, sessões ou esquema do banco sem executar os testes e entender os efeitos sobre os dados existentes.

Perfil vem do servidor; localStorage é apenas um cache de compatibilidade. Preferências de áudio, notificações e privacidade ainda são locais ao navegador e compartilhadas pelas contas usadas nele. Não representam regras de privacidade aplicadas no servidor.

## O que ainda falta

- Busca de pessoas no servidor, pedidos e amizades reais.
- Mensagens entre contas, histórico e atualização em tempo real.
- Voz/WebRTC, mute/deafen efetivos, câmera, tela e PiP. Botões atuais de chamada ainda são placeholders do ZIP original.
- Comunidades, canais, membros e presença real.
- Recuperação de senha, política de implantação e validação entre duas redes.

## Testes e build

- `npm test`: testes HTTP com banco temporário e verificação da estrutura.
- `npm run build`: sintaxe de frontend/backend; copia o frontend para dist/. O backend continua necessário para usá-lo.
- `npm run test:accounts`: cadastro/login/logout/refresh/perfil no navegador.
- `npm run test:browser`: regressão dos fluxos existentes com usuário de teste e servidor real.

Para os testes de navegador, instale Playwright no ambiente de desenvolvimento (`npm install --no-save playwright` e `npx playwright install chromium`), ou informe PLAYWRIGHT_MODULE apontando para o módulo instalado. CHROME_PATH permite usar Chrome instalado. Os testes criam bancos temporários; não alteram suas contas.

Não edite dist/. O servidor estático antigo, scripts/serve.js, não executa a aplicação com contas: use npm start.
