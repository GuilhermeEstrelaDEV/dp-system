# ETP-015.4 — Matriz de testes negativos

| Cenário                                       | Resultado                               | Evidência automatizada                                   |
| --------------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| rota pública sem token                        | sucesso                                 | E2E health                                               |
| rota autenticada sem token                    | `401`                                   | E2E de autorização                                       |
| token inválido ou expirado                    | `401`                                   | E2E + `jwt.strategy.spec.ts`                             |
| sessão revogada/expirada                      | `401`                                   | identity/session integration specs                       |
| usuário ausente/inativo                       | `401`                                   | application context specs                                |
| empresa ativa ausente                         | `403`                                   | `active-company.guard.spec.ts`                           |
| vínculo ausente, expirado ou empresa inativa  | `403`                                   | active company resolver specs                            |
| capability ausente                            | `403`                                   | unitário + E2E                                           |
| capability desconhecida                       | fail-closed de configuração             | capabilities guard spec                                  |
| capability global em domínio empresarial      | fail-closed de configuração             | capabilities guard spec                                  |
| grant revogado, futuro ou expirado            | `403` por ausência no principal efetivo | queries temporais + specs de contexto                    |
| múltiplas capabilities                        | todas (`ALL`) obrigatórias              | capabilities guard spec                                  |
| metadata pública fora da allowlist            | fail-closed                             | authorization route guard spec                           |
| metadata inválida/conflitante                 | fail-closed                             | authorization route guard spec                           |
| handler sem metadata e fora do legado nominal | `403`, handler não executado            | E2E de autorização                                       |
| entrada legada órfã                           | falha de CI                             | verifier spec                                            |
| empresa de outro tenant em lookup             | `404`                                   | permanece por caso de uso canônico; expansão é ETP-015.5 |

Fixtures de capability existem somente em memória ou em banco temporário isolado com limpeza
explícita. Seed e contas demo continuam com zero grants e zero assignments automáticos.
