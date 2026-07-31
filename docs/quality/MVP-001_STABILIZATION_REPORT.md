# MVP-001.8 — Relatório de estabilização

## Resultado

`IMPLEMENTED — PROTOTYPE STABILIZED`, sem expansão funcional.

Foram corrigidas a corrida entre Compose e a porta PostgreSQL do host, a classificação ruidosa de
rejeições HTTP esperadas, a ausência de timeout finito no gate e uma colisão visual em 1024 px.
Todos os P1 foram encerrados; não houve P0.

A regressão preservou 58 suítes/277 testes executados da API (mais 4 suítes/18 testes condicionais
ignorados) e a cobertura de 70,34% de linhas/69,75% de branches. O frontend aprovou 21 arquivos/76
testes e preservou 77,50% de linhas/74,15% de branches. Os scripts aprovaram 23 testes; são 376
testes executados no total.

## Escopo preservado

Não foram criados módulos, CRUDs, métricas, endpoints, DTOs, migrations, grants, capabilities,
assignments, bypasses, login automático, configuração externa ou implementação da ETP-015.4. O
dataset segue fictício e as contas seguem com zero grants.

## Aceite

Consulte a [matriz de regressão](MVP-001_REGRESSION_MATRIX.md), as
[evidências](MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md), o [registro de defeitos](MVP-001_DEFECT_REGISTER.md)
e as [limitações](MVP-001_KNOWN_LIMITATIONS.md). O próximo incremento autorizado é apenas a
MVP-001.9 — pacote de apresentação executiva.
