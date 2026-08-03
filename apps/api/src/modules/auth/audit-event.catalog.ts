export type AuditEventCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION_ASSIGNMENT'
  | 'ACCESS_GRANT'
  | 'PAYROLL_REVIEW'
  | 'PAYROLL_PERIOD';

export type AuditAtomicity = 'REQUIRED' | 'OPTIONAL';

export interface AuditEventDescriptor {
  readonly code: AuditEventCode;
  readonly version: 1;
  readonly category: AuditEventCategory;
  readonly atomicity: AuditAtomicity;
  readonly companyContext: 'REQUIRED' | 'OPTIONAL';
  readonly requiredCapabilities: readonly string[];
  readonly allowedMetadata: readonly string[];
}

const descriptor = (
  code: string,
  category: AuditEventCategory,
  atomicity: AuditAtomicity,
  companyContext: AuditEventDescriptor['companyContext'],
  requiredCapabilities: readonly string[] = [],
  allowedMetadata: readonly string[] = [],
) =>
  Object.freeze({
    code,
    version: 1 as const,
    category,
    atomicity,
    companyContext,
    requiredCapabilities: Object.freeze([...requiredCapabilities]),
    allowedMetadata: Object.freeze([...allowedMetadata]),
  });

export const AUDIT_EVENT_CATALOG = Object.freeze({
  AUTH_LOGIN_SUCCEEDED: descriptor(
    'AUTH_LOGIN_SUCCEEDED',
    'AUTHENTICATION',
    'OPTIONAL',
    'OPTIONAL',
  ),
  AUTH_COMPANY_SELECTED: descriptor(
    'AUTH_COMPANY_SELECTED',
    'AUTHENTICATION',
    'OPTIONAL',
    'REQUIRED',
  ),
  AUTH_LOGOUT_SUCCEEDED: descriptor(
    'AUTH_LOGOUT_SUCCEEDED',
    'AUTHENTICATION',
    'OPTIONAL',
    'OPTIONAL',
  ),
  ROLE_PERMISSION_ASSIGNED: descriptor(
    'ROLE_PERMISSION_ASSIGNED',
    'AUTHORIZATION_ASSIGNMENT',
    'REQUIRED',
    'OPTIONAL',
    [],
    ['source'],
  ),
  ROLE_PERMISSION_REVOKED: descriptor(
    'ROLE_PERMISSION_REVOKED',
    'AUTHORIZATION_ASSIGNMENT',
    'REQUIRED',
    'OPTIONAL',
  ),
  USER_COMPANY_ROLE_ASSIGNED: descriptor(
    'USER_COMPANY_ROLE_ASSIGNED',
    'AUTHORIZATION_ASSIGNMENT',
    'REQUIRED',
    'REQUIRED',
    [],
    ['source'],
  ),
  USER_COMPANY_ROLE_REVOKED: descriptor(
    'USER_COMPANY_ROLE_REVOKED',
    'AUTHORIZATION_ASSIGNMENT',
    'REQUIRED',
    'REQUIRED',
  ),
  SUBSTITUTION_CREATED: descriptor(
    'SUBSTITUTION_CREATED',
    'ACCESS_GRANT',
    'REQUIRED',
    'REQUIRED',
    ['delegation.manage'],
    ['capabilities', 'startsAt', 'expiresAt', 'grantType'],
  ),
  SUBSTITUTION_REVOKED: descriptor('SUBSTITUTION_REVOKED', 'ACCESS_GRANT', 'REQUIRED', 'REQUIRED', [
    'delegation.manage',
  ]),
  SUBSTITUTION_EXPIRED: descriptor('SUBSTITUTION_EXPIRED', 'ACCESS_GRANT', 'REQUIRED', 'REQUIRED', [
    'delegation.manage',
  ]),
  EMERGENCY_ACCESS_GRANTED: descriptor(
    'EMERGENCY_ACCESS_GRANTED',
    'ACCESS_GRANT',
    'REQUIRED',
    'REQUIRED',
    ['emergency_access.manage'],
    ['capabilities', 'startsAt', 'expiresAt', 'grantType'],
  ),
  EMERGENCY_ACCESS_REVOKED: descriptor(
    'EMERGENCY_ACCESS_REVOKED',
    'ACCESS_GRANT',
    'REQUIRED',
    'REQUIRED',
    ['emergency_access.manage'],
  ),
  EMERGENCY_ACCESS_EXPIRED: descriptor(
    'EMERGENCY_ACCESS_EXPIRED',
    'ACCESS_GRANT',
    'REQUIRED',
    'REQUIRED',
    ['emergency_access.manage'],
  ),
  PAYROLL_REVIEW_CYCLE_OPENED: descriptor(
    'PAYROLL_REVIEW_CYCLE_OPENED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.create'],
    ['source'],
  ),
  PAYROLL_REVIEW_FINDING_OPENED: descriptor(
    'PAYROLL_REVIEW_FINDING_OPENED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.finding.create'],
    ['source'],
  ),
  PAYROLL_REVIEW_STARTED: descriptor(
    'PAYROLL_REVIEW_STARTED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.submit'],
    ['source'],
  ),
  PAYROLL_REVIEW_SUBMITTED: descriptor(
    'PAYROLL_REVIEW_SUBMITTED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.submit'],
    ['source'],
  ),
  PAYROLL_REVIEW_APPROVED: descriptor(
    'PAYROLL_REVIEW_APPROVED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.approve'],
    ['source'],
  ),
  PAYROLL_REVIEW_REJECTED: descriptor(
    'PAYROLL_REVIEW_REJECTED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.reject'],
    ['source'],
  ),
  PAYROLL_REVIEW_CLOSED: descriptor(
    'PAYROLL_REVIEW_CLOSED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.close'],
    ['source'],
  ),
  PAYROLL_REVIEW_REOPENED: descriptor(
    'PAYROLL_REVIEW_REOPENED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.reopen'],
    ['source'],
  ),
  PAYROLL_REVIEW_FINDING_RESOLVED: descriptor(
    'PAYROLL_REVIEW_FINDING_RESOLVED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.finding.resolve'],
    ['source'],
  ),
  PAYROLL_REVIEW_FINDING_REOPENED: descriptor(
    'PAYROLL_REVIEW_FINDING_REOPENED',
    'PAYROLL_REVIEW',
    'REQUIRED',
    'REQUIRED',
    ['payroll.review.finding.reopen'],
    ['source'],
  ),
  PAYROLL_PERIOD_CLOSURE_FOUNDATION_CREATED: descriptor(
    'PAYROLL_PERIOD_CLOSURE_FOUNDATION_CREATED',
    'PAYROLL_PERIOD',
    'REQUIRED',
    'REQUIRED',
    ['payroll.period.close.execute'],
    ['source'],
  ),
  PAYROLL_PERIOD_CLOSED: descriptor(
    'PAYROLL_PERIOD_CLOSED',
    'PAYROLL_PERIOD',
    'REQUIRED',
    'REQUIRED',
    ['payroll.period.close.execute'],
    [
      'closureId',
      'manifestId',
      'manifestHash',
      'selectedPayrollRunId',
      'linkedReviewCycleId',
      'warnings',
    ],
  ),
  PAYROLL_PERIOD_REOPENED: descriptor(
    'PAYROLL_PERIOD_REOPENED',
    'PAYROLL_PERIOD',
    'REQUIRED',
    'REQUIRED',
    ['payroll.period.close.reopen'],
    ['details'],
  ),
} satisfies Record<
  string,
  Readonly<Omit<AuditEventDescriptor, 'code'> & { readonly code: string }>
>);

export type AuditEventCode = keyof typeof AUDIT_EVENT_CATALOG;

export function auditEventDescriptor(code: string): AuditEventDescriptor {
  const found = (AUDIT_EVENT_CATALOG as Readonly<Record<string, AuditEventDescriptor | undefined>>)[
    code
  ];
  if (!found) throw new Error(`Unknown audit event code: ${code}`);
  return found;
}

export const AUDIT_EVENT_CODES = Object.freeze(
  Object.keys(AUDIT_EVENT_CATALOG) as AuditEventCode[],
);
