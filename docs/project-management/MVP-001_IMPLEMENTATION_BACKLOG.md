# MVP-001 — Backlog de implementação

## Estado

`IN PROGRESS`. Bootstrap, shell visual, login demonstrativo e dashboard executivo estão disponíveis.
O protótipo completo ainda não está pronto.

| Ordem | Incremento                          | Estado                                        | Critério de saída                                                    |
| ----- | ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| 1     | MVP-001.1 Bootstrap e reset         | `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE`     | setup/start/stop/status/reset isolados e documentados                |
| 2     | MVP-001.2 Identidade e shell visual | `IMPLEMENTED — VISUAL SHELL AVAILABLE`        | marca temporária, tokens, navegação honesta e shell desktop/notebook |
| 3     | MVP-001.3 Identidades e massa demo  | `IMPLEMENTED — DEMO LOGIN AVAILABLE`          | login fictício, empresas, assignments e dados sem grant implícito    |
| 4     | MVP-001.4 Dashboard executivo       | `IMPLEMENTED — EXECUTIVE DASHBOARD AVAILABLE` | métricas reais, autorizadas e isoladas por empresa                   |
| 5     | MVP-001.5 Roteiro e acceptance      | `NOT STARTED`                                 | smoke test, roteiro de 15 minutos e guia do apresentador             |

## Dependências e gates

- credenciais fictícias pertencem exclusivamente à MVP-001.3 e não foram antecipadas;
- assignments devem ser explícitos e auditáveis; nenhuma capability automática por papel;
- scripts destrutivos devem falhar fora do ambiente local e exigir alvo explícito;
- qualquer alteração de banco futura exige migration nova;
- cada incremento parte de `develop`, usa branch/PR próprio e preserva ETP-015.4 `NOT STARTED`.

## Sequência recomendada

A MVP-001.1 oferece execução reproduzível e a MVP-001.2 fornece a linguagem visual reutilizável. A
MVP-001.3 preparou identidades fictícias sem alterar o modelo de segurança. A MVP-001.4 oferece a
visão autorizada documentada na [matriz de métricas](../product/MVP-001_DASHBOARD_METRICS.md). A
MVP-001.5 permanece `NOT STARTED` e será o gate final da demonstração.
