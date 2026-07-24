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
  | 'CONCURRENT_CLOSURE_CONFLICT'
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
