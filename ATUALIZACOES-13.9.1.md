# Nightcall 13.9.1 — instalação e atualização

Use Nightcall-Setup-13.9.1-x64.exe. Execute por cima da instalação existente, sem desinstalar antes. Mantivemos a identidade com.nightcall.desktop, o nome Nightcall e a pasta de dados independente dos arquivos instalados. A configuração não apaga dados ao desinstalar; não exclua manualmente a pasta de dados.

A versão instalada verifica atualizações ao abrir e a cada quatro horas. Baixa em segundo plano as versões estáveis publicadas em https://github.com/gabicdev/Nightcall. Quando pronta, mostra uma notificação. No ícone do Nightcall perto do relógio do Windows, use “Atualizações — verificar / instalar”. Encerre a chamada antes de escolher “Reiniciar e atualizar”. Fechar normalmente o aplicativo não instala atualizações automaticamente.

A versão portátil não recebe atualização automática. Para usar o novo fluxo, passe a usar o instalador. O nome/pasta de dados do aplicativo foi mantido, mas instalações antigas personalizadas devem ser verificadas antes de remover seus arquivos.

## Publicação das próximas versões

O repositório público foi verificado em 11/10/2026 e ainda não tinha Releases. A atualização não funciona somente por colocar o código no GitHub: os arquivos da versão precisam estar publicados em Releases.

1. Crie uma Release estável com a tag v13.9.1 no repositório gabicdev/Nightcall.
2. Anexe Nightcall-Setup-13.9.1-x64.exe, seu arquivo .blockmap e latest.yml, juntos, sem renomeá-los. Esses arquivos estão no ZIP “publicar”.
3. Publique a Release; não deixe como rascunho ou pré-lançamento.
4. Nas próximas versões, aumente version em package.json, compile novamente e publique o instalador e metadados gerados por aquela compilação na mesma Release. Nunca reutilize latest.yml de outra compilação.

O build configura electron-updater com o provedor GitHub para esse repositório. Não requer um token no aplicativo distribuído. Não foram publicados arquivos nem incluídas credenciais nesta entrega.

## Validação e limites

- 60 testes passaram, incluindo atualização pronta, adiamento, reinício explícito, erros, nova tentativa e bloqueio da edição portátil. Esses testes do atualizador usam um provedor simulado.
- Verificação de sintaxe do desktop e build do frontend passaram.
- Instalador e portátil Windows gerados; metadados e dependência do atualizador verificados no aplicativo empacotado.
- Não foi executada uma instalação real sobre a instalação pessoal do usuário. Não foi validada atualização completa entre duas Releases públicas, pois ainda não há Releases no repositório.
- O aplicativo continua sem assinatura digital. Os avisos do Windows podem continuar aparecendo.

Para migrar uma versão antiga que não tem atualizador, é necessário executar este instalador uma vez. As próximas versões publicadas corretamente poderão chegar pelo aplicativo.

O Electron empacotado 13.9.1 passou por cadastro, comunidade com modelo, envio de mensagem, perfil, banner e recarregamento com dados temporários. Isso valida a abertura e esses fluxos; não substitui o teste de instalação ou de atualização entre Releases.
