# Nightcall 13.10.0

## Alterações
Comunidades ocupam um espaço contínuo com canais, conversa e membros. A setinha reúne convites, configurações, criação de canal/categoria, notificações e ID. Criar/entrar ficam no +; troca de comunidade pelos ícones da barra lateral. Configurações permitem renomear, administrar cargos e apagar com confirmação do nome e autorização do dono.

Amigos e mensagens têm busca simples, filtros sem sublinhados e estados vazios com ícones coerentes. Conversas aparecem na lateral. Configurações abrem visão geral; perfil e edição são ações separadas. Perfil tem avatar, bio e banner por URL. Categorias podem ser criadas e escolhidas ao criar canais. Preferência de notificações é salva por conta e comunidade neste dispositivo.

Chamadas deixam de mostrar quatro espaços de vídeo vazios. Vídeos e controles aparecem conforme a mídia ativa. A logo oficial foi preservada, sem gerar imagens.

## Instalação e atualizações
Execute Nightcall-Setup-13.10.0-x64.exe sobre a instalação existente, usando a mesma conta Windows. Não é necessário desinstalar antes. A identidade do aplicativo e o diretório de dados foram mantidos. O portátil não instala atualizações automaticamente.

Para distribuir as próximas atualizações, publique no GitHub gabicdev/Nightcall uma release pública com tag v13.10.0 e os três arquivos do ZIP publicar: instalador, seu .blockmap e latest.yml. Não modifique nem renomeie esses arquivos. O aplicativo instalado verifica atualizações e permite instalar/reiniciar pelo menu da bandeja quando prontas. Nenhuma release foi publicada nesta tarefa.

## Validação e limites
62 testes de regressão passaram, incluindo migração de banco antigo, autorização, comunidade/categoria, histórico e atualização simulada. Fluxos Chromium passaram com duas contas: amigos, mensagens, criação/entrada, categorias, notificações, renomeação e exclusão. Testes anteriores de contas, navegação e criação também passaram. Chamada entre duas contas foi conectada com microfones simulados, mute e encerramento. Aplicativo Electron empacotado foi testado com dados isolados para cadastro, comunidade, mensagens, perfil e banner.

Não foram validados áudio real entre computadores, qualidade em redes externas, compartilhamento de tela real, atualização a partir de release pública nem instalação/upgrade na conta pessoal do usuário. Executáveis não têm assinatura digital. Banco pessoal não foi aberto nem alterado; preservação foi verificada em bancos de teste. Apagar comunidade remove os seus canais e mensagens após confirmação, preservando contas e mensagens privadas.

## Código
O ZIP fontes inclui código, testes e evidências, sem banco pessoal ou dependências instaladas. Requer Node 22.13 ou superior. Instale dependências com npm ci; npm test; npm run build. Empacotamento: npm run dist:win -- --publish never.
