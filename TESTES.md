# Verificação — contas 0.2.0 — 10/10/2026

## Implementado

Servidor HTTP local, SQLite persistente, cadastro, login, sessão de sete dias, logout e perfil salvo por conta. Módulos existentes preservados. Login e aplicação são regiões estáticas alternadas pelo atributo hidden; não ocupam duas alturas de tela ao mesmo tempo. Sem unsafe-eval e sem fetch de templates.

## Executado

- npm test: três testes passam. O teste de integração cobre validação, usuário duplicado, senha incorreta, cookies, isolamento de duas contas, atualização do próprio perfil, rejeição de avatar inválido, origem indevida, arquivos internos inacessíveis, persistência após reinício, logout e limite de tentativas.
- npm run build: sintaxe de todos os módulos frontend e backend.
- npm run test:accounts: Chrome; cadastro, login, erro de senha, refresh autenticado/deslogado, logout, perfil persistente, navegação, outra sessão de navegador e mobile 390×844. Login e aplicação em y=0; zero erros JS e zero requests de templates.
- npm run test:browser: Home/Amigos/Mensagens, modal de amigos, busca/renderização com fixtures locais, configurações, perfil salvo/reload, preferências, desktop e mobile. Executado com servidor e conta reais. Fixtures de amigos não comprovam amizade ou chat real.

## Limites

Sem comparação pixel a pixel nesta etapa: a tela de autenticação e o botão Sair são novos. Sem hardware de áudio, comunicação entre redes ou teste de produção. Amigos, mensagens, chamadas e comunidades ainda não têm implementação conectada. Não houve push/deploy.

A estrutura organizada anterior foi mantida. A restauração do perfil principal agora lê a conta autenticada e atualiza a interface no boot; anteriormente o perfil principal só era atualizado ao salvar. Nenhuma regressão funcional foi detectada pelos testes executados.
