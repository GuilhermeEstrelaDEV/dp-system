# MVP-001 — Backlog de implementação

## Estado

`IN PROGRESS`. Bootstrap, shell visual, login demonstrativo e dashboard executivo estão disponíveis.
O protótipo completo ainda não está pronto.

| Ordem | Incremento                                 | Estado                                           | Critério de saída                                                    |
| ----- | ------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| 1     | MVP-001.1 Bootstrap e reset                | `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE`        | setup/start/stop/status/reset isolados e documentados                |
| 2     | MVP-001.2 Identidade e shell visual        | `IMPLEMENTED — VISUAL SHELL AVAILABLE`           | marca temporária, tokens, navegação honesta e shell desktop/notebook |
| 3     | MVP-001.3 Identidades e massa demo         | `IMPLEMENTED — DEMO LOGIN AVAILABLE`             | login fictício, empresas, assignments e dados sem grant implícito    |
| 4     | MVP-001.4 Dashboard executivo              | `IMPLEMENTED — EXECUTIVE DASHBOARD AVAILABLE`    | métricas reais, autorizadas e isoladas por empresa                   |
| 5     | MVP-001.5 Dataset demonstrativo            | `IMPLEMENTED — DEMO DATASET AVAILABLE`           | massa determinística, segura, isolada e verificável                  |
| 6     | MVP-001.6 Fluxos principais                | `IMPLEMENTED — SAFE CORE DEMO FLOWS AVAILABLE`   | login, contexto, dashboard, restrição segura, troca e logout         |
| 7     | MVP-001.7 Roteiro e acceptance             | `IMPLEMENTED — DEMO MODE AND GO/NO-GO AVAILABLE` | smoke test, gate GO/NO-GO e guia do apresentador                     |
| 8     | MVP-001.8 Estabilização final              | `NOT STARTED`                                    | ensaio aceito, pendências críticas encerradas e aceite final         |
| 9     | MVP-001.9 Pacote de apresentação executiva | `NOT STARTED — PRESENTATION PACKAGE`             | materiais finais e decisão de encerramento, após estabilização       |

## Dependências e gates

- credenciais fictícias pertencem exclusivamente à MVP-001.3 e não foram antecipadas;
- assignments devem ser explícitos e auditáveis; nenhuma capability automática por papel;
- scripts destrutivos devem falhar fora do ambiente local e exigir alvo explícito;
- qualquer alteração de banco futura exige migration nova;
- cada incremento parte de `develop`, usa branch/PR próprio e preserva ETP-015.4 `NOT STARTED`.

### MVP-001.9 — Pacote de apresentação executiva

Etapa futura para preparar o roteiro executivo final, narrativa de negócio, sequência da
demonstração, slides, guia do apresentador, checklist do dia, contingência consolidada, limitações,
coleta de feedback, evidências finais e decisão de encerramento da MVP-001.

Depende da MVP-001.8 concluída, protótipo estabilizado, critérios de aceite revisados, riscos
residuais documentados e `DEMO STATUS: GO`. Não inclui funcionalidades, módulos, APIs legadas,
grants, capabilities, produção, cloud, deploy ou ETP-015.4. Seu status é `NOT STARTED`; nenhum
material de apresentação foi criado nesta regularização.

## Sequência recomendada

A MVP-001.1 oferece execução reproduzível e a MVP-001.2 fornece a linguagem visual reutilizável. A
MVP-001.3 preparou identidades fictícias sem alterar o modelo de segurança. A MVP-001.4 oferece a
visão autorizada documentada na [matriz de métricas](../product/MVP-001_DASHBOARD_METRICS.md). A
MVP-001.5 fornece o [dataset determinístico](../product/MVP-001_DEMO_DATASET.md). MVP-001.6 entrega
os [fluxos essenciais seguros](../product/MVP-001_CORE_FLOWS.md), sem antecipar a proteção de backend
da ETP-015.4 nem criar grants. MVP-001.7 entrega o modo de apresentação e o gate operacional
GO/NO-GO. MVP-001.8 e MVP-001.9 permanecem `NOT STARTED`; o protótipo completo e o pacote executivo
ainda não estão prontos.
