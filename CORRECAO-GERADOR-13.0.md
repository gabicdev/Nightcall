# Nightcall 13.0 — correção do gerador Windows

1. Extraia todo o ZIP para uma pasta normal (não execute dentro do ZIP).
2. Instale Node.js 22.13 ou superior e garanta acesso à internet.
3. Execute `GERAR-EXE-WINDOWS.cmd`.
4. Se falhar, leia o arquivo mais recente em `logs\build-windows-*.log` e encaminhe as linhas finais para diagnóstico.
5. Se funcionar, os dois arquivos .exe estarão na pasta `release`.

A geração baixa o Electron e suas dependências da internet. Não foi validada em uma máquina Windows nesta entrega.
