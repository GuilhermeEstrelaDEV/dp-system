# ETP-001 — Dicionário de dados inicial

**Status:** rascunho técnico concluído; pendente de validação do responsável de DP.
**Escopo:** base `GERAL`, seções de `LANCAMENTOS` e dependências necessárias ao primeiro módulo de colaboradores e contratos.

## Convenções

| Classificação  | Significado                                               | Tratamento no ERP                                  |
| -------------- | --------------------------------------------------------- | -------------------------------------------------- |
| Dado mestre    | Informação estável reutilizada por processos              | Entidade normalizada e histórico quando necessário |
| Evento         | Ocorrência com data/competência                           | Registro imutável e auditável                      |
| Regra derivada | Resultado de fórmula ou parâmetro                         | Serviço de domínio ou parâmetro com vigência       |
| Workflow       | Controle de execução/pendência                            | Template e instância de checklist                  |
| Documento      | Conteúdo ou saída de impressão                            | Template versionado e documento gerado             |
| Legado         | Cópia, apoio temporário ou resultado sem origem confiável | Arquivamento; não migrar operacionalmente          |

## Fonte e qualidade observada

- A aba `GERAL` tem 82 registros preenchidos no campo de funcionário e 176 colunas.
- Os campos de identificação, benefícios, jornada e acompanhamento coexistem com colunas derivadas por fórmula.
- Empresa, dados de impressão, períodos de experiência e muitos vencimentos são calculados. Eles não são fonte primária de migração.
- Há erros persistidos de referência, busca, divisão e valor em abas centrais e auxiliares. Nenhum resultado com erro será importado.

## Mapeamento — cadastro e contrato

| Origem Excel                                    | Classificação          | Destino proposto                           | Transformação/regra                                                | Qualidade/decisão necessária                       |
| ----------------------------------------------- | ---------------------- | ------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------- |
| `GERAL.B` Funcionário                           | Dado mestre            | `employees.legal_name`                     | Aparar espaços e padronizar capitalização sem alterar grafia legal | Confirmar se representa nome civil completo        |
| `GERAL.D` Conhecido por                         | Dado mestre            | `employees.preferred_name`                 | Opcional                                                           | Manter separado do nome legal                      |
| `GERAL.C` Código ADM                            | Dado mestre externo    | `employee_external_ids`                    | Tipo `adm_code`; unicidade por empresa                             | Confirmar sistema de origem ADM                    |
| `GERAL.Q` Código do funcionário no ADM          | Dado mestre externo    | `employee_external_ids`                    | Tipo `adm_employee_code`; preservar como texto                     | Validar relação com código ADM                     |
| `GERAL.Z` Matrícula                             | Dado mestre externo    | `employment_contracts.registration_number` | Única por empresa e vínculo                                        | Tratar ausência e duplicidade antes da carga       |
| `GERAL.BU` CTPS                                 | Documento pessoal      | `employee_documents`                       | Tipo, número, emissor e validade quando disponíveis                | Não usar como chave; completar dados ausentes      |
| `GERAL.AU` Data de admissão                     | Evento de vínculo      | `employment_contracts.start_date`          | Data obrigatória para vínculo ativo                                | Validar datas inválidas e recontratações           |
| `GERAL.AT` Data de desligamento e `G` Desligado | Evento de desligamento | `terminations` e status do contrato        | Não encerrar apenas pelo indicador; data e motivo são obrigatórios | Há divergência potencial entre flag e data         |
| `GERAL.AM` N.Setor                              | Dado mestre            | `departments.name` / vínculo do contrato   | Normalizar, deduplicar e relacionar à empresa                      | Confirmar que é fonte canônica de setor            |
| `GERAL.AN` N.Cargo                              | Dado mestre            | `job_positions.name` / vínculo do contrato | Normalizar, deduplicar e relacionar à empresa                      | Confirmar que é fonte canônica de cargo            |
| `GERAL.AH/AI` Setor/Cargo                       | Regra derivada         | Não importar diretamente                   | Recalcular a partir de entidades canônicas                         | São predominantemente fórmulas                     |
| `GERAL.P` Carga horária semanal                 | Dado mestre contratual | `work_schedules.weekly_hours`              | Converter para decimal positivo                                    | Validar jornadas especiais                         |
| `GERAL.Y`, `BM`, `BP`, `CJ`, `CK`               | Dado mestre contratual | `work_schedules` e `collective_agreements` | Estruturar dias, intervalos, horário e acordo                      | Texto livre requer padronização antes da carga     |
| `GERAL.BV` Salário base/mínimo                  | Regra/valor contratual | `compensation_history.base_salary`         | Importar somente após identificar origem e vigência                | A coluna mistura valores digitados e fórmulas      |
| `GERAL.CQ/CR/CS` Empresa/CNPJ/endereço          | Regra derivada         | `companies` e `establishments`             | Recalcular pelo vínculo do contrato                                | Não importar resultado de fórmula como fonte       |
| `GERAL.BG:BJ/BK` marcadores de empresa          | Dado mestre de vínculo | `employment_contracts.company_id`          | Converter flags em uma única empresa obrigatória                   | Confirmar regra quando houver múltiplos marcadores |

## Mapeamento — benefícios, pagamentos e remuneração

| Origem Excel                                    | Classificação             | Destino proposto                             | Transformação/regra                                                                  |
| ----------------------------------------------- | ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `M`, `N`, `L`, `AD`, `AE` — VT/VR               | Dado mestre de benefício  | `benefit_enrollments`                        | Elegibilidade, periodicidade, próximo ciclo e status; não armazenar texto como regra |
| `AO`, `AP`, `AW`, `CA` — valores e ajuste de VT | Evento/regra              | `benefit_enrollments` e `payroll_inputs`     | Valor contratado separado de ajuste específico por competência                       |
| `BA` — carta de desistência de VT               | Documento/workflow        | `generated_documents` e checklist            | Exigir evidência documental quando aplicável                                         |
| `AR` — forma de recebimento                     | Dado mestre               | `payment_methods` / vínculo de pagamento     | Usar enumeração controlada; dados bancários serão fonte própria                      |
| `AF`, `CC` — pensão                             | Regra contratual/judicial | `garnishments`                               | Valor, percentual, beneficiário, processo e vigência; dados atuais são insuficientes |
| `AB`, `BY`, `BZ`, `AS`, `CI`                    | Regra/remuneração         | `compensation_components` e `payroll_inputs` | Gratificação, adicional, prêmio, comissão e quinquênio devem ter rubrica e vigência  |
| `CB`, `CH` — hora extra                         | Regra/evento              | `time_events` e `payroll_inputs`             | A apuração pertence à jornada; a folha recebe evento consolidado                     |
| `CG` — mensalidade sindical                     | Desconto                  | `recurring_deductions`                       | Exigir autorização, valor e vigência                                                 |

## Mapeamento — prazos, segurança e workflows

| Origem Excel                                | Classificação            | Destino proposto                                               | Transformação/regra                                                                             |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `K`, `EC`, `ED` — férias                    | Evento/regra             | `vacation_periods`, `vacation_requests` e `employee_deadlines` | Período aquisitivo e concessivo calculados pelo domínio; ajustes migrados como evento histórico |
| `CY:DF`, `EI:ET` — experiências             | Regra/workflow           | `probation_periods` e `employee_deadlines`                     | Criar marcos de 30/90 dias ou estágio conforme tipo de contrato                                 |
| `CL:CN`, `DW:DX`, `EW:EX` — uniforme        | Ativo/documento/workflow | `employee_assets`, checklist e documentos                      | Tipo, tamanho, entrega e renovação em registros separados                                       |
| `DY:DZ`, `EH`, `EZ`, `EA:EB`, `EE:EF`, `EG` | Documento/prazo          | `employee_compliance_records` e `employee_deadlines`           | CNH, toxicológico, cursos, EPI, atestado e CIPA com validade e evidência                        |
| `CO`, `FO:FQ` — processo admissional        | Workflow                 | `checklist_templates` e `checklist_instances`                  | Não migrar texto de célula como status; converter itens e responsáveis                          |
| `I`, `J` — acompanhamentos/observações      | Nota operacional         | `employee_notes`                                               | Classificar confidencialidade, autor e visibilidade; revisar conteúdo antes da importação       |

## Lançamentos: conversão por seção

| Seção da aba `LANCAMENTOS`                                   | Classificação             | Destino no ERP                                               |
| ------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------ |
| Faltas e folgas                                              | Evento de jornada         | `time_events` e `payroll_inputs`                             |
| Férias                                                       | Evento de férias/folha    | `vacation_requests` e `payroll_inputs`                       |
| VT e alimentação                                             | Benefício/ajuste          | `benefit_enrollments` e `payroll_inputs`                     |
| Adiantamento salarial                                        | Evento financeiro         | `salary_advances` e desconto na folha                        |
| Hora extra e banco de horas                                  | Jornada e evento de folha | `time_events`, `time_balances`, `payroll_inputs`             |
| Comissão, prêmio e outros                                    | Remuneração variável      | `variable_compensation_events` e `payroll_inputs`            |
| Salário proporcional, quinquênio, pensão e adicional noturno | Regra de folha            | Rubricas e serviços de cálculo                               |
| FGTS, INSS, IRRF e guias                                     | Resultado/regra           | `payroll_calculations`, `tax_calculations`, `payment_guides` |
| Conferência de folha e contracheque por fora                 | Conferência/ajuste        | `payroll_reconciliations` e `off_cycle_payments`             |

## Campos ausentes ou insuficientes para carga produtiva

Os campos a seguir não devem ser inferidos e precisam de fonte validada antes da migração: CPF, data de nascimento, sexo, endereço completo, dados bancários, dependentes detalhados, categoria eSocial, tipo de contrato, motivo de desligamento, sindicato, lotação tributária e dados completos dos documentos.

## Regras de saneamento antes da carga

1. Definir uma empresa única por vínculo e eliminar combinações ambíguas de marcadores.
2. Normalizar setor, cargo, jornada e forma de recebimento em catálogos controlados.
3. Validar unicidade de matrícula e identificadores externos por empresa.
4. Validar datas: admissão anterior ao desligamento; documentos e prazos em datas válidas.
5. Excluir de carga operacional fórmulas, abas duplicadas, resultados com erro e colunas de impressão.
6. Anexar evidências documentais à pessoa/vínculo correto, com classificação de acesso.

## Critério de aceite da migração do primeiro módulo

Uma carga piloto só será aprovada quando todos os colaboradores tiverem empresa, nome legal, identificador externo, vínculo, data de admissão, setor, cargo e jornada válidos; exceções devem estar listadas e aprovadas pelo DP.
