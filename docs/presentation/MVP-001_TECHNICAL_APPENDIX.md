# MVP-001 — Apêndice técnico

## Arquitetura demonstrada

- monorepo pnpm/Turborepo;
- API NestJS, frontend React/Vite e PostgreSQL 16;
- Prisma Client e 16 migrations aplicadas em ordem;
- quatro serviços locais: PostgreSQL, Redis, API e web conforme Compose;
- autenticação JWT, sessão lógica, principal único e contexto de empresa ativa;
- trilha de auditoria e regras append-only existentes nos domínios entregues;
- dados fictícios, determinísticos e resetáveis.

## Segurança

- zero assignments de capability nas identidades demo;
- deny-by-default, 401 para identidade inválida e 403 para vínculo ausente;
- bloqueio de superfícies sem grant antes de chamadas legadas no fluxo demo;
- relatórios sanitizados e nenhuma credencial incorporada ao deck;
- reset e seed falham fora do alvo local explícito.

## Qualidade registrada na estabilização

| Indicador                  | Resultado                      |
| -------------------------- | ------------------------------ |
| testes do aceite MVP-001.8 | 376 aprovados                  |
| cobertura API              | 70,34% linhas; 69,75% branches |
| cobertura web              | 77,50% linhas; 74,15% branches |
| soak                       | 30,3 min; 7/7 checkpoints GO   |
| 5xx/restarts no roteiro    | zero                           |
| defeitos P0/P1 abertos     | zero                           |

## Limites técnicos

APIs legadas ainda não têm proteção canônica uniforme; a conta demo não recebe grants; não há
infraestrutura produtiva, deploy, MFA, refresh ou recuperação de senha. O bundle inicial excede 500
kB e há oito advisories transitivos documentados, nenhum crítico. Consulte
[limitações conhecidas](../quality/MVP-001_KNOWN_LIMITATIONS.md) e
[segurança](../quality/MVP-001_SECURITY_REVIEW.md).
