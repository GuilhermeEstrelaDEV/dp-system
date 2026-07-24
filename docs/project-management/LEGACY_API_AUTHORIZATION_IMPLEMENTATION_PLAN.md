# Plano incremental — autorização e consolidação das APIs legadas

**Iniciativa:** `INIT-AUTH-LEGACY` (provisória)
**Status:** plano candidato; não aprovado e sem fase técnica autorizada
**Governança:** uma fase por branch e PR draft; merge e verificação pós-merge antes da seguinte

## Princípios vinculantes já existentes

- empresa deriva do principal/contexto, nunca do payload como autoridade;
- autorização na borda e novamente no caso de uso;
- deny-by-default e `404` entre empresas;
- nenhuma regra por nome de papel;
- nenhum assignment automático;
- escrita crítica, evento e `AuditLog` na mesma transação;
- compatibilidade não mantém regra de domínio paralela;
- nenhum valor legal, alçada ou política de BDP pendente é presumido;
- nenhuma fase é `COMPLETED` antes de merge e aceitação.

## Fases e gates

| Fase                                           | Objetivo e pré-requisitos                                    | Rotas/capabilities candidatas                                                                     | Riscos e testes                                                            | Documentação/aceite/rollback/gate                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 0 — Gate, reconciliação e inventário           | Base limpa, ETP-014 concluída; inventariar código/documentos | 163 handlers; sem capability nova                                                                 | omissão de rota; validar AST, OpenAPI e clientes                           | inventário e inconsistências; aceite: 100% rastreado; rollback: revert documental; gate: PR documental mergeado |
| 1 — Decisão humana                             | Homologar BDP-AUTH-LEGACY após F0                            | classificação, matriz e cinco capabilities de fechamento                                          | concessão excessiva; revisão DP/Produto/Segurança/DPO                      | resolução versionada; aceite: matriz preenchida; rollback: nova versão de decisão; gate humano formal           |
| 2 — Especificação transversal                  | BDP aprovada                                                 | contexto, erro, auditoria, adapters e telemetria                                                  | contrato contraditório; testes de contrato projetados                      | ADR se necessário; aceite: APIs e rollback definidos; merge documental                                          |
| 3 — Fundação reutilizável                      | F2 mergeada; sem ativar famílias em massa                    | decorators/policies/ports conforme decisão                                                        | guard global prematuro; unitários de deny-by-default, grants e sanitizer   | documentação técnica; rollback sem abrir rotas já seguras; gate pós-merge                                       |
| 4 — `/payroll-closures` canônico               | consumidores e adapter homologados                           | `payroll.period.close.*` existentes                                                               | bypass, envelope e concorrência; 401/403/404, PostgreSQL, replay, rollback | inventário/OpenAPI; aceite: uma única regra; rollback mantém JWT e volta adapter seguro                         |
| 5 — Operações de folha                         | F4 estável; matriz de CLOSED aprovada                        | `payroll.input.*`, `payroll.run.*`, `payroll.rubric.*`, `payroll.parameter.*`, `payroll.period.*` | alterar snapshot fechado; regressão API/web e concorrência                 | matriz de writers; aceite: nenhum bypass CLOSED; rollback por família; gate individual                          |
| 6 — Organização                                | administração global/empresarial decidida                    | `company.*`, `organization.*`                                                                     | escopo raiz e BDP-002/012/013; duas empresas e unicidade                   | contratos de empresa/filial; aceite 401/403/404; rollback por controller                                        |
| 7 — Colaboradores, contratos e admissão        | BDP-001/004/005/011 aplicáveis delimitadas                   | `employee.*`, `employment.contract.*`, `admission.*`, capability sensível                         | PII e histórico; mascaramento, leitura sensível, auditoria                 | matriz de dados; aceite sem vazamento; rollback preserva filtro empresarial                                     |
| 8 — Jornada, benefícios, férias e afastamentos | BDP-007/008/010/011 delimitadas                              | `time.*`, `benefit.*`, `vacation.*`, `leave.*`                                                    | políticas materiais e saúde; não implementá-las; isolamento/histórico      | limites por módulo; aceite autorização sem nova regra; rollback por família                                     |
| 9 — Remuneração variável                       | BDP-006 continua autoridade                                  | `variable.compensation.*`                                                                         | criar fórmula/alçada implícita; testes só de acesso/auditoria              | registrar limites; aceite sem efeito material novo; rollback por controller                                     |
| 10 — Telemetria e compatibilidade              | todas as famílias protegidas                                 | aliases marcados deprecated                                                                       | PII em logs e consumidor invisível; métricas agregadas e OpenAPI           | relatório de uso/comunicação; aceite janela cumprida; rollback mantém aliases protegidos                        |
| 11 — Remoção definitiva                        | F10 aceita, zero consumidor ou migração formal               | remover somente contratos obsoletos aprovados                                                     | quebra externa; testes E2E e ausência de referência                        | PR exclusivo, changelog e plano de retorno; aceite pós-merge; nunca remoção incidental                          |

## Detalhamento da Fase 4

Ordem candidata:

1. congelar contratos e consumidores de `/payroll-closures`;
2. testes caracterizadores do envelope atual;
3. adapter para leitura/histórico;
4. delegação de close/reopen ao orquestrador canônico;
5. JWT, empresa e capabilities existentes;
6. telemetria segura e depreciação;
7. migração de `/folha/fechamentos`;
8. janela antes de remoção.

Não se autoriza fallback ao serviço legado após enforcement.

## Detalhamento da Fase 5

Cada família precisa identificar todas as escritas que afetam competência fechada:

- `payroll-inputs`: criar, atualizar/inativar;
- `payroll-runs`: iniciar e acrescentar mensagem com efeito operacional;
- `payroll-rubrics` e `payroll-parameters`: vigência/versão retroativa;
- `payroll-periods`: create/update/open/validate e contratos restantes;
- remuneração variável e eventos financeiros relacionados.

O estado `CLOSED` e o manifesto permanecem imutáveis. Correção material exige reabertura homologada.

## Estratégia de PRs

- `docs/*` para decisão/especificação;
- `feature/*` somente depois do gate humano;
- commits separados por documentação, testes e comportamento quando aplicável;
- PR sempre draft inicialmente, com escopo e rollback;
- checks verdes e revisão dos responsáveis antes de ready/merge;
- verificação pós-merge em `origin/develop` registra hash e ausência de branch concorrente;
- a próxima fase nasce somente da `develop` atualizada.

## Critérios globais de encerramento

- nenhuma rota empresarial sem JWT/capability explícita;
- rotas públicas em allowlist mínima;
- nenhuma empresa do cliente usada como autoridade;
- isolamento, grants, auditoria e dados sensíveis testados;
- aliases delegam ou foram removidos após janela;
- OpenAPI e frontends usam contratos canônicos;
- CI executa PostgreSQL transacional aplicável;
- zero assignment automático não homologado;
- relatório final e aceitação antes de declarar a iniciativa concluída.
