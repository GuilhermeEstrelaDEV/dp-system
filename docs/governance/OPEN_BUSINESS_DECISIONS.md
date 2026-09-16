# Decisões de negócio abertas

## Propósito

Este registro consolida decisões ainda abertas a partir de
[Business Decisions Pending](../project-management/BUSINESS_DECISIONS_PENDING.md) e
[Business/Legal Decisions Required](../product/BUSINESS_LEGAL_DECISIONS_REQUIRED.md). Ele não
resolve, renumera ou aprova nenhuma decisão.

BDP-009, BDP-014 e BDP-AUTH-LEGACY não aparecem como pendentes porque possuem resolução aprovada.
As BDPs abaixo preservam o status `PENDING` da fonte.

## Decisões numeradas pendentes

| ID      | Problema                                                                       | Decisão necessária                                                                                                             | Impacto                                        | Áreas afetadas                                                     | Quem precisa decidir                                             | Consequência de não decidir                                                           |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| BDP-001 | A origem confiável de dados pessoais e familiares não está consolidada         | Confirmar fontes oficiais, autoridade de atualização e minimização de CPF, nascimento, endereço, dados bancários e dependentes | Migração, qualidade, privacidade e integrações | Employee, Admission, documentos, folha, eSocial                    | Coordenação de DP com Jurídico/DPO e TI quando houver integração | Campos sem fonte permanecem opcionais/omitidos; migração e automação ficam bloqueadas |
| BDP-002 | Setor e cargo possuem fontes legadas potencialmente concorrentes               | Confirmar se `N.SETOR` e `N.CARGO` são canônicos e como divergências são tratadas                                              | Estrutura e histórico                          | Organização, contrato, importação                                  | DP e RH                                                          | Migração estrutural e organograma definitivo permanecem bloqueados                    |
| BDP-003 | Matrícula, código ADM e registro contábil não têm prioridade definida          | Definir semântica, geração e unicidade de cada identificador                                                                   | Integridade e interoperabilidade               | Employee, Contract, Admission, integrações                         | DP e TI/fornecedor ADM                                           | Importação automática e reconciliação ficam bloqueadas                                |
| BDP-004 | Fonte e vigência salarial não estão homologadas                                | Definir fonte oficial, vigência, reajustes, correções e visibilidade                                                           | Histórico contratual e folha                   | Contract, payroll, auditoria, relatórios                           | DP e Financeiro                                                  | Salário e histórico salarial permanecem fora do produto operacional                   |
| BDP-005 | Marcadores legados podem associar um vínculo a mais de uma empresa             | Definir empresa canônica e tratamento de conflitos/múltiplos marcadores                                                        | Isolamento empresarial e folha                 | Contract, payroll, importação, eSocial                             | DP e Administração                                               | Importação ambígua e vínculo multiempresa não podem ser automatizados                 |
| BDP-006 | Regras de remuneração variável não estão homologadas                           | Aprovar tipos, elegibilidade, fórmulas, percentuais, incidências e exceções                                                    | Valores de folha e fechamento                  | Variable Compensation, Payroll, Financeiro                         | DP, Financeiro e Diretoria                                       | Eventos permanecem administrativos, sem cálculo ou efeito financeiro automático       |
| BDP-007 | Jornada e banco de horas não têm política canônica                             | Definir fonte de ponto, escalas, compensação, fechamento e exceções                                                            | Jornada, folha e relatórios                    | Time, Payroll, integrações                                         | DP, Gestores e Jurídico/Contábil                                 | Registros não representam apuração legal nem cálculo de folha                         |
| BDP-008 | Benefícios não possuem regras materiais aprovadas                              | Definir elegibilidade, adesão/recusa, descontos, coparticipação e documentos                                                   | Benefícios e folha                             | Benefits, Employee, Payroll                                        | RH e DP                                                          | Catálogo e adesões permanecem demonstrativos e sem efeitos de folha                   |
| BDP-010 | Fornecedores e contratos de integração não estão definidos                     | Confirmar formatos, responsabilidades, segurança, SLA e reconciliação                                                          | Integrações e operação                         | Ponto, eSocial, bancos, contabilidade, assinatura                  | TI, DP e fornecedores                                            | Nenhuma integração externa pode ser iniciada                                          |
| BDP-011 | Não existe política final de ciclo de vida e acesso a dados pessoais/sensíveis | Definir retenção, descarte, acesso médico, exportação, legal hold e atendimento ao titular                                     | LGPD, segurança, auditoria e storage           | Todos os módulos com PII, documentos, logs, auditoria e exportação | Diretoria, Jurídico/DPO e DP                                     | Upload, exportação ampla, retenção automatizada e produção permanecem bloqueados      |
| BDP-012 | Organização raiz e unicidade fiscal do grupo não estão definidas               | Definir raiz, escopo global/empresarial e unicidade entre empresas                                                             | Multiempresa e cadastro fiscal                 | Company, identidade, isolamento, integrações                       | Administração e TI                                               | Evolução global de Company e relações de grupo permanece bloqueada                    |
| BDP-013 | Hierarquia organizacional e obrigatoriedade de filial são incertas             | Definir hierarquia, vigência, subordinação e regras de filial                                                                  | Estrutura, vínculos e gestão                   | Organization, Contract, portal do gestor                           | RH e DP                                                          | Organograma completo, escopo gestor-equipe e obrigatoriedades ficam bloqueados        |

## Foco crítico — BDP-001

Antes de ampliar o perfil pessoal ou importar dados, a decisão deve registrar ao menos:

- sistema/fonte responsável por cada atributo;
- quem pode criar, corrigir e contestar o dado;
- regra de reconciliação e evidência de origem;
- identidade da pessoa entre empresas e eventual unicidade de CPF;
- tratamento de legado incompleto e campos anuláveis;
- dados deliberadamente não coletados.

A implementação aditiva do
[Employee Profile](../product/EMPLOYEE_PROFILE_EXPANSION.md) não resolve a fonte canônica nem
autoriza novos documentos, dados bancários ou dependentes.

## Foco crítico — BDP-011

Uma resolução precisa cobrir, por categoria de dado:

- finalidade e base legal;
- perfis de acesso e dados médicos/sensíveis;
- retenção, descarte, anonimização e legal hold;
- exportação, portabilidade e rastreabilidade do arquivo;
- storage, criptografia, backup e restauração;
- atendimento a titulares, incidentes e responsabilização;
- compatibilidade com eventos append-only e obrigações de auditoria.

Enquanto pendente, relatórios/exportações de PII, gestão documental, políticas automáticas de
retenção e produção permanecem bloqueados.

## Decisões adicionais sem BDP definitiva

Estes temas já aparecem na documentação, mas não recebem novo identificador BDP neste registro:

| Tema                      | Decisão necessária                                                          | Áreas afetadas                      | Quem precisa decidir                 | Consequência de não decidir                                             |
| ------------------------- | --------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Templates admissionais    | Lista oficial, responsáveis, prazos e critérios de aceite                   | Admission, documentos               | DP, Jurídico/DPO                     | Checklist continua lógico/demonstrativo, sem upload oficial             |
| Desligamento              | Workflow, motivos, documentos, aprovações e limite entre processo e cálculo | Employee, Contract, Payroll         | DP, Jurídico, Financeiro             | Desligamento e rescisão funcional permanecem fora do escopo             |
| Autoatendimento           | Vínculo canônico `User–Employee` e projeção de dados próprios               | Identity, Employee, frontend        | Produto, Segurança, Jurídico/DPO     | Portal do colaborador permanece bloqueado                               |
| Gestão de equipe          | Relação gestor-equipe, substituição e visibilidade                          | Organization, Employee, autorização | RH, Produto, Segurança               | Portal do gestor e organograma funcional permanecem bloqueados          |
| Pesquisas internas        | Anonimato, finalidade, retenção e acesso a resultados                       | Employee experience, analytics      | Produto, RH, Jurídico/DPO            | Pesquisas/eNPS permanecem bloqueadas                                    |
| Relatórios e exportações  | Finalidade, campos permitidos, masking, retenção e revogação                | Todos os domínios                   | Produto, DP, Segurança, Jurídico/DPO | Wave 3 só pode tratar candidatos não sensíveis ou permanecer documental |
| Responsáveis operacionais | Accountable owner por família funcional                                     | Governança e operação               | Produto/Diretoria                    | Rollout de nova família não deve avançar sem owner explícito            |

## Regra de atualização

Uma decisão só deixa este registro após documento formal com alternativa escolhida, aprovadores,
data, justificativa, impactos, exceções e vínculo à implementação. Ausência de decisão nunca deve
ser interpretada como permissão para usar um default de mercado.
