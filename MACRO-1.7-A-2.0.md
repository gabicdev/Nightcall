# Nightcall 2.0.0 — Macro 1.7 a 2.0

- 1.7: persistência SQLite de comunidades e associação de membros.
- 1.8: entrada por código de convite, privacidade e perfis de membro.
- 1.9: canais de texto e voz cadastrados; mensagens de texto persistentes com SSE para membros.
- 2.0: gestão de cargos owner/admin/member e criação de canais restrita; painel básico na interface (botão 🌐).

## Limitações

Canais de voz são somente estrutura no banco; ainda não oferecem chamadas em grupo. Convites são códigos compartilháveis, sem expiração; proteja-os. A interface de comunidades é inicial; criação de canais e gestão de cargos já existem na API, mas não possuem botões no painel. O desktop ainda exige gerar EXE no Windows e não há servidor de internet incluído. Testes automatizados não substituem teste visual nem uso entre dois computadores.
