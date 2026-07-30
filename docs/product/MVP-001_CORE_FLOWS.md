# MVP-001 — Fluxos essenciais da demonstração

## Decisão de escopo

A inspeção de controllers, serviços, rotas, guards, catálogo e assignments confirmou que os únicos
fluxos `INCLUDE` executáveis pelos usuários demonstrativos são autenticação, seleção/troca de
empresa, dashboard restrito, navegação segura e logout. Os usuários possuem zero grants.

As superfícies legadas de estrutura, pessoas e folha administrativa possuem telas e CRUDs, mas seus
controllers ainda não adotam em conjunto JWT, empresa ativa e capability canônica. Elas permanecem
bloqueadas no frontend por `platform.manage`; o guard visual evita carregar dados ou oferecer ações,
mas não é apresentado como substituto da proteção de backend. A migração pertence à ETP-015.4.

## Inventário

| Fluxo                               | Classificação              | Rota                              | Endpoint                                    | Dados                                  | Decisão e limite                                        |
| ----------------------------------- | -------------------------- | --------------------------------- | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| Login e recuperação                 | `FULLY FUNCTIONAL`         | `/login`                          | `POST /auth/login`, `GET /auth/me`          | identidades demo                       | `INCLUDE`; sessão real e 401 encerra contexto           |
| Seleção/troca de empresa            | `FULLY FUNCTIONAL`         | `/selecionar-empresa`             | `GET /auth/companies`, `POST /auth/context` | Horizonte/Atlas                        | `INCLUDE`; vínculo validado no backend e cache limpo    |
| Dashboard                           | `READ ONLY FUNCTIONAL`     | `/`                               | `GET /dashboard/summary`                    | agregados persistidos                  | `INCLUDE`; sem grants retorna `RESTRICTED` sem métricas |
| Estrutura organizacional            | `BLOCKED BY AUTHORIZATION` | `/estrutura/*`                    | APIs legadas de estrutura                   | 2 unidades, 8 departamentos, 13 cargos | `DEFER`; requer ETP-015.4                               |
| Colaboradores e contatos            | `BLOCKED BY AUTHORIZATION` | `/colaboradores/*`                | APIs legadas de colaboradores               | 26 colaboradores                       | `DEFER`; nenhum dado é carregado sem `platform.manage`  |
| Contratos                           | `BLOCKED BY AUTHORIZATION` | `/contratos/*`                    | APIs legadas de contratos                   | 26 contratos                           | `DEFER`; isolamento canônico ainda ausente              |
| Admissões                           | `BLOCKED BY AUTHORIZATION` | `/admissoes/*`                    | APIs legadas de admissão                    | 6 admissões                            | `DEFER`; escrita e consulta não entram no roteiro       |
| Conferência de folha                | `BLOCKED BY AUTHORIZATION` | `/folha/conferencia/*`            | APIs canônicas de review                    | 8 ciclos e 8 achados                   | `DEFER`; exige capabilities específicas não atribuídas  |
| Fechamento                          | `BLOCKED BY AUTHORIZATION` | `/folha/competencias/*/historico` | APIs canônicas de fechamento                | competências demo                      | `DEFER`; exige capability específica não atribuída      |
| Jornada, benefícios e movimentações | `PARTIALLY FUNCTIONAL`     | rotas de domínio                  | APIs legadas                                | sem cenário utilizável                 | `REJECT` nesta etapa                                    |
| Auditoria administrativa            | `BACKEND ONLY`             | inexistente                       | inexistente para consulta                   | `AuditLog` persistido                  | `DEFER`; não criar superfície nova                      |
| Papéis e usuários                   | `BACKEND ONLY`             | inexistente                       | grants internos                             | catálogo existente                     | `REJECT`; nenhuma atribuição será criada                |
| Desligamentos                       | `NOT IMPLEMENTED`          | inexistente                       | inexistente                                 | nenhum                                 | `OUT OF MVP SCOPE`                                      |

## Roteiro operacional seguro

1. O Administrador Demo autentica em `/login`.
2. Seleciona Horizonte em `/selecionar-empresa`.
3. Consulta o dashboard, que identifica a empresa e explica o acesso restrito.
4. Acessa uma superfície administrativa e recebe o estado `Acesso restrito`; nenhuma API legada é
   chamada e nenhuma ação é oferecida.
5. Troca para Atlas; o token de contexto é renovado e todo o cache é descartado.
6. Repete dashboard e estado restrito sem resíduos da Horizonte.
7. Encerra a sessão; token e cache locais são removidos e a sessão backend é revogada.
8. O Analista RH autentica e confirma que somente Horizonte está disponível.

## Criação, edição e alteração de status

Não foram incluídas. Executá-las legitimamente exigiria grants explícitos e a migração das APIs
legadas para os guards canônicos. Criar bypass, grant demo, autorização por e-mail ou controle
somente visual violaria o deny-by-default. O reset continua sendo o único mecanismo autorizado para
restaurar o cenário.

## Empresa ativa e erros

A empresa ativa vem do JWT emitido por `POST /auth/context`. A troca limpa o React Query cache antes
de renderizar o novo contexto. A aplicação diferencia sessão ausente/expirada, acesso restrito,
dashboard sem dados, falha de API e rota inexistente. IDs empresariais não são aceitos pelo
dashboard, e detalhes legados não são carregados no recorte demo.

## Operação de apresentação

Com `VITE_DEMO_MODE=true`, o shell identifica claramente o modo demonstrativo e oferece ajuda ao
apresentador. O gate `pnpm demo:verify` ensaia este roteiro por APIs reais, sem bypass nem mutação de
dados. Fora desse modo, badge e ajuda não são renderizados.
