import { HttpException } from '@nestjs/common';
import type { PayrollPeriodReadinessBlocker } from './domain/payroll-period-closure-readiness';

export type PayrollPeriodClosureErrorCode =
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_KEY_INVALID'
  | 'IDEMPOTENCY_PAYLOAD_CONFLICT'
  | 'IDEMPOTENCY_OPERATION_IN_PROGRESS'
  | 'CONSISTENCY_TOKEN_MISMATCH'
  | 'CLOSURE_READINESS_NOT_MET'
  | 'WARNING_ACKNOWLEDGEMENT_REQUIRED'
  | 'WARNING_ACKNOWLEDGEMENT_INVALID'
  | 'PERIOD_ALREADY_CLOSED'
  | 'EXPECTED_CLOSURE_VERSION_MISMATCH'
  | 'PERIOD_NOT_CLOSED'
  | 'PERIOD_REOPEN_ALREADY_COMPLETED'
  | 'PERIOD_REOPEN_IN_PROGRESS'
  | 'CONCURRENT_REOPEN_CONFLICT'
  | 'CONCURRENT_CLOSURE_CONFLICT'
  | 'REOPEN_REASON_REQUIRED'
  | 'REOPEN_REASON_INVALID'
  | 'CLOSURE_EVIDENCE_INTEGRITY_ERROR'
  | 'OPTIMISTIC_VERSION_CONFLICT';

export class PayrollPeriodClosureHttpException extends HttpException {
  constructor(
    code: PayrollPeriodClosureErrorCode,
    message: string,
    status: number,
    details?: { blockers?: readonly PayrollPeriodReadinessBlocker[]; warningCodes?: string[] },
  ) {
    super({ code, message, ...details }, status);
  }
}
