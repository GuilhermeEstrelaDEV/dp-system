# MVP-001 — Backlog de implementação

## Estado

`IN PROGRESS`. O bootstrap local e a fundação visual estão disponíveis. O protótipo completo ainda
não está pronto e não possui credenciais demonstrativas.

| Ordem | Incremento                          | Estado                                    | Critério de saída                                                    |
| ----- | ----------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1     | MVP-001.1 Bootstrap e reset         | `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE` | setup/start/stop/status/reset isolados e documentados                |
| 2     | MVP-001.2 Identidade e shell visual | `IMPLEMENTED — VISUAL SHELL AVAILABLE`    | marca temporária, tokens, navegação honesta e shell desktop/notebook |
| 3     | MVP-001.3 Identidades e massa demo  | `IMPLEMENTED — DEMO LOGIN AVAILABLE`      | login fictício, empresas, assignments e dados sem grant implícito    |
| 4     | MVP-001.4 Fluxo principal           | `NOT STARTED`                             | estrutura → colaborador → contrato ponta a ponta                     |
| 5     | MVP-001.5 Roteiro e acceptance      | `NOT STARTED`                             | smoke test, roteiro de 15 minutos e guia do apresentador             |

## Dependências e gates

- credenciais fictícias pertencem exclusivamente à MVP-001.3 e não foram antecipadas;
- assignments devem ser explícitos e auditáveis; nenhuma capability automática por papel;
- scripts destrutivos devem falhar fora do ambiente local e exigir alvo explícito;
- qualquer alteração de banco futura exige migration nova;
- cada incremento parte de `develop`, usa branch/PR próprio e preserva ETP-015.4 `NOT STARTED`.

## Sequência recomendada

A MVP-001.1 oferece execução reproduzível e a MVP-001.2 fornece a linguagem visual reutilizável. A
MVP-001.3 deverá preparar identidade e dados fictícios sem alterar o modelo de segurança. A
MVP-001.4 validará o fluxo principal e a MVP-001.5 será o gate final da demonstração.
