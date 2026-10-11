# Nightcall 13.11.0

Esta versão concentra as melhorias em chamadas, perfil, comunidades e conversas, mantendo a identidade visual do Nightcall.

## O que mudou

- Adicionar amigos: campo de usuário organizado, resultado com foto, indicação de amizade ou solicitação existente e aceitação de pedidos recebidos pelo próprio modal.
- Perfil: escolha de imagens e GIFs salvos no computador para avatar e banner, prévia e confirmação ao salvar. A foto passa a aparecer no perfil, nas mensagens, na comunidade e na chamada. Endereços externos continuam disponíveis; se a imagem externa falhar, a interface orienta escolher um arquivo.
- Comunidades: ícone personalizado nas configurações, menu na seta do nome e remoção da mensagem permanente “Comunidade criada com sucesso.”. A marca oficial do Nightcall foi preservada.
- Chat privado e canais: envio de imagens, GIFs, vídeos e áudio, prévias antes de enviar, reprodução no chat, colar ou arrastar arquivos e biblioteca pessoal de figurinhas que podem ser reutilizadas.
- Salas de voz: cartões de participantes, sua própria foto e identificação, controles de microfone, áudio, câmera e tela. A chamada permanece ativa ao abrir um canal de texto, com um painel para voltar à sala ou desligar.
- Chamadas privadas: aviso de chamada recebida mesmo fora da conversa, câmera nos dois sentidos e duas transmissões de tela independentes.
- Correções de chamadas: renovação da presença para não desaparecer depois de 45 segundos; negociação das pistas de vídeo entre quem liga e quem atende; limpeza dos dispositivos ao sair; encerramento de transmissão sem deixar um quadro congelado; desligamento recebido imediatamente pelo outro participante.
- Tela de entrada: correção da margem após sair da conta em tamanho de celular.

## Arquivos e dados

O envio aceita até **8 MiB por arquivo**, **4 anexos por mensagem** e **128 MiB de uploads por conta**. Imagens aceitas: PNG, JPEG, GIF e WebP. Mídias aceitas: MP4, WebM, MP3, Ogg e WAV, conforme o formato reconhecido e o suporte de reprodução do navegador. Figurinhas são imagens ou GIFs enviados pelo usuário; não há catálogo externo integrado.

Os arquivos ficam no banco do servidor e são servidos com autenticação e verificação de acesso. Mensagens privadas limitam o acesso aos participantes; anexos de comunidades exigem participação naquela comunidade. A migração adiciona campos e uma tabela de mídia sem apagar contas ou histórico.

Os testes usaram bancos temporários. Os dados pessoais da instalação existente não foram abertos ou modificados. No modo local, os dados continuam naquela máquina; para pessoas em computadores diferentes conversarem, todas precisam utilizar o mesmo servidor remoto configurado.

## Instalar e atualizar

Execute **Nightcall-Setup-13.11.0-x64.exe sobre a instalação atual**, usando o mesmo local. Não é necessário desinstalar antes. O instalador mantém os dados do aplicativo. A edição Portable funciona separadamente e não utiliza o atualizador automático.

O aplicativo instalado está preparado para consultar as releases do repositório `gabicdev/Nightcall`, baixar uma versão mais nova e permitir instalar e reiniciar. A distribuição desta atualização ainda precisa ser publicada no GitHub. Nenhuma release foi publicada durante este trabalho, e a atualização a partir de uma release pública não foi validada de ponta a ponta.

Para publicar, crie a release **v13.11.0** e anexe juntos:

1. `Nightcall-Setup-13.11.0-x64.exe`
2. `Nightcall-Setup-13.11.0-x64.exe.blockmap`
3. `latest.yml`

O pacote `Nightcall-13.11.0-publicar.zip` contém esses três arquivos com metadados conferidos contra o instalador. Não altere o nome ou o conteúdo dos arquivos de atualização. A edição Portable pode ser anexada separadamente. Os executáveis não possuem assinatura digital.

## Validação realizada

- **65 testes automatizados passaram**, incluindo autenticação, permissões de anexos, formatos, acesso por membros, reprodução por requisições parciais, persistência após reiniciar o servidor e renovação da presença de voz.
- Navegador: cadastro, entrada, saída, sessões isoladas, navegação, perfil, amigos, mensagens, gerenciamento de comunidades e adaptação ao tamanho de celular passaram.
- Duas contas: upload e recarregamento de avatar e banner, pedidos de amizade pelo modal, envio e reprodução de vídeo e áudio, reutilização de figurinhas, ícone da comunidade e anexos em canais passaram.
- Duas contas em chamada: participantes visíveis por mais de 45 segundos, câmeras nos dois sentidos, compartilhamento, conversa em canal sem sair da chamada, limpeza ao desligar e chamada recebida fora da conversa passaram.
- Chamada privada: câmera nos dois sentidos, duas transmissões simultâneas e encerramento independente das transmissões passaram.
- Aplicativo Windows empacotado: fluxos de conta, perfil com upload e comunidade foram verificados usando dados temporários.

**Limites da validação:** microfones e câmeras foram simulados nos testes de navegador. A captura de tela foi substituída por uma pista de vídeo de teste, transmitida realmente pelo WebRTC. Isso verifica a negociação, o transporte e a interface, mas não comprova funcionamento com microfone físico, seleção de janela pelo Windows, áudio do sistema ou entre dois computadores em redes diferentes. Esses cenários ainda exigem teste real; redes restritivas podem exigir um servidor TURN. As salas de voz continuam limitadas a cinco pessoas.

As evidências e os testes estão incluídos no pacote de fontes. O README de apresentação permanece sem número fixo de versão para uso na página do GitHub.
