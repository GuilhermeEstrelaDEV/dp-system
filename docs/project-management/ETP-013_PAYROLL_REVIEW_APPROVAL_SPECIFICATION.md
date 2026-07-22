# ETP-013 — Especificação de conferência e aprovação de folha

**Status:** especificação e BDP-009 v1 aprovadas; fundação técnica neutra existente, implementação funcional não iniciada.

## 1. Motivação e evidências

A ETP-013 não possuía escopo individual atribuído. Esta especificação propõe o próximo incremento da Etapa 5 exclusivamente a partir dos artefatos existentes:

- o roadmap ainda prevê conferência e aprovação após rubricas, lançamentos e cálculos;
- o UC-08 atribui ao DP calcular e conferir, ao Financeiro conferir pagamentos e ao Diretor aprovar o fechamento conforme alçada;
- o fluxo de folha exige correção de divergências, submissão à conferência e nova aprovação após reabertura;
- a matriz de permissões separa preparação, conferência financeira e aprovação do fechamento;
- o domínio determina que quem calcula não pode ser o único aprovador;
- a ETP-011 já produz resultados e mensagens reproduzíveis;
- a ETP-012 registra conciliações administrativas e foi mergeada em `develop` pelo PR #26 após a publicação inicial desta especificação.

## 2. Objetivo proposto

Fornecer um workflow auditável de conferência de uma execução de folha, tratamento de pendências e decisão de aprovação antes do fechamento, sem alterar o cálculo e sem presumir regras legais ou alçadas ainda não homologadas.

O resultado esperado é distinguir claramente:

1. execução calculada;
2. conferência operacional pelo DP;
3. conferência operacional por assignment empresarial autorizado;
4. aprovação final pelo assignment empresarial autorizado;
5. retorno para ajustes quando houver pendência.

## 3. Dependências

### Funcionais

- ETP-010: competências, execuções, mensagens e fechamento;
- ETP-011: resultados por contrato e memória de cálculo;
- ETP-012: conciliações administrativas, dependência técnica já integrada em `develop`;
- BDP-009: definição de atores, alçadas e segregação de funções;
- autenticação, autorização e identidade funcional para atribuir decisões a usuários reais.

### Técnicas

- `PayrollPeriod`, `PayrollRun`, `PayrollRunEmployee`, `PayrollRunMessage` e `PayrollPeriodClosure`;
- contratos HTTP e envelopes definidos em `API_TECHNICAL_CONVENTIONS.md`;
- trilha append-only e FKs restritivas adotadas nos módulos de folha;
- frontend React/TanStack Query já existente em `/folha`.

## 4. Escopo proposto

### Dentro do escopo

- abrir uma conferência para uma execução `COMPLETED`;
- registrar checklist/snapshot de critérios técnicos configurados, sem conteúdo legal embutido;
- registrar achados de conferência vinculados à execução e, opcionalmente, ao contrato ou item calculado;
- classificar achados como informativos ou bloqueantes;
- resolver ou reabrir achados com justificativa e histórico;
- submeter a execução para conferência financeira;
- registrar decisões de devolução ou aprovação por etapa;
- impedir fechamento enquanto houver achado bloqueante ou etapa obrigatória pendente;
- preservar snapshots, decisões, justificativas, timestamps e responsáveis;
- listar histórico e estado atual por competência/execução;
- registrar reabertura da competência como invalidação explícita da aprovação anterior, sem apagar histórico.

### Fora do escopo

- cálculo ou recálculo de folha;
- INSS, FGTS, IRRF, encargos, faixas, alíquotas ou incidências legais;
- definição de valores, tolerâncias ou critérios normativos de divergência;
- aprovação automática ou inferência de alçada;
- permitir que o mesmo ator prepare e seja o único aprovador;
- pagamento, dados bancários, remessa, PIX ou integração financeira;
- eSocial, guias, contabilidade ou assinatura eletrônica;
- notificações externas;
- migração de fórmulas ou resultados brutos da planilha.

## 5. Regras e invariantes propostas

Estas regras derivam da documentação atual, mas os nomes finais dos estados dependem de aprovação do desenho:

- somente execução concluída pode entrar em conferência;
- uma execução possui no máximo um ciclo de conferência ativo;
- decisões e achados são append-only; correções geram novos eventos;
- achado bloqueante aberto impede aprovação final e fechamento;
- fechamento exige todas as etapas configuradas como concluídas;
- reabertura de competência invalida a aprovação vigente e exige novo ciclo ou nova decisão;
- o autor do cálculo não pode ser o único aprovador;
- toda devolução, rejeição, reabertura ou resolução exige justificativa;
- snapshots de cálculo, parâmetros e checklist não podem ser alterados retroativamente.

## 6. Decisões de negócio v1

BDP-009 foi resolvida para a versão 1: RBAC por empresa, modelo híbrido de capacidades, workflow sequencial em duas etapas, preparador impedido de aprovar, validação distinta de achado bloqueante, ausência de alçada financeira, substituição temporária, acesso emergencial auditado, `404` fora do escopo e visibilidade por capacidade. Consulte [Resolução da BDP-009](BDP-009_RESOLUTION_V1.md).

Prazos, notificações, escalonamento, tolerâncias de conciliação, alçadas financeiras, níveis adicionais e delegação permanecem fora da versão 1. Nenhum padrão deve ser criado sem nova decisão homologada.

## 7. Possíveis alterações no banco

Não há migration nesta especificação. As migrations candidatas devem seguir o [plano técnico](ETP-013_FUNCTIONAL_IMPLEMENTATION_PLAN.md) após revisão arquitetural, com entidades candidatas:

- `PayrollReviewCycle`: execução, status, versão do checklist, abertura e conclusão;
- `PayrollReviewFinding`: ciclo, referência opcional ao contrato/item, severidade, descrição e estado;
- `PayrollReviewFindingEvent`: histórico append-only de abertura, resolução e reabertura;
- `PayrollApprovalDecision`: ciclo, etapa, decisão, responsável, justificativa e timestamp.

Requisitos de persistência:

- UUID, timestamps com timezone, FKs `RESTRICT` e índices por execução/status;
- nenhuma exclusão em cascata;
- unicidade de ciclo ativo por execução;
- identidade do responsável referenciada a `User` quando autenticação funcional estiver disponível;
- snapshots em JSON somente para critérios técnicos versionados, nunca para ocultar regras legais não modeladas.

Os nomes, campos e estados acima são candidatos de desenho, não contrato aprovado de banco.

## 8. APIs propostas

Sob `/api/v1/payroll-reviews`, após aprovação do contrato:

- `POST /` — abrir ciclo para uma execução;
- `GET /` — listar por competência, execução e status;
- `GET /:id` — obter ciclo, achados, etapas e histórico;
- `POST /:id/findings` — registrar achado;
- `POST /:id/findings/:findingId/resolve` — resolver com justificativa;
- `POST /:id/findings/:findingId/reopen` — reabrir com justificativa;
- `POST /:id/submit` — submeter à próxima etapa configurada;
- `POST /:id/decisions` — devolver, rejeitar ou aprovar na etapa autorizada.

Todas as escritas críticas devem ser transacionais, idempotentes quando repetição for possível e autorizadas no backend. Controllers não podem decidir alçadas nem executar cálculo.

## 9. Telas propostas

Em `/folha/conferencia`:

- lista filtrável por empresa, competência, execução e estado;
- resumo da execução e versões preservadas;
- totais por contrato sem ampliar acesso a dados sensíveis;
- achados informativos/bloqueantes e histórico;
- checklist técnico versionado;
- linha do tempo de submissões e decisões;
- ações disponíveis conforme permissão retornada pela API;
- estados de carregamento, vazio, erro e conflito;
- aviso permanente de que regras legais e alçadas dependem de configuração homologada.

## 10. Permissões

Mapeamento v1 baseado na resolução da BDP-009. Os códigos são configuráveis no banco e não entram nas regras de domínio:

| Ação                      | Papel candidato v1                        | Capacidade candidata                                | Restrição                                    |
| ------------------------- | ----------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| Preparar/registrar achado | `PAYROLL_ANALYST` ou `PAYROLL_SUPERVISOR` | `payroll.edit`                                      | empresa ativa e assignment vigente           |
| Conferência operacional   | `PAYROLL_ANALYST` ou `PAYROLL_SUPERVISOR` | `payroll.review`                                    | ator distinto quando exigido pela segregação |
| Submeter                  | assignment configurado                    | `payroll.submit`                                    | preparador preservado no histórico           |
| Aprovação final           | `HR_MANAGER`                              | `payroll.approve`                                   | não pode ser o preparador                    |
| Rejeitar/reabrir/fechar   | assignment configurado                    | `payroll.reject`, `payroll.reopen`, `payroll.close` | justificativa, policy e auditoria            |
| Consultar auditoria       | `AUDITOR` ou assignment configurado       | `payroll.audit`                                     | visibilidade condicionada por capacidade     |

O frontend não é fonte de autorização. A API deve aplicar empresa, papel, alçada e segregação.

## 11. Estratégia de testes

### Domínio/unitários

- transições válidas e inválidas do ciclo;
- achado bloqueante impede aprovação;
- resolução/reabertura preserva histórico;
- segregação impede aprovação exclusiva pelo preparador;
- reabertura da competência invalida aprovação vigente.

### Aplicação/integração

- transações e concorrência ao abrir/submeter/decidir;
- idempotência das ações críticas;
- isolamento por empresa e autorização;
- integridade de FKs e imutabilidade histórica;
- fechamento rejeitado quando a conferência não estiver apta.

### Frontend

- loading, erro, vazio e conflito;
- filtros, detalhe, achados e timeline;
- ações condicionadas às capacidades retornadas pela API;
- justificativa obrigatória;
- acessibilidade de formulários, mensagens e navegação.

### Regressão

- `pnpm check`, cobertura, build, Prisma generate/validate e testes existentes de folha;
- nenhuma mudança no resultado determinístico da ETP-011;
- nenhuma geração automática a partir da ETP-012.

## 12. Critérios para autorizar implementação

A integração da ETP-012 e a resolução v1 da BDP-009 foram atendidas. A ETP-013 somente deve avançar para código funcional conforme o plano técnico e quando as condições restantes forem atendidas:

1. identidade/autorização funcional e RBAC empresarial estiverem implementados;
2. modelo de banco e contrato de API tiverem revisão arquitetural;
3. critérios de retenção/auditoria aplicáveis estiverem validados;
4. critérios de aceite e amostras de conferência tiverem validação dos responsáveis.

## 13. Entregáveis futuros previstos

Quando autorizada, a implementação deve ser dividida em commits de banco, domínio/API, interface, testes e documentação. Esta especificação não cria código funcional, schema Prisma ou migration.

## 14. Fundação técnica neutra

O recorte preparatório implementa somente contratos imutáveis de achados e eventos append-only, com vínculo empresarial, justificativa, cronologia e unicidade técnicas. Não há ciclo persistente, identidade de ator, autorização, API, tela, fechamento ou decisão de aprovação. Consulte [Fundação técnica de conferência](../modules/PAYROLL_REVIEW_FOUNDATION.md).

Esse recorte não satisfaz as condições da seção 12 e não altera BDP-006 ou BDP-009.

## 15. Identidade, autorização e auditoria

A arquitetura para principal autenticado, empresa ativa, deny-by-default, capacidades, segregação configurável e `AuditLog` está documentada em [Especificação técnica de identidade, autorização e auditoria](../architecture/IDENTITY_AUTHORIZATION_SPECIFICATION.md). A primeira fundação funcional de identidade e RBAC empresarial está implementada e descrita em [Identidade autenticada e RBAC empresarial](../modules/IDENTITY_COMPANY_RBAC.md). BDP-009 está homologada para a versão 1; o workflow, a auditoria completa e as demais fases continuam pendentes.
