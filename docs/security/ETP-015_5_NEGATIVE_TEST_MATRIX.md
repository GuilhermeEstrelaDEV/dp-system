# ETP-015.5 — Matriz de testes negativos

| Cenário                                         | Resultado                              | Evidência                                                   |
| ----------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| scope estrutural não emitido pelo resolvedor    | bloqueio antes do caso de uso          | `enterprise-scope.spec.ts`                                  |
| principal e scope de empresas/atores diferentes | bloqueio                               | `enterprise-scope.spec.ts`, `access-grants.service.spec.ts` |
| dashboard Horizonte/Atlas                       | contagens distintas e nenhuma mistura  | `dashboard.repository.spec.ts`, PostgreSQL E2E              |
| listagem de grants                              | somente empresa ativa                  | `access-grants.repository.spec.ts`, PostgreSQL E2E          |
| ID inexistente                                  | `404`                                  | API E2E e service spec                                      |
| ID de outra empresa                             | mesmo `404`                            | API E2E e PostgreSQL E2E                                    |
| update de outra empresa                         | zero linhas, zero mudança e `404`      | repository/service specs e PostgreSQL E2E                   |
| titular/substituto de empresas diferentes       | rejeição antes do insert               | service spec e PostgreSQL E2E                               |
| beneficiário emergencial de outra empresa       | rejeição antes do insert               | service spec                                                |
| capability não pertencente ao titular           | `400`, sem grant                       | service spec                                                |
| capability ausente na rota                      | `403` antes do repository              | API E2E                                                     |
| identidade inválida/ausente                     | `401` antes do repository              | API E2E                                                     |
| falha de auditoria transacional                 | rollback integral                      | service spec e PostgreSQL E2E                               |
| assignment de outra empresa                     | não participa de membership/capability | repository spec e PostgreSQL E2E                            |
| grant futuro, expirado ou revogado              | não entra no principal                 | testes existentes de application context                    |
| nova regressão de source                        | arquivo, linha, método e motivo        | `enterprise-query-isolation-verifier.spec.ts`               |

Paginação, busca, cursor, cache e novo raw SQL não existem nas operações migradas; portanto, não há
fixture artificial para um comportamento inexistente. O pattern obrigatório está documentado e será
testado na onda que introduzir cada operação.
