export type ApprovedProjectionFamily =
  'AUTH_CONTEXT' | 'GRANTS_ASSIGNMENTS' | 'DASHBOARD' | 'PAYROLL_REVIEW' | 'PAYROLL_PERIODS';

export type ApprovedProjectionDisposition = 'INCLUDE' | 'OMIT' | 'MIXED';

export interface ApprovedMinimalProjectionPolicy {
  readonly id: `FC-${string}`;
  readonly family: ApprovedProjectionFamily;
  readonly resource: string;
  readonly operation: string;
  readonly field: string;
  readonly classification: string;
  readonly disposition: ApprovedProjectionDisposition;
  readonly profile: 'MINIMAL';
  readonly capability: string;
  readonly cache: string;
  readonly audit: string;
  readonly masking: 'NONE';
}

type PolicyRow = readonly [
  id: ApprovedMinimalProjectionPolicy['id'],
  field: string,
  classification: string,
  disposition: ApprovedProjectionDisposition,
];

function policies(
  family: ApprovedProjectionFamily,
  resource: string,
  operation: string,
  capability: string,
  cache: string,
  audit: string,
  rows: readonly PolicyRow[],
): readonly ApprovedMinimalProjectionPolicy[] {
  return rows.map(([id, field, classification, disposition]) =>
    Object.freeze({
      id,
      family,
      resource,
      operation,
      field,
      classification,
      disposition,
      profile: 'MINIMAL' as const,
      capability,
      cache,
      audit,
      masking: 'NONE' as const,
    }),
  );
}

const auth = policies(
  'AUTH_CONTEXT',
  'authenticated-session',
  'login/me/companies/context/logout',
  'AUTHENTICATION_OR_MEMBERSHIP',
  'CP-01/CP-02',
  'AR-01/AR-02_NOT_ACTIVATED',
  [
    ['FC-001', 'accessToken', 'AUTH_CREDENTIAL', 'INCLUDE'],
    ['FC-002', 'tokenType', 'TECHNICAL_PROTOCOL', 'INCLUDE'],
    ['FC-003', 'actorId', 'IDENTITY_CONTEXT', 'INCLUDE'],
    ['FC-004', 'activeCompanyId', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-005', 'sessionId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-006', 'permissions', 'AUTHORIZATION_CONTEXT', 'INCLUDE'],
    ['FC-007', 'traceId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-008', 'ipAddress', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-009', 'userAgent', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-010', 'accessGrants[].id', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-011', 'accessGrants[].type', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-012', 'accessGrants[].capabilities', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-013', 'email', 'IDENTITY_CONTEXT', 'INCLUDE'],
    ['FC-014', 'displayName', 'IDENTITY_CONTEXT', 'INCLUDE'],
    ['FC-015', 'roleCodes', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-016', 'companies[].id', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-017', 'companies[].legalName', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-018', 'companies[].tradeName', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-019', 'revoked', 'TECHNICAL_PROTOCOL', 'INCLUDE'],
  ],
);

const grants = policies(
  'GRANTS_ASSIGNMENTS',
  'authorization-access-grant',
  'list/create/revoke',
  'delegation.manage|emergency_access.manage',
  'CP-03_NO_CACHE',
  'AR-03_ACCESS_GRANTS_VIEWED',
  [
    ['FC-020', 'id', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-021', 'companyId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-022', 'holderUserId', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-023', 'substituteUserId', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-024', 'beneficiaryUserId', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-025', 'grantedByUserId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-026', 'revokedByUserId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-027', 'capabilities', 'AUTHORIZATION_CONTEXT', 'INCLUDE'],
    ['FC-028', 'startsAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-029', 'expiresAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-030', 'reason', 'FREE_TEXT_BLOCKED', 'OMIT'],
    ['FC-031', 'status', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-032', 'revokedAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-033', 'revocationReason', 'FREE_TEXT_BLOCKED', 'OMIT'],
    ['FC-034', 'createdAt', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-035', 'updatedAt', 'TECHNICAL_INTERNAL', 'OMIT'],
  ],
);

const dashboard = policies(
  'DASHBOARD',
  'dashboard-summary',
  'read',
  'platform.read',
  'CP-04_MEMORY_COMPANY_ACTOR_RESOURCE_PROFILE',
  'AR-04_NOT_ACTIVATED',
  [
    ['FC-036', 'context.companyId', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-037', 'context.companyName', 'TENANT_CONTEXT', 'INCLUDE'],
    ['FC-038', 'context.generatedAt', 'TECHNICAL_CONTEXT', 'INCLUDE'],
    ['FC-039', 'context.timezone', 'TECHNICAL_CONTEXT', 'INCLUDE'],
    ['FC-040', 'access', 'AUTHORIZATION_CONTEXT', 'INCLUDE'],
    ['FC-041', 'metrics[].value', 'OPERATIONAL_AGGREGATE', 'INCLUDE'],
    ['FC-042', 'metrics[].label', 'PRESENTATION_METADATA', 'INCLUDE'],
    ['FC-043', 'metrics[].description', 'PRESENTATION_METADATA_STATIC_ONLY', 'INCLUDE'],
    ['FC-044', 'statusDistribution[].key', 'OPERATIONAL_AGGREGATE', 'INCLUDE'],
    ['FC-045', 'statusDistribution[].label', 'PRESENTATION_METADATA', 'INCLUDE'],
    ['FC-046', 'statusDistribution[].value', 'OPERATIONAL_AGGREGATE', 'INCLUDE'],
    ['FC-047', 'sixMonthTimeline[].key', 'OPERATIONAL_AGGREGATE', 'INCLUDE'],
    ['FC-048', 'sixMonthTimeline[].label', 'PRESENTATION_METADATA', 'INCLUDE'],
    ['FC-049', 'sixMonthTimeline[].value', 'OPERATIONAL_AGGREGATE', 'INCLUDE'],
    ['FC-050', 'recentActivity[].type', 'OPERATIONAL_HISTORY', 'INCLUDE'],
    ['FC-051', 'recentActivity[].occurredAt', 'OPERATIONAL_HISTORY', 'INCLUDE'],
    ['FC-052', 'recentActivity[].description', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
  ],
);

const review = policies(
  'PAYROLL_REVIEW',
  'payroll-review',
  'read/workflow/finding',
  'payroll.review.*_MATCHING_OPERATION',
  'CP-05_MEMORY_COMPANY_ACTOR_RESOURCE_PROFILE',
  'AR-05/AR-06/AR-07_NOT_ACTIVATED',
  [
    ['FC-053', 'cycle.id', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-054', 'cycle.companyId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-055', 'cycle.payrollRunId', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-056', 'cycle.status', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-057', 'cycle.createdBy', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-058', 'cycle.traceId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-059', 'cycle.createdAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    [
      'FC-060',
      'cycle.submissionNumber/currentApprovalStage/reviewRound',
      'OPERATIONAL_WORKFLOW',
      'INCLUDE',
    ],
    ['FC-061', 'finding.references', 'DOMAIN_REFERENCE_PERSON_REFERENCE_BLOCKED', 'MIXED'],
    ['FC-062', 'finding.companyId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-063', 'finding.severity/status/code', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-064', 'finding.title/description', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    ['FC-065', 'finding.createdBy/resolvedBy', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-066', 'finding.createdAt/resolvedAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-067', 'finding.resolutionReason', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    ['FC-068', 'finding.traceId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-069', 'event.id/reviewCycleId/findingId', 'DOMAIN_REFERENCE', 'MIXED'],
    ['FC-070', 'event.companyId/actorId/actor.id', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-071', 'event.actor.displayName', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    ['FC-072', 'event.traceId/eventType', 'OPERATIONAL_WORKFLOW_TECHNICAL_INTERNAL', 'MIXED'],
    [
      'FC-073',
      'event.reason/previousState/nextState',
      'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED',
      'MIXED',
    ],
    ['FC-074', 'event.occurredAt/metadata', 'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED', 'MIXED'],
    ['FC-075', 'approvalStage', 'OPERATIONAL_WORKFLOW', 'MIXED'],
    ['FC-076', 'decision', 'OPERATIONAL_WORKFLOW', 'MIXED'],
    [
      'FC-077',
      'decision.actor/reason/traceId/occurredAt',
      'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED',
      'MIXED',
    ],
    ['FC-078', 'invalidation', 'OPERATIONAL_WORKFLOW', 'MIXED'],
    [
      'FC-079',
      'invalidation.actor/reason/invalidatedAt',
      'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED',
      'MIXED',
    ],
    ['FC-080', 'history.currentState/timeline', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
  ],
);

const periods = policies(
  'PAYROLL_PERIODS',
  'payroll-period-closure',
  'readiness/history/manifest/close/reopen',
  'payroll.period.close.*_MATCHING_OPERATION',
  'CP-06_TRANSIENT_OR_MEMORY_COMPANY_ACTOR_PERIOD_VERSION_PROFILE',
  'AR-08/AR-09/AR-10_NOT_ACTIVATED',
  [
    [
      'FC-081',
      'readiness.payrollPeriodId/companyId',
      'DOMAIN_REFERENCE_TECHNICAL_INTERNAL',
      'MIXED',
    ],
    ['FC-082', 'readiness.referenceDate/currentStatus/isReady', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-083', 'readiness.evaluatedAt', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    [
      'FC-084',
      'selectedPayrollRun.id/sequence/status',
      'DOMAIN_REFERENCE_OPERATIONAL_WORKFLOW',
      'INCLUDE',
    ],
    [
      'FC-085',
      'selectedPayrollRun.completedAt/engineVersion/parameterVersion',
      'INTEGRITY_METADATA',
      'INCLUDE',
    ],
    ['FC-086', 'linkedReviewCycle', 'DOMAIN_REFERENCE_OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-087', 'blockers[].code/category/severity/source', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-088', 'blockers[].message', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    [
      'FC-089',
      'blockers[].relatedEntityType/relatedEntityId/metadata',
      'DOMAIN_REFERENCE_CONTENT_BLOCKED',
      'MIXED',
    ],
    [
      'FC-090',
      'warnings[].code/category/acknowledgementRequired/source',
      'OPERATIONAL_WORKFLOW',
      'INCLUDE',
    ],
    ['FC-091', 'warnings[].message', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    [
      'FC-092',
      'warnings[].relatedEntityType/relatedEntityId/metadata',
      'DOMAIN_REFERENCE_CONTENT_BLOCKED',
      'MIXED',
    ],
    [
      'FC-093',
      'acknowledgementsRequired/unavailableWarningChecks',
      'OPERATIONAL_WORKFLOW',
      'INCLUDE',
    ],
    ['FC-094', 'consistencyToken', 'TECHNICAL_CONCURRENCY_TOKEN', 'INCLUDE'],
    ['FC-095', 'traceId', 'TECHNICAL_INTERNAL', 'OMIT'],
    ['FC-096', 'history.version identity/status/isActive', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-097', 'history timestamps', 'OPERATIONAL_WORKFLOW', 'INCLUDE'],
    ['FC-098', 'history actor', 'BLOCKED_PENDING_CONTENT_GOVERNANCE', 'OMIT'],
    ['FC-099', 'history structural references', 'DOMAIN_REFERENCE', 'INCLUDE'],
    ['FC-100', 'manifest metadata', 'INTEGRITY_METADATA', 'INCLUDE'],
    ['FC-101', 'history events', 'OPERATIONAL_WORKFLOW_TECHNICAL_INTERNAL', 'MIXED'],
    ['FC-102', 'warning acknowledgements', 'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED', 'MIXED'],
    [
      'FC-103',
      'manifest schemaVersion/summary',
      'INTEGRITY_METADATA_OPERATIONAL_WORKFLOW',
      'MIXED',
    ],
    [
      'FC-104',
      'manifest warnings/acknowledgements',
      'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED',
      'MIXED',
    ],
    ['FC-105', 'manifest totals', 'FINANCIAL_AGGREGATE_BLOCKED', 'OMIT'],
    ['FC-106', 'manifest references', 'DOMAIN_REFERENCE_PERSON_REFERENCE_BLOCKED', 'MIXED'],
    [
      'FC-107',
      'close response references',
      'OPERATIONAL_WORKFLOW_DOMAIN_REFERENCE_INTEGRITY_METADATA',
      'MIXED',
    ],
    [
      'FC-108',
      'close response reviewRound/warningsAcknowledged/closedAt/closedBy',
      'OPERATIONAL_WORKFLOW_TECHNICAL_INTERNAL',
      'MIXED',
    ],
    ['FC-109', 'reopen response', 'OPERATIONAL_WORKFLOW_CONTENT_BLOCKED', 'MIXED'],
    [
      'FC-110',
      'consistencyToken/traceId/idempotentReplay',
      'TECHNICAL_CONCURRENCY_TOKEN_INTERNAL',
      'MIXED',
    ],
  ],
);

export const APPROVED_MINIMAL_PROJECTION_CATALOG = Object.freeze([
  ...auth,
  ...grants,
  ...dashboard,
  ...review,
  ...periods,
]);

export const APPROVED_MINIMAL_PROFILE = 'MINIMAL' as const;
