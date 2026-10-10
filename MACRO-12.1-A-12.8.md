# Nightcall 12.8.0 — macro de validação

- 12.1: rota `GET /api/health`, sem informação de usuário ou credenciais.
- 12.2: verificação de identidade do servidor no diagnóstico de rede.
- 12.3: diagnóstico com timeout e sem seguir redirecionamentos.
- 12.4: limpeza de executáveis antigos antes da compilação, evitando falsos positivos.
- 12.5: validador exige um instalador e um portátil para o release.
- 12.6: smoke test Windows do portátil com execução isolada de 12 segundos (`TESTAR-EXECUTAVEL-WINDOWS.ps1`).
- 12.7: testes automatizados do endpoint e diagnóstico.
- 12.8: consolidação do ZIP e testes completos.

**Não foi gerado .exe** neste ambiente. O script de smoke test depende de um .exe compilado no Windows. Chamadas, GoLive, FPS e servidor remoto exigem testes em máquinas reais.
