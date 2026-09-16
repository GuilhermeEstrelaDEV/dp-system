# Production Readiness — Gap Analysis

## Declaração de escopo

Este inventário **não aprova produção**. Ele descreve evidências ausentes ou parciais para uma
avaliação futura, sem alterar Gate D, ETP-015.10 ou qualquer decisão vigente.

Classificações permitidas:

- `DONE`: requisito comprovado para o ambiente-alvo aprovado;
- `PARTIAL`: existe fundação reutilizável, mas falta evidência ou cobertura do ambiente-alvo;
- `PENDING`: requisito conhecido aguardando execução ou validação;
- `BLOCKED_BY_BUSINESS`: depende de decisão formal do negócio;
- `BLOCKED_BY_LEGAL`: depende de Jurídico/DPO ou base legal;
- `NOT_STARTED`: não há implementação/evidência para produção.

## Matriz de lacunas

| Área                | Estado             | Evidência atual                                                                      | Lacuna para produção                                                                             | Evidência mínima futura                                              |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Infraestrutura      | `NOT_STARTED`      | Compose local e preparação de demo não produtiva                                     | Topologia produtiva, segregação, capacidade, hardening e responsabilidades não aprovados         | Diagrama aprovado, IaC revisada, owners e teste no ambiente-alvo     |
| Domínio/DNS         | `NOT_STARTED`      | Nenhum domínio produtivo aprovado                                                    | Propriedade, registros, renovação e processo de mudança                                          | Domínio aprovado, DNS versionado/auditado e plano de rollback        |
| TLS                 | `NOT_STARTED`      | HTTPS pode ser provido por plataforma de demo, sem evidência produtiva               | Certificados, renovação, política TLS e terminação não homologados                               | Varredura TLS, renovação testada e owner registrado                  |
| Banco persistente   | `NOT_STARTED`      | PostgreSQL 16 local e migrations aditivas                                            | Serviço persistente, HA, capacidade, manutenção e privilégios de migration                       | Ambiente-alvo aprovado, sizing, roles mínimas e ensaio de upgrade    |
| Backup              | `NOT_STARTED`      | Ensaios locais não equivalem a backup produtivo                                      | Política, criptografia, frequência, retenção e monitoramento                                     | Backup automatizado recuperável e evidência datada                   |
| Restore             | `NOT_STARTED`      | Restore local isolado já foi exercitado em etapas anteriores                         | Restore do ambiente-alvo e responsabilidades não comprovados                                     | Restore completo cronometrado com validação funcional                |
| Disaster recovery   | `NOT_STARTED`      | Nenhum plano produtivo aprovado                                                      | Região/local alternativo, runbook, comunicação, RPO e RTO                                        | DR testado com resultado e aceite dos responsáveis                   |
| Secrets             | `PARTIAL`          | Validação de ambiente e ausência de segredo real versionado                          | Vault/KMS, rotação, acesso mínimo, inventário e resposta a vazamento                             | Gestão central, rotação testada e trilha de acesso                   |
| Observabilidade     | `PARTIAL`          | Health checks, logs estruturados e correlação existem                                | Plataforma, SLOs, traces, dashboards e ownership produtivos                                      | Dashboards/SLOs e exercício de incidente                             |
| Métricas            | `PARTIAL`          | Há sinais técnicos e verificadores de demo                                           | Métricas RED/USE e métricas de negócio aprovadas não estão consolidadas                          | Catálogo, cardinalidade, retenção e dashboards aprovados             |
| Alertas             | `NOT_STARTED`      | Sem plantão ou política produtiva                                                    | Limiares, roteamento, escalonamento e teste de entrega                                           | Alertas acionáveis e simulação com responsáveis                      |
| Logs                | `PARTIAL`          | Logs estruturados evitam body/headers e respostas 5xx são sanitizadas                | Centralização, acesso, retenção, redaction contínua e correlação entre serviços                  | Pipeline seguro, testes de redaction e consulta operacional          |
| Retenção            | `BLOCKED_BY_LEGAL` | Preservação append-only existe em domínios aprovados                                 | Prazos, descarte, legal hold e retenção por categoria dependem da BDP-011                        | Decisão Jurídico/DPO e testes de ciclo de vida                       |
| LGPD                | `BLOCKED_BY_LEGAL` | Minimização e projeções restritas foram adotadas                                     | Bases legais, direitos dos titulares, RIPD quando aplicável e governança final                   | Aprovação Jurídico/DPO, inventário e procedimentos exercitados       |
| PII                 | `PARTIAL`          | CPF e perfil têm projeção mínima; auditoria evita payload sensível                   | Catálogo completo, masking final, finalidade e revisão de todos os fluxos                        | Classificação aprovada, testes negativos e matriz de acesso          |
| Auditoria           | `PARTIAL`          | Eventos transacionais, append-only e metadados allowlist existem                     | Retenção, consulta administrativa, exportação, monitoramento e cobertura final                   | Cobertura aprovada, consulta segura e retenção definida              |
| Segurança           | `PARTIAL`          | JWT, deny-by-default, capabilities, isolamento e testes negativos existem            | Threat model produtivo, pentest, hardening, gestão de vulnerabilidades e revisão de dependências | Pentest, zero risco não aceito, plano de patch e aceite de Segurança |
| CI/CD               | `PARTIAL`          | CI executa validações do monorepo                                                    | Pipeline produtivo, promoção, aprovação, artefatos imutáveis e segregação não existem            | Pipeline aprovado com artefato assinado e gates humanos              |
| Rollback            | `PARTIAL`          | Há runbooks e comportamento reversível em entregas específicas                       | Rollback integrado de aplicação/dados no ambiente-alvo não foi ensaiado                          | Ensaio completo com critérios de abortar e responsáveis              |
| Rate limiting       | `NOT_STARTED`      | Nenhuma política produtiva consolidada                                               | Limites por superfície, identidade, empresa e abuso                                              | Política aprovada e testes de carga/negação segura                   |
| Disponibilidade     | `NOT_STARTED`      | Demo e local não possuem SLA                                                         | SLO/SLA, redundância, manutenção, capacidade e tolerância a falhas                               | SLO aprovado e testes de resiliência/capacidade                      |
| Custos              | `NOT_STARTED`      | Nenhum orçamento produtivo aprovado                                                  | Forecast, limites, tags, alertas e owner financeiro                                              | Estimativa aprovada e monitoramento de custo                         |
| Ambientes           | `PARTIAL`          | Local/demo usam dados fictícios e controles próprios                                 | Estratégia dev/homologação/produção, paridade e promoção ainda não aprovadas                     | Matriz de ambientes, dados, acessos e promoção                       |
| Homologação         | `PENDING`          | Automação passou em baselines anteriores; execução humana funcional permanece aberta | 22 jornadas, evidências, reteste e aceite formal                                                 | Matriz concluída, zero P0 aberto e decisão humana                    |
| Suporte operacional | `NOT_STARTED`      | Runbooks de demo existem                                                             | Modelo de suporte, plantão, SLAs, comunicação e gestão de incidentes                             | RACI, contatos, runbooks e exercício de incidente                    |

## Bloqueios transversais

- [BDP-001 e BDP-011](../project-management/BUSINESS_DECISIONS_PENDING.md) continuam materiais para
  origem, exposição, retenção, descarte e exportação de dados pessoais;
- a exceção de dependências registrada para homologação local não é aprovação produtiva;
- PR #104 e PR #105 permanecem trabalhos abertos e não compõem a baseline `develop` deste
  inventário;
- a homologação humana deve ser registrada na
  [matriz própria](../homologation/HUMAN_HOMOLOGATION_MATRIX.md);
- nenhum item `DONE` foi atribuído apenas porque existe evidência local ou de demo.

## Condição para nova avaliação

Uma futura análise de produção exige ambiente-alvo identificado, owners formais, decisões legais e
de negócio aplicáveis, evidência operacional reproduzível e revisão independente de Segurança.
Até lá, o estado permanece `NOT AUTHORIZED FOR PRODUCTION` e Gate D permanece `NOT STARTED`.
