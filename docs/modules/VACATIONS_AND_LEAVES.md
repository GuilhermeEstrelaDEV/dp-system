# Férias e afastamentos

## Escopo da ETP-009

O módulo oferece controles administrativos demonstrativos para períodos de férias, solicitações, programação coletiva, afastamentos e retornos. Não calcula remuneração, adicionais, abonos, prazos legais, contagens automáticas ou qualquer obrigação trabalhista.

## Regras implementadas

- Períodos aquisitivos e concessivos são informados, com datas coerentes, sem derivação legal automática.
- Solicitações de férias são vinculadas a período e contrato; intervalos sobrepostos e afastamentos abertos incompatíveis são bloqueados.
- Aprovação e cancelamento são decisões administrativas lógicas. O cancelamento exige justificativa e toda mudança gera histórico append-only.
- Tipos de afastamento pertencem à empresa; o serviço valida a compatibilidade com o contrato, o retorno previsto quando configurado e o retorno efetivo posterior ao início.
- Férias coletivas existem apenas como estrutura de programação por empresa.

## Limitações e LGPD

Não são coletados documentos, diagnósticos, CID, dados médicos, motivos clínicos detalhados nem dados reais. Tipos, motivos e datas exibidos em testes ou interface são demonstrativos.

As regras de direito, fracionamento, pagamento, conversão, aviso, estabilidade e prazos dependem de fonte oficial validada e homologação de DP/Jurídico. Até essa validação, a aplicação não deve ser usada para decidir conformidade legal.

## Endpoints

- `GET|POST /vacation-periods`
- `GET|POST /vacation-requests`, `POST /vacation-requests/:id/approve`, `POST /vacation-requests/:id/cancel`
- `POST /collective-vacations`
- `GET|POST /leave-types`
- `GET|POST /leave-cases`, `POST /leave-cases/:id/return`

## Interface

A rota `/movimentacoes` apresenta estados de carregamento, erro e vazio para períodos e afastamentos, além de formulários administrativos demonstrativos. Não substitui fluxo de aprovação autenticado nem gestão documental.
