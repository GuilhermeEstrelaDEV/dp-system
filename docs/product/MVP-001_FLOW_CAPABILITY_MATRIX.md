# MVP-001 — Matriz de fluxos e capabilities

| Rota                              | Ação                      | Capability                                     | Backend            | Frontend                 | Usuário demo    | Resultado esperado                 |
| --------------------------------- | ------------------------- | ---------------------------------------------- | ------------------ | ------------------------ | --------------- | ---------------------------------- |
| `/login`                          | autenticar                | pública mínima                                 | JWT real           | formulário real          | ambos           | sessão criada ou 401 controlado    |
| `/selecionar-empresa`             | listar/selecionar vínculo | identidade autenticada                         | vínculo validado   | seleção real             | Admin: 2; RH: 1 | novo JWT empresarial e cache limpo |
| `/`                               | contexto do dashboard     | JWT + empresa ativa                            | canônico           | sempre disponível        | ambos           | contexto empresarial, `RESTRICTED` |
| `/`                               | métricas de review        | `payroll.review.view`                          | filtro empresarial | seção condicional        | nenhum          | métricas omitidas                  |
| `/`                               | métricas de competência   | `payroll.period.close.view`                    | filtro empresarial | seção condicional        | nenhum          | métricas omitidas                  |
| `/estrutura/*`                    | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/colaboradores/*`                | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/contratos/*`                    | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/admissoes/*`                    | workflow legado           | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/folha/conferencia/*`            | consultar/decidir         | família `payroll.review.*`                     | canônico           | `CapabilityRoute`        | nenhum          | `Acesso restrito`                  |
| `/folha/competencias/*/historico` | consultar histórico       | `payroll.period.close.history`                 | canônico           | `CapabilityRoute`        | nenhum          | `Acesso restrito`                  |
| menu do usuário                   | logout                    | identidade autenticada                         | revogação lógica   | limpeza local            | ambos           | retorno ao login                   |

`platform.manage` não concede acesso e não é atribuído pelo seed. Seu uso no frontend impede que
uma identidade sem grant invoque acidentalmente superfícies administrativas legadas. A proteção
canônica de backend da ETP-015.4 cobre as rotas já classificadas e bloqueia novos handlers sem
política. As 129 rotas legadas permanecem nominalmente adiadas; nenhuma é declarada segura apenas por
esse gate visual.
