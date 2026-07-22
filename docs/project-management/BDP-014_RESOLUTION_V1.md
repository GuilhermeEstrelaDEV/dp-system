# BDP-014 — Resolução para fechamento de competência

**Status:** `APPROVED — VERSION 1`

**Data de homologação:** 22/07/2026

**Escopo:** contrato operacional da ETP-014 v1

## 1. Contexto

A ETP-013 concluiu o workflow de conferência até `CLOSED`, com decisões, invalidações, rodadas, identidade, isolamento empresarial, RBAC e auditoria. A fundação de folha já possui `PayrollPeriod`, `PayrollRun` e `PayrollPeriodClosure`, porém dois serviços legados fecham e reabrem a mesma competência por contratos e pré-condições diferentes.

A [proposta da BDP-014](BDP-014_RESOLUTION_PROPOSAL.md) inventariou alternativas e impactos. Esta resolução homologa a versão 1 e passa a ser a fonte vinculante para a ETP-014. Ela não implementa nem autoriza mudança funcional fora das fases do [plano de implementação](ETP-014_IMPLEMENTATION_PLAN.md).

## 2. Decisão final

### 2.1 Contrato canônico

`PayrollPeriod` é o agregado canônico do fechamento operacional. Novas funcionalidades devem usar um único caso de uso de aplicação sob a competência.

Contratos canônicos aprovados para implementação futura:

- `GET /payroll-periods/:id/closure-readiness`;
- `POST /payroll-periods/:id/close`;
- `POST /payroll-periods/:id/reopen`;
- `GET /payroll-periods/:id/closure-history`.

`PayrollPeriodsService` e `PayrollClosuresService` não poderão manter regras independentes. As escritas sob `/payroll-closures` serão compatibilidade temporária e deverão delegar ao mesmo caso de uso. Nenhuma rota será removida antes do inventário de consumidores, telemetria, plano de migração, comunicação e janela de descontinuação. A remoção será débito técnico separado.

### 2.2 Execução elegível

O fechamento recebe `payrollRunId` explicitamente. A execução somente é elegível quando:

- pertence à empresa ativa e à competência informada;
- está `COMPLETED`;
- possui a maior sequência válida da competência;
- não está cancelada nem invalidada;
- possui ciclo de conferência elegível.

Execução mais antiga não fundamenta fechamento se existir execução posterior válida. Se mais de uma execução parecer canônica, o comando é rejeitado até haver exatamente uma elegível. Ausência, cancelamento, invalidação ou estado diferente de `COMPLETED` bloqueiam o fechamento.

### 2.3 Vínculo obrigatório com a ETP-013

O ciclo deve pertencer à mesma empresa, competência e execução, estar `CLOSED`, representar a rodada vigente, não ter reabertura posterior e possuir todas as decisões exigidas válidas ou devidamente substituídas após invalidação.

Não são elegíveis ciclos antigos, reabertos, rejeitados, somente `APPROVED` ou vinculados a outra execução. A evidência referencia `reviewCycleId`, `reviewRound`, execução, decisões válidas e o evento `REVIEW_CLOSED` correspondente.

### 2.4 Blockers e warnings da v1

São blockers obrigatórios:

- competência já `CLOSED`, exceto replay idempotente do mesmo comando;
- fechamento ou reabertura incompatível em andamento;
- execução inexistente, não `COMPLETED`, não canônica, cancelada ou invalidada;
- ciclo inexistente, de outra execução, diferente da empresa/competência ou não `CLOSED`;
- rodada desatualizada, reabertura posterior ou decisões inválidas não substituídas;
- achado `BLOCKING` aberto;
- cálculo ou totais obrigatórios indisponíveis;
- `BLOCKING_ERROR` aberto na execução selecionada;
- operação concorrente incompatível.

São warnings na v1:

- remuneração variável pendente;
- integração externa ainda não realizada;
- alerta operacional não crítico;
- informação auxiliar incompleta sem impacto direto nos totais.

Warnings são apresentados e registrados, mas não viram blockers silenciosamente. Regras legais, tolerâncias, integrações e dados obrigatórios ainda não homologados permanecem fora da v1.

### 2.5 Reabertura

Reabrir competência e reabrir review são operações diferentes. A reabertura da competência:

- ocorre somente de `CLOSED` para `OPEN`;
- exige justificativa não vazia e capability própria;
- cria nova versão operacional;
- preserva o manifesto e todo o histórico anterior;
- acrescenta invalidação de uso futuro da evidência anterior, sem alterá-la ou excluí-la;
- libera somente as operações homologadas;
- exige nova execução, novo ciclo, nova submissão, novas aprovações, novo fechamento do review e novo fechamento da competência.

O review anterior não é reaberto automaticamente. Integração externa irreversível permanece fora da v1 e, quando existir, deverá bloquear a reabertura ou aplicar política previamente aprovada.

### 2.6 Idempotência e concorrência

Fechamento e reabertura exigem `Idempotency-Key`. A versão 1 terá:

- unicidade por empresa, competência, operação e chave;
- replay consistente para mesma chave e mesmo payload;
- `409` para mesma chave com payload diferente;
- lock transacional no agregado;
- versão otimista;
- constraint de unicidade no banco;
- revalidação de readiness dentro da transação;
- estado, manifesto, evento e `AuditLog` na mesma transação;
- rollback integral em qualquer falha;
- `409` para estado ou concorrência conflitante;
- `422` para readiness não atendida, salvo padrão equivalente formalmente consolidado antes da API.

Qualquer `SELECT FOR UPDATE` ou advisory lock ficará encapsulado no adaptador de persistência e terá teste real em PostgreSQL.

### 2.7 Capabilities

Capabilities aprovadas:

- `payroll.period.close.view`;
- `payroll.period.close.readiness`;
- `payroll.period.close.execute`;
- `payroll.period.close.reopen`;
- `payroll.period.close.history`.

Todas são empresariais, deny-by-default, verificadas no guard e novamente no serviço. Não haverá associação automática a papéis nem regra por nome de papel. O frontend usa as capabilities somente para visibilidade; o backend permanece autoridade. A matriz de concessões deve suportar segregação entre execução e reabertura.

### 2.8 Imutabilidade após fechamento

Enquanto a competência estiver `CLOSED`, ficam bloqueados:

- nova execução ou recálculo;
- alteração de lançamentos, remuneração variável ou eventos financeiros que afetem a competência;
- exclusão ou substituição da execução canônica;
- reabertura/alteração do review vinculado;
- alteração de manifesto/evidência;
- operação retroativa que mude totais fechados.

Permanecem permitidos, conforme autorização:

- consulta, histórico e auditoria;
- visualizações ou documentos sem mutação;
- exportações formalmente previstas que não alterem o agregado.

Novo cálculo, execução, lançamento, conferência e fechamento exigem primeiro a reabertura. Dados mestres retroativos são versionados e nunca alteram silenciosamente o snapshot fechado.

### 2.9 Manifesto e evidência

Cada fechamento gera manifesto append-only e versionado com, no mínimo:

- `companyId`, `payrollPeriodId` e versão operacional;
- `payrollRunId`, sequência, versões técnicas e estado;
- `reviewCycleId`, `reviewRound`, decisões válidas e evento de fechamento do review;
- achados relevantes e prova de ausência de blocker aberto;
- totais consolidados e resumo mínimo por colaborador ou referência segura;
- estados anterior/posterior;
- ator, data do banco, `traceId`, `sessionId`, IP e user-agent;
- justificativa ou reconhecimento aplicável;
- eventos relacionados;
- hash e versão do algoritmo de hash.

Referências e snapshots mínimos prevalecem sobre duplicação de dados pessoais. A BDP-011 continua responsável pelo prazo, arquivamento, descarte e exportação; até sua resolução, nenhuma eliminação automática é autorizada.

### 2.10 Remuneração variável pendente

Na v1, remuneração variável pendente é warning. O fechamento somente prossegue se o warning for exibido, reconhecido explicitamente e registrado no manifesto e na auditoria, sem blocker técnico associado.

Nenhum item será excluído, movido para competência futura ou submetido a alçada financeira automaticamente. Alçadas e tratamento automatizado permanecem fora do escopo e dependem de decisão própria, incluindo a BDP-006.

## 3. Justificativas

- competência é a unidade cujo estado operacional muda e, portanto, a raiz correta do contrato;
- seleção explícita mais maior sequência elimina ambiguidade e evidência obsoleta;
- review `CLOSED` representa o ciclo decisório encerrado, não apenas aprovado;
- reabertura independente preserva o significado histórico do review anterior;
- chave idempotente, lock e versão cobrem falhas de cliente e concorrência de servidor;
- capabilities específicas evitam misturar fechamento operacional e aprovação de review;
- manifesto versionado permite reconstrução sem tornar o `AuditLog` a única fonte de domínio;
- warning reconhecido preserva a BDP-006 sem criar alçada financeira implícita.

## 4. Alternativas rejeitadas na v1

- manter os dois serviços com regras próprias;
- usar `/payroll-closures` como fonte primária para novas funcionalidades;
- escolher automaticamente apenas a última execução sem `payrollRunId`;
- criar flag de execução “oficial” antes de necessidade comprovada;
- aceitar ciclo `APPROVED` sem `CLOSED`;
- reabrir automaticamente o review ao reabrir a competência;
- reutilizar execução/review anteriores para novo fechamento;
- depender somente do estado atual ou somente do isolation level para idempotência;
- reutilizar capabilities `payroll.review.*`;
- bloquear remuneração variável por valor ou exigir alçada financeira;
- persistir `READY` desde o início sem necessidade técnica;
- duplicar integralmente dados pessoais no manifesto.

## 5. Estados vinculantes e candidatos

- `OPEN` e `CLOSED` são estados de negócio persistidos necessários;
- `CLOSING` e `REOPENING` são estados candidatos para coordenação/observabilidade e só serão persistidos se a Fase 3 demonstrar necessidade compatível com transação e recuperação;
- `READY` é derivado dinamicamente do readiness e não será persistido por padrão;
- nenhum estado adicional será criado sem decisão formal.

O contrato canônico detalha estados, comandos, queries e eventos em [PAYROLL_PERIOD_CLOSURE_CANONICAL_CONTRACT.md](../architecture/PAYROLL_PERIOD_CLOSURE_CANONICAL_CONTRACT.md).

## 6. Impactos

- **Backend:** novo orquestrador canônico e delegação progressiva do legado;
- **Banco:** evolução aditiva para versão, idempotência, manifesto, referências e constraints, somente na Fase 3;
- **API:** readiness, close, reopen e history sob a competência;
- **Frontend:** migração futura dos dois clientes atuais para o contrato canônico;
- **RBAC:** cadastro futuro das cinco capabilities, sem assignments automáticos;
- **Auditoria:** manifesto/evento e `AuditLog` atômicos;
- **Testes:** domínio, integração PostgreSQL, API, frontend, E2E e compatibilidade.

## 7. Riscos aceitos

- duas superfícies permanecem durante a transição;
- consumidores externos não identificados podem depender do legado;
- execução posterior válida torna a anterior inelegível;
- lock específico poderá exigir SQL parametrizado no adaptador Prisma;
- manifesto aumenta volume e sensibilidade dos dados;
- warnings dependem de reconhecimento humano;
- retenção temporal permanece indefinida até a BDP-011;
- integrações irreversíveis impedem política completa de reabertura na v1.

## 8. Restrições vinculantes

- nenhuma regra duplicada entre contratos canônico e legado;
- nenhuma empresa aceita do payload como autoridade;
- nenhuma capability concedida automaticamente;
- nenhum evento, manifesto ou evidência histórica atualizado ou removido;
- nenhuma regra legal, tolerância ou alçada implícita;
- nenhum fechamento sem evidência da ETP-013 vigente;
- nenhuma reabertura automática do review;
- nenhum descarte automático antes da BDP-011.

## 9. Critérios de aceite da implementação futura

- readiness determinística com blockers e warnings codificados;
- execução e review inequivocamente vinculados e empresariais;
- um único orquestrador aplicado por todas as escritas;
- replay idempotente e concorrência comprovados em PostgreSQL;
- estado, manifesto, evento e auditoria com commit/rollback conjunto;
- competência fechada imutável conforme matriz homologada;
- reabertura cria nova versão e exige novo ciclo completo;
- capabilities deny-by-default e sem nomes fixos de papéis;
- legado preservado até cumprimento dos critérios de descontinuação;
- documentação, inventário de rotas e testes atualizados em cada fase.

## 10. Dependências e débitos futuros

- BDP-006: regras materiais de remuneração variável;
- BDP-011: retenção e descarte;
- ETP-015: integrações, notificações e automações;
- inventário e telemetria de consumidores legados;
- decisão futura sobre persistência de estados transitórios;
- política para integrações externas irreversíveis;
- descontinuação de `/payroll-closures` como iniciativa separada;
- alçadas financeiras, tolerâncias e catálogos legais fora da v1.

## 11. Efeito da homologação

BDP-014 está `APPROVED — VERSION 1`. A Fase 1 da ETP-014 está `COMPLETED` exclusivamente no plano documental. A ETP-014 permanece `PLANNING`, e sua Fase 2 permanece `NOT STARTED`. Esta resolução não altera código, schema, entidade, endpoint, capability, seed ou frontend.
