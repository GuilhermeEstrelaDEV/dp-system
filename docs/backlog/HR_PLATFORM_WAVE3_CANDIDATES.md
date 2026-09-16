# HR Platform — Wave 3 Candidates

## Estado

`CANDIDATE BACKLOG — NOT APPROVED`

Este documento não cria escopo, cronograma, capability, endpoint, migration ou autorização. A Wave
2 está no PR #104 aberto e deve ser integrada e homologada antes de qualquer decisão de Wave 3.
Cada candidato exige discovery, decisão de dados, owner e critérios de aceite próprios.

## REPORTING

| Candidato                                       | Valor potencial                           | Dependências e limites                                             | Estado                     |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| Resumo de quadro por empresa/status             | Visão gerencial sem navegar por registros | Somente agregados aprovados; impedir inferência de grupos pequenos | `CANDIDATE — NOT APPROVED` |
| Relatório operacional de admissões pendentes    | Priorizar checklists e etapas             | Templates/prazos oficiais ainda dependem de decisão                | `CANDIDATE — NOT APPROVED` |
| Relatório administrativo de férias/afastamentos | Apoiar planejamento                       | Sem interpretar conformidade legal ou expor saúde                  | `CANDIDATE — NOT APPROVED` |
| Resumo de competência e fechamento              | Consolidar prontidão, versões e blockers  | Reutilizar contratos canônicos; sem novo cálculo                   | `CANDIDATE — NOT APPROVED` |

## EXPORTS

| Candidato                                  | Valor potencial                                    | Dependências e limites                                         | Estado                           |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| CSV de listas administrativas              | Facilitar análise autorizada                       | BDP-011, allowlist de campos, auditoria e expiração do arquivo | `BLOCKED — BDP-011`              |
| Exportação de relatório agregado           | Compartilhar indicadores sem registros individuais | Limites de granularidade e finalidade aprovados                | `CANDIDATE — NOT APPROVED`       |
| Exportação assíncrona para grandes volumes | Evitar timeout em bases maiores                    | Job seguro, storage, TTL, revogação e observabilidade          | `BLOCKED — ARCHITECTURE/BDP-011` |

## HISTORY

| Candidato                                          | Valor potencial                        | Dependências e limites                                | Estado                        |
| -------------------------------------------------- | -------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| Timeline consolidada do colaborador                | Unir eventos já existentes por pessoa  | Projeção mínima, ordenação e acesso por empresa       | `CANDIDATE — NOT APPROVED`    |
| Histórico organizacional do vínculo                | Explicar mudanças de lotação/cargo     | BDP-002/013 e modelo temporal                         | `BLOCKED — BUSINESS DECISION` |
| Visão consolidada de contratos                     | Facilitar auditoria do vínculo         | Não incluir salário enquanto BDP-004 estiver pendente | `CANDIDATE — RESTRICTED`      |
| Evidências de fechamento na jornada do colaborador | Relacionar períodos sem duplicar regra | Somente referências canônicas e dados mínimos         | `CANDIDATE — NOT APPROVED`    |

## SEARCH

| Candidato                          | Valor potencial                           | Dependências e limites                                    | Estado                         |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------------- | ------------------------------ |
| Busca global de navegação          | Encontrar módulos e ações autorizadas     | Resultados condicionados à capability; sem PII            | `CANDIDATE — NOT APPROVED`     |
| Busca empresarial de colaboradores | Encontrar pessoas por atributos aprovados | Não pesquisar CPF; company scope e paginação obrigatórios | `CANDIDATE — NOT APPROVED`     |
| Filtros organizacionais compostos  | Refinar listas por estrutura              | Opções paginadas e relações canônicas                     | `BLOCKED — PAGINATION/BDP-013` |
| Histórico de buscas                | Melhorar produtividade                    | Privacidade, retenção e telemetria ainda não aprovadas    | `BLOCKED — BDP-011`            |

## UX

| Candidato                                        | Valor potencial                        | Dependências e limites                                         | Estado                     |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| Centro acessível de notificações de sucesso/erro | Padronizar feedback entre fluxos       | Sem notificações externas ou regra de escalonamento            | `CANDIDATE — NOT APPROVED` |
| Seletores contextuais no lugar de UUIDs          | Reduzir erro de digitação              | Endpoints de opções paginados e company-scoped                 | `CANDIDATE — NOT APPROVED` |
| Estados vazios orientados à próxima ação         | Melhorar descoberta                    | Ação só aparece com capability correspondente                  | `CANDIDATE — NOT APPROVED` |
| Evidência visual por viewport                    | Tornar regressão responsiva comparável | Matriz de homologação e armazenamento de artefatos sanitizados | `CANDIDATE — NOT APPROVED` |

## PERFORMANCE

| Candidato                    | Valor potencial                  | Dependências e limites                            | Estado                     |
| ---------------------------- | -------------------------------- | ------------------------------------------------- | -------------------------- |
| Paginação canônica de listas | Controlar volume e latência      | Evolução contratual compatível por família        | `CANDIDATE — NOT APPROVED` |
| Code splitting por rota      | Reduzir bundle inicial           | Medição, orçamento e teste de navegação           | `CANDIDATE — NOT APPROVED` |
| Perfil de queries críticas   | Detectar N+1 e índices faltantes | Dataset representativo sem dados reais            | `CANDIDATE — NOT APPROVED` |
| Cache de leitura por empresa | Reduzir consultas repetidas      | Chaves com company/principal e invalidação segura | `CANDIDATE — NOT APPROVED` |

## ADMINISTRATION

| Candidato                           | Valor potencial                      | Dependências e limites                                 | Estado                     |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------ | -------------------------- |
| Consulta de assignments temporários | Apoiar revisão de acessos            | Capability administrativa específica e projeção mínima | `CANDIDATE — NOT APPROVED` |
| Gestão de catálogos demonstrativos  | Centralizar configurações existentes | Não transformar parâmetro em regra legal               | `CANDIDATE — NOT APPROVED` |
| Painel de integridade empresarial   | Identificar relações inválidas       | Somente diagnóstico; correção exige comando auditado   | `CANDIDATE — NOT APPROVED` |
| Gestão documental                   | Centralizar documentos               | Storage, tipos, retenção e acesso dependem da BDP-011  | `BLOCKED — BDP-011`        |

## AUDIT

| Candidato                            | Valor potencial                             | Dependências e limites                                | Estado                     |
| ------------------------------------ | ------------------------------------------- | ----------------------------------------------------- | -------------------------- |
| Consulta administrativa de AuditLog  | Investigar ações sem acesso direto ao banco | Capability, paginação, masking e retenção             | `CANDIDATE — NOT APPROVED` |
| Cobertura de leituras sensíveis      | Evidenciar acesso a PII                     | Classificação por campo e decisão de volume/retention | `BLOCKED — BDP-011`        |
| Relatório de segregação de funções   | Identificar grants conflitantes             | Matriz final por ação e owner operacional             | `CANDIDATE — NOT APPROVED` |
| Exportação de evidência de auditoria | Atender investigação controlada             | Integridade, assinatura, expiração e BDP-011          | `BLOCKED — BDP-011`        |

## OPERATIONS

| Candidato                           | Valor potencial                   | Dependências e limites                                     | Estado                         |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------- | ------------------------------ |
| Dashboard de saúde operacional      | Tornar falhas visíveis ao suporte | SLOs, métricas e alertas aprovados                         | `CANDIDATE — NOT APPROVED`     |
| Catálogo de jobs e concorrência     | Preparar automações futuras       | Nenhum scheduler existe/aprovado; idempotência obrigatória | `CANDIDATE — NOT APPROVED`     |
| Runbook de incidentes e suporte     | Padronizar resposta               | RACI, contatos, severidade e comunicação                   | `CANDIDATE — NOT APPROVED`     |
| Exercício de backup/restore do alvo | Evidenciar recuperação            | Ambiente-alvo, RPO/RTO e responsável                       | `BLOCKED — TARGET ENVIRONMENT` |

## Gates mínimos para converter candidato em escopo

1. Wave 2 integrada, retestada e homologada.
2. Resultado humano e feedback relevante registrados.
3. Owner de Produto e owner operacional definidos.
4. BDPs, Jurídico/DPO e Segurança resolvidos quando aplicáveis.
5. Dados, projection, capability, auditoria e isolamento explicitamente definidos.
6. Critérios de aceite, rollback e evidência aprovados.
7. Estimativa e prioridade comparadas aos débitos do
   [registro técnico](../technical/TECHNICAL_DEBT_REGISTER.md).

Até esses gates serem satisfeitos, todos os itens permanecem candidatos não vinculantes e não
autorizam Wave 3.
