# Nightcall 13.0.3 — correção do empacotamento Windows

## Causa identificada
O electron-builder tenta extrair o pacote winCodeSign, que contém links simbólicos .dylib do macOS. O Windows recusou criar os links. Não é uma falha do aplicativo nem exige modificar Secure Boot, antivírus ou habilitar modo desenvolvedor.

## Correção
Configuramos `build.win.signAndEditExecutable: false` (electron-builder 25) para não chamar a edição/assinatura de recursos do executável, evitando o caminho winCodeSign. O aplicativo será distribuído **sem assinatura digital** e sem personalização de ícone/metadados no executável. Para distribuição pública, assinatura deverá ser avaliada separadamente.

## Uso
1. Extraia o novo ZIP em uma pasta nova, fora do ZIP.
2. Rode `GERAR-EXE-WINDOWS.cmd`.
3. Verifique `release` para instalador e portátil.
4. Caso falhe, compartilhe o novo arquivo `logs/build-windows-*.log`.

Não apague caches de outras aplicações, não execute como administrador por padrão e não altere as proteções do Windows.
