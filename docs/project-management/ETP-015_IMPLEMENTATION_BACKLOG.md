# ETP-015 — Implementation Backlog

**Status:** especificação aprovada; ETP-015.1–015.3 concluídas; ETP-015.4–015.7 implementadas; Gates B
e C aprovados; ETP-015.8 `COMPLETED — POST-MERGE VERIFIED`

**Baseline:** ETP-015.3 foi incorporada à `develop` pelo PR #61. O
[Operational Gate](ETP-015_3_OPERATIONAL_RELEASE_GATE.md) permanece pendente para ambiente de destino,
sem bloquear o uso local. A ETP-015.4 implementa as primitivas canônicas e a ETP-015.5 aplica
isolamento empresarial ao recorte canônico aprovado, sem iniciar a ETP-015.6.

Cada entrega nasce de `develop` atualizada, possui branch/PR próprios e só avança após evidência do
gate aplicável.

## ETP-015.1 — Identity Context Foundation

**Status:** `COMPLETED`

- **Objetivo:** estabilizar principal, sessão, trace e contrato imutável de aplicação.
- **Dependências:** ADR-007, DAL-01/05; Gate A.
- **Módulos afetados:** auth, request context, correlation middleware e filtro global.
- **Banco esperado:** nenhum; sessão/revogação futura requer proposta separada.
- **Testes:** JWT inválido/expirado, usuário inativo, trace e ausência de principal.
- **Riscos:** mudar claims/contratos existentes.
- **Aceite:** principal único, sem Express na aplicação e `401` uniforme.
- **Rollback:** restaurar adapter de principal sem abrir rota protegida.
- **Evidências:** contratos, matriz negativa, OpenAPI e checks.
- **Conclusão:** PR #53 incorporado à `develop` em 29/07/2026 pelo merge
  `dac460d8bd84bbe0a1e9f39360f4c740c47c2e4e`, com CI aprovado.
- **Revisão técnica:** uso de `RefreshToken` como registro de sessão classificado como
  `ACCEPTABLE WITH FOLLOW-UP`; a chave exclusiva é o hash SHA-256 do `sessionId`, sem armazenar token
  bruto e sem alterar o schema.
- **Follow-ups não bloqueantes:** avaliar modelo dedicado e migration aditiva de sessão; definir
  issuer/audience do JWT com plano de compatibilidade; implementar política de limpeza de registros
  expirados, rotação/refresh, logout backend, revogação global e identidade técnica em entregas
  futuras explicitamente aprovadas. Nenhum desses itens integra ou inicia a ETP-015.2.

## ETP-015.2 — Active Company Resolution

**Status:** `COMPLETED`

Recorte atual: contrato imutável mínimo, normalização das fontes existentes, rejeição de conflitos,
validação do vínculo empresarial ativo e integração opt-in no fluxo autenticado existente. Não
inclui capabilities, autorização de recursos, migração de endpoints, Prisma ou frontend.

- **Objetivo:** tornar empresa ativa a única autoridade empresarial.
- **Dependências:** 015.1, BDP-009, DAL-04/05.
- **Módulos afetados:** application context, auth/company selection e repositories.
- **Banco esperado:** reutilizar `UserCompanyRole`; evolução só após Gate A.
- **Testes:** assignment vigente, empresa inativa, spoofing e duas empresas.
- **Riscos:** consultas amplas ou quebra na troca de empresa.
- **Aceite:** contexto validado e `404` fora do escopo.
- **Rollback:** preservar validação e reverter apenas forma de seleção.
- **Evidências:** queries, testes API/PostgreSQL e cache segmentado documentado.
- **Conclusão:** PR #55 incorporado à `develop` em 29/07/2026 pelo merge
  `70dd036080fdeac59a88f434786257b01c3c7ead`, com CI aprovado.
- **Classificação do modelo:** `SUFFICIENT WITH FOLLOW-UP`.
- **Follow-ups não bloqueantes:** revogação dedicada, provenance, unicidade temporal, múltiplos
  assignments, política futura de assignment canônico, evolução controlada das fontes empresariais
  e semântica futura de `404`. O modelo dedicado de sessão, issuer/audience, refresh, logout backend,
  revogação global e identidades técnicas também permanecem preservados da ETP-015.1.

## ETP-015.3 — Capability Catalog and Assignments

**Status:** `COMPLETED`

**Gate de entrada:** `APPROVED`. GA-01..GA-15 foram homologadas em 29/07/2026 no pacote
[ETP-015 Gate A — Capability Catalog and Assignments Data Model](ETP-015_GATE_A_DATA_MODEL_DECISION_PACKAGE.md),
sem iniciar migration ou implementação funcional.

**Classification Subgate:** `APPROVED — READY FOR CONTROLLED MIGRATION`. Os 19 códigos e as políticas
PC-20/PC-21 foram homologados em 29/07/2026. O PR #59 foi incorporado à `develop` pelo merge
`f3a63d6243797c91e17ace40a715bdbf78478efb`, com CI aprovado. Todos os pré-requisitos documentais
estão concluídos. A implementação controlada está em validação na branch
`feature/etp-015-3-capability-catalog-assignments`, sem ativação de autorização em rotas.

- **Objetivo:** governar catálogo e concessões explícitas.
- **Dependências:** 015.2, DAL-02/03/04/13.
- **Módulos afetados:** auth, Prisma e administração futura.
- **Banco esperado:** campos/constraints aditivos aprovados no modelo.
- **Testes:** catálogo, vigência, revogação, grants e seed sem assignment.
- **Riscos:** privilege creep e capability global em domínio.
- **Aceite:** nenhuma autorização por role name; concessão auditável.
- **Rollback:** migration reversível sem apagar histórico; negar em ambiguidade.
- **Evidências:** diff do seed, matriz de capabilities e testes PostgreSQL.
- **Conclusão:** PR #61 incorporado à `develop`; migration `0016`, catálogo e assignments históricos
  presentes, sem ativação automática de autorização ou ampliação de acesso.

## ETP-015.4 — Authorization Guards and Decorators

**Status:** `IMPLEMENTED — AUTHORIZATION PRIMITIVES AVAILABLE`

- **Objetivo:** padronizar allowlist pública, capability e deny-by-default.
- **Dependências:** 015.1–015.3, DAL-01/02/05.
- **Módulos afetados:** auth, metadata NestJS, OpenAPI e CI.
- **Banco esperado:** nenhum.
- **Testes:** metadata ausente, `401`, `403`, grants e rota pública.
- **Riscos:** guard global prematuro.
- **Aceite:** primitives reutilizáveis opt-in e regra para impedir rota nova sem classificação.
- **Rollback:** desativar apenas enforcement da família, preservando JWT/isolamento ativados.
- **Evidências:** unitários, E2E e inventário atualizado.
- **Implementação:** metadata imutável, quatro decorators, três guards compostos, allowlist nominal,
  manifesto de compatibilidade para 129 handlers e verificador de 165/165 rotas.
- **Limite:** nenhuma família legada foi migrada; o isolamento do recorte canônico pertence à
  ETP-015.5.

## ETP-015.5 — Enterprise Query Isolation

**Status:** `IMPLEMENTED — ENTERPRISE QUERY ISOLATION AVAILABLE`

- **Objetivo:** filtrar empresa antes do lookup em repositories/casos de uso.
- **Dependências:** 015.2/015.4, DAL-04/05.
- **Módulos afetados:** ports/repositories de cada família migrada.
- **Banco esperado:** índices compostos quando comprovados.
- **Testes:** list/detail/write com duas empresas e IDs enumerados.
- **Riscos:** pós-filtragem ou relação indireta sem join empresarial.
- **Aceite:** nenhuma query empresarial ampla; `404` uniforme.
- **Rollback:** adapter de query anterior somente se mantiver filtro seguro.
- **Evidências:** SQL/Prisma revisado, testes e planos de consulta.
- **Implementação:** `EnterpriseScope` canônico e imutável; repositories explícitos para grants e
  dashboard; company derivada do contexto em assignments; relações empresariais validadas na mesma
  transação; verificador de anti-patterns estáveis.
- **Recorte migrado:** auth/contexto, grants temporários e emergenciais, assignments empresariais e
  dashboard. Payroll review e payroll periods já atendiam o padrão e foram revalidados.
- **Testes:** unitários, E2E HTTP e PostgreSQL 16 com duas empresas cobrem list/detail/write,
  enumeração cruzada, `404` uniforme, rollback e ausência de mutação cross-tenant.
- **Limite:** 129 handlers `LEGACY_DEFERRED` permanecem fora do recorte; nenhuma rota, capability,
  migration, DTO, masking ou evento novo de auditoria foi introduzido.

## ETP-015.7 — Authorization Audit Events

**Status:** `IMPLEMENTED — AUTHORIZATION AUDIT FOUNDATION AVAILABLE`

- **Objetivo:** cobrir escritas críticas canônicas, estabelecer a fundação de auditoria de autorização
  e preparar a auditoria de leituras sensíveis. Nesta etapa, somente leituras com classificação
  material previamente aprovada podem ser cobertas.
- **Dependências:** 015.1–015.5, DAL-07/08/13.
- **Módulos afetados:** `AuditWriterService`, sanitizer e casos de uso.
- **Banco:** nenhuma migration; `AuditLog` e índices existentes foram suficientes no ensaio local.
- **Testes:** atomicidade, rollback, metadata proibida e grant usado.
- **Riscos:** PII em logs e volume excessivo.
- **Aceite:** eventos allowlist, trace completo e falha crítica atômica.
- **Rollback:** reduzir evento não crítico; não separar auditoria de escrita crítica.
- **Evidências:** testes PostgreSQL e amostras sanitizadas.
- **Limites:** a fundação não depende de masking. `AuditWriterService`, sanitizador, catálogo de
  eventos, envelope e atomicidade pertencem a esta etapa. Leituras sem classificação aprovada e a
  cobertura integral das leituras sensíveis ficam adiadas para a ETP-015.6.
- **Entrega:** 26 códigos canônicos, decisão efetiva imutável, metadata por allowlist, verificador
  AST, manifesto de produtores e rollback atômico, sem migration ou nova capability.
- **Evidências:** [arquitetura](../security/ETP-015_7_AUTHORIZATION_AUDIT_EVENTS.md),
  [catálogo](../security/ETP-015_7_AUDIT_EVENT_CATALOG.md),
  [inventário](../security/ETP-015_7_AUDIT_COVERAGE_INVENTORY.md) e
  [aceite](../security/ETP-015_7_ACCEPTANCE_EVIDENCE.md).

## ETP-015.6 — Sensitive Data Projection and Masking

**Status:**
`IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`

- **Objetivo:** aplicar somente a projeção `MINIMAL` homologada por família e ativar exclusivamente o
  evento de leitura AR-03 no writer entregue pela ETP-015.7.
- **Dependências:** 015.3–015.5, fundação da ETP-015.7, DAL-06 e limites BDP-001/011.
- **Módulos afetados:** serializers/query projections e contratos compartilhados.
- **Banco esperado:** nenhum por padrão.
- **Testes:** allowlist de 110 campos, omissão, capabilities da operação, AR-03, cache entre empresa e
  ator, frontend e respostas negativas.
- **Riscos:** inferir política final de PII ou criar uma trilha de auditoria paralela.
- **Aceite:** somente campos homologados; itens bloqueados permanecem fora; toda leitura sensível
  ativada possui auditoria correspondente.
- **Rollback:** reduzir projeção; nunca ampliar dados para compatibilidade.
- **Evidências:** matriz de campos e testes de snapshot/segurança.
- **Limites:** esta etapa reutiliza, sem reimplementar, `AuditWriterService`, catálogo de eventos,
  envelope, sanitizador e atomicidade da ETP-015.7.
- **Gate de classificação:** o
  [relatório do gate](../security/ETP-015_6_CLASSIFICATION_GATE_REPORT.md) inventariou 33 endpoints
  canônicos e confirmou ausência de classificação material por campo, máscara, capability integral e
  evento de leitura homologados. BDP-001/011 continuam pendentes para ampliações futuras; a matriz
  posterior homologou a execução mínima sem masking e sem perfil integral.
- **Pacote de decisão:** o
  [pacote formal](../security/ETP-015_6_FIELD_CLASSIFICATION_DECISION_PACKAGE.md) e a
  [matriz de homologação](../security/ETP-015_6_FIELD_CLASSIFICATION_APPROVAL_MATRIX.md) registram
  110 decisões `FC-*`, todas `APPROVED` por `PROJECT_OWNER` em 2026-08-08. O
  [registro humano](../security/ETP-015_6_HUMAN_APPROVAL_RECORD.md) preserva OMIT/BLOCKED, e a
  [reconciliação](../security/ETP-015_6_IMPLEMENTATION_READINESS_RECONCILIATION.md) libera somente a
  implementação controlada dos contratos `MINIMAL`. O runtime aprovado está documentado em
  [ETP-015_6_SENSITIVE_DATA_PROJECTION_AND_MASKING.md](../security/ETP-015_6_SENSITIVE_DATA_PROJECTION_AND_MASKING.md):
  33 rotas, CP-01..06, AR-03 e zero masking. Esse era o estado anterior ao recorte P0 da ETP-015.8.

> A ordem de execução não segue a ordem numérica entre 015.6 e 015.7. A ETP-015.7 deve ser
> implementada primeiro para estabelecer auditoria atômica, catálogo de eventos, sanitização e
> rastreabilidade das escritas críticas. A ETP-015.6 utiliza essa fundação para ativar projeções e
> leituras sensíveis por família.

## Matriz de dependências da sequência vigente

| Etapa  | Depende de                      | Entrega principal                         | Limite                                     |
| ------ | ------------------------------- | ----------------------------------------- | ------------------------------------------ |
| 015.5  | 015.2 e 015.4                   | isolamento empresarial                    | sem masking ou nova auditoria funcional    |
| 015.7  | 015.1–015.5 e DAL-07/08/13      | fundação de auditoria e escritas críticas | leituras não classificadas permanecem fora |
| 015.6  | 015.3–015.5 e fundação da 015.7 | projeção, masking e leituras sensíveis    | somente por família aprovada               |
| 015.8  | 015.1–015.5, 015.7 e 015.6      | migração P0 do fechamento                 | sem rollout geral                          |
| 015.9  | 015.8 estável e BDPs aplicáveis | ondas legadas                             | execução por família                       |
| 015.10 | 015.1–015.9 e Gate D            | hardening e prontidão de remoção          | sem remoção automática                     |

A direção é única: fundação ETP-015.7 → rollout de leituras sensíveis ETP-015.6. Não existe
dependência circular.

## ETP-015.8 — Payroll Closure P0 Migration

**Status:** `COMPLETED — POST-MERGE VERIFIED`

O [registro de Segurança](../security/ETP-015_GATE_B_SECURITY_APPROVAL.md) removeu o blocker humano de
entrada. Gate C está `APPROVED`: os oito itens técnicos estão `PASS`, e Segurança, Produto e DP
homologaram o recorte em 2026-08-10 no
[registro formal](../security/ETP-015_GATE_C_HUMAN_APPROVAL.md). BDP-001 e BDP-011 permanecem
`PENDING`, e BDP-014 permanece `APPROVED — VERSION 1`.

- **Objetivo:** proteger `/payroll-closures` e delegar ao fechamento canônico.
- **Dependências:** 015.1–015.5, 015.7 e 015.6, BDP-014, DAL-09–14; Gate B/C.
- **Módulos afetados:** payroll-closures, payroll-periods, OpenAPI e clientes existentes.
- **Banco esperado:** nenhum modelo paralelo; reutilizar persistence da ETP-014.
- **Testes:** contratos, `401/403/404`, close/reopen/replay/concorrência e auditoria.
- **Riscos:** envelope incompatível e consumidor invisível.
- **Aceite:** uma única regra canônica, cinco capabilities e telemetria segura.
- **Rollback:** restaurar adapter/envelope, nunca serviço legado independente.
- **Evidências:** testes PostgreSQL, inventário de consumidores e plano de janela.
- **Implementação:** quatro aliases agora são adapters deprecated, classificados com capabilities,
  sem Prisma ou regra paralela; `/folha/fechamentos` usa readiness/history/close/reopen canônicos.
- **Gate C:** `APPROVED`; 8/8 itens técnicos `PASS`, 0 `FAIL`, com aprovação de Segurança, Produto e
  DP registrada em 2026-08-10.
- **Merge e aceite:** PR #86 incorporado por
  `b8324037b053b947692992d698888ed6e73db5f2`; a
  [verificação pós-merge](../security/ETP-015_8_POST_MERGE_VERIFICATION.md) confirmou a etapa sem
  regressão.

## ETP-015.9 — Legacy Route Rollout

**Status:** `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`

A [avaliação de prontidão](../security/ETP-015_9_ENTRY_READINESS.md) está concluída. As famílias de
domínio permanecem bloqueadas por capabilities, owners e BDPs materiais. Os 15 handlers P0
residuais foram homologados como `PRESERVE / DEFER`. P4 foi aprovada somente para
preservação/reconciliação sem mudança de runtime.

O [pacote de decisão](../security/ETP-015_9_ENTRY_DECISION_PACKAGE.md) registra ED-01–ED-06 em
2026-08-12. Nenhuma capability, projeção ou auditoria foi ampliada; owners permanecem pendentes;
Company é `FIRST FUNCTIONAL CANDIDATE — NOT AUTHORIZED`; nenhuma família funcional está autorizada.

O [pacote de prontidão de Company](../security/ETP-015_9_COMPANY_ENTRY_READINESS.md) responde aos
nove pré-requisitos da ED-05. A decisão humana de 2026-08-20 registrada no
[pacote CD-01–CD-09](../security/ETP-015_9_COMPANY_ENTRY_DECISION_PACKAGE.md) selecionou
`E — DEFER`. Estado: `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`; BDP-012
permanece `PENDING`; owners e entrada funcional continuam bloqueados; inventário está pronto apenas
como evidência; e o limite de rollback foi aprovado somente para uso futuro. Os seis handlers
continuam `LEGACY_DEFERRED`.

- **Objetivo:** migrar famílias restantes por prioridade P1–P4.
- **Dependências:** 015.8 estável e BDPs de cada família.
- **Módulos afetados:** controllers/services/repositories e clientes por família.
- **Banco esperado:** somente índices/constraints aprovados por incremento.
- **Testes:** matriz negativa, isolamento, auditoria, masking e regressão do consumidor.
- **Riscos:** 165 handlers runtime contra 163 registros históricos, decisões materiais e APIs
  externas invisíveis.
- **Aceite:** gate individual, inventário atualizado e zero bypass na família.
- **Rollback:** por família, preservando autenticação e isolamento.
- **Evidências:** telemetria, owner, janela, OpenAPI e checks.

Esta entrega é um programa de ondas, não um único PR. Deve ser decomposta sem renumerar a governança:

- **015.9a — P1:** empresa, colaboradores, contratos, parâmetros e rubricas, respeitando BDPs;
- **015.9b — P2:** organização, admissão, afastamentos e remuneração variável;
- **015.9c — P3:** jornada, benefícios e férias;
- **015.9d — P4/preservação:** superfícies públicas legítimas e reconciliação das já protegidas.

Cada onda e cada família possuem PR, gate, rollback e aceite próprios. Uma família bloqueada não
impede outra sem dependência material.

## ETP-015.10 — Hardening and Legacy Removal Readiness

**Status:** `NOT STARTED — NOT AUTHORIZED`

- **Objetivo:** provar prontidão para enforcement global e futura remoção.
- **Dependências:** 015.1–015.9 e Gate D.
- **Módulos afetados:** AppModule, CI, OpenAPI, observabilidade e documentação.
- **Banco esperado:** nenhum, salvo índice comprovado.
- **Testes:** inventário completo, segurança, carga, falha/rollback e consumidores.
- **Riscos:** falso zero de uso e remoção precoce.
- **Aceite:** 165 handlers runtime reconciliados com a baseline histórica de 163 e suas duas adições
  explícitas, zero rota empresarial implícita e relatório de prontidão.
- **Rollback:** manter aliases protegidos; remoção somente em iniciativa/PR posterior.
- **Evidências:** comunicação, telemetria, aceite dos owners e checklist final.

## Ordem final recomendada e resultado da revisão

1. 015.1 principal/sessão/revogação;
2. 015.2 empresa ativa;
3. 015.3 catálogo/assignments;
4. 015.4 decorators/guards;
5. 015.5 isolamento de repositories;
6. 015.7 fundação de auditoria necessária ao enforcement;
7. 015.6 projeção/masking por família, iniciada somente após a fundação da 015.7 estar disponível;
8. 015.8 fechamento P0;
9. 015.9a–d, sequencial por prioridade e independente por família aprovada;
10. 015.10 hardening e prontidão de remoção.

O ajuste move 015.7 antes de ativar masking/leituras sensíveis e explicita que 015.9 não é uma entrega
monolítica. Não há dependência circular. 015.3 é o único incremento com migration provável; 015.6 e
015.9 permanecem condicionados às BDPs materiais de cada família.
