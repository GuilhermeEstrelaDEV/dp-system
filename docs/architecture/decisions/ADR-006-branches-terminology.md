# ADR-006 — Padronização de filiais como branches

## Contexto

A especificação inicial usava `establishments`, enquanto a ETP-004 aprova o módulo e a entidade `branches` para representar filiais.

## Decisão

O termo canônico na aplicação, API, Prisma e documentação passa a ser `branches`. Cada filial pertence a uma empresa e possui código interno único no escopo da empresa. A mudança não introduz regra de domínio adicional.

## Consequências

Referências futuras a estabelecimentos devem usar `branches`. A hierarquia e vigência de departamentos permanecem pendentes e não são definidas por esta ADR.
