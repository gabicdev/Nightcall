# Nightcall 13.5 — correções funcionais e de interface

- Configurações: botão associado diretamente à abertura do painel de perfil (antes chamava alternância de microfone por índice).
- Nova conversa: botão + abre a lista de amigos, ao invés de não fazer nada.
- Adicionar na barra: encaminha para comunidades, ao invés de console.log.
- Comunidades: painel fixo integrado ao aplicativo, fechamento limpa classe de estado, avisos de criação/entrada e erros visíveis.
- Marca: ícone oficial recortado da arte fornecida (sem o texto espremido no rail).
- Navegação: dimensões, alinhamento, perfil fixo e botão sair na parte inferior.
- 3 testes de regressão específicos; 53/53 testes e build passaram.

## Limites
O ambiente bloqueou o Chromium automatizado no endereço local. Não foi possível fazer o teste visual no EXE Windows nem validar manualmente o clique de criação no Electron. Se a criação falhar, confira a mensagem exibida no painel e o log do servidor. Não reinstale substituindo dados reais: preserve a pasta de dados do usuário.
