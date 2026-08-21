import { AUDIT_EVENT_CODES, auditEventDescriptor } from './audit-event.catalog';
import {
  APPROVED_MINIMAL_PROJECTION_CATALOG,
  type ApprovedProjectionFamily,
} from './approved-minimal-projection.catalog';

export interface ApprovedMinimalEndpoint {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly family: ApprovedProjectionFamily;
}

export const APPROVED_MINIMAL_ENDPOINTS = Object.freeze(
  [
    ['POST', '/auth/login', 'AUTH_CONTEXT'],
    ['GET', '/auth/me', 'AUTH_CONTEXT'],
    ['GET', '/auth/companies', 'AUTH_CONTEXT'],
    ['POST', '/auth/context', 'AUTH_CONTEXT'],
    ['POST', '/auth/logout', 'AUTH_CONTEXT'],
    ['GET', '/access-grants/substitutions', 'GRANTS_ASSIGNMENTS'],
    ['POST', '/access-grants/substitutions', 'GRANTS_ASSIGNMENTS'],
    ['POST', '/access-grants/substitutions/:id/revoke', 'GRANTS_ASSIGNMENTS'],
    ['GET', '/access-grants/emergency', 'GRANTS_ASSIGNMENTS'],
    ['POST', '/access-grants/emergency', 'GRANTS_ASSIGNMENTS'],
    ['POST', '/access-grants/emergency/:id/revoke', 'GRANTS_ASSIGNMENTS'],
    ['GET', '/dashboard/summary', 'DASHBOARD'],
    ['POST', '/payroll-runs/:payrollRunId/reviews', 'PAYROLL_REVIEW'],
    ['GET', '/payroll-runs/:payrollRunId/reviews', 'PAYROLL_REVIEW'],
    ['GET', '/payroll-reviews/:reviewCycleId', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/findings', 'PAYROLL_REVIEW'],
    ['GET', '/payroll-reviews/:reviewCycleId/findings', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-review-findings/:findingId/resolve', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-review-findings/:findingId/reopen', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/start', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/submit', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/approve', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/reject', 'PAYROLL_REVIEW'],
    ['GET', '/payroll-reviews/:reviewCycleId/history', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/close', 'PAYROLL_REVIEW'],
    ['POST', '/payroll-reviews/:reviewCycleId/reopen', 'PAYROLL_REVIEW'],
    ['GET', '/payroll-periods/:payrollPeriodId/closure-readiness', 'PAYROLL_PERIODS'],
    ['GET', '/payroll-periods/:payrollPeriodId/history', 'PAYROLL_PERIODS'],
    ['GET', '/payroll-periods/:payrollPeriodId/history/:closureVersion', 'PAYROLL_PERIODS'],
    ['GET', '/payroll-periods/:payrollPeriodId/history/:closureVersion/events', 'PAYROLL_PERIODS'],
    [
      'GET',
      '/payroll-periods/:payrollPeriodId/history/:closureVersion/manifest',
      'PAYROLL_PERIODS',
    ],
    ['POST', '/payroll-periods/:payrollPeriodId/close', 'PAYROLL_PERIODS'],
    ['POST', '/payroll-periods/:payrollPeriodId/reopen', 'PAYROLL_PERIODS'],
  ].map(([method, path, family]) =>
    Object.freeze({ method, path, family }),
  ) as readonly ApprovedMinimalEndpoint[],
);

const EXPECTED_FAMILY_COUNTS: Readonly<Record<ApprovedProjectionFamily, number>> = {
  AUTH_CONTEXT: 19,
  GRANTS_ASSIGNMENTS: 16,
  DASHBOARD: 17,
  PAYROLL_REVIEW: 28,
  PAYROLL_PERIODS: 30,
};

export function verifyApprovedMinimalProjection(): readonly string[] {
  const errors: string[] = [];
  const expectedIds = Array.from(
    { length: 110 },
    (_, index) => `FC-${String(index + 1).padStart(3, '0')}`,
  );
  const ids = APPROVED_MINIMAL_PROJECTION_CATALOG.map((policy) => policy.id);
  if (new Set(ids).size !== ids.length) errors.push('projection catalog contains duplicate IDs');
  if (ids.join('|') !== expectedIds.join('|'))
    errors.push('projection catalog is not FC-001..FC-110');
  if (APPROVED_MINIMAL_ENDPOINTS.length !== 33) errors.push('canonical endpoint count is not 33');
  const endpointKeys = APPROVED_MINIMAL_ENDPOINTS.map(({ method, path }) => `${method} ${path}`);
  if (new Set(endpointKeys).size !== endpointKeys.length)
    errors.push('canonical endpoint manifest contains duplicates');
  for (const [family, expected] of Object.entries(EXPECTED_FAMILY_COUNTS)) {
    const actual = APPROVED_MINIMAL_PROJECTION_CATALOG.filter(
      (policy) => policy.family === family,
    ).length;
    if (actual !== expected) errors.push(`${family} has ${actual} policies; expected ${expected}`);
    if (!APPROVED_MINIMAL_ENDPOINTS.some((endpoint) => endpoint.family === family))
      errors.push(`${family} has no canonical endpoint`);
  }
  if (
    APPROVED_MINIMAL_PROJECTION_CATALOG.some(
      (policy) => policy.profile !== 'MINIMAL' || policy.masking !== 'NONE',
    )
  )
    errors.push('catalog contains an unapproved profile or masking strategy');
  if (AUDIT_EVENT_CODES.length !== 81)
    errors.push('runtime audit catalog does not contain 81 events');
  const ar03 = auditEventDescriptor('ACCESS_GRANTS_VIEWED');
  if (
    ar03.category !== 'AUTHORIZATION' ||
    ar03.allowedAuthorizationCapabilities.join('|') !== 'delegation.manage|emergency_access.manage'
  )
    errors.push('AR03 is not constrained to the approved grants capabilities');
  return Object.freeze(errors);
}
