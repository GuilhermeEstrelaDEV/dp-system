# Inventário da Planilha e Estratégia de Migração

## Evidências levantadas

A planilha analisada possui 61 abas, 216 intervalos nomeados e aproximadamente 213 mil fórmulas. Foram identificadas 82 linhas de colaboradores na base central `GERAL` e ao menos seis empresas administradas no mesmo arquivo.

As abas `GERAL` e `LANCAMENTOS` formam o principal eixo de dependências. A primeira concentra dados cadastrais, benefícios, contrato, prazos, documentos e status; a segunda concentra eventos de folha, férias, jornada, comissões, encargos e conferência.

Também foram identificados controles de férias, experiências, hora extra, banco de horas, VT/VR, adiantamento salarial, reajuste, comissões, pagamentos por fora, documentos admissionais e 12 checklists demissionais individualizados.

## Riscos identificados

- Dependência elevada de fórmulas e referências cruzadas.
- Abas duplicadas/auxiliares com erros calculados persistidos (`#REF!`, `#N/A`, `#DIV/0!` e `#VALUE!`).
- Regras de negócio implícitas em fórmulas, nomes de intervalo e textos de checklist.
- Dados pessoais e documentos tratados fora de um modelo de autorização e auditoria centralizado.

## Regra de migração

Não haverá migração "fórmula por fórmula". Cada elemento será classificado antes de qualquer carga:

| Classificação          | Destino                                      |
| ---------------------- | -------------------------------------------- |
| Dado mestre            | Entidade normalizada no banco                |
| Evento histórico       | Registro com competência, vigência e origem  |
| Regra de cálculo       | Serviço de domínio parametrizado e testado   |
| Checklist              | Template e instância de workflow             |
| Documento              | Template versionado e dados de preenchimento |
| Relatório              | Consulta, indicador ou exportação            |
| Aba obsoleta/duplicada | Arquivo histórico, sem migração operacional  |

## Próximo artefato de descoberta

O dicionário técnico inicial foi registrado em [ETP-001 — Dicionário de dados](ETP-001_DATA_DICTIONARY.md). A validação pelo DP permanece necessária para confirmar fontes canônicas, lacunas cadastrais e regras de exceção antes de qualquer carga.
