# BDP-014 — Proposta de resolução para fechamento de competência

**Status:** `PENDING APPROVAL`

**Natureza:** proposta não vinculante para homologação

**Iniciativa:** ETP-014 — Fechamento de Competência e Integração Operacional

**Efeito atual:** nenhum. Este documento não autoriza código, migration, endpoint, capability, seed ou interface.

## 1. Contexto e problema

A ETP-013 encerrou a conferência da folha com identidade autenticada, contexto empresarial, RBAC por capability, duas aprovações, segregação, eventos e decisões append-only, auditoria transacional, fechamento e reabertura do ciclo. A competência (`PayrollPeriod`) já possui estado `OPEN`/`CLOSED` e histórico (`PayrollPeriodClosure`), mas o fechamento operacional não está integrado à conferência.

Há hoje dois fluxos capazes de alterar o mesmo estado:

| Fluxo atual | Serviço                               | Escrita                                  | Pré-condições atuais                                                                                                                                     | Retorno              | Autorização                           |
| ----------- | ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------- |
| competência | `PayrollPeriodsService.close/reopen`  | `PayrollPeriod` e `PayrollPeriodClosure` | ausência de qualquer `BLOCKING_ERROR` aberto na competência; motivo somente na reabertura                                                                | competência          | rota legada, sem JWT/RBAC empresarial |
| fechamentos | `PayrollClosuresService.close/reopen` | as mesmas entidades                      | competência aberta; última execução `COMPLETED`; ausência de qualquer `BLOCKING_ERROR` aberto; motivo opcional no fechamento e obrigatório na reabertura | evento de fechamento | rota legada, sem JWT/RBAC empresarial |

As superfícies atuais são:

- `POST /payroll-periods/:id/close`;
- `POST /payroll-periods/:id/reopen`;
- `POST /payroll-periods/:id/validate`;
- `POST /payroll-closures`;
- `POST /payroll-closures/:payrollPeriodId/reopen`;
- `GET /payroll-closures` e `GET /payroll-closures/:id`.

Nenhum fluxo exige um `PayrollReviewCycle` `CLOSED`, referencia a execução/ciclo no evento, deriva a empresa do principal autenticado ou grava `AuditLog`. As validações são feitas antes da transação e não há idempotência, versionamento otimista ou lock explícito. Isso permite divergência entre contratos, condição de corrida e fechamento baseado em evidência obsoleta.

## 2. Inventário reutilizável

- `PayrollPeriod`: competência, empresa, referência, tipo, estado e versões técnicas;
- `PayrollRun`: sequência, estado, versões, snapshot de parâmetros, itens e mensagens;
- `PayrollReviewCycle`: empresa, execução, estado, rodada, etapas e submissão;
- `PayrollReviewDecision`, `PayrollReviewDecisionInvalidation` e `PayrollReviewEvent`: decisões e invalidações append-only;
- `PayrollReviewFinding`: achados informativos ou bloqueantes;
- `PayrollPeriodClosure`: histórico atual de `CLOSED`/`REOPENED`;
- JWT, principal tipado, empresa ativa e política de `404` empresarial;
- `CapabilitiesGuard` e repetição da autorização no serviço;
- grants temporários/emergenciais sem associação automática a papéis;
- `AuditWriterService` para alteração e auditoria na mesma transação;
- correlation/trace ID, sessão, IP e user-agent já disponíveis no contexto;
- cliente HTTP, sessão, empresa ativa, guards visuais e tratamento de erros no frontend.

No banco, a base de folha nasceu na migration `0008_payroll_foundation`; identidade/RBAC e auditoria estão em `0010`/`0011`; ciclos, achados, eventos, etapas, decisões, rodadas e invalidações da conferência estão em `0012` a `0014`. Não existe migration posterior nem vínculo persistido entre `PayrollPeriodClosure` e a evidência da ETP-013.

## 3. Decisão D-014-01 — contrato canônico

### Alternativas

| Alternativa                                                      | Benefícios                                           | Riscos                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| manter os dois fluxos independentes                              | menor mudança imediata                               | perpetua divergência, duplicação e bypass                                      |
| tornar `/payroll-closures` o recurso canônico                    | preserva a API orientada ao evento                   | fechamento é comando sobre a competência; URI e retorno ficam menos intuitivos |
| tornar `/payroll-periods/:id` canônico e delegar compatibilidade | agrega estado, prontidão e comandos no mesmo recurso | exige adaptação gradual das rotas atuais                                       |

### Recomendação não vinculante

Adotar um único caso de uso de aplicação sob a competência, com contratos candidatos:

- `GET /payroll-periods/:id/closure-readiness`;
- `POST /payroll-periods/:id/close`;
- `POST /payroll-periods/:id/reopen`;
- `GET /payroll-periods/:id/closure-history`.

O futuro orquestrador canônico deverá concentrar isolamento, readiness, concorrência, transação, evento e auditoria. `PayrollPeriodsService` deverá ser adaptado para delegar ao caso de uso. As escritas de `PayrollClosuresService` deverão funcionar apenas como compatibilidade temporária, delegando ao mesmo caso de uso e emitindo sinal de depreciação; depois de janela homologada, serão descontinuadas. Leituras de histórico poderão ser adaptadas ao contrato canônico antes da descontinuação.

**Homologação necessária:** rotas finais, formato de resposta, janela de compatibilidade e consumidores conhecidos.

## 4. Decisão D-014-02 — execução que fundamenta o fechamento

### Alternativas avaliadas

- **mais recente:** simples, mas uma execução nova pode mudar a evidência entre readiness e comando;
- **explicitamente selecionada:** inequívoca e auditável, mas exige validação contra obsolescência;
- **marcada como oficial:** clara, porém cria estado e comando adicionais sem necessidade comprovada;
- **aprovada na ETP-013:** aproveita a decisão, mas `APPROVED` ainda não é o encerramento final do review;
- **vinculada ao ciclo `CLOSED`:** melhor evidência operacional, desde que seja também a execução mais recente da competência.

### Recomendação não vinculante

O comando deve receber explicitamente `payrollRunId`. A execução é elegível somente quando:

1. pertence à competência e à empresa ativa;
2. está `COMPLETED`;
3. é a maior `sequence` existente na competência no instante do commit;
4. possui um ciclo de conferência elegível em `CLOSED` para a mesma execução;
5. não possui mensagem `BLOCKING_ERROR` aberta.

Não se recomenda criar flag “oficial” na v1. A seleção explícita evita ambiguidade; a exigência da maior sequência impede fechamento por execução antiga.

| Situação                                               | Comportamento proposto                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| nenhuma execução elegível                              | readiness bloqueada e fechamento `409`                                               |
| mais de uma execução                                   | apenas a maior sequência pode ser selecionada                                        |
| execução posterior não aprovada, em andamento ou falha | bloqueia a execução anterior; concluir/corrigir a posterior ou criar política futura |
| execução selecionada cancelada/invalidada              | deixa de ser elegível; estados futuros diferentes de `COMPLETED` bloqueiam           |

**Homologação necessária:** confirmar que qualquer execução posterior torna a anterior obsoleta, inclusive uma execução falha.

## 5. Decisão D-014-03 — vínculo obrigatório com a ETP-013

### Alternativas

- aceitar qualquer ciclo aprovado;
- aceitar o último ciclo por data;
- exigir ciclo `CLOSED` da execução selecionada e validar a rodada vigente.

### Recomendação não vinculante

O fechamento deverá exigir simultaneamente:

- ciclo existente e em `CLOSED`;
- mesma execução, empresa e competência derivadas por relacionamento;
- `reviewRound` atual do ciclo;
- todas as etapas da submissão atual aprovadas e sem invalidação;
- nenhum achado `BLOCKING` aberto;
- nenhum evento de reabertura posterior ao fechamento efetivo da rodada;
- nenhuma execução de sequência superior.

O evento de fechamento operacional deverá preservar os IDs e a rodada usados. O readiness e o comando repetirão as verificações dentro da transação. Assim, uma conferência antiga ou reaberta não poderá fundamentar novo fechamento.

**Homologação necessária:** confirmar se somente um ciclo `CLOSED` por execução pode ser evidência vigente ou se será necessário marcador explícito futuro.

## 6. Decisão D-014-04 — blockers operacionais

| Condição avaliada                               | Classificação proposta v1                 | Justificativa                                                       |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| achado `BLOCKING` aberto                        | obrigatório                               | já é invariante do fechamento do review e deve ser revalidado       |
| ciclo não aprovado                              | obrigatório                               | faltam decisões válidas                                             |
| ciclo não `CLOSED`                              | obrigatório                               | aprovação isolada não encerra a conferência                         |
| folha sem execução `COMPLETED`                  | obrigatório                               | não há evidência técnica                                            |
| colaborador sem dados obrigatórios              | futuro                                    | catálogo obrigatório depende de decisões de domínio ainda pendentes |
| remuneração variável pendente                   | alerta com reconhecimento explícito       | BDP-006 impede inferir regra material ou alçada                     |
| evento financeiro inconsistente                 | futuro                                    | classificação e tolerância não estão homologadas                    |
| integração obrigatória incompleta               | fora do escopo                            | integrações pertencem à ETP-015                                     |
| divergência de totais                           | futuro                                    | fonte, tolerância e critério de bloqueio não foram definidos        |
| execução concorrente `RUNNING`                  | obrigatório                               | pode tornar a evidência obsoleta                                    |
| competência já `CLOSED`                         | obrigatório; replay idempotente é exceção | evita segunda transição efetiva                                     |
| fechamento/reabertura em andamento              | obrigatório                               | serialização deve impedir comando concorrente                       |
| `BLOCKING_ERROR` aberto na execução selecionada | obrigatório                               | preserva regra técnica atual                                        |
| execução posterior à selecionada                | obrigatório                               | impede evidência obsoleta                                           |

Alertas não podem ser silenciosos. O manifesto de readiness deverá separar `blockers` e `warnings` por código estável.

**Homologação necessária:** catálogo v1 e decisão específica sobre remuneração variável.

## 7. Decisão D-014-05 — reabertura

### Alternativas

- reabrir automaticamente competência e ciclo da ETP-013;
- reabrir apenas a competência e reutilizar a execução/review anterior;
- reabrir a competência, invalidar sua evidência operacional e exigir nova execução/review para o próximo fechamento.

### Recomendação não vinculante

Adotar a terceira alternativa:

- transição permitida somente de `CLOSED` para `OPEN`;
- justificativa não vazia e capability `payroll.period.close.reopen` obrigatórias;
- reabertura da competência não reabre automaticamente o ciclo da ETP-013;
- o fechamento operacional anterior permanece imutável, mas passa a constar como superado por evento de reabertura;
- alterações operacionais ficam liberadas conforme a matriz D-014-08;
- para fechar novamente, será obrigatória nova execução de maior sequência e novo ciclo completo da ETP-013;
- o ciclo e as decisões anteriores permanecem históricos, sem invalidação artificial, pois eram válidos para a execução anterior;
- reabrir especificamente uma conferência continua sendo operação separada, com `payroll.review.reopen` e regras da ETP-013;
- integrações externas já realizadas não serão revertidas na v1; a reabertura deve ser bloqueada quando houver integração irreversível até uma política da ETP-015.

Não se recomenda segregação adicional entre quem fechou e quem reabre na v1 sem decisão de negócio. A capability distinta, a justificativa e a auditoria são controles mínimos; grants temporários/emergenciais continuam aplicáveis e auditados.

**Homologação necessária:** efeito de integrações existentes, obrigatoriedade de ator distinto e exigência universal de nova execução/review.

## 8. Decisão D-014-06 — idempotência e concorrência

### Alternativas

- apenas verificar o estado atual;
- somente lock pessimista;
- idempotency key persistida, lock da competência e versão otimista.

### Recomendação não vinculante

Combinar os três controles:

- cabeçalho obrigatório `Idempotency-Key`, UUID gerado pelo cliente para cada comando;
- unicidade persistida por `companyId + payrollPeriodId + action + idempotencyKey`;
- mesma chave e mesmo hash de payload retornam o resultado original sem novo evento/auditoria;
- mesma chave com payload diferente retorna `409`;
- lock transacional da linha de `PayrollPeriod` no PostgreSQL antes da revalidação;
- versão otimista incremental para detectar escrita fora do orquestrador;
- transação única para estado, manifesto/evidência, evento append-only e `AuditLog`;
- constraint para impedir mais de um fechamento vigente por versão operacional;
- duplo clique reutiliza a mesma chave no frontend;
- falha antes do commit não deixa efeito; repetição segura pode concluir a operação;
- falha após resposta perdida retorna o resultado persistido pelo registro idempotente.

| Caso                                         | Resposta proposta                         |
| -------------------------------------------- | ----------------------------------------- |
| recurso de outra empresa                     | `404`                                     |
| sem autenticação/capability                  | `401`/`403`                               |
| payload inválido                             | `400`                                     |
| estado, blocker, versão ou chave conflitante | `409`                                     |
| replay idêntico concluído                    | `200` com indicação de replay             |
| criação efetiva da transição                 | `200` ou `201`, a homologar pelo contrato |

Prisma deverá executar a transação interativa; lock específico poderá usar SQL parametrizado no adaptador de persistência, encapsulado e testado. Não se recomenda depender apenas do isolation level sem chave idempotente.

**Homologação necessária:** obrigatoriedade do cabeçalho, prazo de retenção da chave e status HTTP final.

## 9. Decisão D-014-07 — capabilities e concessões

### Catálogo candidato recomendado

| Capability                       | Uso no backend                                | Uso visual no frontend  |
| -------------------------------- | --------------------------------------------- | ----------------------- |
| `payroll.period.close.view`      | consultar resumo da competência apta ao fluxo | acessar tela/resumo     |
| `payroll.period.close.readiness` | consultar blockers e warnings detalhados      | exibir checklist        |
| `payroll.period.close.execute`   | executar fechamento                           | mostrar ação de fechar  |
| `payroll.period.close.reopen`    | executar reabertura                           | mostrar ação de reabrir |
| `payroll.period.close.history`   | consultar evidências e histórico              | mostrar timeline        |

Os nomes seguem `domínio.recurso.ação`, distinguem leitura sensível, decisão e histórico e evitam reutilizar capabilities de review. Todas são empresariais, deny-by-default, verificadas no guard e novamente no serviço. Nenhuma será atribuída automaticamente a papel; grants temporários e emergenciais poderão carregá-las segundo a fundação existente.

A proposta não exige que o executor do fechamento seja um dos aprovadores. Não haverá regra por nome de papel. Eventual segregação entre preparação, aprovação, fechamento e reabertura precisa ser homologada e configurada por ator/capability, não por cargo fixo.

**Homologação necessária:** granularidade das três leituras, matriz de concessão e segregação adicional.

## 10. Decisão D-014-08 — operações após fechamento

| Operação                                      | Classificação proposta                                                               | Observação                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| criar nova execução                           | permitida apenas após reabertura                                                     | já é bloqueada pelo estado atual                    |
| recalcular folha                              | permitida apenas após reabertura                                                     | deverá gerar nova sequência                         |
| criar/alterar lançamentos da competência      | permitida apenas após reabertura                                                     | snapshot fechado permanece imutável                 |
| alterar remuneração variável da referência    | permitida com versionamento para período futuro; impacto na fechada exige reabertura | não decidir regra da BDP-006                        |
| alterar eventos financeiros da competência    | permitida apenas após reabertura                                                     | sem mutação retroativa do manifesto                 |
| criar/editar achados do ciclo usado           | bloqueada                                                                            | ciclo `CLOSED` é imutável; novo run cria novo ciclo |
| reabrir ciclo de conferência usado            | permitida apenas após reabertura da competência e por comando separado               | nunca automática                                    |
| excluir execução ou evidência                 | bloqueada                                                                            | histórico e referências são append-only/restrict    |
| alterar contrato com impacto retroativo       | permitida com versionamento, sem mudar o snapshot fechado                            | correção da folha exige reabertura                  |
| processar exportação externa                  | fora do escopo                                                                       | política pertence à ETP-015                         |
| gerar documento derivado da evidência fechada | permitida                                                                            | deve identificar versão/evidência                   |
| consultar dados e histórico                   | permitida com capability                                                             | sempre isolada por empresa                          |

**Homologação necessária:** inventário completo dos comandos atuais e política para alterações contratuais retroativas.

## 11. Decisão D-014-09 — retenção da evidência

### Evidência mínima recomendada para a ETP-014

- competência, empresa, referência, tipo e versão operacional;
- execução, sequência, status, versões de engine/parâmetro e hash do snapshot;
- ciclo, estado `CLOSED`, rodada, número de submissão e etapas;
- IDs das decisões válidas, atores, datas e referências às invalidações;
- contagem e estado dos achados, incluindo prova de ausência de blocker aberto;
- totais da execução e resumo por colaborador em manifesto controlado;
- hash canônico do manifesto e versão do algoritmo de hash;
- blockers, warnings e reconhecimentos apresentados no fechamento;
- ator, data do banco, `traceId`, `sessionId`, IP, user-agent e motivo;
- evento append-only de competência e `AuditLog` na mesma transação.

Recomenda-se persistir referências normalizadas e um manifesto imutável versionado. O resumo por colaborador deve conter somente o mínimo necessário; dados sensíveis não devem ser duplicados sem necessidade. Hash garante detecção de alteração, não substitui preservação das fontes.

### Dependência da BDP-011

Prazo, arquivamento, descarte, anonimização, exportação e acesso após expiração permanecem fora desta decisão. Até a BDP-011, nenhuma rotina automática deve eliminar evidências. A ETP-014 define o conteúdo mínimo, não sua política temporal.

**Homologação necessária:** campos do manifesto, algoritmo/versionamento do hash, visibilidade dos totais e base de retenção.

## 12. Decisão D-014-10 — remuneração variável pendente

### Alternativas

| Alternativa                      | Benefício                  | Risco                                                            |
| -------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| bloquear sempre                  | conservadora               | transforma estado demonstrativo em regra material não homologada |
| permitir somente com alerta      | não inventa regra          | alerta pode ser ignorado                                         |
| exigir aprovação excepcional     | controle adicional         | cria alçada fora do escopo                                       |
| excluir ou mover automaticamente | mantém fechamento          | altera competência financeira sem regra aprovada                 |
| exigir declaração explícita      | rastreabilidade sem alçada | depende de mensagem clara e auditoria                            |

### Recomendação não vinculante

Na v1, remuneração variável pendente deve gerar warning estruturado e exigir reconhecimento explícito no comando. Não bloqueia por valor, não exige aprovação excepcional, não exclui e não move itens automaticamente. O manifesto registra contagem, referências e reconhecimento. Se o negócio quiser bloqueio material, deve resolver a BDP-006 ou aprovar regra específica versionada antes da implementação.

**Homologação necessária:** texto/estrutura do reconhecimento e eventual decisão de transformar o warning em blocker.

## 13. Decisão proposta para homologação

Propõe-se aprovar em conjunto a seguinte versão 1:

1. competência como recurso canônico, com escritas legadas apenas em compatibilidade temporária;
2. execução explicitamente selecionada, `COMPLETED`, de maior sequência e ligada a review `CLOSED`;
3. correspondência estrita entre empresa, competência, execução, ciclo, rodada e decisões válidas;
4. catálogo de blockers técnicos da seção 6 e warnings separados;
5. reabertura independente do review, preservando histórico e exigindo nova execução/review para novo fechamento;
6. idempotency key, lock de linha, versão otimista e transação atômica;
7. cinco capabilities empresariais, deny-by-default e sem grants automáticos;
8. matriz de imutabilidade da seção 10;
9. manifesto mínimo imutável, referências normalizadas, hash e auditoria completa;
10. remuneração variável pendente como warning com reconhecimento explícito, sem alçada financeira.

Esta decisão somente se torna vinculante após registro de aprovadores, data, versão e eventuais ressalvas. Até lá, BDP-014 permanece `PENDING APPROVAL` e a ETP-014 permanece `PLANNING`.

### Impactos consolidados da proposta

| Decisão  | Domínio/dados                                  | API/frontend                                 | Segurança/auditoria                   | Testes prioritários                               |
| -------- | ---------------------------------------------- | -------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| D-014-01 | um orquestrador, sem novo agregado obrigatório | quatro contratos canônicos e compatibilidade | elimina portas de bypass gradualmente | equivalência entre rotas durante rollout          |
| D-014-02 | referência explícita à maior execução          | `payrollRunId` no comando e readiness        | impede seleção ambígua                | execução ausente, antiga, posterior e concorrente |
| D-014-03 | vínculo execução–review–rodada                 | evidência navegável                          | evita conferência velha/inválida      | rodada, decisões e achados revalidados            |
| D-014-04 | catálogo estável de códigos                    | blockers e warnings separados                | reconhecimento auditável              | matriz completa de prontidão                      |
| D-014-05 | nova versão operacional após reabertura        | comandos de competência/review independentes | justificativa e histórico preservados | reclose sem reutilizar evidência superada         |
| D-014-06 | idempotência, versão e constraints             | header e respostas de replay/conflito        | transação conjunta                    | corrida real, retry e rollback                    |
| D-014-07 | catálogo de cinco capabilities                 | ações visuais por capability                 | deny-by-default, sem papel fixo       | `401`, `403`, grants e multiempresa               |
| D-014-08 | snapshots fechados imutáveis                   | comandos bloqueados com `409`                | reduz mutação retroativa              | inventário de bypass por módulo                   |
| D-014-09 | manifesto, hash e referências                  | timeline com minimização                     | contexto completo no `AuditLog`       | hash, append-only e visibilidade                  |
| D-014-10 | warning, sem fórmula/alçada                    | reconhecimento explícito                     | decisão registrada                    | pendência presente/ausente e retry                |

### Matriz de homologação preenchível

| Decisão  | Escolha proposta                               | Resultado da homologação | Ressalvas | Aprovador/data |
| -------- | ---------------------------------------------- | ------------------------ | --------- | -------------- |
| D-014-01 | competência como contrato canônico             | pendente                 |           |                |
| D-014-02 | execução explícita e de maior sequência        | pendente                 |           |                |
| D-014-03 | review `CLOSED` correspondente e vigente       | pendente                 |           |                |
| D-014-04 | blockers/warnings da seção 6                   | pendente                 |           |                |
| D-014-05 | reabertura independente e nova execução/review | pendente                 |           |                |
| D-014-06 | chave + lock + versão + transação              | pendente                 |           |                |
| D-014-07 | cinco capabilities empresariais                | pendente                 |           |                |
| D-014-08 | matriz de imutabilidade da seção 10            | pendente                 |           |                |
| D-014-09 | manifesto mínimo e retenção separada           | pendente                 |           |                |
| D-014-10 | warning com reconhecimento explícito           | pendente                 |           |                |

## 14. Critérios de aceite da homologação

- cada D-014-01 a D-014-10 está marcada como aprovada, rejeitada ou aprovada com ressalva;
- DP, Financeiro, Segurança e responsável técnico identificam seus aprovadores;
- contrato canônico e janela de compatibilidade estão definidos;
- execução elegível, blockers e efeitos da reabertura não possuem ambiguidade;
- catálogo de capabilities e segregação estão aprovados;
- manifesto separa conteúdo obrigatório de retenção temporal;
- tratamento da remuneração variável não contradiz a BDP-006;
- divergências geram versão revisada deste documento e, quando arquiteturais, ADR;
- ROADMAP e status mestre somente avançam após evidência formal.

## 15. Pendências residuais e riscos

- BDP-006 continua bloqueando regras materiais de remuneração variável;
- BDP-011 continua bloqueando a política temporal de retenção;
- integrações irreversíveis e notificações dependem da ETP-015;
- catálogo de dados obrigatórios e tolerâncias financeiras não está aprovado;
- rotas legadas podem possuir consumidores ainda não inventariados;
- lock via Prisma exige desenho de infraestrutura e teste real em PostgreSQL;
- manifesto com totais por colaborador exige revisão de minimização e visibilidade;
- uma execução posterior falha bloqueando a anterior pode exigir exceção futura, mas nenhuma é proposta sem homologação.

## 16. Implicações para as fases da ETP-014

| Fase                       | Decisões necessárias     | Resultado permitido após aprovação                     |
| -------------------------- | ------------------------ | ------------------------------------------------------ |
| 1 — contrato e homologação | todas                    | ADR/contratos documentais, sem comportamento funcional |
| 2 — readiness              | D-014-02, 03, 04, 07, 10 | leitura autenticada de blockers/warnings               |
| 3 — persistência/auditoria | D-014-05, 06, 09         | migration e writers, sem comando público ativo         |
| 4 — fechamento             | D-014-01 a 09            | comando canônico, compatibilidade e imutabilidade      |
| 5 — reabertura             | D-014-05, 06, 08, 09     | reabertura independente e nova versão operacional      |
| 6 — frontend/E2E           | catálogo completo        | experiência funcional e regressão ponta a ponta        |

O plano detalhado está em [ETP-014 — plano de implementação](ETP-014_IMPLEMENTATION_PLAN.md).
