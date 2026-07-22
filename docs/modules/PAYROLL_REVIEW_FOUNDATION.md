# Fundação de conferência de folha

## Estado

A fase 4 da ETP-013 implementa a persistência neutra de ciclos e achados. A etapa permanece **parcial**: não há submissão, aprovação, rejeição, fechamento, reabertura de execução de folha, níveis ou alçadas neste incremento.

## Modelo persistente

- `PayrollReviewCycle` liga uma execução `COMPLETED` à empresa ativa, ator, trace e estado técnico único `OPEN`.
- `PayrollReviewFinding` registra severidade `INFORMATIONAL` ou `BLOCKING`, estado `OPEN` ou `RESOLVED`, código técnico, título, descrição e referências opcionais a contrato e item calculado.
- `PayrollReviewEvent` registra `REVIEW_CYCLE_OPENED`, `FINDING_OPENED`, `FINDING_RESOLVED` e `FINDING_REOPENED`.
- `PayrollReviewEvent` é append-only: não existem operações de alteração/exclusão e uma trigger do PostgreSQL rejeita `UPDATE` e `DELETE`.

Todas as FKs usam `RESTRICT`. Um índice parcial impede dois ciclos `OPEN` para a mesma execução. Contrato e item opcionais são validados contra a empresa ativa e a própria execução antes da escrita.

## Invariantes

- apenas execução concluída e pertencente à empresa ativa pode receber ciclo;
- recursos de outra empresa são indistinguíveis de inexistentes (`404`);
- resolução só parte de `OPEN`, reabertura só parte de `RESOLVED`, ambas com motivo;
- estado atual deve corresponder ao último evento, com IDs únicos e cronologia não decrescente;
- transformações do domínio retornam objetos e históricos imutáveis;
- ciclo/achado, evento e `AuditLog` são gravados na mesma transação.

## Autorização

As capabilities são cadastradas pelo seed, sem associação automática a papéis:

- `payroll.review.view`;
- `payroll.review.create`;
- `payroll.review.finding.create`;
- `payroll.review.finding.resolve`;
- `payroll.review.finding.reopen`.

As rotas exigem JWT, empresa ativa e capability no guard, repetindo a policy no serviço. Não existe capability de arquivamento porque `ARCHIVED` não foi aprovado para este recorte.

## APIs

- `POST /api/v1/payroll-runs/:payrollRunId/reviews`;
- `GET /api/v1/payroll-runs/:payrollRunId/reviews`;
- `GET /api/v1/payroll-reviews/:reviewCycleId`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/findings`;
- `GET /api/v1/payroll-reviews/:reviewCycleId/findings`;
- `POST /api/v1/payroll-review-findings/:findingId/resolve`;
- `POST /api/v1/payroll-review-findings/:findingId/reopen`.

## Limites e próximo incremento

O catálogo de códigos/categorias continua técnico e não contém tolerâncias, fórmulas ou regras legais. Não há frontend nesta fase. A fase seguinte deve implementar o workflow de submissão e decisão conforme a BDP-009 v1, mantendo segregação, configuração por dados e auditoria atômica.
