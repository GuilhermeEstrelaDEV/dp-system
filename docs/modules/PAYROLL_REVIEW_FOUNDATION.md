# Fundação de conferência de folha

## Estado

O backend do workflow decisório v1 está funcionalmente concluído, incluindo fechamento e reabertura controlada. A ETP-013 permanece parcial sem frontend e integração geral de fechamento.

## Modelo persistente

- `PayrollReviewCycle` liga uma execução `COMPLETED` à empresa ativa, ator, trace, rodada de submissão e etapa atual.
- `PayrollReviewApprovalStage` preserva o snapshot ordenado das etapas e da capability requerida, sem nomes fixos de papéis.
- `PayrollReviewDecision` preserva decisões por ciclo, rodada e etapa; uma trigger rejeita alteração ou exclusão.
- `PayrollReviewDecisionInvalidation` registra separadamente ator, motivo, rodada, momento e evento causador sem alterar decisões antigas.
- `PayrollReviewFinding` registra severidade `INFORMATIONAL` ou `BLOCKING`, estado `OPEN` ou `RESOLVED`, código técnico, título, descrição e referências opcionais a contrato e item calculado.
- `PayrollReviewEvent` registra abertura, início, submissão, aprovação, rejeição e bloqueio/desbloqueio de achados.
- `PayrollReviewEvent` é append-only: não existem operações de alteração/exclusão e uma trigger do PostgreSQL rejeita `UPDATE` e `DELETE`.

Todas as FKs usam `RESTRICT`. Um índice parcial impede dois ciclos `OPEN` para a mesma execução. Contrato e item opcionais são validados contra a empresa ativa e a própria execução antes da escrita.

## Invariantes

- apenas execução concluída e pertencente à empresa ativa pode receber ciclo;
- recursos de outra empresa são indistinguíveis de inexistentes (`404`);
- resolução só parte de `OPEN`, reabertura só parte de `RESOLVED`, ambas com motivo;
- estado atual deve corresponder ao último evento, com IDs únicos e cronologia não decrescente;
- transformações do domínio retornam objetos e históricos imutáveis;
- ciclo/achado, evento e `AuditLog` são gravados na mesma transação.
- somente `OPEN` ou `REJECTED` inicia conferência; somente `IN_REVIEW` submete;
- achado `BLOCKING` aberto impede submissão;
- aprovação/rejeição exige `SUBMITTED`; rejeição exige motivo;
- duas etapas v1 são sequenciais, com preparador e aprovadores distintos;
- `APPROVED` é terminal neste recorte e impede alteração de achados.
- `CLOSED` exige todas as etapas válidas e nenhum achado bloqueante aberto;
- reabertura de `APPROVED` ou `CLOSED` exige motivo, invalida aprovações da rodada e retorna a `IN_REVIEW`.

## Autorização

As capabilities são cadastradas pelo seed, sem associação automática a papéis:

- `payroll.review.view`;
- `payroll.review.create`;
- `payroll.review.finding.create`;
- `payroll.review.finding.resolve`;
- `payroll.review.finding.reopen`.
- `payroll.review.submit`;
- `payroll.review.approve`;
- `payroll.review.reject`.
- `payroll.review.close`;
- `payroll.review.reopen`.

As rotas exigem JWT, empresa ativa e capability no guard, repetindo a policy no serviço. Não existe capability de arquivamento porque `ARCHIVED` não foi aprovado para este recorte.

## APIs

- `POST /api/v1/payroll-runs/:payrollRunId/reviews`;
- `GET /api/v1/payroll-runs/:payrollRunId/reviews`;
- `GET /api/v1/payroll-reviews/:reviewCycleId`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/findings`;
- `GET /api/v1/payroll-reviews/:reviewCycleId/findings`;
- `POST /api/v1/payroll-review-findings/:findingId/resolve`;
- `POST /api/v1/payroll-review-findings/:findingId/reopen`.
- `POST /api/v1/payroll-reviews/:reviewCycleId/start`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/submit`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/approve`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/reject`;
- `GET /api/v1/payroll-reviews/:reviewCycleId/history`.
- `POST /api/v1/payroll-reviews/:reviewCycleId/close`;
- `POST /api/v1/payroll-reviews/:reviewCycleId/reopen`.

## Limites e próximo incremento

O catálogo continua sem tolerâncias, fórmulas ou regras legais. As duas etapas usam a capability configurável `payroll.review.approve`; a matriz de assignments define seus detentores. Não há frontend, `CLOSED`, reabertura, delegação dentro do workflow ou alçada financeira.
