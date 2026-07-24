# Inventário legado de fechamento de competência

**Status:** inventariado para transição da ETP-014 v1

**Regra:** nenhum componente listado pode ser removido antes dos critérios de descontinuação.

## 1. Visão geral

Existem duas superfícies funcionais que alteram `PayrollPeriod.status` e acrescentam `PayrollPeriodClosure`. Ambas nasceram na ETP-010, são registradas no `AppModule`, permanecem classificadas como legadas no inventário de autorização e possuem consumidores frontend distintos.

## 2. Fluxo `payroll-periods`

| Elemento                | Local                                                                                                 | Comportamento atual                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| controller              | `PayrollPeriodsController`                                                                            | listar, buscar, criar, editar, abrir, validar, fechar e reabrir             |
| serviço                 | `PayrollPeriodsService`                                                                               | fecha após contar `BLOCKING_ERROR` em qualquer run da competência           |
| DTOs                    | `PayrollPeriodQueryDto`, `CreatePayrollPeriodDto`, `UpdatePayrollPeriodDto`, `ReopenPayrollPeriodDto` | `companyId` vem do cliente; motivo somente na reabertura                    |
| endpoints de fechamento | `POST /payroll-periods/:id/validate`, `POST /:id/close`, `POST /:id/reopen`                           | retorna readiness mínima ou `PayrollPeriod`                                 |
| entidade                | `PayrollPeriod`                                                                                       | atualiza `status`, `closedAt` ou `reopenedAt`                               |
| histórico               | `PayrollPeriodClosure`                                                                                | adiciona `CLOSED`/`REOPENED` com versões técnicas                           |
| módulo                  | `PayrollPeriodsModule`                                                                                | exporta `PayrollPeriodsService`; nenhuma chamada interna foi localizada     |
| testes API              | `payroll-periods.service.spec.ts`                                                                     | criação, duplicidade, imutabilidade fechada e `404`; não cobre close/reopen |
| cliente frontend        | `payroll-periods.ts`                                                                                  | consome validate, close e reopen                                            |
| tela                    | `/folha/competencias`                                                                                 | lista por `companyId`, mostra imutabilidade e reabertura                    |
| teste frontend          | `payroll-periods.test.tsx`                                                                            | navegação, empresa, criação e abertura do fluxo de reabertura               |

## 3. Fluxo `payroll-closures`

| Elemento         | Local                                                                          | Comportamento atual                                                           |
| ---------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| controller       | `PayrollClosuresController`                                                    | lista/detalha histórico, fecha e reabre                                       |
| serviço          | `PayrollClosuresService`                                                       | exige run `COMPLETED` de maior sequência e ausência de `BLOCKING_ERROR`       |
| DTOs             | `PayrollClosureQueryDto`, `ClosePayrollPeriodDto`, `ReopenPayrollPeriodDto`    | fecha por `payrollPeriodId`; motivo opcional no close e obrigatório no reopen |
| endpoints        | `GET /payroll-closures`, `GET /:id`, `POST /`, `POST /:payrollPeriodId/reopen` | mutações retornam `PayrollPeriodClosure`                                      |
| entidades        | `PayrollPeriod`, `PayrollRun`, `PayrollRunMessage`, `PayrollPeriodClosure`     | copia versões da execução para período/evento                                 |
| módulo           | `PayrollClosuresModule`                                                        | registrado no `AppModule`; sem exportação ou chamada interna localizada       |
| testes API       | `payroll-closures.service.spec.ts`                                             | período ausente, run obrigatório, blocker, versões e reabertura inválida      |
| cliente frontend | `payroll-closures.ts`                                                          | lista, detalhe, close e reopen                                                |
| tela             | `/folha/fechamentos`                                                           | histórico, fechamento com motivo opcional e reabertura justificada            |
| teste frontend   | `payroll-closures.test.tsx`                                                    | histórico, conflito de fechamento e reabertura                                |

## 4. Divergências

| Tema              | `payroll-periods`                  | `payroll-closures`                               | Risco                              |
| ----------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------------- |
| run concluída     | não exige                          | exige maior `sequence` `COMPLETED`               | bypass da evidência técnica        |
| blockers          | todas as runs da competência       | todas as runs da competência                     | execução selecionada não é isolada |
| review ETP-013    | não consulta                       | não consulta                                     | fechamento sem conferência         |
| motivo no close   | inexistente                        | opcional                                         | auditoria divergente               |
| retorno           | período                            | evento                                           | consumidores incompatíveis         |
| empresa           | query/body fornecidos pelo cliente | derivada indiretamente do período, sem principal | ausência de isolamento autenticado |
| autorização       | nenhuma                            | nenhuma                                          | rotas legadas expostas sem RBAC    |
| transação         | update e evento                    | update e evento                                  | validações anteriores à transação  |
| versões           | usa versões já no período          | copia da run escolhida                           | evidência diferente                |
| idempotência/lock | inexistente                        | inexistente                                      | duplicidade e corrida              |
| auditoria         | sem `AuditLog`                     | sem `AuditLog`                                   | decisão não atribuída              |
| testes            | close/reopen não cobertos          | cobertura unitária parcial                       | regressão desigual                 |

## 5. Consumidores conhecidos

- frontend `/folha/competencias` via `payrollPeriodsApi`;
- frontend `/folha/fechamentos` via `payrollClosuresApi`;
- testes frontend que afirmam os contratos atuais;
- testes unitários dos dois serviços;
- Swagger gerado pelos controllers;
- documentação `PAYROLL_FOUNDATION.md`, ROADMAP e status mestre.

Não foram localizadas chamadas internas aos métodos de fechamento além dos controllers. `PayrollPeriodsService` é exportado pelo módulo, portanto consumo dinâmico ou futuro não pode ser descartado apenas pela busca estática.

## 6. Consumidores não identificados

- clientes externos da API e automações fora do monorepo;
- coleções HTTP, scripts locais ou integrações não versionadas;
- consultas diretas à tabela `payroll_period_closures`;
- dashboards ou exportações construídos fora do repositório.

A ausência de referência no monorepo não prova ausência de consumidor.

## 7. Estratégia de compatibilidade

1. implementar o orquestrador canônico sem remover rotas;
2. migrar `PayrollPeriodsService.close/reopen` para delegação;
3. migrar escritas de `PayrollClosuresService` para o mesmo caso de uso;
4. criar adaptadores de resposta para preservar contratos temporariamente;
5. migrar `/folha/competencias` e `/folha/fechamentos` para os contratos canônicos;
6. marcar rotas legadas como deprecated no OpenAPI e emitir telemetria sem dados sensíveis;
7. observar uma janela homologada e comunicar consumidores;
8. remover somente em iniciativa técnica separada.

Durante a compatibilidade, as rotas legadas devem aplicar a mesma autenticação, empresa ativa, capability, readiness, idempotência, lock, evento e auditoria. Compatibilidade de URI ou envelope não autoriza regra alternativa.

## 8. Riscos de remoção

- quebra das duas telas atuais e seus testes;
- quebra de consumidores externos invisíveis ao repositório;
- alteração de retorno de `PayrollPeriod` para evento ou vice-versa;
- mudança de códigos HTTP e exigência nova de headers/body;
- perda de acesso ao histórico por clientes existentes;
- remoção antes de assignments das novas capabilities;
- inconsistência se apenas uma rota delegar ao serviço canônico.

## 9. Critérios futuros de descontinuação

- consumidores internos migrados e testes atualizados;
- inventário externo assinado pelo responsável técnico/produto;
- OpenAPI marcou depreciação por pelo menos a janela aprovada;
- telemetria demonstra ausência de uso ou consumidores foram formalmente migrados;
- documentação e comunicação publicadas;
- equivalência funcional e de auditoria comprovada;
- plano de rollback aprovado;
- remoção executada em PR próprio, nunca incidentalmente numa fase funcional.

## 10. Limite desta entrega

Este inventário não altera controller, serviço, DTO, entidade, rota, frontend ou teste. A fonte normativa para o destino é o [contrato canônico](PAYROLL_PERIOD_CLOSURE_CANONICAL_CONTRACT.md).

## 11. Situação após a Fase 4

A URI homologada `POST /payroll-periods/:id/close` passou a executar o comando canônico autenticado
da Fase 4. Isso elimina o bypass do fechamento por essa URI, mas altera deliberadamente seu contrato
de entrada e resposta conforme a BDP-014. `validate`, `open`, `reopen` e toda a família
`/payroll-closures` permanecem inalterados e ainda não delegam ao orquestrador. Seus consumidores,
telemetria e janela de migração continuam pendentes; nenhuma remoção ou redirecionamento ocorreu.
