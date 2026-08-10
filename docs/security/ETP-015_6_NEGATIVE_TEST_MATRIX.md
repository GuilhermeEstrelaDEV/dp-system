# ETP-015.6 — Negative Test Matrix

| Invariante                                                   | Evidência automatizada                          |
| ------------------------------------------------------------ | ----------------------------------------------- |
| FC-001..110 únicos e completos                               | verificador do catálogo                         |
| exatamente 33 rotas canônicas                                | manifesto de endpoints do verificador           |
| perfil diferente de `MINIMAL` proibido                       | verificador do catálogo                         |
| masking não homologado proibido                              | verificador exige `NONE`                        |
| campos técnicos/textos/atores omitidos                       | specs de presenters, serviços e frontend        |
| `platform.manage` não libera dashboard                       | `dashboard.service.spec.ts`                     |
| empresa diferente retorna 404                                | testes ETP-015.5 preservados                    |
| ausência de capability retorna 403                           | testes de guards e interfaces preservados       |
| AR-03 sem capability homologada falha                        | `audit-writer.service.spec.ts`                  |
| falha de AR-03 não retorna leitura                           | `access-grants.service.spec.ts`                 |
| cache não cruza empresa/ator/perfil                          | chave canônica e limpeza de escopo no frontend  |
| sessão antiga não reidrata campos técnicos                   | `auth.test.tsx`                                 |
| totais financeiros do manifesto não vazam                    | testes de history API e frontend                |
| chaves futuras no estado de evento não vazam                 | allowlist e spec do presenter de payroll review |
| ator/motivo/metadata de acknowledgement não vazam            | spec do history service e OpenAPI fechado       |
| parâmetros `FULL`, `MASKED` ou `fields` não ampliam contrato | inspeção HTTP e manifesto OpenAPI               |

Nenhum teste concede capabilities por nome de papel ou introduz assignments automáticos.
