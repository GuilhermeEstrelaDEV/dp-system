export const DEMO_CLOSURE_FIXTURE = {
  companyId: '10000000-0000-4000-8000-000000000001',
  payrollPeriodId: 'a0000000-0000-4000-8000-000000000004',
  payrollRunId: 'b0000000-0000-4000-8000-000000000004',
  reviewCycleId: 'c0000000-0000-4000-8000-000000000004',
  actorId: '20000000-0000-4000-8000-000000000001',
  employeeCount: 2,
  approvalStageCount: 2,
  submissionNumber: 1,
  reviewRound: 1,
} as const;

export type DemoClosureFixtureLifecycle = 'PREPARED' | 'CLOSED' | 'REOPENED';

export interface DemoClosureFixtureSnapshot {
  periodStatus: string;
  payrollRunStatus: string;
  employeeCount: number;
  reviewStatus: string;
  approvalStageCount: number;
  approvedDecisionCount: number;
  invalidatedDecisionCount: number;
  openBlockingFindingCount: number;
  closedEventRound: number | null;
  hasLaterReviewReopenedEvent: boolean;
  closureVersions: Array<{
    version: number;
    status: string;
    superseded: boolean;
    manifestCount: number;
    eventTypes: string[];
  }>;
}

function requireFixture(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Fixture canônico de fechamento inválido: ${message}`);
}

export function validateDemoClosureFixture(
  snapshot: DemoClosureFixtureSnapshot,
): DemoClosureFixtureLifecycle {
  requireFixture(snapshot.payrollRunStatus === 'COMPLETED', 'execução não concluída');
  requireFixture(
    snapshot.employeeCount === DEMO_CLOSURE_FIXTURE.employeeCount,
    `esperados ${DEMO_CLOSURE_FIXTURE.employeeCount} participantes calculados`,
  );
  requireFixture(snapshot.reviewStatus === 'CLOSED', 'conferência não fechada');
  requireFixture(
    snapshot.approvalStageCount === DEMO_CLOSURE_FIXTURE.approvalStageCount,
    'quantidade de etapas de aprovação divergente',
  );
  requireFixture(
    snapshot.approvedDecisionCount === DEMO_CLOSURE_FIXTURE.approvalStageCount,
    'aprovações canônicas ausentes',
  );
  requireFixture(snapshot.invalidatedDecisionCount === 0, 'decisão aprovada invalidada');
  requireFixture(snapshot.openBlockingFindingCount === 0, 'achado bloqueante aberto');
  requireFixture(
    snapshot.closedEventRound === DEMO_CLOSURE_FIXTURE.reviewRound,
    'evento REVIEW_CLOSED ausente ou em rodada divergente',
  );
  requireFixture(!snapshot.hasLaterReviewReopenedEvent, 'conferência reaberta após o fechamento');

  const versions = [...snapshot.closureVersions].sort(
    (left, right) => left.version - right.version,
  );
  if (versions.length === 0) {
    requireFixture(snapshot.periodStatus === 'OPEN', 'estado inicial da competência deve ser OPEN');
    return 'PREPARED';
  }

  const first = versions[0]!;
  requireFixture(first.version === 1, 'primeira versão de fechamento deve ser 1');
  requireFixture(first.status === 'CLOSED', 'primeira versão deve permanecer CLOSED');
  requireFixture(first.manifestCount === 1, 'primeira versão deve possuir um manifesto');
  requireFixture(first.eventTypes.includes('PERIOD_CLOSED'), 'evento PERIOD_CLOSED ausente');

  if (versions.length === 1) {
    requireFixture(snapshot.periodStatus === 'CLOSED', 'competência fechada deve estar CLOSED');
    requireFixture(!first.superseded, 'fechamento vigente não pode estar superseded');
    return 'CLOSED';
  }

  requireFixture(
    versions.length === 2,
    'somente o fechamento e a reabertura demonstrativos são aceitos',
  );
  const successor = versions[1]!;
  requireFixture(snapshot.periodStatus === 'OPEN', 'competência reaberta deve estar OPEN');
  requireFixture(first.superseded, 'versão fechada deve estar superseded após reabertura');
  requireFixture(
    first.eventTypes.includes('PERIOD_REOPENING_STARTED'),
    'início da reabertura ausente',
  );
  requireFixture(first.eventTypes.includes('CLOSURE_EVIDENCE_INVALIDATED'), 'invalidação ausente');
  requireFixture(successor.version === 2 && successor.status === 'OPEN', 'sucessor OPEN inválido');
  requireFixture(successor.manifestCount === 0, 'sucessor OPEN não pode possuir manifesto');
  requireFixture(
    successor.eventTypes.includes('PERIOD_REOPENED'),
    'evento PERIOD_REOPENED ausente',
  );
  return 'REOPENED';
}
