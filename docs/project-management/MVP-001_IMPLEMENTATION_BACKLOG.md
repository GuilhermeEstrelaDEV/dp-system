# MVP-001 — Backlog de implementação

## Estado

`IMPLEMENTED — LOCAL PROTOTYPE READY FOR MANAGEMENT VALIDATION`. Os nove incrementos locais estão
disponíveis; validação gerencial e qualquer continuidade ainda dependem de decisão explícita.

| Ordem | Incremento                                 | Estado                                           | Critério de saída                                                    |
| ----- | ------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| 1     | MVP-001.1 Bootstrap e reset                | `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE`        | setup/start/stop/status/reset isolados e documentados                |
| 2     | MVP-001.2 Identidade e shell visual        | `IMPLEMENTED — VISUAL SHELL AVAILABLE`           | marca temporária, tokens, navegação honesta e shell desktop/notebook |
| 3     | MVP-001.3 Identidades e massa demo         | `IMPLEMENTED — DEMO LOGIN AVAILABLE`             | login fictício, empresas, assignments e dados sem grant implícito    |
| 4     | MVP-001.4 Dashboard executivo              | `IMPLEMENTED — EXECUTIVE DASHBOARD AVAILABLE`    | métricas reais, autorizadas e isoladas por empresa                   |
| 5     | MVP-001.5 Dataset demonstrativo            | `IMPLEMENTED — DEMO DATASET AVAILABLE`           | massa determinística, segura, isolada e verificável                  |
| 6     | MVP-001.6 Fluxos principais                | `IMPLEMENTED — SAFE CORE DEMO FLOWS AVAILABLE`   | login, contexto, dashboard, restrição segura, troca e logout         |
| 7     | MVP-001.7 Roteiro e acceptance             | `IMPLEMENTED — DEMO MODE AND GO/NO-GO AVAILABLE` | smoke test, gate GO/NO-GO e guia do apresentador                     |
| 8     | MVP-001.8 Estabilização final              | `IMPLEMENTED — PROTOTYPE STABILIZED`             | ensaio aceito, pendências críticas encerradas e aceite final         |
| 9     | MVP-001.9 Pacote de apresentação executiva | `IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE`   | deck, roteiro, evidências, contingência e feedback reproduzíveis     |

## Dependências e gates

- credenciais fictícias pertencem exclusivamente à MVP-001.3 e não foram antecipadas;
- assignments devem ser explícitos e auditáveis; nenhuma capability automática por papel;
- scripts destrutivos devem falhar fora do ambiente local e exigir alvo explícito;
- qualquer alteração de banco futura exige migration nova;
- cada incremento parte de `develop`, usa branch/PR próprio e preserva ETP-015.4 `NOT STARTED`.

### MVP-001.9 — Pacote de apresentação executiva

Entrega do roteiro executivo final, narrativa de negócio, sequência da demonstração, slides, guia
do apresentador, checklist do dia, contingência consolidada, limitações, coleta de feedback e
evidências finais da MVP-001.

Foi concluída após a MVP-001.8, com protótipo estabilizado, critérios de aceite revisados, riscos
residuais documentados e `DEMO STATUS: GO`. Não inclui funcionalidades, módulos, APIs legadas,
grants, capabilities, produção, cloud, deploy ou ETP-015.4. Seu status é
`IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE`.

## Sequência recomendada

A MVP-001.1 oferece execução reproduzível e a MVP-001.2 fornece a linguagem visual reutilizável. A
MVP-001.3 preparou identidades fictícias sem alterar o modelo de segurança. A MVP-001.4 oferece a
visão autorizada documentada na [matriz de métricas](../product/MVP-001_DASHBOARD_METRICS.md). A
MVP-001.5 fornece o [dataset determinístico](../product/MVP-001_DEMO_DATASET.md). MVP-001.6 entrega
os [fluxos essenciais seguros](../product/MVP-001_CORE_FLOWS.md), sem antecipar a proteção de backend
da ETP-015.4 nem criar grants. MVP-001.7 entrega o modo de apresentação e o gate operacional
GO/NO-GO. MVP-001.8 estabilizou o protótipo, encerrou todos os P1 e registrou evidências e limitações
em `docs/quality`. MVP-001.9 disponibiliza o
[pacote de apresentação](../presentation/MVP-001_PRESENTATION_PACKAGE_README.md); o protótipo local
está pronto para validação gerencial, sem representar prontidão produtiva.
