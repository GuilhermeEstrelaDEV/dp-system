# ETP-015.3 — Compatibilidade local entre versões

Worktrees detached foram usados sem modificar `develop` ou a branch do PR #61.

| Combinação                           | Evidência                                          | Classificação                                |
| ------------------------------------ | -------------------------------------------------- | -------------------------------------------- |
| aplicação anterior + schema anterior | geração Prisma e build concluídos                  | `SUPPORTED` para build; runtime `NOT TESTED` |
| aplicação anterior + schema novo     | cliente novo + código anterior compilam            | `NOT TESTED` em runtime                      |
| aplicação nova + schema anterior     | build falha com 34 erros por campos/tipos ausentes | `UNSUPPORTED`                                |
| aplicação nova + schema novo         | geração Prisma, build e testes PostgreSQL 4/4      | `SUPPORTED` localmente; destino `PENDING`    |

Health, autenticação/contexto e leituras completas entre as quatro combinações não foram executados;
não há credenciais/bootstrap representativos aprovados para esse ensaio. A ordem coordenada permanece
obrigatória até comprovar aplicação anterior + schema novo em runtime.
