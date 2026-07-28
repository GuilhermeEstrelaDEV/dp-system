# BDP-AUTH-LEGACY — Resolução de autorização e transição das APIs legadas

**Identificador:** provisório; não reserva numeração definitiva
**Versão:** estrutura candidata v1; não homologada
**Estado atual:** `READY FOR HUMAN DECISION`

## Objetivo

Receber e preservar as decisões humanas da BDP-AUTH-LEGACY em um registro único, versionável e
auditável. A existência deste documento não homologa decisão, não concede acesso e não libera o gate
técnico.

## Escopo

Esta resolução contém exclusivamente os campos de homologação de DAL-01 a DAL-14. Alternativas,
recomendações e evidências preparatórias permanecem nas fontes relacionadas. Até manifestação dos
aprovadores, todos os campos decisórios continuam vazios e todos os status permanecem `PENDING`.

## Documentos relacionados

- [ADR-007 — Contexto de identidade e autorização empresarial](../architecture/decisions/ADR-007-identity-authorization-context.md);
- [BDP-009 — Resolução v1](BDP-009_RESOLUTION_V1.md);
- [BDP-014 — Resolução v1](BDP-014_RESOLUTION_V1.md);
- [Matriz de decisões](LEGACY_API_AUTHORIZATION_DECISION_MATRIX.md);
- [Plano incremental](LEGACY_API_AUTHORIZATION_IMPLEMENTATION_PLAN.md);
- [Gate de liberação técnica](BDP-AUTH-LEGACY_TECHNICAL_RELEASE_GATE.md);
- [Matriz de aprovação e dependências](BDP-AUTH-LEGACY_APPROVAL_MATRIX.md);
- [Questionário de homologação](BDP-AUTH-LEGACY_HOMOLOGATION_QUESTIONNAIRE.md).

## Histórico

- PR #48: inventário, prontidão, pacote de decisão e preparação de homologação incorporados à
  `develop`;
- PR #50: aprovadores do questionário reconciliados com os papéis `A` da matriz RACI;
- estado de origem: DAL-01 a DAL-14 `PENDING`, sem resposta humana registrada;
- esta estrutura somente poderá receber resultado após manifestação de todos os aprovadores exigidos.

## Dependências

- ADR-007, BDP-009 v1 e BDP-014 v1 permanecem vinculantes;
- BDP-001 a BDP-008 e BDP-010 a BDP-013 limitam decisões materiais das famílias relacionadas;
- a matriz RACI define os aprovadores e é a fonte autoritativa para a homologação;
- os Gates A a D precisam ser documentados como atendidos antes de qualquer liberação técnica.

## Estado atual

`READY FOR HUMAN DECISION`

O gate técnico permanece `BLOCKED — AWAITING HUMAN DECISIONS`.

## Decisões

## DAL-01 — Classificação das superfícies

**Aprovadores:** Segurança

**Contexto:** classificar cada superfície como pública explícita, autenticação pública, autenticada,
administrativa global, empresarial ou interna, preservando allowlist pública mínima.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-02 — Granularidade das capabilities

**Aprovadores:** DP, Segurança

**Contexto:** definir a granularidade por módulo, recurso, leitura/escrita, caso de uso ou ação
sensível, respeitando menor privilégio.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-03 — Matriz de concessão

**Aprovadores:** Segurança, Diretoria/Operação

**Contexto:** definir como capabilities serão concedidas, revisadas, revogadas e auditadas, sem
associação implícita por nome de papel.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-04 — Administração global e empresarial

**Aprovadores:** Segurança

**Contexto:** delimitar operações administrativas globais e operações de domínio que sempre exigem
empresa ativa validada.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-05 — Semântica de negação

**Aprovadores:** Segurança

**Contexto:** homologar a aplicação de `401`, `403` e `404`, incluindo eventuais exceções contratuais
explicitamente documentadas.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-06 — Visibilidade de dados sensíveis

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** definir mascaramento, projeções permitidas e acesso integral a dados pessoais,
trabalhistas, financeiros ou médicos.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-07 — Cobertura de auditoria

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** delimitar auditoria de escritas críticas, leituras sensíveis e demais consultas por
família.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-08 — Metadata e retenção de auditoria

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** definir metadata permitida por allowlist e os limites de preservação enquanto a
BDP-011 permanecer pendente.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-09 — Compatibilidade do legado

**Aprovadores:** Produto

**Contexto:** decidir entre corte, alias, adapter ou delegação canônica para cada contrato legado e
seus consumidores.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-10 — Estratégia de rollout

**Aprovadores:** Produto, Segurança

**Contexto:** definir sequência, observação, enforcement e gates da transição das famílias legadas.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-11 — Política de rollback

**Aprovadores:** Segurança

**Contexto:** definir mecanismos, gatilhos e autoridades de rollback sem restaurar bypass de
autenticação ou isolamento.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-12 — Depreciação e remoção

**Aprovadores:** Produto

**Contexto:** definir comunicação, telemetria, evidências e janela necessárias antes da remoção de
contratos legados.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-13 — Segregação e grants

**Aprovadores:** Segurança, Diretoria/Operação

**Contexto:** definir ações incompatíveis e limites de substituição temporária e acesso emergencial.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## DAL-14 — Primeiro recorte técnico

**Aprovadores:** Produto, DP, Segurança

**Contexto:** escolher a primeira família, seu ownership, consumidores, dependências e critérios de
prontidão.

**Decisão homologada:**

**Justificativa:**

**Exceções:**

**Impactos:**

**Data:**

**Status:** `PENDING`

## Condição para homologação

Esta estrutura somente poderá registrar uma resolução homologada quando DAL-01 a DAL-14 tiverem
decisões e justificativas humanas, todos os aprovadores da matriz RACI tiverem se manifestado, nenhuma
decisão permanecer `PENDING` e os Gates A a D estiverem documentados como atendidos.
