# MVP-001 — Matriz de fluxos e capabilities

| Rota                              | Ação                      | Capability                                     | Backend            | Frontend                 | Usuário demo    | Resultado esperado                 |
| --------------------------------- | ------------------------- | ---------------------------------------------- | ------------------ | ------------------------ | --------------- | ---------------------------------- |
| `/login`                          | autenticar                | pública mínima                                 | JWT real           | formulário real          | ambos           | sessão criada ou 401 controlado    |
| `/selecionar-empresa`             | listar/selecionar vínculo | identidade autenticada                         | vínculo validado   | seleção real             | Admin: 2; RH: 1 | novo JWT empresarial e cache limpo |
| `/`                               | contexto do dashboard     | JWT + empresa ativa                            | canônico           | sempre disponível        | ambos           | contexto empresarial, `RESTRICTED` |
| `/`                               | métricas aprovadas        | `platform.read`                                | projeção `MINIMAL` | seção condicional        | nenhum          | métricas ou estado restrito        |
| `/estrutura/*`                    | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/colaboradores/*`                | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/contratos/*`                    | CRUD legado               | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/admissoes/*`                    | workflow legado           | `platform.manage` como gate visual conservador | migração pendente  | bloqueado antes do fetch | nenhum          | `Acesso restrito`                  |
| `/folha/conferencia/*`            | consultar/decidir         | família `payroll.review.*`                     | canônico           | `CapabilityRoute`        | nenhum          | `Acesso restrito`                  |
| `/folha/competencias/*/historico` | consultar histórico       | `payroll.period.close.history`                 | canônico           | `CapabilityRoute`        | nenhum          | `Acesso restrito`                  |
| `/folha/fechamentos`              | readiness/fechar/reabrir  | família `payroll.period.close.*`               | canônico           | `CapabilityRoute`        | nenhum          | evidência explícita ou restrição   |
| menu do usuário                   | logout                    | identidade autenticada                         | revogação lógica   | limpeza local            | ambos           | retorno ao login                   |

`platform.manage` não concede acesso e não é atribuído pelo seed. Seu uso no frontend impede que
uma identidade sem grant invoque acidentalmente superfícies administrativas legadas. A proteção
canônica de backend da ETP-015.4 cobre as rotas já classificadas e bloqueia novos handlers sem
política. A ETP-015.5 força `EnterpriseScope` e filtro anterior ao lookup no dashboard e nas demais
superfícies canônicas migradas. Após o P0, 125 rotas legadas permanecem nominalmente adiadas;
nenhuma é declarada segura apenas por esses controles.

A ETP-015.7 registra os eventos canônicos de autenticação e das escritas críticas já disponíveis. A
ETP-015.6 aplica a projeção `MINIMAL` às cinco famílias e ativa somente AR-03 nas listas de grants;
dashboard e folha não recebem novos eventos de leitura. Nenhuma capability ou assignment foi criado.

A ETP-015.8 migra somente `/folha/fechamentos`: a tela usa readiness/history/close/reopen canônicos,
exige run, acknowledgement e key explícitos e não decide domínio. Nenhum grant demonstrativo ou
bypass por `platform.manage` foi adicionado.
