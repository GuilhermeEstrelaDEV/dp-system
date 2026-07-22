import { apiRequest } from '@/lib/api';
import type { PayrollRun, PayrollRunPage } from '@/features/payroll/payroll-runs';

export type ReviewStatus = 'OPEN' | 'IN_REVIEW' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CLOSED';
export type FindingStatus = 'OPEN' | 'RESOLVED';
export type FindingSeverity = 'INFORMATIONAL' | 'BLOCKING';
export type ReviewEvent = {
  id: string;
  eventType: string;
  actorId: string;
  actor?: { id: string; displayName: string };
  reason?: string | null;
  occurredAt: string;
  previousState?: unknown;
  nextState?: unknown;
  metadata?: unknown;
  findingId?: string | null;
};
export type ReviewDecision = {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  actorId: string;
  actor?: { id: string; displayName: string };
  reason?: string | null;
  occurredAt: string;
  reviewRound: number;
  submissionNumber: number;
};
export type ReviewFinding = {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  code: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  events?: ReviewEvent[];
};
export type ApprovalStage = {
  id: string;
  sequence: number;
  code: string;
  requiredCapability: string;
};
export type ReviewCycle = {
  id: string;
  companyId: string;
  payrollRunId: string;
  status: ReviewStatus;
  reviewRound: number;
  submissionNumber: number;
  currentApprovalStage: number;
  createdBy: string;
  createdAt: string;
  findings: ReviewFinding[];
  events: ReviewEvent[];
  approvalStages?: ApprovalStage[];
  decisions?: ReviewDecision[];
};
export type ReviewHistory = ReviewCycle & {
  currentState: ReviewStatus;
  timeline: ReviewEvent[];
  invalidations?: Array<{
    id: string;
    reviewRound: number;
    invalidatedAt: string;
    invalidatedBy: string;
    invalidationReason: string;
  }>;
};
export type CreateFinding = {
  severity: FindingSeverity;
  code: string;
  title: string;
  description: string;
  employmentContractId?: string;
  payrollCalculationItemId?: string;
};

export const payrollReviewApi = {
  listRuns: (payrollPeriodId: string) =>
    apiRequest<PayrollRunPage>(
      `/payroll-runs?${new URLSearchParams({ payrollPeriodId, page: '1', pageSize: '20', sortBy: 'createdAt', sortDirection: 'desc' })}`,
    ),
  findRun: (id: string) => apiRequest<PayrollRun>(`/payroll-runs/${id}`),
  listCycles: (runId: string) => apiRequest<ReviewCycle[]>(`/payroll-runs/${runId}/reviews`),
  createCycle: (runId: string) =>
    apiRequest<ReviewCycle>(`/payroll-runs/${runId}/reviews`, { method: 'POST' }),
  findCycle: (id: string) => apiRequest<ReviewCycle>(`/payroll-reviews/${id}`),
  history: (id: string) => apiRequest<ReviewHistory>(`/payroll-reviews/${id}/history`),
  findings: (id: string) => apiRequest<ReviewFinding[]>(`/payroll-reviews/${id}/findings`),
  createFinding: (id: string, body: CreateFinding) =>
    apiRequest<ReviewFinding>(`/payroll-reviews/${id}/findings`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resolveFinding: (id: string, reason: string) =>
    apiRequest<ReviewFinding>(`/payroll-review-findings/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  reopenFinding: (id: string, reason: string) =>
    apiRequest<ReviewFinding>(`/payroll-review-findings/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  action: (id: string, action: 'start' | 'submit' | 'close') =>
    apiRequest<ReviewCycle>(`/payroll-reviews/${id}/${action}`, { method: 'POST' }),
  decide: (id: string, action: 'approve' | 'reject' | 'reopen', reason?: string) =>
    apiRequest<ReviewCycle>(`/payroll-reviews/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    }),
};
