# Nightcall 13.9.0

Base: Nightcall-13.8.0-logo-comunidades.zip, encontrado em Downloads. Foram usados os prints da conversa e os dois prints do Discord enviados nesta sessão. A marca oficial existente foi reutilizada; não foram geradas imagens por IA.

## Mudanças

- Acesso rápido da home reorganizado em três cartões de tamanho igual, com ícone, título e descrição curta. Amigos, Comunidades e Mensagens abrem seus fluxos reais; em telas menores os cartões ficam empilhados.

- O + abre uma janela central sobre a tela atual, com Criar o meu, Jogos, Amigos, Grupo de estudos, Clube escolar, Comunidade local, Artistas e criadores e entrada por convite.
- Criação: modelo → nome → revisão dos canais → confirmação. Os modelos criam canais persistentes no servidor, dentro de uma transação. Fechar ou voltar não cria uma comunidade.
- Os quatro quadradinhos e o ícone debaixo do + foram removidos da barra principal. Comunidades tem acesso no menu lateral. O + passou a ser um botão único, sem o ícone e o pseudo-elemento duplicados que produziam o quadrado estranho. Os modelos usam ícones vetoriais consistentes, sem emojis.
- Marca com proporção preservada e sem deslocamento/corte imposto pelo layout. O símbolo foi extraído novamente do arquivo oficial, mantendo o desenho completo e margem em volta, em resolução maior. Ícone Windows e bandeja usam esse mesmo símbolo; não houve redesenho nem geração de nova arte.
- Perfil e engrenagem agora são botões separados. O perfil abre um painel próprio; Editar meu perfil leva às configurações.
- Banner por endereço HTTP/HTTPS: prévia, salvamento na conta, persistência e remoção ao apagar o endereço. Não há upload de arquivo nesta versão.
- Uma migração aditiva acrescenta banner ao SQLite. Não remove contas, sessões, mensagens ou comunidades; clientes antigos que salvam o perfil sem banner mantêm o valor existente.
- Comunidades ocupa o workspace e coordena a navegação. Criação usa um único diálogo com foco e Escape nativos. A tela anterior fica disponível ao fechar a criação.
- Canais: formulário de criação aberto sob demanda, tipo texto/voz, renomeação com permissões verificadas no servidor, mensagem e cópia de convite. Renomear conserva o canal e seu histórico. Exclusão, categorias e reordenação de canais não foram adicionadas.
- Mudança de tela e fechamento do workspace não desligam automaticamente a voz em grupo. O botão Sair do canal continua encerrando a participação.

## Uso e dados

Os executáveis são entregues separadamente do ZIP de fontes. Use o portátil ou o instalador 13.9.0. Feche a versão anterior antes de abrir a nova. O identificador do aplicativo e o local do banco desktop foram mantidos; não apague a pasta de dados. Nenhuma conta real foi aberta ou modificada durante o trabalho.

Para o navegador: Node.js 22.13 ou superior, `npm start`, endereço mostrado no terminal. Para desenvolver o desktop: `npm ci`, `npm run desktop`. Para recompilar: gerador Windows existente ou `npm run dist:win`. O ícone Windows exige a ferramenta winCodeSign do electron-builder; se sua extração falhar ao criar links simbólicos do macOS, extraia apenas os arquivos Windows no cache winCodeSign-2.6.0. Os executáveis desta entrega já estão compilados.

Consulte TESTES-13.9.md para validações e limitações.
