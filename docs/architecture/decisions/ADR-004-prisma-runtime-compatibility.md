# ADR-004 — Compatibilidade de runtime para Prisma

**Status:** Aceita

## Contexto

O ambiente de desenvolvimento atual usa Node.js 20.17.0. A versão mais recente do Prisma requer Node.js 20.19.0 ou superior. Alterar globalmente o Node da máquina não faz parte da ETP-002 e não é necessário para iniciar a fundação.

## Decisão

- Fixar Prisma ORM na linha 6 durante a ETP-002, compatível com Node.js 20.
- Usar imagens Docker Node 20 compatíveis com a mesma linha do Prisma.
- Registrar como pré-requisito futuro a atualização do Node local e das imagens para uma versão suportada pela linha mais recente do Prisma antes da adoção dessa linha.

## Consequências

- O ambiente local e os contêineres permanecem compatíveis entre si.
- A fundação não depende de alteração global de runtime na estação de desenvolvimento.
- A atualização para Prisma 7 será uma etapa planejada, com revisão de breaking changes, e não uma atualização implícita.
