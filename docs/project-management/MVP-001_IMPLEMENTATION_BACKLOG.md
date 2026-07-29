# MVP-001 — Backlog de implementação

## Estado

`PLANNED — DISCOVERY COMPLETED`. Nenhum incremento abaixo foi iniciado.

| Ordem | Incremento                      | Entrega                                                                        | Critério de saída                                            | Complexidade |
| ----- | ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------ |
| 1     | MVP-001.1 Bootstrap e reset     | comando local seguro, verificação de pré-requisitos e reset idempotente        | ambiente limpo sobe e volta ao baseline sem edição de código | média        |
| 2     | MVP-001.2 Massa e identidades   | duas empresas, usuários/personas, assignments e domínio inteiramente fictícios | login e troca autorizada funcionam; zero grant implícito     | alta         |
| 3     | MVP-001.3 Experiência executiva | dashboard coerente, estados vazios e feedback padronizado                      | nenhuma tela enganosa; dados demo identificados              | média        |
| 4     | MVP-001.4 Fluxo principal       | estrutura → colaborador → contrato ponta a ponta                               | criação, consulta, edição e isolamento cobertos              | alta         |
| 5     | MVP-001.5 Roteiro e acceptance  | smoke test, roteiro de 15 minutos e guia do apresentador                       | execução sem 5xx, console crítico ou reinício                | média        |

## Dependências e gates

- especificar credenciais fictícias sem versionar senha reutilizável ou segredo real;
- assignments devem ser explícitos e auditáveis; nenhuma capability automática por papel;
- scripts destrutivos devem falhar fora do ambiente local e exigir alvo explícito;
- escolher apenas contratos existentes; qualquer alteração de banco exige migration nova;
- cada incremento parte de `develop`, usa branch/PR próprio e preserva ETP-015.4 `NOT STARTED`.

## Sequência recomendada

MVP-001.1 e MVP-001.2 desbloqueiam a primeira execução real. MVP-001.3 pode evoluir em paralelo
conceitual, mas não deve mascarar ausência de dados. MVP-001.4 entrega valor demonstrável; MVP-001.5
é o gate final. Complexidade global estimada: **alta**, sobretudo pela preparação segura e
reproduzível de identidade, assignments e dados relacionais.
