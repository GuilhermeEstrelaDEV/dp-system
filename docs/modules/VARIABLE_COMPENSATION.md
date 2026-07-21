# Remuneração variável e conciliação

## Escopo da ETP-012

A ETP-012 implementa o recorte administrativo documentado no UC-09 para eventos de remuneração variável, adiantamentos salariais, pagamentos externos e conciliações de execução de folha. Os registros usam valores `Decimal(15,2)`, referências temporais, contratos ou execuções existentes e estados lógicos iniciais.

As APIs ficam sob `/api/v1/variable-compensation`; a interface está em `/folha/remuneracao-variavel`. Comissões/prêmios, adiantamentos e pagamentos externos são consultados por contrato. Conciliações são vinculadas a uma execução de folha e aceitam diferença positiva, negativa ou zero.

## Garantias

- contratos e execuções referenciados precisam existir;
- valores de eventos, adiantamentos e pagamentos externos são estritamente positivos;
- dinheiro trafega como texto decimal e é persistido sem ponto flutuante;
- chaves estrangeiras são restritivas e os registros não são apagados em cascata;
- nenhuma criação dispara cálculo, lançamento, desconto ou pagamento.

## Pendências explícitas

BDP-006 mantém pendentes as regras de comissão, prêmio, adicional, quinquênio, descontos e pagamentos externos. A BDP-009 foi resolvida para a versão 1, mas sua infraestrutura ainda não está implementada. Por isso a etapa continua sem fórmula, percentual, elegibilidade, aprovação autenticada, geração automática de `PayrollInput`, liquidação, dados bancários ou integração financeira.
