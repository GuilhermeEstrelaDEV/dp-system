# BDP-AUTH-LEGACY — Matriz de autorização e transição das APIs legadas

**Identificador:** provisório; não reservar numeração definitiva
**Status:** `READY FOR HUMAN DECISION`; não homologado
**Natureza:** alternativas para decisão humana; não autoriza código, assignment ou mudança de rota

## 1. Problema e condição de saída

A plataforma possui JWT, empresa ativa, RBAC, grants e auditoria, mas 133 de 163 handlers ainda não
usam JWT e 136 não declaram capability. O [inventário completo](../architecture/LEGACY_API_AUTHORIZATION_ROUTE_INVENTORY.md)
registra as superfícies reais. A saída deste pacote exige homologar classificação, capabilities,
concessões, sensibilidade, HTTP, auditoria, compatibilidade, rollout, rollback e depreciação.

## 2. Como decidir

Para cada tema, responsáveis devem selecionar uma alternativa, registrar justificativa, exceções,
data, evidência e aprovadores. Recomendações são técnicas e não vinculantes.

| Tema            | Alternativas                                                                 | Benefícios                       | Riscos/impactos                                                     | Recomendação técnica não vinculante                                                | Decisão humana                |
| --------------- | ---------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| Classificação   | pública explícita; autenticação; global administrativa; empresarial; interna | fronteira verificável            | classificar global como empresarial ou tornar rota sensível pública | health/login públicos; administração global explícita; domínio empresarial         | Produto + Segurança + Técnica |
| Granularidade   | módulo; recurso; caso de uso; leitura/escrita; ação sensível                 | menor privilégio                 | catálogo excessivo ou permissões amplas                             | recurso + leitura/escrita, separando aprovar, fechar, reabrir, exportar e sensível | Produto + DP + Segurança      |
| Concessão       | explícita manual; template revisável; seed por papel                         | operação inicial                 | seed automático viola menor privilégio                              | templates apenas como proposta; assignment explícito e auditado                    | DP + Segurança + Diretoria    |
| Administração   | papel global; papel empresarial; híbrido                                     | separa plataforma e domínio      | global operar folha indevidamente                                   | híbrido conforme BDP-009; folha nunca por permissão global isolada                 | Segurança + Produto           |
| HTTP            | 401/403/404 uniformes; exceções por rota                                     | previsibilidade e antienumeração | 404 pode reduzir diagnóstico                                        | 401 sem identidade; 403 sem capability; 404 fora da empresa                        | Segurança + Técnica           |
| Dados sensíveis | integral; mascarado; projeção allowlist; capability adicional                | minimização                      | exposição ou UX insuficiente                                        | capability específica e allowlist; mascarar por padrão                             | DPO/Jurídico + DP + Segurança |
| Auditoria       | só escrita; escrita + leitura sensível; todas as leituras                    | rastreabilidade                  | volume, custo e PII em metadata                                     | toda escrita crítica e leitura sensível; metadata allowlist                        | DPO + Segurança + Técnica     |
| Compatibilidade | corte; alias; adapter; delegação                                             | migração gradual                 | regra duplicada                                                     | adapter temporário delegando ao caso canônico                                      | Produto + Técnica             |
| Rollout         | big bang; família por família; observe-only/flag                             | risco controlado                 | coexistência longa                                                  | família por família, testes negativos e telemetria antes do enforcement            | Produto + Operação + Técnica  |
| Rollback        | retirar guard; feature flag; adapter anterior                                | recuperação                      | reabrir bypass inseguro                                             | rollback mantém autenticação e reverte só adapter/envelope quando seguro           | Segurança + Técnica           |
| Depreciação     | imediata; prazo fixo; evidência de uso                                       | remove dívida                    | consumidor invisível                                                | aviso OpenAPI + telemetria + comunicação + janela homologada                       | Produto + Técnica             |

## 3. Matriz papel–capability preenchível

Os nomes abaixo são personas de análise, não roles seedados. Preencher com `CONCEDER`, `NEGAR`,
`CONDICIONAL` ou `N/A`; toda concessão deve indicar empresa, vigência e justificativa.

| Grupo de capability                | Plataforma admin | Empresa admin | Operador DP | Conferência | Aprovação | Auditoria | Emergência | Temporário |
| ---------------------------------- | ---------------- | ------------- | ----------- | ----------- | --------- | --------- | ---------- | ---------- |
| empresa/organização — visualizar   |                  |               |             |             |           |           |            |            |
| empresa/organização — manter       |                  |               |             |             |           |           |            |            |
| colaborador/contrato — visualizar  |                  |               |             |             |           |           |            |            |
| colaborador/contrato — manter      |                  |               |             |             |           |           |            |            |
| dados sensíveis — visualizar       |                  |               |             |             |           |           |            |            |
| admissão/jornada/benefícios/férias |                  |               |             |             |           |           |            |            |
| folha — configurar                 |                  |               |             |             |           |           |            |            |
| folha — lançar/executar            |                  |               |             |             |           |           |            |            |
| folha — conferir/aprovar           |                  |               |             |             |           |           |            |            |
| fechamento — consultar             |                  |               |             |             |           |           |            |            |
| fechamento — executar/reabrir      |                  |               |             |             |           |           |            |            |
| auditoria/exportação               |                  |               |             |             |           |           |            |            |

### Cinco capabilities de fechamento

| Capability                       | Opções de concessão                         | Risco                            | Proposta não vinculante                         |
| -------------------------------- | ------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| `payroll.period.close.view`      | operador, conferência, aprovação, auditoria | revelar estado operacional       | conceder leitura no escopo empresarial          |
| `payroll.period.close.readiness` | operador e conferência                      | revelar blockers e evidências    | separar de histórico detalhado                  |
| `payroll.period.close.execute`   | operador distinto ou responsável homologado | fechar competência               | não combinar automaticamente com reabertura     |
| `payroll.period.close.reopen`    | exceção controlada                          | invalida uso futuro de evidência | concessão restrita, temporária quando aplicável |
| `payroll.period.close.history`   | conferência, auditoria e responsáveis       | exposição de atores/totais       | projeção allowlist; sem payload bruto           |

Nenhuma opção desta tabela cria assignment. A matriz final deve preservar segregação e ausência de
autorização por nome fixo de papel.

## 4. Semântica HTTP candidata

- `401`: token ausente, inválido, expirado ou sessão/principal inválido;
- `403`: identidade e empresa válidas, capability efetiva ausente;
- `404`: ID pertence a outra empresa ou não existe no escopo ativo;
- `409`: estado, idempotência ou concorrência incompatíveis;
- exceções públicas devem ser explicitamente allowlisted; ausência de metadata não torna rota pública.

## 5. Sensibilidade e auditoria

| Classe      | Exemplos                                  | Controle candidato                           | Auditoria candidata        |
| ----------- | ----------------------------------------- | -------------------------------------------- | -------------------------- |
| PII         | contatos, documentos, afastamentos        | capability sensível, projeção e mascaramento | leitura sensível e escrita |
| Financeiro  | folha, adiantamentos, pagamentos externos | empresa + capability granular                | toda escrita e exportação  |
| Trabalhista | contrato, jornada, férias, admissão       | empresa + caso de uso                        | mudança de estado          |
| Evidência   | manifesto, decisão, audit log             | allowlist e append-only                      | acesso administrativo      |
| Técnico     | health e readiness técnica                | público mínimo                               | log sem domínio            |

Auditoria mínima: ator, empresa, recurso, ação, resultado, `traceId`, timestamp e metadata allowlist.
Tokens, senhas, headers completos, documentos, dados bancários e payload integral são proibidos.

## 6. Rollout e gates

1. observar e inventariar consumidores;
2. homologar matriz e contratos;
3. adicionar testes antes do enforcement;
4. migrar uma família por PR;
5. medir `401/403/404`, alias e consumidor sem registrar PII;
6. confirmar merge e estabilidade;
7. avançar somente com gate humano registrado.

Feature flag é candidata apenas quando permitir observação ou adapter sem criar bypass. O modo
observe-only nunca pode simular autorização bem-sucedida como segurança efetiva.

## 7. Rollback

Rollback precisa preservar autenticação em superfícies já protegidas. São gatilhos candidatos:
regressão comprovada, consumidor homologado interrompido, erro de escopo ou auditoria incompleta.
Evidências: correlation IDs, métricas agregadas, contrato afetado e reprodução. É proibido restaurar
uma regra independente de fechamento ou expor recurso de outra empresa como atalho.

## 8. Depreciação

- marcar alias no OpenAPI;
- comunicar consumidores conhecidos;
- observar uso por janela aprovada;
- migrar frontend e automações;
- comprovar equivalência e rollback;
- remover contrato, cliente e branch obsoletos somente em PR próprio.

## 9. Perguntas objetivas

### Produto e DP

1. Quais operações cada persona realmente executa por empresa?
2. Quem pode visualizar valores, blockers e histórico?
3. Fechar e reabrir devem sempre pertencer a concessões distintas?
4. Quais consumidores das rotas legadas são conhecidos e qual janela de migração é aceitável?

### Segurança

1. Quais operações são globais e quais sempre exigem empresa ativa?
2. Quais leituras precisam capability sensível e auditoria?
3. Grants temporários/emergenciais podem conceder quais grupos?
4. Qual modo de rollout não cria sensação falsa de enforcement?

### Jurídico/DPO

1. Quais leituras de PII, afastamento e documentos devem ser auditadas?
2. Quais campos precisam mascaramento ou projeção allowlist?
3. Quais telemetrias são permitidas antes da BDP-011?

### Responsáveis técnicos

1. Existem consumidores externos, coleções ou integrações não versionadas?
2. Quais rotas usam lookup sem filtro empresarial?
3. Quais escritas não compartilham transação com `AuditLog`?
4. Quais aliases podem delegar sem quebrar envelope ou código HTTP?

## 10. Critérios de homologação

- todas as 163 rotas classificadas e aprovadas por responsáveis;
- matriz de capability e concessão preenchida, sem assignment implícito;
- dados sensíveis e auditoria definidos;
- semântica HTTP e empresa ativa homologadas;
- consumidores, telemetria, compatibilidade, rollback e depreciação aprovados;
- conflitos com BDP-001–013 registrados;
- plano técnico e estratégia de testes revisados;
- identificador definitivo atribuído pela governança somente depois da aprovação.

## 11. Pacote de homologação

O pacote está documentalmente completo para decisão humana, sem representar aprovação:

- [questionário estruturado](BDP-AUTH-LEGACY_HOMOLOGATION_QUESTIONNAIRE.md), com 14 decisões;
- [matriz RACI, dependências e critérios de aprovação](BDP-AUTH-LEGACY_APPROVAL_MATRIX.md);
- [gate de liberação técnica](BDP-AUTH-LEGACY_TECHNICAL_RELEASE_GATE.md);
- [matriz preenchível de alternativas](LEGACY_API_AUTHORIZATION_DECISION_MATRIX.md);
- [plano incremental candidato](LEGACY_API_AUTHORIZATION_IMPLEMENTATION_PLAN.md).

O estado `READY FOR HUMAN DECISION` declara somente completude documental. A BDP continua provisória,
sem identificador definitivo, resolução homologada, assignment ou implementação autorizada.
