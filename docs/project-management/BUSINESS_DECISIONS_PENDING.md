# Business Decisions Pending

**Status geral:** Pendente. Estas decisões não bloqueiam a ETP-002, mas devem ser resolvidas antes dos incrementos de domínio afetados.

| ID      | Descrição                                                                                                         | Impacto                                                   | Prioridade | Responsável pela validação       | Status   |
| ------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- | -------------------------------- | -------- |
| BDP-001 | Confirmar a fonte oficial de CPF, data de nascimento, endereço, dados bancários e dependentes.                    | Migração de colaboradores, documentos, LGPD e eSocial.    | Crítica    | Coordenação de DP                | Pendente |
| BDP-002 | Confirmar se `N.SETOR` e `N.CARGO` são as fontes canônicas de setor e cargo.                                      | Migração de estrutura e histórico contratual.             | Alta       | Coordenação de DP e RH           | Pendente |
| BDP-003 | Definir a diferença e a prioridade entre Código ADM, código do funcionário no ADM, matrícula e registro contábil. | Unicidade, importação e integração com sistemas externos. | Crítica    | DP e TI/fornecedor ADM           | Pendente |
| BDP-004 | Definir a fonte oficial do salário, sua vigência e o tratamento de reajustes.                                     | Histórico contratual, folha e auditoria.                  | Crítica    | DP e Financeiro                  | Pendente |
| BDP-005 | Confirmar a empresa de cada vínculo e a regra para marcadores múltiplos da planilha.                              | Isolamento multiempresa, folha e eSocial.                 | Crítica    | DP e Administração               | Pendente |
| BDP-006 | Homologar regras de comissão, prêmio, adicional, quinquênio, descontos e pagamentos por fora.                     | Motor de folha e remuneração variável.                    | Alta       | DP, Financeiro e Diretoria       | Pendente |
| BDP-007 | Definir políticas de jornada, banco de horas, compensação, fonte de ponto e exceções.                             | Jornada, folha e relatórios.                              | Alta       | DP, Gestores e Jurídico/Contábil | Pendente |
| BDP-008 | Definir regras de VT/VR, benefícios, elegibilidade, descontos e documentos de recusa.                             | Benefícios e eventos de folha.                            | Alta       | RH e DP                          | Pendente |
| BDP-009 | Definir alçadas de aprovação para folha, rescisão, parâmetros legais e acessos emergenciais.                      | Permissões, segregação de funções e auditoria.            | Crítica    | Diretoria, DP e Financeiro       | Pendente |
| BDP-010 | Confirmar fornecedores, formatos e responsabilidades para ponto, contabilidade, assinatura e eSocial.             | Adaptadores de integração e cronograma.                   | Média      | TI, DP e fornecedores            | Pendente |
| BDP-011 | Definir retenção documental, acesso a dados médicos, descarte, exportação e política LGPD.                        | Segurança, auditoria e armazenamento de documentos.       | Crítica    | Diretoria, Jurídico/DPO e DP     | Pendente |
| BDP-012 | Definir organização raiz e regra definitiva de unicidade fiscal entre empresas do mesmo grupo.                    | Isolamento multiempresa e evolução de dados.              | Alta       | Administração e TI               | Pendente |
| BDP-013 | Confirmar hierarquia, vigência e eventual obrigatoriedade de filial para departamentos.                           | Estrutura organizacional e vínculos futuros.              | Alta       | RH e Departamento Pessoal        | Pendente |

## Aplicação segura na ETP-005

- BDP-001 e BDP-011: endereço, documentos, banco, dependentes e demais dados sensíveis não foram implementados.
- BDP-003: a matrícula é manual e única por empresa; não há migração ou geração automática.
- BDP-004: salário e histórico salarial foram adiados integralmente.
- BDP-005: o serviço impede mais de um contrato ativo por colaborador e empresa, sem decidir a regra futura para vínculos múltiplos.
- BDP-013: filial, departamento e centro de custo permanecem opcionais; quando informados, precisam ser compatíveis com a empresa.

## Aplicação segura na ETP-006

- BDP-001 e BDP-011: a etapa não coleta, armazena ou transmite documentos pessoais; os requisitos documentais são apenas rótulos e estados lógicos.
- BDP-011: retenção, acesso, descarte, lista oficial de documentos e qualquer upload permanecem fora do escopo até validação de DP, Jurídico e DPO.
- Nova decisão necessária: validar templates oficiais, responsáveis, prazos legais e critérios de aceite do checklist antes de uso operacional. A ETP-006 usa somente prazos internos configuráveis e demonstrativos.

## Aplicação segura na ETP-008

- BDP-008: o catálogo é parametrizável e demonstrativo; elegibilidade material, políticas de adesão/recusa, documentos, descontos e regras de coparticipação não foram implementados.
- BDP-011: o módulo não coleta dados médicos, laudos, documentos, dependentes ou qualquer dado pessoal novo.
- Valores registrados são somente insumos futuros, sem cálculo, retenção, lançamento ou integração de folha.

## Aplicação segura na ETP-009

- Regras de férias, fracionamento, aviso, conversão, pagamento e prazos não foram implementadas sem fonte oficial e homologação de DP/Jurídico.
- Afastamentos não armazenam dados de saúde, diagnóstico, CID, documentos ou evidências.
- O módulo usa apenas tipos e datas administrativas configuráveis, sem declaração de conformidade legal.

## Gestão

- Cada decisão será atualizada para `Em análise`, `Aprovada` ou `Descartada`, com data, evidência e responsável.
- A implementação do módulo relacionado deve referenciar o ID da decisão e não poderá assumir regra diferente sem nova decisão documentada.
- Decisões aprovadas que alterem arquitetura, dados ou segurança exigem ADR correspondente.
