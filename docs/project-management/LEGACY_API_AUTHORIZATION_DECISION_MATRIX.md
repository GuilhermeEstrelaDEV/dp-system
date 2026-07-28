# Matriz de decisões — autorização das APIs legadas

**Status:** `READY FOR HUMAN DECISION`; não homologada
**BDP candidata:** `BDP-AUTH-LEGACY` (identificador provisório)

## Decisões existentes e lacunas

| Tema                            | Fonte           | Estado                  | Decidido                                                   | Ainda pendente                           | Responsáveis           |
| ------------------------------- | --------------- | ----------------------- | ---------------------------------------------------------- | ---------------------------------------- | ---------------------- |
| RBAC híbrido e empresa ativa    | BDP-009         | decidido para v1        | papel por empresa; global só plataforma; folha empresarial | concessão nos módulos legados            | Produto, DP, Segurança |
| `companyId` não autoritativo    | BDP-009/ADR-007 | decidido                | backend resolve contexto                                   | adaptação rota por rota                  | Técnica                |
| `401/403/404`                   | BDP-009/ADR-007 | decidido                | 404 entre empresas                                         | exceções globais e públicas              | Segurança              |
| deny-by-default                 | ADR-007         | decidido                | ausência de capability nega                                | rollout sem quebra                       | Segurança, Técnica     |
| auditoria transacional          | BDP-009/ADR-007 | decidido                | escrita crítica atômica                                    | leituras sensíveis por módulo            | DPO, Segurança         |
| substituição e emergência       | BDP-009         | decidido para mecanismo | grants explícitos, expiráveis                              | capabilities concedíveis                 | Segurança, DP          |
| fechamento canônico             | BDP-014         | decidido                | `PayrollPeriod`, cinco capabilities, idempotência          | assignments e legado `/payroll-closures` | DP, Produto            |
| legado de fechamento            | BDP-014         | parcialmente decidido   | delegar, observar, deprecar sem remoção incidental         | consumidores e janela                    | Produto, Técnica       |
| matriz papel–capability geral   | —               | pendente                | catálogo configurável                                      | concessões por empresa/módulo            | Produto, DP, Segurança |
| administração de empresas       | —               | pendente                | modelo híbrido                                             | quem possui capability global            | Segurança, Diretoria   |
| PII e mascaramento              | BDP-001/011     | bloqueado               | minimização                                                | fontes, retenção e acesso                | Jurídico/DPO, DP       |
| regras materiais de remuneração | BDP-006         | bloqueado               | não presumir                                               | fórmulas, elegibilidade, alçada          | DP, Financeiro         |
| integrações                     | BDP-010         | bloqueado               | fora deste rollout                                         | fornecedores e formatos                  | TI, fornecedores       |
| hierarquia organizacional       | BDP-002/012/013 | parcialmente decidido   | escopo empresarial atual                                   | canonicidade e obrigatoriedade           | RH, Administração      |
| rollback e flags                | —               | pendente                | falha fechada obrigatória                                  | mecanismo e critérios                    | Segurança, Técnica     |
| telemetria/depreciação          | BDP-014 parcial | pendente                | sem PII e sem remoção precoce                              | janela e métricas                        | Produto, DPO, Técnica  |

## Classificação de rotas

| Grupo                                | Estado                  | Condição antes de código                               |
| ------------------------------------ | ----------------------- | ------------------------------------------------------ |
| health e login                       | decidido                | preservar contrato e testes técnicos                   |
| auth/context e grants                | decidido                | regressão da BDP-009                                   |
| payroll review e fechamento canônico | decidido                | não alterar política; assignments continuam humanos    |
| leituras de catálogo organizacional  | parcialmente decidido   | capability e administração global/empresarial          |
| folha legada                         | pendente prioritário    | matriz, closed-state, consumidores e adapters          |
| PII/documentos/afastamentos          | bloqueado               | BDP-001/011 e visibilidade                             |
| remuneração variável                 | bloqueado materialmente | BDP-006; autorização pode ser especificada sem fórmula |
| integrações/exportações              | bloqueado               | BDP-010/011                                            |

## Recomendação

Uma nova BDP é necessária. BDP-009 e BDP-014 fornecem mecanismos e invariantes, mas não autorizam a
matriz transversal de concessões nem a transição das famílias legadas. A implementação permanece
bloqueada até o pacote provisório ser homologado e receber identificador definitivo.

As respostas e aprovações devem ser registradas no
[questionário de homologação](BDP-AUTH-LEGACY_HOMOLOGATION_QUESTIONNAIRE.md) e avaliadas pela
[matriz de aprovação](BDP-AUTH-LEGACY_APPROVAL_MATRIX.md). Esta matriz não cria decisão por si só.
