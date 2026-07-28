# Prontidão técnica — autorização e isolamento das APIs legadas

**Iniciativa:** `INIT-AUTH-LEGACY` (provisória)
**Status:** descoberta documental; não aprovada e sem implementação autorizada
**Base:** `origin/develop@a2ce83e`

## 1. Objetivo e limites

Preparar a migração incremental das APIs legadas para JWT, empresa ativa, capabilities,
deny-by-default, isolamento e auditoria, reutilizando a fundação existente. Este documento não cria
guard, endpoint, DTO, migration, seed, assignment, feature flag ou comportamento.

## 2. Diagnóstico validado no código

| Área           | Estado real                                   | Prontidão  | Lacuna                                              |
| -------------- | --------------------------------------------- | ---------- | --------------------------------------------------- |
| JWT            | login, strategy, guard e principal funcionais | alta       | aplicado apenas opt-in                              |
| Empresa ativa  | assignment vigente e contexto validados       | alta       | legados aceitam empresa do cliente ou inferem tarde |
| Capabilities   | catálogo, decorator, guard e serviço          | alta       | matriz geral não homologada                         |
| Auditoria      | writer transacional e sanitizer               | alta       | maioria das escritas não o usa                      |
| Grants         | substituição e emergência persistidas         | alta       | escopo de capability por módulo não aprovado        |
| Payroll review | 14 rotas protegidas                           | referência | não estender nomes de capability por analogia       |
| Fechamento     | 7 handlers canônicos protegidos               | referência | família `/payroll-closures` ainda compete           |
| Legado geral   | 133 handlers sem JWT                          | baixa      | migração por família e consumidor                   |
| Frontend       | sessão, empresa e cliente tipado              | média      | várias features ainda enviam `companyId`            |
| OpenAPI        | gerado por decorators                         | média      | depreciação e security metadata não uniformes       |
| Seed           | permissions sem `RolePermission`              | segura     | assignments humanos necessários                     |

## 3. Contrato transversal candidato

1. middleware valida/cria `traceId`;
2. JWT resolve principal e sessão;
3. empresa ativa é validada contra assignment/grant;
4. capability declarada é exigida na borda;
5. controller recebe DTO de negócio, sem confiar em ator/empresa;
6. serviço filtra empresa antes do lookup e repete autorização;
7. escrita crítica, evento e `AuditLog` compartilham transação;
8. resposta usa projeção allowlist conforme sensibilidade.

Rotas públicas precisam allowlist explícita. Um guard global só pode ser avaliado depois que todo o
inventário deixar de depender de ausência implícita de metadata.

## 4. Riscos

| ID        | Risco                                     | Severidade | Evidência                                  | Tratamento candidato                      |
| --------- | ----------------------------------------- | ---------- | ------------------------------------------ | ----------------------------------------- |
| R-AUTH-01 | acesso anônimo a dados empresariais       | crítica    | 133 handlers sem JWT                       | rollout P0/P1 por família                 |
| R-AUTH-02 | enumeração/consulta entre empresas        | crítica    | lookup por ID sem contexto                 | filtro antes do lookup + 404              |
| R-AUTH-03 | fechamento por fluxo concorrente legado   | crítica    | duas mutações `/payroll-closures`          | delegação canônica                        |
| R-AUTH-04 | mutação de insumos de competência fechada | crítica    | writers distribuídos                       | matriz de comandos e testes CLOSED        |
| R-AUTH-05 | exposição de PII/trabalhista              | crítica    | employee/contract/leave públicos           | BDP-001/011 + capability sensível         |
| R-AUTH-06 | assignment amplo ou automático            | alta       | catálogo sem matriz aprovada               | concessão explícita, zero seed automático |
| R-AUTH-07 | quebra de frontend/consumidor invisível   | alta       | contratos legados e externos desconhecidos | adapter, telemetria e janela              |
| R-AUTH-08 | auditoria com token/PII                   | alta       | metadata ainda não padronizada em legados  | sanitizer e allowlist                     |
| R-AUTH-09 | observe-only interpretado como proteção   | alta       | rollout ainda indefinido                   | status explícito e falha fechada          |
| R-AUTH-10 | rollback restaurar bypass                 | alta       | corte sem política                         | rollback previamente aprovado             |
| R-AUTH-11 | cache misturar empresas                   | alta       | frontend multiempresa                      | limpar/segmentar cache por contexto       |
| R-AUTH-12 | CI não executar PostgreSQL transacional   | média      | workflow não provisiona DB de invariantes  | job PostgreSQL futuro                     |

Há cinco riscos críticos: R-AUTH-01 a R-AUTH-05.

## 5. Famílias prioritárias

1. **P0 — fechamento e writers da folha:** `/payroll-closures`, períodos legados, lançamentos e
   execuções; risco de bypass e snapshot inconsistente.
2. **P1 — rubricas, parâmetros, empresas, colaboradores e contratos:** configuração, PII e escopo.
3. **P2 — admissão, organização e afastamentos:** workflow e dados potencialmente sensíveis.
4. **P3 — jornada, benefícios, férias e remuneração variável:** dependências BDP específicas.
5. **P4 — superfícies públicas legítimas:** manter e testar, não converter em empresariais.

## 6. Consumidores

Consumidores internos conhecidos estão registrados no inventário por rota/família. Todo endpoint
legado também possui consumidor externo potencial: Swagger, coleções, scripts, integrações e acesso
direto não versionado. Ausência de referência no monorepo não prova ausência de uso.

Telemetria candidata registra somente identificador técnico da rota, versão, resultado, cliente
declarado quando seguro e correlation ID. Não registra query/body, token, documento ou PII.

## 7. Compatibilidade

- preservar URI/envelope por adapter quando possível;
- aplicar uma única regra de domínio mesmo com alias;
- migrar clientes React antes da remoção;
- marcar depreciação no OpenAPI;
- não criar fallback que ignore JWT/capability;
- tratar `/payroll-closures` antes das demais remoções;
- remover somente depois dos critérios do inventário legado.

## 8. Impactos candidatos

### Backend

Contexto explícito nos serviços, lookup empresarial, capabilities, writer transacional e adapters.
Nenhuma mudança é autorizada até a BDP provisória ser homologada.

### Frontend

Parar de tratar `companyId` como autoridade, segmentar cache, condicionar UI por capability e manter
tratamento de 401/403/404. Essas mudanças serão por fase, não nesta entrega.

### Banco

Nenhuma migration é atualmente comprovada para o mecanismo básico. Novos índices de auditoria,
telemetria ou constraints precisam proposta própria e PostgreSQL real.

### OpenAPI

Security metadata, capabilities, erros e `deprecated` precisam refletir o comportamento efetivo.
Contrato documentado não pode preceder enforcement.

## 9. Critérios de readiness para a primeira fase técnica

- BDP-AUTH-LEGACY homologada e identificada definitivamente;
- todas as rotas P0 aprovadas, com capabilities e concessões;
- consumidores do fechamento inventariados;
- adapter, telemetria e rollback especificados;
- semântica 401/403/404 aprovada;
- testes negativos e PostgreSQL definidos antes do código;
- nenhum conflito com BDP-006/011;
- branch técnica criada somente após merge e verificação pós-merge desta documentação.

## 10. Rastreabilidade

- [inventário rota por rota](LEGACY_API_AUTHORIZATION_ROUTE_INVENTORY.md);
- [pacote de decisão](../project-management/BDP-AUTH-LEGACY_DECISION_PACKAGE.md);
- [matriz de decisões](../project-management/LEGACY_API_AUTHORIZATION_DECISION_MATRIX.md);
- [plano incremental](../project-management/LEGACY_API_AUTHORIZATION_IMPLEMENTATION_PLAN.md);
- [estratégia de testes](LEGACY_API_AUTHORIZATION_TEST_STRATEGY.md).
