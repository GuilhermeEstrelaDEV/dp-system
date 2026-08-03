# ETP-015.7 — Política de metadata e estado

## Fail closed

O writer aceita apenas as chaves canônicas e as chaves específicas declaradas no descritor do
evento. Chave desconhecida, estrutura dinâmica ou conteúdo proibido causa erro; nenhum valor é
silenciosamente removido ou mascarado.

## Chaves canônicas

- `eventVersion`
- `category`
- `outcome`
- `requiredCapabilities`
- `satisfiedCapabilities`
- `effectiveGrantIds`
- `reasonCode`

## Chaves específicas

| Família                | Chaves permitidas                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| criação de assignment  | `source`                                                                                             |
| criação de grant       | `capabilities`, `startsAt`, `expiresAt`, `grantType`                                                 |
| payroll review         | `source`                                                                                             |
| fundação de fechamento | `source`                                                                                             |
| fechamento             | `closureId`, `manifestId`, `manifestHash`, `selectedPayrollRunId`, `linkedReviewCycleId`, `warnings` |
| reabertura             | `details`                                                                                            |

## Limites estruturais

| Controle                |          Limite |
| ----------------------- | --------------: |
| profundidade            |               4 |
| propriedades acumuladas |              32 |
| itens por array         |              32 |
| string                  |  512 caracteres |
| JSON serializado        |           8 KiB |
| números                 | somente finitos |

## Chaves proibidas

São recusadas, inclusive em objetos internos, chaves relacionadas a senha, token, segredo, cookie,
authorization, API key, connection string, e-mail, telefone, endereço, CPF/CNPJ, documento, dados
bancários, conta, salário, request/response, stack e query. A lista é conservadora e não substitui
classificação de dados.

## Estado e motivo

`previousState` e `nextState` passam pelos mesmos limites e bloqueios, mas não possuem uma lista
global de chaves porque representam agregados distintos. Os produtores de assignments e grants
persistem apenas `status`, eliminando snapshots integrais. O texto de motivo fica na coluna
dedicada, limitado a 1.000 caracteres; `reasonCode` estruturado sempre integra a metadata.
