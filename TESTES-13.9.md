# Validação Nightcall 13.9.0 — 11 de outubro de 2026

## Concluído

- Suíte Node: 57/57 testes passaram. Abrange contas, sessões, mensagens, permissões, sinalização, voz em grupo, mídia, privacidade, recuperação de rede e contratos desktop. Inclui testes de persistência/isolamento do banner e migração repetida de um banco antigo com conta e sessão.
- Build de frontend e checagem de sintaxe desktop passaram.
- Regressão existente no Chromium: navegação, amigos, perfil, preferências, cadastro, login, logout, recarregamento, telas móveis e duas sessões isoladas; sem erros JavaScript registrados.
- Novos fluxos Chromium: perfil separado da engrenagem, banner carregado/salvo após reload, criação por etapas, todos os modelos no servidor, mensagem em canal, renomeação preservando histórico, criação de canal, segunda conta entrando por convite, bloqueio de edição para membro, validação de nomes/modelos, convite inválido, Escape, retorno à home e layout móvel.
- Entrada/saída de voz em grupo no Chromium com dispositivo de mídia simulado; compositor de texto fica oculto na voz.
- Electron com contas temporárias: cadastro, painel de perfil, modelo Jogos com três canais, mensagem, banner e recarregamento. O aplicativo empacotado é testado pelo roteiro tests/desktop-workflows.mjs; resultado em evidence/electron.json.
- Inspeção visual de screenshots Chromium de criação, perfil, comunidades e tela móvel. A captura da janela Electron oculta não foi obtida de forma consistente; as validações Electron registradas verificam os elementos e ações da página.

## Não validado

- Conversa de voz real entre dois computadores, qualidade de áudio, dispositivos físicos, câmera, compartilhamento real de tela, TURN/NAT e reconexão sob uma queda de rede real. Os testes de sinalização e mídia simulada não comprovam essas condições.
- Instalação, desinstalação e atualização pelo instalador NSIS em uma máquina limpa. Não foi feita instalação sobre os dados reais do usuário.
- Automação direta do wrapper do portátil: a conexão do Playwright excedeu o prazo. Os fluxos Electron foram validados no aplicativo extraído/empacotado win-unpacked; isso não comprova a abertura do wrapper portátil em outra máquina.
- Migração do banco real do usuário: ele não foi acessado. A migração foi validada em uma cópia sintética do esquema antigo; mantenha seu backup antes de substituir uma instalação.
- Servidor remoto de produção, publicação e funcionamento multiplayer fora do ambiente local.
- Banner depende de uma URL de imagem acessível. Links quebrados ficam ocultos; upload do computador ainda não está implementado.
- Executáveis não possuem assinatura digital de editor. A aplicação do ícone não equivale a assinatura.

## Evidências

Logs e resultados compactos são incluídos em evidence no ZIP de fontes. Os screenshots são capturas do aplicativo em teste, não imagens geradas.

Scripts: npm test; npm run build; npm run check:desktop; tests/browser.mjs; tests/accounts-browser.mjs; tests/workflows-browser.mjs; tests/desktop-workflows.mjs. Os testes de navegador requerem Playwright e Chromium; PLAYWRIGHT_MODULE e CHROME_PATH permitem indicar as instalações existentes. O teste Electron usa NIGHTCALL_TEST_MODE e NIGHTCALL_TEST_DATA para isolar os dados; NIGHTCALL_TEST_EXE seleciona o aplicativo compilado.
