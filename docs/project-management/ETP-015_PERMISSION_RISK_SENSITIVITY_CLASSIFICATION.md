# ETP-015 — Permission Risk and Sensitivity Classification

## Estado e objetivo

**PENDING HUMAN APPROVAL.** Este documento inventaria os 19 códigos atuais e propõe classificações
reproduzíveis para o backfill da ETP-015.3. Nenhuma recomendação é decisão homologada; nenhuma
migration, assignment ou autorização funcional é criada.

## Critérios reproduzíveis

### Risk level

- `LOW`: leitura/ação de baixo impacto, sem alteração crítica ou decisão financeira, trabalhista ou operacional relevante;
- `MEDIUM`: leitura privilegiada ou alteração operacional reversível e limitada, sem aprovação ou fechamento crítico;
- `HIGH`: alteração relevante de dados empresariais, financeiros ou trabalhistas, decisão operacional ou abuso significativo;
- `CRITICAL`: fechamento, aprovação final, gestão de acesso privilegiado, exposição massiva ou ação de alto impacto.

### Sensitivity

- `STANDARD`: dados operacionais comuns, sem dados pessoais, trabalhistas ou financeiros relevantes;
- `SENSITIVE`: dados pessoais, trabalhistas, documentos internos ou informações financeiras não críticas;
- `RESTRICTED`: folha, remuneração, dados bancários/sensíveis, credenciais, administração de acesso ou informação sujeita a segregação rigorosa.

A classificação combina recurso, alcance, dados alcançáveis e efeito operacional; o verbo isolado não
determina risco ou sensibilidade.

## Inventário canônico

O modelo atual não possui `Permission.name`; por isso “nome atual” é registrado como inexistente, sem
inventar valor de backfill. `RolePermission` não é criado pelo seed, logo não há papel automaticamente
relacionado; relações eventualmente existentes são dados configuráveis do banco.

| PC    | Code                             | Nome atual  | Descrição atual                                 | Resource                 | Action      | Consumidores principais                                          | Roles relacionadas | Evidência/compatibilidade           |
| ----- | -------------------------------- | ----------- | ----------------------------------------------- | ------------------------ | ----------- | ---------------------------------------------------------------- | ------------------ | ----------------------------------- |
| PC-01 | `platform.read`                  | inexistente | View platform resources                         | `platform`               | `read`      | Catálogo; sem rota declarada encontrada                          | Nenhuma no seed    | `seed.ts`; preservar código/ID      |
| PC-02 | `platform.manage`                | inexistente | Manage platform resources                       | `platform`               | `manage`    | Resolução global em `ApplicationContextService`; testes          | Nenhuma no seed    | `seed.ts`; escopo global preservado |
| PC-03 | `delegation.manage`              | inexistente | Manage temporary substitutions                  | `delegation`             | `manage`    | `GET/POST /access-grants/substitutions`, revoke                  | Nenhuma no seed    | seed, controller e service          |
| PC-04 | `emergency_access.manage`        | inexistente | Manage audited emergency access                 | `emergency_access`       | `manage`    | `GET/POST /access-grants/emergency`, revoke                      | Nenhuma no seed    | seed, controller e service          |
| PC-05 | `payroll.review.view`            | inexistente | View payroll review cycles and findings         | `payroll.review`         | `view`      | Consultas de ciclo, achados e histórico; rota web de conferência | Nenhuma no seed    | seed, API, web e módulo             |
| PC-06 | `payroll.review.create`          | inexistente | Open payroll review cycles                      | `payroll.review`         | `create`    | `POST /payroll-runs/:payrollRunId/reviews`; web                  | Nenhuma no seed    | seed, controller e web              |
| PC-07 | `payroll.review.finding.create`  | inexistente | Create payroll review findings                  | `payroll.review.finding` | `create`    | `POST /payroll-reviews/:id/findings`; web                        | Nenhuma no seed    | seed, controller e web              |
| PC-08 | `payroll.review.finding.resolve` | inexistente | Resolve payroll review findings                 | `payroll.review.finding` | `resolve`   | `POST /payroll-review-findings/:id/resolve`; web                 | Nenhuma no seed    | seed, controller e web              |
| PC-09 | `payroll.review.finding.reopen`  | inexistente | Reopen payroll review findings                  | `payroll.review.finding` | `reopen`    | `POST /payroll-review-findings/:id/reopen`; web                  | Nenhuma no seed    | seed, controller e web              |
| PC-10 | `payroll.review.submit`          | inexistente | Submit payroll review cycles                    | `payroll.review`         | `submit`    | start/submit do ciclo; web                                       | Nenhuma no seed    | seed, controller e web              |
| PC-11 | `payroll.review.approve`         | inexistente | Approve configured payroll review stages        | `payroll.review`         | `approve`   | aprovação em duas etapas; readiness de fechamento; web           | Nenhuma no seed    | seed, API, testes e módulo          |
| PC-12 | `payroll.review.reject`          | inexistente | Reject submitted payroll review cycles          | `payroll.review`         | `reject`    | rejeição de ciclo; web                                           | Nenhuma no seed    | seed, controller e web              |
| PC-13 | `payroll.review.close`           | inexistente | Close approved payroll review cycles            | `payroll.review`         | `close`     | fechamento de ciclo aprovado; web                                | Nenhuma no seed    | seed, controller e web              |
| PC-14 | `payroll.review.reopen`          | inexistente | Reopen approved or closed payroll review cycles | `payroll.review`         | `reopen`    | reabertura e invalidação; web                                    | Nenhuma no seed    | seed, controller e web              |
| PC-15 | `payroll.period.close.view`      | inexistente | View payroll period closure summary             | `payroll.period.close`   | `view`      | Catálogo/documentação; sem rota declarada encontrada             | Nenhuma no seed    | seed e módulo; preservar código     |
| PC-16 | `payroll.period.close.readiness` | inexistente | Evaluate payroll period closure readiness       | `payroll.period.close`   | `readiness` | `GET /payroll-periods/:id/closure-readiness`; web                | Nenhuma no seed    | seed, API, web e módulo             |
| PC-17 | `payroll.period.close.execute`   | inexistente | Execute payroll period closure                  | `payroll.period.close`   | `execute`   | `POST /payroll-periods/:id/close`; web                           | Nenhuma no seed    | seed, API, e2e e inventário         |
| PC-18 | `payroll.period.close.reopen`    | inexistente | Reopen a closed payroll period                  | `payroll.period.close`   | `reopen`    | `POST /payroll-periods/:id/reopen`; web                          | Nenhuma no seed    | seed, API, e2e e inventário         |
| PC-19 | `payroll.period.close.history`   | inexistente | View payroll period closure history             | `payroll.period.close`   | `history`   | quatro rotas públicas autenticadas de histórico; web             | Nenhuma no seed    | seed, API, web e módulo             |

## Matriz de classificação proposta

Escalas de impacto: `L` baixo, `M` médio, `H` alto e `C` crítico. Dados envolvidos: `N` não
evidenciado, `S` sim. Alcance: `GLOBAL` ou `COMPANY`.

| PC    | Code                             | Resource               | Action    | Descrição                   | Conf. | Integ. | Disp. | Pessoal | Financeiro | Trabalhista | Destrutiva | Aprova/fecha | Alcance | Justificativa técnica                                                   | Risk     | Sensitivity | Segurança | DPO      | Decisão | Condições | Evidência          | Data | Status  |
| ----- | -------------------------------- | ---------------------- | --------- | --------------------------- | ----- | ------ | ----- | ------- | ---------- | ----------- | ---------- | ------------ | ------- | ----------------------------------------------------------------------- | -------- | ----------- | --------- | -------- | ------- | --------- | ------------------ | ---- | ------- |
| PC-01 | `platform.read`                  | platform               | read      | Leitura da plataforma       | H     | L      | L     | S       | N          | N           | N          | N            | GLOBAL  | Leitura transversal pode revelar estrutura e usuários, sem mutação      | MEDIUM   | SENSITIVE   | pendente  | pendente |         |           | seed/consumidores  |      | PENDING |
| PC-02 | `platform.manage`                | platform               | manage    | Administração da plataforma | C     | C      | H     | S       | S          | S           | S          | S            | GLOBAL  | Autoridade administrativa transversal e potencial gestão de acesso      | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | seed/contexto      |      | PENDING |
| PC-03 | `delegation.manage`              | delegation             | manage    | Substituições temporárias   | H     | C      | H     | S       | S          | S           | S          | S            | COMPANY | Pode transferir capacidades e afetar segregação, com vigência/revogação | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | controller/service |      | PENDING |
| PC-04 | `emergency_access.manage`        | emergency_access       | manage    | Acesso emergencial          | C     | C      | H     | S       | S          | S           | S          | S            | COMPANY | Concede acesso privilegiado emergencial, escopo e expiração             | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | controller/service |      | PENDING |
| PC-05 | `payroll.review.view`            | payroll.review         | view      | Consulta conferência        | H     | L      | L     | S       | S          | S           | N          | N            | COMPANY | Expõe dados de folha, achados e histórico sem mutação                   | MEDIUM   | RESTRICTED  | pendente  | pendente |         |           | API/web/módulo     |      | PENDING |
| PC-06 | `payroll.review.create`          | payroll.review         | create    | Abre ciclo                  | M     | H      | M     | S       | S          | S           | N          | N            | COMPANY | Cria agregado operacional ligado a execução de folha                    | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-07 | `payroll.review.finding.create`  | payroll.review.finding | create    | Cria achado                 | M     | H      | M     | S       | S          | S           | N          | N            | COMPANY | Achado pode bloquear submissão e alterar o fluxo de folha               | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-08 | `payroll.review.finding.resolve` | payroll.review.finding | resolve   | Resolve achado              | M     | H      | M     | S       | S          | S           | N          | N            | COMPANY | Remove impedimento operacional e influencia submissão                   | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-09 | `payroll.review.finding.reopen`  | payroll.review.finding | reopen    | Reabre achado               | M     | H      | M     | S       | S          | S           | N          | N            | COMPANY | Restaura impedimento e altera estado auditável do fluxo                 | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-10 | `payroll.review.submit`          | payroll.review         | submit    | Inicia/submete ciclo        | M     | H      | H     | S       | S          | S           | N          | S            | COMPANY | Avança ciclo para decisão e restringe alterações posteriores            | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-11 | `payroll.review.approve`         | payroll.review         | approve   | Aprova etapa                | H     | C      | H     | S       | S          | S           | N          | S            | COMPANY | Decisão formal em duas etapas e pré-condição de fechamento              | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | API/testes/módulo  |      | PENDING |
| PC-12 | `payroll.review.reject`          | payroll.review         | reject    | Rejeita ciclo               | M     | H      | H     | S       | S          | S           | N          | S            | COMPANY | Decisão relevante que devolve o ciclo para correção                     | HIGH     | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-13 | `payroll.review.close`           | payroll.review         | close     | Fecha ciclo                 | H     | C      | H     | S       | S          | S           | S          | S            | COMPANY | Consolida ciclo aprovado e impede alterações ordinárias                 | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-14 | `payroll.review.reopen`          | payroll.review         | reopen    | Reabre ciclo                | H     | C      | H     | S       | S          | S           | S          | S            | COMPANY | Invalida decisões anteriores e reabre edição controlada                 | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | controller/web     |      | PENDING |
| PC-15 | `payroll.period.close.view`      | payroll.period.close   | view      | Consulta resumo             | H     | L      | L     | S       | S          | S           | N          | N            | COMPANY | Resumo de fechamento contém contexto de folha, sem mutação              | MEDIUM   | RESTRICTED  | pendente  | pendente |         |           | seed/módulo        |      | PENDING |
| PC-16 | `payroll.period.close.readiness` | payroll.period.close   | readiness | Avalia prontidão            | H     | M      | M     | S       | S          | S           | N          | N            | COMPANY | Consulta evidências e bloqueios que antecedem fechamento                | MEDIUM   | RESTRICTED  | pendente  | pendente |         |           | API/web/módulo     |      | PENDING |
| PC-17 | `payroll.period.close.execute`   | payroll.period.close   | execute   | Fecha competência           | H     | C      | C     | S       | S          | S           | S          | S            | COMPANY | Fechamento canônico, manifesto e efeitos operacionais de alto impacto   | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | API/e2e/inventário |      | PENDING |
| PC-18 | `payroll.period.close.reopen`    | payroll.period.close   | reopen    | Reabre competência          | H     | C      | C     | S       | S          | S           | S          | S            | COMPANY | Cria sucessor, invalida estado fechado e exige controle rigoroso        | CRITICAL | RESTRICTED  | pendente  | pendente |         |           | API/e2e/inventário |      | PENDING |
| PC-19 | `payroll.period.close.history`   | payroll.period.close   | history   | Consulta histórico          | H     | L      | M     | S       | S          | S           | N          | N            | COMPANY | Expõe manifesto e timeline histórica de fechamento                      | MEDIUM   | RESTRICTED  | pendente  | pendente |         |           | API/web/módulo     |      | PENDING |

## Política fail-closed para inventário e backfill

| Situação                          | Recomendação PC-20/PC-21                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Código extra no banco             | `BLOCK`; listar no relatório pré-migration                                          |
| Código da matriz ausente no banco | `WARN` em banco vazio; `BLOCK` no upgrade até justificar ausência                   |
| Código duplicado                  | `BLOCK`                                                                             |
| Classificação `PENDING` ou nula   | `BLOCK`                                                                             |
| Código descontinuado              | Exigir entrada homologada e status de catálogo coerente; caso contrário `BLOCK`     |
| Novo código futuro                | Exigir aprovação de risco/sensibilidade antes de insert/seed/migration; sem default |

Nenhum valor será inferido por código, nome, role ou verbo. O relatório pré-migration deve comparar
conjuntos, detectar ausentes/extras/duplicados e falhar antes de escrever. A lista presente na matriz e
ausente em banco limpo pode ser criada apenas pelo seed de catálogo homologado; isso nunca cria
`RolePermission`, `UserCompanyRole` ou grant.
