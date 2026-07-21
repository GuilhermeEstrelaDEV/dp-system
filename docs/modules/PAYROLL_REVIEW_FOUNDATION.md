# Fundação técnica de conferência de folha

## Estado

Esta entrega inicia somente a fundação técnica neutra da ETP-013. A etapa continua parcial e bloqueada; não existe workflow operacional, aprovação, rejeição, permissão, endpoint, tela ou persistência de conferência.

## Recorte implementado

O domínio isolado em `apps/api/src/modules/payroll-reviews/domain` define:

- severidades técnicas `INFORMATIONAL` e `BLOCKING`, já previstas na especificação;
- estados de achado `OPEN` e `RESOLVED`;
- eventos append-only `OPENED`, `RESOLVED` e `REOPENED`;
- referências opcionais a contrato e item calculado;
- vínculo obrigatório com empresa e execução de folha;
- justificativa obrigatória para resolver ou reabrir;
- ordem cronológica, unicidade de evento e isolamento empresarial no histórico;
- transformações imutáveis que não alteram snapshots ou eventos anteriores.

Os identificadores, relógio e `traceId` são fornecidos pela futura camada de aplicação. A fundação não identifica o ator e não concede capacidade de ação.

## Limites deliberados

- O domínio não foi registrado como módulo NestJS e não expõe endpoints.
- Não há DTO HTTP operacional, feature flag, tela ou integração com fechamento.
- Não há schema Prisma ou migration: ciclo, ator, workflow e unicidade persistente ainda dependem de decisões abertas.
- Não há gravação em `AuditLog`; a infraestrutura atual não propaga identidade funcional aos módulos. O contrato de evento preserva `traceId` para futura integração auditável.
- O vínculo `companyId` protege transições de domínio, mas a futura aplicação ainda deverá confirmar que execução, contrato e item pertencem à mesma empresa.
- Nenhum status representa submissão, aprovação, rejeição ou decisão financeira.

## Dependências para o próximo incremento

- decisão BDP-009 sobre atores, alçadas, substituições e segregação;
- autenticação e autorização funcionais com contexto de empresa e usuário;
- definição das etapas obrigatórias e critérios de bloqueio;
- revisão do modelo persistente e do contrato HTTP preliminar;
- critérios de aceite validados por DP, Financeiro e Diretoria;
- decisão explícita sobre tolerâncias de conciliação, caso existam.

BDP-006 permanece pendente para regras materiais de remuneração variável e não foi alterada por esta fundação.

## Testes

Os testes unitários cobrem abertura neutra, resolução/reabertura append-only, imutabilidade, isolamento por empresa, justificativa, transições estruturais, unicidade, integridade e cronologia do histórico. Testes de integração e frontend não se aplicam enquanto não houver persistência, API ou interface operacional.
