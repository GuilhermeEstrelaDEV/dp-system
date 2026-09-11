# Auditoria completa do produto DP-System

## Escopo e evidências

Auditoria executada em 10/09/2026 sobre `develop@ff656c6`, antes de qualquer alteração funcional da
iniciativa de evolução da plataforma. A classificação combina inspeção estática, contratos Prisma,
inventário de rotas, documentação de segurança, testes automatizados, o
[aceite pós-merge da entrega funcional](../full-delivery/FULL_FUNCTIONAL_POST_MERGE_ACCEPTANCE.md) e
a execução das cinco suítes de smoke. Existência de código, isoladamente, não foi considerada
evidência de funcionamento.

Baseline confirmada:

- 165 handlers: 4 públicos, 5 autenticados e 156 protegidos por capability;
- 0 handlers `LEGACY_DEFERRED` e 0 `UNCLASSIFIED`;
- 48 capabilities e 81 eventos de auditoria, sem grants automáticos;
- 73 modelos Prisma e 16 migrations aditivas;
- 86 suítes/410 testes ativos de API e 22 arquivos/87 testes de frontend na evidência consolidada;
- smokes: Essential 17/17, P1 33/33, P2 56/56, P3 21/21 e P0 Residual 15/15;
- isolamento empresarial, `401`, `403`, `404` entre empresas e auditoria fail-closed aprovados.

O navegador controlável não estava disponível nesta execução. A avaliação visual usa o relato humano
registrado, inspeção de componentes/CSS e testes de frontend; por isso, não declara nova homologação
visual.

## Legenda

- `IMPLEMENTED`: fluxo funcional comprovado no recorte documentado.
- `PARTIAL`: existe fluxo utilizável, mas faltam capacidades relevantes da categoria.
- `MISSING`: não existe implementação funcional.
- `BROKEN`: existe fluxo, mas a evidência demonstra falha funcional.
- `UX IMPROVEMENT NEEDED`: funcional, porém inconsistente ou difícil de operar.
- `BLOCKED BY BUSINESS DECISION`: implementação material depende de decisão pendente.

## Inventário por módulo

| Módulo                       | Backend / banco                                                      | Frontend                                             | Evidência funcional                        | Classificação                              | Principal gap                                               |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------- |
| Autenticação e sessão        | JWT, principal, sessão e revogação                                   | Login, seleção de empresa e logout                   | Essential smoke                            | `IMPLEMENTED`                              | Refresh e hardening permanecem futuros                      |
| Autorização e empresa ativa  | RBAC por capability, deny-by-default, isolamento e grants auditáveis | Rotas e ações condicionadas por capability           | testes negativos e inventário de 165 rotas | `IMPLEMENTED`                              | UI administrativa de grants não existe                      |
| Empresas                     | CRUD, ativação e isolamento                                          | Lista, formulário inline, detalhe e status           | P1 6/6                                     | `UX IMPROVEMENT NEEDED`                    | ação primária genérica e formulário pouco estruturado       |
| Filiais                      | CRUD, ativação e isolamento                                          | `ResourcePage` genérico                              | P2 6/6                                     | `UX IMPROVEMENT NEEDED`                    | feedback, detalhe e confirmação improvisados                |
| Departamentos                | CRUD, ativação e isolamento                                          | `ResourcePage` genérico                              | P2 6/6                                     | `UX IMPROVEMENT NEEDED`                    | hierarquia/filial dependem da BDP-013                       |
| Cargos                       | CRUD, ativação e isolamento                                          | `ResourcePage` genérico                              | P2 6/6                                     | `UX IMPROVEMENT NEEDED`                    | formulários e estados não padronizados                      |
| Centros de custo             | CRUD, ativação e isolamento                                          | `ResourcePage` genérico                              | P2 6/6                                     | `UX IMPROVEMENT NEEDED`                    | filtros e detalhe limitados                                 |
| Colaboradores e contatos     | CRUD, contatos e isolamento                                          | lista, criação, detalhe, edição e status             | P1 12/12                                   | `UX IMPROVEMENT NEEDED`                    | formulário mínimo; histórico consolidado ausente            |
| Contratos                    | CRUD, histórico e status                                             | lista, criação e detalhe                             | P1 7/7                                     | `UX IMPROVEMENT NEEDED`                    | edição/status pouco descobríveis; salário bloqueado         |
| Admissões                    | processo, checklist, documentos lógicos e histórico                  | lista, criar/editar, detalhe, checklist e requisitos | P2 19/19                                   | `PARTIAL`                                  | upload/assinatura e onboarding amplo não existem            |
| Desligamentos                | não modelado                                                         | apenas item “Em breve”                               | nenhuma suíte funcional                    | `MISSING` / `BLOCKED BY BUSINESS DECISION` | regras de rescisão e checklist precisam de escopo aprovado  |
| Documentos                   | requisitos lógicos admissionais apenas                               | sem central                                          | não há storage aprovado                    | `MISSING` / `BLOCKED BY BUSINESS DECISION` | BDP-011, storage, retenção e acesso                         |
| Jornada e ponto              | jornadas, feriados, ocorrências, saldo e fechamento                  | painel funcional                                     | P3 Time 8/8                                | `PARTIAL` / `BLOCKED BY BUSINESS DECISION` | escalas completas, aprovações e regras dependem da BDP-007  |
| Benefícios                   | catálogo, planos, adesões e histórico                                | painéis de consulta e operação                       | P3 Benefit 6/6                             | `PARTIAL` / `BLOCKED BY BUSINESS DECISION` | elegibilidade, custos e políticas dependem da BDP-008       |
| Férias                       | períodos, solicitações, aprovação, cancelamento e coletivas          | painel funcional                                     | P3 Vacation 7/7                            | `PARTIAL` / `BLOCKED BY BUSINESS DECISION` | calendário, saldo legal e alertas completos não homologados |
| Afastamentos                 | tipos, casos e retorno                                               | painel em Movimentações                              | P2 Leave 5/5                               | `PARTIAL`                                  | documentos e regras legais permanecem fora do recorte       |
| Remuneração variável         | eventos, adiantamentos, pagamentos externos e conciliação            | quatro painéis operacionais                          | P2 8/8                                     | `PARTIAL` / `BLOCKED BY BUSINESS DECISION` | fórmulas e elegibilidade dependem da BDP-006                |
| Parâmetros de folha          | CRUD versionado e auditado                                           | lista, detalhe, criação e edição                     | P1 4/4                                     | `UX IMPROVEMENT NEEDED`                    | formulário técnico e feedback disperso                      |
| Rubricas                     | CRUD versionado e auditado                                           | lista, detalhe, criação e edição                     | P1 4/4                                     | `UX IMPROVEMENT NEEDED`                    | cadastro técnico; nenhuma regra legal será inferida         |
| Lançamentos de folha         | CRUD controlado e isolamento                                         | formulário, lista e inativação                       | P0 4/4                                     | `UX IMPROVEMENT NEEDED`                    | exige IDs manuais em vez de seletores contextualizados      |
| Processamento de folha       | execução e mensagens                                                 | iniciar, listar e consultar                          | P0 5/5                                     | `PARTIAL`                                  | motor é fundação; cálculo legal não homologado              |
| Conferência de folha         | workflow completo, achados e timeline append-only                    | jornada funcional completa                           | Essential + testes de ETP-013              | `IMPLEMENTED`                              | retenção e integrações futuras                              |
| Fechamento de competência    | readiness, fechamento, replay, histórico e reabertura                | jornada funcional e histórico                        | Essential 17/17                            | `IMPLEMENTED`                              | integração externa e fechamento legal fora do escopo        |
| Dashboard                    | agregados autorizados de review/competência                          | cards, distribuições e atividade                     | Essential smoke                            | `PARTIAL`                                  | não cobre headcount, admissões, férias e benefícios         |
| Relatórios                   | sem central de consultas                                             | item “Em breve”                                      | nenhuma evidência funcional                | `MISSING`                                  | relatórios básicos seguros são oportunidade P1              |
| Busca e filtros              | contratos variam por módulo                                          | busca/filtro/paginação inconsistentes                | inspeção das telas                         | `PARTIAL`                                  | falta padrão compartilhado e filtros contextuais            |
| Portal do colaborador        | não existe self-scope canônico                                       | ausente                                              | nenhuma evidência                          | `MISSING`                                  | requer identidade usuário-colaborador e projeções aprovadas |
| Portal do gestor             | não existe relação canônica gestor-equipe                            | ausente                                              | nenhuma evidência                          | `MISSING`                                  | requer hierarquia explícita e escopo de subordinados        |
| Recrutamento                 | não modelado                                                         | ausente                                              | nenhuma evidência                          | `MISSING`                                  | iniciativa futura segura após especificação                 |
| Desempenho, metas, PDI e 1:1 | não modelado                                                         | ausente                                              | nenhuma evidência                          | `MISSING`                                  | iniciativa futura de RH estratégico                         |
| Pesquisas/eNPS               | não modelado                                                         | ausente                                              | nenhuma evidência                          | `MISSING`                                  | privacidade e anonimato precisam de decisão                 |
| Treinamentos                 | não modelado                                                         | ausente                                              | nenhuma evidência                          | `MISSING`                                  | futura fundação de aprendizagem                             |
| Comunicação e notificações   | não existe infraestrutura transversal                                | ausente                                              | nenhuma evidência                          | `MISSING`                                  | canais externos não autorizados                             |

## Auditoria transversal de UX

| Área                | Estado atual                                       | Diagnóstico                                                         |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Cabeçalhos          | `PageHeader` compartilhado existe                  | ações primárias frequentemente ficam fora do cabeçalho              |
| Tabelas             | `DataTable`, ações e status compartilhados existem | padrão visual é bom; algumas telas ainda usam controles soltos      |
| Formulários         | React Hook Form/Zod em parte das telas             | agrupamento, descrição, obrigatoriedade e rodapé são inconsistentes |
| Busca e filtros     | presentes em módulos principais                    | labels, contador, limpeza e paginação não seguem um padrão único    |
| Loading             | textos, skeletons e estados específicos            | precisa convergir em componente compartilhado                       |
| Erros               | `role=alert` e erro global existem                 | mensagens/ação de tentar novamente variam muito                     |
| Estados vazios      | `EmptyState` existe                                | várias telas ainda exibem apenas um parágrafo sem ação contextual   |
| Confirmações        | existem em alguns fluxos                           | modal genérico não é compartilhado e foco/ESC variam                |
| Feedback de sucesso | atualização de query confirma indiretamente        | falta notificação/estado explícito e consistente                    |
| Responsividade      | shell e tabela possuem overflow                    | formulários densos e toolbars precisam de revisão por breakpoint    |
| Acessibilidade      | foco visível e semântica básica presentes          | sanity completo precisa continuar como evidência humana             |

## Conclusão

O DP-System possui uma base de DP e folha tecnicamente ampla, segura e testada. A prioridade correta
é completar e uniformizar a experiência dos CRUDs existentes antes de introduzir novos domínios. Os
maiores gaps competitivos são documentos, relatórios, histórico consolidado, autoatendimento,
recrutamento e desenvolvimento; vários deles exigem decisões de privacidade, hierarquia ou regras
trabalhistas e não podem ser tratados como simples CRUD.
