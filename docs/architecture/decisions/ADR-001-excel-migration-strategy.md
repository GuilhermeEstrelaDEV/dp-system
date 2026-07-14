# ADR-001 — Estratégia de migração da planilha

**Status:** Aceita
**Data:** 2026-07-14

## Contexto

A planilha atual é o centro operacional do DP e contém mais de 213 mil fórmulas, abas auxiliares, modelos de documentos, checklists e valores calculados com erros persistidos. Migrar fórmulas literalmente transferiria acoplamento, duplicidade e resultados potencialmente incorretos para o ERP.

## Decisão

O ERP não migrará fórmulas Excel como implementação. Cada item da planilha será classificado como dado mestre, evento histórico, regra de negócio, workflow, modelo de documento, relatório ou legado descartável.

Regras válidas serão reconstruídas em serviços de domínio versionados e testados. Dados de origem serão carregados somente após saneamento, validação de qualidade e definição de origem canônica.

## Consequências

### Positivas

- Remove dependências ocultas entre abas e fórmulas duplicadas.
- Torna cálculo, aprovação e auditoria reproduzíveis.
- Permite correção de dados históricos sem perpetuar erros conhecidos.
- Centraliza regras em serviços de domínio, alinhada à arquitetura modular.

### Custos e controles

- Exige descoberta detalhada e validação do DP antes de cada migração.
- Requer execução paralela de planilha e ERP nas competências iniciais de folha.
- Toda regra reconstruída precisa de caso de teste e comparação com amostras homologadas.

## Alternativas rejeitadas

1. Converter cada planilha em uma tela: preservaria complexidade e não resolveria rastreabilidade.
2. Manter o Excel como motor de cálculo: inviabilizaria auditoria, escalabilidade e operação web confiável.
3. Importar todos os resultados calculados sem origem: impediria revisão e reprodução dos cálculos.
