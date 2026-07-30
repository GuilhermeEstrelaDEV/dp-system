# MVP-001 — Critérios GO/NO-GO

## NO-GO bloqueante

- Docker ou ambiente não sobe;
- migration ou dataset inválido;
- API, frontend, PostgreSQL ou Redis indisponível;
- login ou troca empresarial falha;
- empresa não vinculada não retorna `403`;
- sessão revogada não retorna `401`;
- dashboard não preserva empresa e estado restrito;
- grant automático, segredo exposto, vazamento empresarial ou 5xx no fluxo essencial.

## Warnings

- working tree com alterações;
- resolução abaixo de 1366×768 ou zoom diferente de 100%;
- navegador não homologado;
- primeiro build ainda não aquecido;
- aviso não crítico de browser/log;
- internet indisponível antes da instalação/build inicial.

Warnings devem ser apresentados e avaliados, mas não transformam isoladamente o resultado em
`NO-GO`. Qualquer bloqueio produz código diferente de zero, lista de falhas, correção sugerida e
referência documental.
