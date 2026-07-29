# ETP-015 — Authorization Foundation & Enterprise Isolation

**Status:** `IN PROGRESS — SPECIFICATION APPROVED`
**Natureza:** especificação vinculante; implementação somente pelos incrementos e gates aprovados
**Base analisada:** `origin/develop@af9c68b`

## 1. Objetivo e motivação

Consolidar a fundação de identidade, autorização e isolamento já usada pelos módulos protegidos e
planejar sua aplicação incremental às APIs legadas. A iniciativa elimina acesso anônimo implícito,
uso de `companyId` do cliente como autoridade, lookup cruzado entre empresas e regras concorrentes de
fechamento, sem alterar regras materiais de DP.

O diagnóstico de referência contém 163 handlers: 30 com JWT, 27 com capability, 133 sem JWT, 136 sem
capability e 29 que recebem `companyId` por DTO ou path. A ETP-015 transforma esse passivo em rollout
controlado, começando pelo fechamento P0.

## 2. Escopo

- principal autenticado e contexto imutável de aplicação;
- resolução da empresa ativa no backend;
- RBAC híbrido com capabilities empresariais e administrativas globais explícitas;
- assignments explícitos, vigentes, revogáveis e auditáveis;
- deny-by-default e allowlist pública mínima;
- semântica uniforme `401`/`403`/`404`;
- isolamento de consultas antes do lookup;
- projeção allowlist e masking de dados sensíveis;
- auditoria de escritas críticas e leituras sensíveis;
- grants temporários, segregação e acesso emergencial;
- adapters legados que delegam à regra canônica;
- rollout família por família, iniciando pelo fechamento da folha.

## 3. Fora de escopo

- regras legais, fórmulas, alíquotas, tolerâncias ou alçadas financeiras;
- matriz automática baseada em nomes de cargos;
- grants ou assignments criados por seed;
- decisão material das BDP-001 a BDP-008 e BDP-010 a BDP-013;
- política final de retenção, descarte ou exportação da BDP-011;
- remoção imediata de endpoints ou consumidores legados;
- integrações externas, notificações, scheduler ou frontend novo;
- reescrita da regra canônica de fechamento.

## 4. Estado atual e estado desejado

| Área         | Estado atual reutilizável                                  | Estado desejado                                      |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------- |
| Identidade   | login, JWT, `JwtStrategy`, `JwtAuthGuard`                  | principal uniforme em toda superfície autenticada    |
| Empresa      | `UserCompanyRole`, seleção e validação de empresa          | empresa derivada exclusivamente do contexto validado |
| Capabilities | `Permission`, `RolePermission`, decorator, guard e serviço | catálogo governado e declaração explícita por rota   |
| Grants       | substituição e emergência vigentes                         | integração uniforme e segregação verificável         |
| Auditoria    | `AuditWriterService` e sanitizer                           | escritas críticas e leituras sensíveis cobertas      |
| Isolamento   | aplicado nos módulos canônicos                             | filtro empresarial antes de todo lookup empresarial  |
| Legado       | 133 handlers sem JWT                                       | famílias migradas por gates, sem bypass              |
| Fechamento   | fluxo canônico protegido e legado concorrente              | legado como adapter exclusivo do fluxo canônico      |

## 5. Requisitos funcionais

1. Somente health, login e superfícies explicitamente allowlisted podem ser públicas.
2. Toda rota empresarial exige identidade válida, empresa ativa e capability declarada.
3. `companyId` de body, query, path ou header é seletor ou dado, nunca autoridade.
4. O backend valida assignment vigente e empresa ativa antes de executar o caso de uso.
5. Ausência de capability deve negar por padrão; nomes de papel não autorizam operações.
6. Recurso inexistente e recurso de outra empresa retornam `404` indistinguível.
7. Grants temporários e emergenciais respeitam empresa, capability, vigência, expiração e revogação.
8. Escrita crítica persiste estado, evento e `AuditLog` na mesma transação.
9. Leitura sensível usa projeção mínima e auditoria conforme classificação.
10. Endpoints legados preservados devem delegar exclusivamente ao serviço canônico.

## 6. Requisitos não funcionais

- tipagem estrita e contexto imutável;
- falha fechada para metadata, policy ou configuração ausente;
- consultas indexáveis por empresa e sem pós-filtragem em memória;
- auditoria append-only, sanitizada e correlacionada por `traceId`;
- compatibilidade observável, reversível e sem registrar PII;
- testes negativos obrigatórios por rota/família;
- nenhuma redução de cobertura ou de checks do monorepo;
- documentação OpenAPI coerente com o enforcement efetivo.

## 7. Decisões vinculantes

DAL-01 a DAL-14 da
[resolução BDP-AUTH-LEGACY](BDP-AUTH-LEGACY_RESOLUTION_V1.md) são vinculantes: allowlist mínima,
capabilities por recurso e operação, assignments explícitos, RBAC híbrido, `401`/`403`/`404`, masking,
auditoria, metadata allowlist, adapters canônicos, rollout incremental, rollback seguro, remoção após
evidência, segregação e fechamento P0. Também permanecem vinculantes o
[ADR-007](../architecture/decisions/ADR-007-identity-authorization-context.md), a
[BDP-009 v1](BDP-009_RESOLUTION_V1.md) e a [BDP-014 v1](BDP-014_RESOLUTION_V1.md).

### 7.1 Matriz de conformidade DAL-01 a DAL-14

| DAL | Decisão vinculante                                | Especificação/seção            | Backlog           | Gate | Status    | Evidência e ajuste                       |
| --- | ------------------------------------------------- | ------------------------------ | ----------------- | ---- | --------- | ---------------------------------------- |
| 01  | allowlist pública mínima                          | §5 RF-1; Technical Design §5   | 015.4             | A/B  | `COVERED` | decorator público explícito e inventário |
| 02  | capabilities por recurso/operação crítica         | §5 RF-2/5; Technical Design §4 | 015.3/015.4       | A/B  | `COVERED` | catálogo e ações críticas separadas      |
| 03  | assignments explícitos; zero seed automático      | §5 RF-4; Data Model §2/5       | 015.3             | A/B  | `COVERED` | provenance, vigência e teste do seed     |
| 04  | RBAC híbrido; domínio empresarial                 | §2/5; Technical Design §3      | 015.2/015.5       | A/B  | `COVERED` | `platform.*` não autoriza domínio        |
| 05  | `401`/`403`/`404` uniforme                        | §5 RF-6; Technical Design §7   | 015.1/015.4/015.5 | B/C  | `COVERED` | matriz negativa e antienumeração         |
| 06  | masking/allowlist e acesso integral adicional     | §9; Technical Design §8        | 015.6             | C/D  | `COVERED` | projeção backend e capability sensível   |
| 07  | escritas críticas e leituras sensíveis auditadas  | §9/12; Technical Design §8     | 015.7             | C/D  | `COVERED` | taxonomia, atomicidade e testes          |
| 08  | metadata allowlist; sem descarte antes da BDP-011 | §9; Technical Design §8        | 015.7             | A/C  | `COVERED` | sanitizer e retenção provisória          |
| 09  | adapters delegam à regra canônica                 | §10/11; Technical Design §9    | 015.8/015.9       | C/D  | `COVERED` | sem fallback de domínio                  |
| 10  | rollout por família com telemetria/gates          | §10/13.1                       | 015.8–015.10      | C/D  | `COVERED` | ondas P0–P4 e gate individual            |
| 11  | rollback preserva autenticação/isolamento         | §10                            | todos             | B–D  | `COVERED` | rollback obrigatório por incremento      |
| 12  | remoção após comunicação/evidência/janela         | §10                            | 015.10            | D    | `COVERED` | remoção posterior em PR próprio          |
| 13  | segregação e grants explícitos/expiráveis         | §2/9; Technical Design §10     | 015.3/015.7       | A/B  | `COVERED` | policy, vigência, revogação e auditoria  |
| 14  | fechamento P0 com adapters                        | §11/13.1                       | 015.8             | C    | `COVERED` | cinco capabilities e orquestrador único  |

Nenhuma linha possui ajuste pendente após esta revisão. Mudança futura que torne uma linha `PARTIAL`,
`MISSING` ou `CONFLICT` bloqueia o Gate A até correção documental.

## 8. Dependências, restrições e pendências

- BDP-011 bloqueia retenção definitiva e projeções finais de dados sensíveis.
- BDP-001/004/005 bloqueiam decisões materiais de PII, remuneração e vínculo.
- BDP-006 bloqueia regras materiais de remuneração variável.
- BDP-010 bloqueia remoção baseada em consumidores externos desconhecidos.
- BDP-012/013 limitam administração global e hierarquia organizacional futura.
- A implementação depende da aprovação desta especificação e do Gate A.
- A janela de depreciação e os owners operacionais serão definidos por família antes de remoção.

Essas pendências não impedem autenticação, isolamento, falha fechada e testes negativos; impedem
projeções, concessões ou comportamento material não homologado.

## 9. Segurança, privacidade e auditoria

- token contém somente identidade de sessão; capability efetiva é resolvida no backend;
- `actorId`, empresa e permissões nunca são aceitos de DTO;
- logs e telemetria excluem token, senha, documento, dados bancários, body e query integrais;
- projeções sensíveis são allowlist por padrão; acesso integral exige capability adicional;
- auditoria registra ator, empresa, sessão, trace, ação, alvo, resultado, motivo e metadata permitida;
- falha de auditoria em ação crítica causa rollback;
- leituras sensíveis são classificadas e auditadas sem duplicar PII no `AuditLog`.

## 10. Rollout, migração e rollback

1. aprovar desenho e modelo de dados;
2. estabilizar identidade, empresa e catálogo sem ativação em massa;
3. caracterizar contratos e consumidores da família P0;
4. proteger e adaptar `/payroll-closures` ao fechamento canônico;
5. observar `401`/`403`/`404`, aliases e falhas por telemetria segura;
6. avançar por famílias P1 a P4 somente após gate individual;
7. remover legado em PR próprio depois de comunicação, janela e evidência.

Rollback pode restaurar envelope, alias ou adapter anterior, mas nunca remover JWT, empresa ativa,
isolamento ou delegação canônica já ativados. Não existe fallback para regra de fechamento paralela.

## 11. Impacto no fechamento da folha

O primeiro recorte P0 cobre `/payroll-closures` e writers relacionados. As cinco capabilities
existentes (`view`, `readiness`, `execute`, `reopen`, `history`) são reutilizadas. Os adapters devem
preservar URI/envelope somente enquanto delegam a readiness, lock, idempotência, manifesto, eventos e
auditoria da ETP-014. Nenhuma capability será atribuída automaticamente.

## 12. Plano de testes e observabilidade

- unitários: principal/contexto, vigência, grants, deny-by-default, masking e sanitizer;
- integração/API: token ausente/inválido, `403`, duas empresas, spoofing e ausência de efeitos;
- PostgreSQL: constraints, expiração/revogação, atomicidade, concorrência e idempotência;
- contratos: OpenAPI, envelopes legados e adapters canônicos;
- frontend existente: sessão, troca de empresa, cache e tratamento `401`/`403`/`404`;
- segurança: enumeração de IDs, logs sem PII e nenhum bypass por metadata ausente;
- métricas agregadas: família/rota, resultado, latência e uso de alias, sempre sem payload sensível.

## 13. Riscos

### 13.1 Matriz de migração das rotas inventariadas

| Ordem     | Famílias/perfis                                                      | Superfície e JWT alvo           | Capability candidata                                                                                   | Dados/auditoria                                          | Bloqueio ou risco                                  |
| --------- | -------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------- |
| P0        | `CLOSURE-LEGACY`, `PERIOD-LEGACY`, `PAYROLL-INPUT`, `PAYROLL-RUN`    | empresarial; JWT + empresa      | reutilizar `payroll.period.close.*`; `payroll.input.*`; `payroll.run.*`                                | folha crítica; toda escrita auditada                     | bypass de `CLOSED`, concorrência e contrato legado |
| P1        | `COMPANY`, `EMPLOYEE`, `CONTRACT`, `PAYROLL-PARAM`, `PAYROLL-RUBRIC` | global explícita ou empresarial | `company.*`, `employee.*`, `employment.contract.*`, parâmetros/rubricas por read/write e ação sensível | PII, contrato e configuração; leitura sensível + escrita | BDP-001/004/005/011 e escopo administrativo        |
| P2        | `ORG`, `ADMISSION`, `LEAVE`, `VARIABLE`                              | empresarial                     | `organization.*`, `admission.*`, `leave.*`, `variable.compensation.*`                                  | trabalhista/saúde/financeiro; estado e leitura sensível  | BDP-002/006/011/012/013                            |
| P3        | `TIME`, `BENEFIT`, `VACATION`                                        | empresarial                     | capabilities por recurso read/write e decisões separadas                                               | trabalhista/financeiro; mutações auditadas               | BDP-007/008 e políticas materiais                  |
| P4        | `PUB`, `AUTH-PUB`                                                    | pública em allowlist mínima     | nenhuma capability de domínio                                                                          | logs técnicos/login sanitizado                           | exposição acidental ou rate limit inadequado       |
| Preservar | `AUTH`, `GRANT`, `REVIEW`, `PERIOD-CANON`                            | proteção existente              | capabilities existentes                                                                                | auditoria/transação já aplicadas                         | regressão durante consolidação                     |

O inventário registra 24 handlers `ORG`, 19 `ADMISSION`, 14 `REVIEW`, 12 `EMPLOYEE` e as demais
famílias até completar 163 handlers. A capability final de cada rota é aprovada no incremento da
família; a tabela agrupa códigos candidatos sem criar assignments. Todas as rotas empresariais exigem
contexto ativo e filtro anterior ao lookup. A sensibilidade determina projeção/masking e se a leitura
deve ser auditada.

| Risco                          | Tratamento                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| acesso anônimo durante rollout | allowlist explícita, inventário e gates por família              |
| vazamento entre empresas       | filtro composto antes do lookup e testes com duas empresas       |
| privilege creep                | assignment explícito, vigência, revogação e zero seed automático |
| quebra de consumidor invisível | adapter, telemetria, comunicação e janela                        |
| regra de fechamento duplicada  | delegação exclusiva ao orquestrador canônico                     |
| PII em auditoria/telemetria    | allowlist, sanitizer e testes de segurança                       |
| rollback restaurar bypass      | plano testado que preserva controles essenciais                  |

## 14. Critérios de aceite e definição de pronto

A ETP-015 só poderá ser considerada pronta quando:

- as dez entregas do backlog estiverem mescladas e verificadas em `develop`;
- as 163 rotas estiverem públicas por allowlist ou protegidas explicitamente;
- nenhuma operação empresarial confiar no `companyId` do cliente;
- toda rota empresarial tiver testes `401`/`403`/`404` e isolamento;
- catálogo e assignments forem auditáveis, sem nome fixo de papel ou grant por seed;
- fechamento P0 tiver uma única regra canônica;
- auditoria, masking, OpenAPI, telemetria e rollback estiverem validados;
- Gates A a D possuírem evidências e aprovação;
- zero TODO/FIXME crítico e `pnpm check` verde.

Esta especificação não satisfaz a definição de pronto e não inicia implementação.

## 15. Prontidão após revisão

| Área            | Classificação            | Justificativa                                                       |
| --------------- | ------------------------ | ------------------------------------------------------------------- |
| arquitetura     | `READY`                  | responsabilidades, pipeline e defesa em profundidade definidos      |
| modelo de dados | `READY WITH ADJUSTMENTS` | schema reutilizável; campos/constraints dependem do Gate A          |
| autenticação    | `READY WITH ADJUSTMENTS` | JWT existe; contrato de revogação de sessão será fechado na 015.1   |
| empresa ativa   | `READY`                  | seleção é validada por assignment e nunca é autoridade do cliente   |
| capabilities    | `READY`                  | fonte, escopo e ações críticas definidos                            |
| assignments     | `READY WITH ADJUSTMENTS` | provenance/revogação requerem decisão de migration no Gate A        |
| guards          | `READY WITH ADJUSTMENTS` | primitives existem; allowlist e composição explícita vêm na 015.4   |
| isolamento      | `READY`                  | filtro antes do lookup é requisito verificável                      |
| masking         | `READY WITH ADJUSTMENTS` | mecanismo definido; matrizes de campos dependem das BDPs da família |
| auditoria       | `READY WITH ADJUSTMENTS` | writer existe; taxonomia de leitura/negação será definida na 015.7  |
| legado          | `READY WITH ADJUSTMENTS` | estratégia definida; consumidores/janela são gates por família      |
| fechamento P0   | `READY`                  | contrato canônico e cinco capabilities já existem                   |
| testes          | `READY`                  | matriz negativa e camadas obrigatórias especificadas                |
| rollout         | `READY`                  | ondas e gate individual definidos                                   |
| rollback        | `READY`                  | nenhum retorno pode remover identidade ou isolamento                |

Não há área `BLOCKED` para iniciar a especificação detalhada da ETP-015.1 após aprovação deste PR. Os
itens `READY WITH ADJUSTMENTS` são critérios do incremento ou do Gate A, não autorização para
presumir comportamento.
