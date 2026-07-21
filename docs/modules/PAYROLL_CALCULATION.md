# Cálculo configurável de folha

## Escopo da ETP-011

A ETP-011 transforma as execuções técnicas da fundação em um cálculo determinístico dos lançamentos configurados. Cada execução seleciona a versão da rubrica vigente na data de referência, agrupa lançamentos pendentes por contrato e rubrica, persiste itens, totais e memória de cálculo e preserva as versões do motor e dos parâmetros.

O cálculo reconhece exclusivamente as naturezas técnicas `EARNING` e `DEDUCTION`. Proventos compõem o bruto; descontos reduzem o líquido. Valores são convertidos para centavos e arredondados pela regra explícita `HALF_AWAY_FROM_ZERO_2_DECIMALS`, sem uso de ponto flutuante. Entradas da mesma rubrica e versão são somadas, e seus identificadores ficam registrados na memória reproduzível.

## Falha segura

- natureza desconhecida encerra a execução como `FAILED` e gera `UNSUPPORTED_RUBRIC_NATURE`;
- ausência de versão vigente gera `RUBRIC_VERSION_NOT_FOUND` e impede conclusão bem-sucedida;
- competência fechada ou execução concorrente continua bloqueada;
- somente lançamentos `PENDING` participam; lançamentos inativos são ignorados;
- nenhum resultado anterior é sobrescrito ou removido.

## Fora de escopo

Não há fórmula arbitrária, salário contratual presumido, proporcionalidade, INSS, FGTS, IRRF, encargos, faixas, alíquotas, deduções, guias, eSocial ou garantia de conformidade legal. A homologação das regras depende de fontes oficiais e validação formal do DP/Jurídico.

## Interface

Em `/folha/execucoes`, cada execução lista os contratos calculados com bruto, líquido e status. A interface mantém o aviso de que o processamento não representa folha legal homologada.
