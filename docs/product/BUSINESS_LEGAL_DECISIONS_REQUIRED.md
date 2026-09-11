# Decisões legais e de negócio necessárias

Este registro evita que o benchmark de mercado seja convertido em regra legal ou política interna
sem homologação. Ele complementa
[BUSINESS_DECISIONS_PENDING.md](../project-management/BUSINESS_DECISIONS_PENDING.md) e não resolve
nenhuma BDP.

| Tema                        | Decisão necessária                                               | Dependência existente       | Efeito enquanto pendente                                               |
| --------------------------- | ---------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| Dados pessoais e documentos | fonte, minimização, retenção, acesso, descarte e exportação      | BDP-001 e BDP-011           | sem upload/central documental funcional                                |
| Estrutura organizacional    | fontes canônicas, organização raiz, filial e hierarquia          | BDP-002, BDP-012 e BDP-013  | organograma e escopo de gestor bloqueados                              |
| Identificadores do vínculo  | matrícula, código ADM e unicidade                                | BDP-003                     | sem automação de importação/integração                                 |
| Salário e movimentações     | fonte, vigência, reajuste e visibilidade                         | BDP-004                     | sem histórico salarial ou política de cargos/salários                  |
| Multiempresa                | empresa canônica por vínculo e marcadores múltiplos              | BDP-005                     | sem importação ampla ou vínculos ambíguos                              |
| Remuneração variável        | comissão, prêmio, adicionais, descontos e pagamentos externos    | BDP-006                     | apenas registros administrativos; nenhuma fórmula                      |
| Jornada                     | ponto, escalas, compensação, banco de horas e exceções           | BDP-007                     | nenhuma apuração legal inferida                                        |
| Benefícios                  | elegibilidade, custos, descontos, adesão e recusa                | BDP-008                     | catálogo/adesão demonstrativos apenas                                  |
| Fornecedores e integrações  | formatos e responsabilidades                                     | BDP-010                     | sem eSocial, assinatura, ponto, banco ou contabilidade                 |
| Desligamento                | workflow, motivos, documentos, aprovações e cálculos rescisórios | nova homologação específica | nenhum cálculo ou rescisão funcional                                   |
| Autoatendimento             | vínculo User–Employee e limites de dados próprios                | nova homologação específica | portal do colaborador bloqueado                                        |
| Gestão de equipe            | relação de subordinação, substituição e visibilidade             | BDP-013 ou decisão dedicada | portal do gestor bloqueado                                             |
| Pesquisas                   | anonimato, base legal, retenção e acesso ao resultado            | BDP-011 ou decisão dedicada | pesquisas/eNPS bloqueadas                                              |
| Relatórios/exportação       | campos permitidos, finalidade e retenção do arquivo              | BDP-011                     | somente agregados não sensíveis já aprovados; exportação/CSV bloqueada |

Continuam explicitamente fora de autorização automática: INSS, FGTS, IRRF, eSocial, férias legais,
13º, rescisão, DSR, regras legais de banco de horas, convenções coletivas, adicionais, salário e
encargos.
