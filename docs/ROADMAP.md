# Roadmap de Entregas

## Etapa 0 — Fundação documental

**Objetivo:** consolidar visão, arquitetura, governança e inventário da planilha.

**Critério de aceite:** documentos revisados e escopo do primeiro incremento priorizado.

## Etapa 1 — Descoberta e dicionário de dados

Mapear cada fonte relevante da planilha, validar regras com o DP e definir a estratégia de saneamento/migração.

**ETP-001 — Concluída oficialmente:** dicionário inicial da aba `GERAL`, classificação das seções de `LANCAMENTOS`, backlog priorizado, especificação de domínio/banco/arquitetura/fluxos/permissões e estratégia de migração foram entregues. As pendências foram transferidas para [Business Decisions Pending](project-management/BUSINESS_DECISIONS_PENDING.md) e serão tratadas incrementalmente.

## Consolidação de especificação

Foram documentados o modelo de domínio, banco de dados, arquitetura, fluxos e matriz de permissões. Decisões de negócio pendentes não bloqueiam a infraestrutura e serão resolvidas antes dos módulos afetados.

## ETP-002 — Infraestrutura técnica

**Status:** ETP-002.1 concluída — aguardando confirmação para a próxima etapa de infraestrutura.

O bootstrap de monorepo, React/Vite, NestJS, Prisma/PostgreSQL, Docker e documentação técnica foi concluído. Não inclui telas, cadastros ou qualquer funcionalidade de Departamento Pessoal. A execução de contêineres continua pendente até Docker Desktop estar disponível.

O plano e o manifesto de arquivos estão em [ETP-002 — Plano de Infraestrutura Técnica](project-management/ETP-002_INFRASTRUCTURE_PLAN.md). A revisão para pnpm + Turborepo e as fronteiras de pacotes estão registradas na [ADR-003](architecture/decisions/ADR-003-monorepo-turborepo-boundaries.md).

## ETP-003 — Application Shell e experiência visual inicial

**Status:** concluída.

O frontend agora possui sidebar responsiva e recolhível, header, breadcrumbs, menu mobile acessível, dashboard exclusivamente demonstrativo, rotas de placeholder, página 404 e fallback de erro. A etapa não inclui autenticação, autorização, API, dados reais, CRUD ou regras de Departamento Pessoal. A estrutura está documentada em [Application Shell](frontend/APPLICATION_SHELL.md).

## ETP-004 — Estrutura Organizacional

**Status:** concluída.

Empresas, filiais, departamentos, cargos e centros de custo passam a compor a fundação organizacional, com API e interface próprias. Consulte [Estrutura Organizacional](modules/ORGANIZATIONAL_STRUCTURE.md).

## ETP-005 — Colaboradores e contratos de trabalho

**Status:** concluída.

Colaboradores, contatos mínimos, contratos e histórico contratual passam a usar a estrutura organizacional. Dados pessoais e trabalhistas sensíveis, como CPF, endereço, documentos, banco e remuneração, permanecem fora do escopo até validação formal do DP. Consulte [Colaboradores e contratos](modules/EMPLOYEES_AND_CONTRACTS.md).

## ETP-006 — Admissão e checklist admissional

**Status:** concluída.

Processos admissionais demonstrativos, templates de checklist, instâncias imutáveis, itens com bloqueio/reabertura/não aplicável e requisitos documentais lógicos são tratados sem arquivos reais, integração externa ou regras legais presumidas. Consulte [Admissão e checklist admissional](modules/ADMISSION_WORKFLOW.md).

## ETP-007 — Jornada e banco de horas

**Status:** concluída.

Jornadas e escalas configuráveis, ocorrências em minutos, livro imutável de movimentos e fechamento por competência são tratados sem relógio de ponto, integração externa ou regras legais presumidas. Consulte [Jornada e banco de horas](modules/TIME_MANAGEMENT.md).

## ETP-008 — Benefícios

**Status:** concluída.

Catálogo por empresa, planos com vigência, adesões contratuais e coparticipação parametrizável são tratados como controles demonstrativos. Não há cálculo de folha, dados de saúde, integração com operadoras ou regras legais presumidas. Consulte [Benefícios de colaboradores](modules/EMPLOYEE_BENEFITS.md).

## ETP-009 — Férias e afastamentos

**Status:** concluída.

Períodos, solicitações, férias coletivas estruturais, afastamentos e retornos são tratados como controles administrativos demonstrativos. Não há cálculo financeiro, prazo legal, regra de fracionamento ou dado médico. Consulte [Férias e afastamentos](modules/VACATIONS_AND_LEAVES.md).

## ETP-010 — Fundação de folha de pagamento

**Status:** concluída.

Competências, rubricas, parâmetros, lançamentos, execuções e fechamentos formam uma base configurável, versionada e demonstrativa. Não inclui cálculos legais, alíquotas, faixas, deduções, guias ou integrações. Consulte [Fundação de folha](modules/PAYROLL_FOUNDATION.md).

## ETP-011 — Cálculo configurável de folha

**Status:** concluída.

As execuções consolidam lançamentos por contrato e rubrica, selecionam versões vigentes e persistem totais e memória reproduzível com aritmética decimal determinística. Naturezas ou versões inválidas falham de forma bloqueante. Nenhuma regra legal, alíquota ou fórmula normativa foi presumida. Consulte [Cálculo configurável de folha](modules/PAYROLL_CALCULATION.md).

## ETP-012 — Remuneração variável e conciliação

**Status:** concluída.

Eventos de comissão/prêmio, adiantamentos, pagamentos externos e conciliações passam a ter registro administrativo demonstrativo por contrato ou execução. Não há cálculo, percentual, aprovação autenticada, desconto automático ou liquidação: BDP-006 permanece pendente e a resolução v1 da BDP-009 ainda não foi implementada. Consulte [Remuneração variável e conciliação](modules/VARIABLE_COMPENSATION.md).

## ETP-013 — Conferência e aprovação de folha

**Status:** **COMPLETED — VERSION 1**.

A etapa possui workflow auditável até `CLOSED`. Reabertura autorizada invalida aprovações por registros append-only, cria nova rodada e retorna a `IN_REVIEW`. Backend e frontend v1 foram encerrados em 22/07/2026; integração ampla com fechamento e hardening são iniciativas posteriores. Consulte o [relatório final](project-management/ETP-013_FINAL_REPORT.md).

## ETP-014 — Fechamento de competência e integração operacional

**Status:** `COMPLETED`.

A [BDP-014 v1](project-management/BDP-014_RESOLUTION_V1.md) está homologada, e as Fases 1 a 6 estão
`COMPLETED`. O contrato canônico cobre readiness, fechamento, reabertura controlada, histórico
público e [frontend](modules/PAYROLL_PERIOD_FRONTEND.md), com advisory lock, idempotência, versão
otimista, manifesto SHA-256, eventos append-only e auditoria transacional. A ETP-014 foi oficialmente
concluída após a Final Acceptance.

## ETP-015 — Authorization Foundation & Enterprise Isolation

**Status:** `IN PROGRESS` — ETP-015.1–015.3 concluídas; ETP-015.4–015.8 implementadas nos recortes aprovados.

A ETP-015.3 foi incorporada à `develop` pelo PR #61. A migration 0016, o catálogo e os assignments
estão implementados, sem grants automáticos. O
[gate operacional](project-management/ETP-015_3_OPERATIONAL_RELEASE_GATE.md) permanece
`PENDING FOR FUTURE TARGET ENVIRONMENT`; seu bloqueio é de deploy futuro, não da demonstração local.

A ETP-015 foi iniciada exclusivamente em descoberta e planejamento após a homologação da
BDP-AUTH-LEGACY. A [especificação](project-management/ETP-015_AUTHORIZATION_FOUNDATION_AND_ENTERPRISE_ISOLATION.md)
aprovada define identidade, empresa ativa, capabilities, assignments explícitos, isolamento, masking,
auditoria e rollout das APIs legadas. O [backlog](project-management/ETP-015_IMPLEMENTATION_BACKLOG.md)
divide a futura execução em dez incrementos, começando pelo fechamento P0. Nenhuma implementação ou
migration fora do incremento aprovado está autorizada. A ETP-015.1 implementa somente principal,
contexto autenticado, resolução de usuário e revogação lógica de sessão; capabilities, autorização,
isolamento e migração de endpoints permanecem nas etapas posteriores e sujeitos aos
[Gates A–D](project-management/ETP-015_RELEASE_GATES.md). A ETP-015.1 foi incorporada à `develop` pelo
PR #53 em 29/07/2026, no merge `dac460d8bd84bbe0a1e9f39360f4c740c47c2e4e`, com CI aprovado. O uso
provisório de `RefreshToken` permanece `ACCEPTABLE WITH FOLLOW-UP`. A ETP-015.2 foi incorporada à
`develop` pelo PR #55 em 29/07/2026, no merge `70dd036080fdeac59a88f434786257b01c3c7ead`,
com CI aprovado e modelo atual classificado como `SUFFICIENT WITH FOLLOW-UP`. O Gate A para catálogo
e assignments foi homologado em 29/07/2026: GA-01..GA-15 estão `APPROVED`, sem condições
bloqueadoras. O subgate de classificação de risco e sensibilidade dos 19 códigos está
`APPROVED — READY FOR CONTROLLED MIGRATION`. O PR #59 foi incorporado à `develop` em 29/07/2026,
no merge `f3a63d6243797c91e17ace40a715bdbf78478efb`, com CI aprovado. Todos os pré-requisitos
documentais foram concluídos. A ETP-015.3 está `COMPLETED — IMPLEMENTED AND MERGED`, com migration aditiva,
catálogo interno e assignments históricos. Nenhuma rota, grant automático ou ampliação de acesso foi
ativada pela migration. A ETP-015.4 está `IMPLEMENTED — AUTHORIZATION PRIMITIVES AVAILABLE`, com
allowlist pública nominal, JWT, empresa ativa, capabilities `ALL`, deny-by-default e verificador de
165 handlers. A ETP-015.5 está `IMPLEMENTED — ENTERPRISE QUERY ISOLATION AVAILABLE`: o escopo
empresarial canônico, repositories explícitos e testes com duas empresas cobrem auth/contexto,
grants, assignments e dashboard. A ETP-015.7 está
`IMPLEMENTED — AUTHORIZATION AUDIT FOUNDATION AVAILABLE`, com catálogo fechado de 27 eventos após
a ativação homologada de AR-03,
decisão efetiva imutável, metadata deny-by-default e rollback atômico das escritas críticas, sem
migration ou auditoria de leitura sensível. A ETP-015.8 converte quatro handlers P0 em adapters
canônicos, deixando 125 rotas `LEGACY_DEFERRED`; as etapas restantes seguem a ordem governada:

- **ETP-015.7:** `IMPLEMENTED — AUTHORIZATION AUDIT FOUNDATION AVAILABLE`;
- **ETP-015.6:** `IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`;
- **Gate B:** `APPROVED — SECURITY — 2026-08-10`;
- **Gate C:** `APPROVED — SECURITY / PRODUCT / DP — 2026-08-10`;
- **ETP-015.8:** `COMPLETED — POST-MERGE VERIFIED`;
- **ETP-015.9:** `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`;
- **ETP-015.10:** `NOT STARTED — NOT AUTHORIZED`.

Para a ETP-015.9, Company permanece `FIRST FUNCTIONAL CANDIDATE — NOT AUTHORIZED`. Seu
[pacote de entrada](security/ETP-015_9_COMPANY_ENTRY_READINESS.md) está
`ENTRY PACKAGE READY FOR HUMAN DECISIONS`, com BDP-012, escopo, capability, projeção, auditoria, owners, evidence
gate e rollback ainda dependentes das decisões registradas em CO-01–CO-09. Nenhuma rota foi
migrada e nenhum item do Gate D foi iniciado.

O [registro de homologação](security/ETP-015_6_HUMAN_APPROVAL_RECORD.md) confirma 110/110 decisões
`FC-*` aprovadas pelo `PROJECT_OWNER` em 2026-08-08. A
[reconciliação de readiness](security/ETP-015_6_IMPLEMENTATION_READINESS_RECONCILIATION.md) concluiu
que as cinco famílias podem implementar os contratos `MINIMAL` sem inventar política. BDP-001 e
BDP-011 permanecem pendentes para exposições futuras. A
[implementação mínima](security/ETP-015_6_SENSITIVE_DATA_PROJECTION_AND_MASKING.md) aplica as 110
decisões nas 33 rotas, ativa somente AR-03, implementa CP-01..06 e mantém zero masking. A
[evidência pós-merge](security/ETP-015_GATE_B_POST_MERGE_EVIDENCE.md) registrou `8 PASS / 0 FAIL`, e
o [registro humano](security/ETP-015_GATE_B_SECURITY_APPROVAL.md) aprovou o Gate B. A
[migração P0](security/ETP-015_8_PAYROLL_CLOSURE_P0_MIGRATION.md) foi incorporada pelo PR #86 com
oito itens técnicos `PASS`. A [homologação humana](security/ETP-015_GATE_C_HUMAN_APPROVAL.md) de
Segurança, Produto e DP aprovou o Gate C em 2026-08-10, e a
[verificação pós-merge](security/ETP-015_8_POST_MERGE_VERIFICATION.md) confirmou a etapa como
`COMPLETED — POST-MERGE VERIFIED`. A
[prontidão da ETP-015.9](security/ETP-015_9_ENTRY_READINESS.md) foi avaliada. O
[pacote de decisão](security/ETP-015_9_ENTRY_DECISION_PACKAGE.md) registra ED-01–ED-06 em 2026-08-12:
Residual P0 fica `PRESERVE / DEFER`, nenhuma capability/projeção/evento é ampliado, owners continuam
pendentes, Company é apenas a primeira candidata e P4 fica restrita à preservação/reconciliação.
Nenhum rollout funcional, ETP-015.10, Gate D, remoção de legado, produção, cloud ou deploy está
autorizado.
BDP-001 e BDP-011 permanecem `PENDING`, e BDP-014 permanece
`APPROVED — VERSION 1`.

## Próximas iniciativas propostas

## MVP-001 — Protótipo executivo local

**Status:** `IMPLEMENTED — LOCAL PROTOTYPE READY FOR MANAGEMENT VALIDATION`.

O diagnóstico e o [escopo do protótipo](project-management/MVP-001_PROTOTYPE_SCOPE.md) definem uma
demonstração exclusivamente local. A MVP-001.1 está `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE` e a
MVP-001.2 está `IMPLEMENTED — VISUAL SHELL AVAILABLE`. A identidade visual é temporária; não foram
criadas somente identidades fictícias e vínculos locais, sem grants automáticos. A MVP-001.3 está
`IMPLEMENTED — DEMO LOGIN AVAILABLE`; a MVP-001.4 está
`IMPLEMENTED — EXECUTIVE DASHBOARD AVAILABLE`, com métricas autorizadas e isoladas. A MVP-001.5 está
`IMPLEMENTED — DEMO DATASET AVAILABLE`; MVP-001.6 está
`IMPLEMENTED — SAFE CORE DEMO FLOWS AVAILABLE`, com roteiro autenticado e estados restritos seguros;
MVP-001.7 está `IMPLEMENTED — DEMO MODE AND GO/NO-GO AVAILABLE`; MVP-001.8 está
`IMPLEMENTED — PROTOTYPE STABILIZED`, com regressão, aceite e limitações registrados em `docs/quality`.
A MVP-001.9 — Pacote de apresentação executiva está
`IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE`, com deck de 15 slides, evidências rastreáveis,
roteiro, contingência e coleta de feedback, conforme o
[backlog incremental](project-management/MVP-001_IMPLEMENTATION_BACKLOG.md). A MVP-001 está
`IMPLEMENTED — LOCAL PROTOTYPE READY FOR MANAGEMENT VALIDATION`; a validação gerencial e qualquer
continuidade permanecem decisões futuras explícitas.

ETP-015.3 está `COMPLETED — IMPLEMENTED AND MERGED`. Seu Operational Deployment Gate permanece
`PENDING FOR FUTURE TARGET ENVIRONMENT`; esse bloqueio de destino não impede a demonstração local.
ETP-015.4 foi iniciada somente após a conclusão do MVP-001. A ETP-015.5 implementa isolamento no
recorte canônico aprovado; nenhuma família legada foi migrada. A ETP-015.7 implementa a fundação de
auditoria atômica. A ETP-015.6 implementa o perfil `MINIMAL` homologado nas 33 rotas canônicas, sem
antecipação da ETP-015.8.

Permanecem propostas não vinculantes, sem autorização de implementação: **ETP-016 — Relatórios,
dashboards e inteligência operacional** e **ETP-017 — Hardening, observabilidade e performance**.
Integrações, notificações e automações continuam fora da ETP-015 e exigem iniciativa futura própria.

## Etapa 2 — Fundação técnica

Criar monorepo, ambientes, autenticação, autorização, auditoria, banco e pipeline de qualidade. Não inclui funcionalidade de DP.

## Etapa 3 — Cadastros e estrutura

Entregar empresas, estrutura organizacional, colaboradores, contratos, documentos e histórico.

## Etapa 4 — Rotinas trabalhistas

Entregar admissão, checklists, férias, prazos, afastamentos, benefícios e jornada.

## Etapa 5 — Folha e remuneração variável

Entregar rubricas, lançamentos, cálculos, comissões, encargos, conferência, aprovação e fechamento.

## Etapa 6 — Integrações e operação assistida

Entregar eSocial, relatórios, migração controlada, comparação paralela com a planilha, treinamento e homologação.

## Próxima entrega proposta

**Confirmação para a ETP-002.2.**

Confirmar a próxima etapa de infraestrutura: hooks, lint-staged, GitHub Actions, VSCode e validações automatizadas adicionais. Nenhum módulo de negócio será iniciado sem novo planejamento.
