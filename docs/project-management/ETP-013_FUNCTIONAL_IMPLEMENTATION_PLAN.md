# Plano técnico executável — ETP-013 funcional

## Estado

**Em execução incremental.** BDP-009 v1 foi resolvida. Login JWT, contexto empresarial, RBAC por empresa e primitives opt-in de autorização foram implementados; o workflow funcional ainda não foi iniciado. Este plano não autoriza atalho de segurança nem mudança funcional fora das fases descritas.

## Princípios de execução

- deny-by-default e backend como autoridade;
- operações empresariais nunca dependem apenas de capacidade global;
- nenhuma regra referencia nomes fixos de papel;
- estado, evento e auditoria são atômicos;
- reabertura invalida, mas não apaga, aprovações;
- rollout de proteção é incremental para não expor ou quebrar rotas silenciosamente;
- migrations e commits são pequenos, revisáveis e cobertos por testes.

## Fase 1 — Identidade funcional

**Estado:** concluída no recorte de token de acesso. Refresh, logout e revogação permanecem para um incremento de sessão dedicado; nenhum endpoint parcial foi exposto.

### Entregas

- login, refresh, logout e revogação;
- strategy JWT e principal mínimo (`actorId`, sessão, token);
- bloqueio de usuário inativo/bloqueado;
- rotas públicas explicitamente marcadas.

### Testes

- token ausente, inválido, expirado e revogado;
- rotação/reuso de refresh token;
- usuário inativo/bloqueado;
- nenhuma credencial em logs.

## Fase 2 — RBAC empresarial

**Estado:** concluída para assignments ativos/vigentes, resolução híbrida de capabilities e troca validada de empresa. Seeds de matriz e administração de assignments permanecem deliberadamente fora deste incremento.

### Migration candidata 0010

- assignment usuário–empresa–papel com status e timestamps;
- vigência/revogação, se necessária ao contrato final;
- relações restritivas e índices por usuário/empresa/status;
- revisão de `UserRole` global para funções de plataforma;
- catálogo configurável de papéis/capacidades e seeds v1 auditáveis.

### Backend

- resolvedor de empresa ativa;
- contexto imutável com ator, empresa, capacidades e trace;
- validação de assignment ativo;
- capabilities globais allowlisted e operacionais empresariais.

### Testes

- usuário multiempresa e troca de contexto;
- assignment ausente/inativo/revogado;
- operação de folha negada quando há somente papel global;
- spoofing de empresa/permissão rejeitado.

## Fase 3 — Autorização e auditoria transversais

**Estado:** parcial. Guard, decorator, policy de aplicação, `404` empresarial e writer mínimo existem. IP/user-agent, atomicidade transacional, substituição, emergência e migração progressiva das rotas permanecem pendentes.

### Migration candidata 0011

- `companyId`, IP e user-agent em estrutura auditável adequada;
- índices por empresa, ator, entidade e tempo;
- modelo de substituição temporária;
- modelo de acesso emergencial com escopo e expiração.

### Backend

- guards/decorators opt-in e policy port;
- `AuditWriter` transacional com metadata allowlisted;
- filtro empresarial que devolve `404` externamente;
- expiração/revogação de substituição e emergência;
- inventário e migração progressiva das rotas antes do guard global.

### Testes

- deny-by-default e matriz negativa por rota;
- consulta cruzada retorna `404` e gera auditoria interna;
- atomicidade entre ação e auditoria;
- expiração/revogação e ausência de bypass silencioso;
- IP/user-agent/trace propagados sem dados sensíveis.

## Fase 4 — Persistência neutra da conferência

### Migration candidata 0012

- ciclo de conferência e versão do workflow;
- etapas configuráveis com ordem, capacidade requerida e papel configurado;
- achados e eventos append-only;
- decisões por etapa e invalidação explícita;
- participantes/atores preservados;
- idempotência e unicidade do ciclo ativo;
- FKs `RESTRICT`, timestamps com timezone e índices empresariais.

### Backend

- repositórios/ports sem HTTP no domínio;
- abertura e consulta de ciclo;
- criação, resolução e reabertura de achados;
- validação final distinta para achado `BLOCKING` resolvido pelo autor;
- nenhuma submissão/decisão antes das policies da fase 5.

### Testes

- isolamento por empresa, append-only, concorrência e idempotência;
- vínculo consistente entre execução, contrato, item e empresa;
- ausência de deleção física;
- compatibilidade com a fundação neutra existente.

## Fase 5 — Workflow decisório v1

### Backend

- máquina de estados `PREPARATION`, `REVIEW`, `SUBMITTED`, `APPROVED`, `CLOSED`, `REOPENED`;
- duas etapas sequenciais configuradas por dados;
- submissão, conferência, aprovação, rejeição, fechamento e reabertura;
- preparador impedido de aprovar;
- aprovador impedido de alterar lançamentos da execução aprovada;
- reabertura justificada invalida aprovações e exige nova submissão/aprovação;
- arquitetura de etapas sem limite estrutural fixo em dois níveis.

### Testes

- todas as transições válidas/inválidas;
- segregação, capabilities, papel empresarial e substituição;
- rejeição, reabertura e invalidação;
- concorrência de decisões e idempotência;
- ausência de alçada financeira v1;
- policies futuras não alteram histórico anterior.

## Fase 6 — Frontend

- sessão e seleção de empresa entre assignments ativos;
- limpeza de caches ao trocar empresa;
- página `/folha/conferencia` com fila, detalhe, achados e timeline;
- ações baseadas em capabilities devolvidas pela API;
- estados `401`, `403`, `404` e `409` acessíveis;
- mascaramento/projeção sensível fornecidos pelo backend;
- substituição/emergência destacadas, temporárias e nunca silenciosas.

Testes cobrem contexto empresarial, troca de empresa, ações permitidas/negadas, justificativas, timeline, reabertura e ausência de vazamento entre caches.

## Fase 7 — Fechamento e endurecimento

- integrar `CLOSED` ao fechamento de competência sem duplicar domínio;
- ativar deny-by-default global somente após inventário completo;
- testes E2E multiempresa e de segurança;
- métricas/alertas de emergência e tentativas fora do escopo;
- documentação OpenAPI, operação e recuperação;
- homologação com amostras sem dados pessoais reais.

## Ordem de commits sugerida

1. `feat(db): add company-scoped role assignments`;
2. `feat(auth): implement functional sessions`;
3. `feat(authz): add company actor context`;
4. `feat(audit): add transactional audit writer`;
5. `feat(db): add payroll review workflow schema`;
6. `feat(api): persist payroll review findings`;
7. `feat(api): implement payroll review workflow`;
8. `feat(web): add payroll review experience`;
9. `test: cover payroll review authorization`;
10. `docs: document functional payroll review`.

## Gate para iniciar

Antes do primeiro commit funcional, revisar e aprovar os schemas candidatos, estratégia de migração de `UserRole`, contrato de empresa ativa, seeds papel–capacidade, inventário de rotas públicas e critérios de retenção vinculados à BDP-011. Qualquer lacuna de segurança falha fechada e bloqueia a fase correspondente.

## Definição de concluído futura

A ETP-013 só poderá ser marcada concluída após todas as fases aplicáveis, validações globais, cobertura, testes negativos multiempresa, auditoria atômica, homologação dos atores v1 e documentação operacional. A resolução da BDP-009 isoladamente não conclui a etapa.
