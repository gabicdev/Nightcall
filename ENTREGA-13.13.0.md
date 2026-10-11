# Nightcall 13.13.0

Esta versão prioriza estabilidade e diagnóstico das chamadas, atualização acessível no aplicativo e falhas de envio de mídia. Mantém o layout e os recursos da 13.12.

## Melhorias implementadas

- **Recuperação das calls:** tentativas limitadas de renegociação ICE, retomada ao voltar a ficar online e renovação da presença na sala. Mensagens de sinalização são processadas em sequência para reduzir conflitos entre oferta, resposta e candidatos de conexão. A chamada privada tolera perda de conexão por até 35 segundos antes de encerrar.
- **Microfone durante a call:** troca de dispositivo nas salas e nas chamadas privadas sem precisar desligar. Se um microfone selecionado desaparecer da lista de dispositivos, o aplicativo tenta usar o padrão. O estado de silêncio é preservado na troca.
- **Quem está falando:** destaque do avatar e do cartão a partir do áudio capturado/recebido, com supressão quando o participante está silenciado na sala.
- **Qualidade da conexão:** latência e perda recente de pacotes de áudio medidas pelo WebRTC. O indicador não declara boa conexão quando não existem estatísticas. Não coleta nem exibe endereços dos participantes.
- **Visual das calls:** cartões amplos, nomes abaixo do canal de voz, contador, controles compactos, tela cheia e clique/Enter em uma transmissão para ampliar e voltar.
- **Atualização nas configurações:** versão instalada, estado da verificação, progresso e ação “Reiniciar e atualizar”. A instalação continua exigindo escolha explícita na confirmação do Windows. Portátil e navegador informam seus limites.
- **Diagnóstico de conexão:** botão nas configurações informa acesso ao servidor, tempo da requisição, modo local e se há retransmissão configurada para redes restritivas. Retransmissão configurada não significa que o caminho de mídia foi validado.
- **Chat:** progresso de upload, mensagem de falha junto ao arquivo, opção de tentar novamente e busca na biblioteca pessoal de figurinhas. O arquivo com falha deve ser reenviado ou removido antes de enviar a mensagem, para evitar omissão silenciosa.

## Atualização pelo GitHub: problema encontrado

Na consulta realizada durante este trabalho, a release pública mais recente de `gabicdev/Nightcall` usava a tag `APP` e continha somente o Setup e o Portable da versão 13.10.0. Faltavam os metadados `latest.yml` e o blockmap. Isso impede concluir a distribuição automática da atualização. Essa consulta é uma fotografia do estado naquele momento; o repositório pode mudar depois.

Crie uma **nova release com tag v13.13.0**. Extraia `Nightcall-13.13.0-publicar.zip` e anexe os três arquivos, mantendo seus nomes:

1. `Nightcall-Setup-13.13.0-x64.exe`
2. `Nightcall-Setup-13.13.0-x64.exe.blockmap`
3. `latest.yml`

O Portable pode ser anexado separadamente. Não anexe apenas o ZIP: o atualizador precisa encontrar os arquivos individuais. Marque a release como a mais recente quando publicar. Não é preciso apagar a release antiga.

O pacote de fontes inclui `.github/workflows/release-windows.yml`. Depois que os fontes estiverem no repositório, o envio de uma tag numerada igual à versão do `package.json` prepara o aplicativo Windows, verifica os arquivos e cria **um rascunho de release com os anexos completos**. O rascunho exige publicação pelo responsável. O workflow não foi executado no GitHub durante este trabalho; seu formato e os comandos locais foram verificados.

O navegador disponível não estava conectado à conta do GitHub. Nenhuma nova release ou alteração de repositório foi publicada.

## Instalação e dados

Execute o Setup sobre a instalação atual, no mesmo local, **sem desinstalar**. O aplicativo instalado está preparado para baixar futuras atualizações do GitHub e reiniciar quando você escolher. A edição Portable não substitui uma instalação e não utiliza esse mecanismo.

Os dados pessoais da instalação existente não foram abertos ou modificados. Testes usaram contas, bancos e caches temporários. As migrações continuam preservando contas e histórico. Os arquivos de mídia continuam limitados a 8 MiB por arquivo, quatro anexos por mensagem e 128 MiB de uploads por conta. Os executáveis não possuem assinatura digital.

## O que foi validado

- **68 testes automatizados passaram**, incluindo permissões, mídia, presença, sinalização, qualidade calculada pelas estatísticas e estados do atualizador.
- Duas contas no navegador: câmera e transmissão, duas telas privadas independentes, troca de microfone durante chamadas de grupo e privadas, indicadores de fala e qualidade, recuperação por renegociação ICE, ampliação de vídeo, tela cheia e largura de celular.
- Presença na call por mais de 45 segundos, conversa no canal durante a chamada e liberação de mídia ao sair.
- Falha de upload seguida de nova tentativa sem duplicação de mensagem. Interface de progresso e instalação de atualização verificada com ponte simulada.
- **Motor real `electron-updater`:** versão de origem 13.12.0 declarada no adaptador de teste; detectou a 13.13.0 em um servidor HTTP local, baixou o instalador real e conferiu SHA-512. Estado final: pronto para instalar. A instalação não foi executada; auto-instalação ao sair permaneceu desabilitada.
- Aplicativo Windows empacotado com dados temporários: cadastro, perfil, avatar, banner, comunidade, mensagem e ponte nativa para consultar a atualização. O modo de teste impede baixar/instalar automaticamente.
- Instalador, blockmap e `latest.yml` conferidos contra a versão e o hash do binário.

## Limites e próximo teste real

Câmeras e microfones foram simulados nos testes de navegador. O compartilhamento usou uma pista de vídeo real de teste em vez da seleção de janela do Windows. A renegociação ICE foi exercitada em uma conexão local; isso não comprova recuperação de todas as falhas de rede física.

Ainda é necessário testar com **duas pessoas em computadores e redes diferentes**, utilizando o mesmo servidor remoto: ouvir os dois lados, trocar o microfone físico, ligar câmera, escolher uma janela, verificar áudio do sistema, interromper e restaurar a rede e sair da call. Algumas redes exigem servidor TURN. As salas continuam limitadas a cinco participantes.

Também falta executar uma instalação de atualização completa pela release pública, após publicar os anexos corretos, verificando preservação dos dados e abertura da nova versão. O teste local de download não substitui essa etapa.

Reações, respostas e edição de mensagens, reorganização livre dos canais e permissões específicas por canal permanecem oportunidades para uma próxima etapa; não foram implementadas nesta versão.
