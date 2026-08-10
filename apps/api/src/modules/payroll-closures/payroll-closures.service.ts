import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { ClosePayrollPeriodCommandDto } from '../payroll-periods/payroll-period-operational-closure.dto';
import { PayrollPeriodOperationalClosureService } from '../payroll-periods/payroll-period-operational-closure.service';
import { PayrollPeriodControlledReopeningService } from '../payroll-periods/payroll-period-controlled-reopening.service';
import { PayrollPeriodHistoryService } from '../payroll-periods/payroll-period-history.service';
import {
  ClosePayrollPeriodDto,
  PayrollClosureQueryDto,
  ReopenPayrollPeriodDto,
} from './payroll-closures.dto';
import { PayrollClosureLegacyTelemetryService } from './payroll-closure-legacy-telemetry.service';

@Injectable()
export class PayrollClosuresService {
  constructor(
    private readonly history: PayrollPeriodHistoryService,
    private readonly operationalClosure: PayrollPeriodOperationalClosureService,
    private readonly controlledReopening: PayrollPeriodControlledReopeningService,
    private readonly telemetry: PayrollClosureLegacyTelemetryService,
  ) {}

  list(query: PayrollClosureQueryDto, principal: AuthenticatedPrincipal) {
    return this.telemetry.observe(
      this.telemetryContext('GET', '/payroll-closures', 'LIST', principal),
      async () => {
        const history = await this.history.list(query.payrollPeriodId, principal);
        const ordered = [...history.versions].sort((left, right) => right.version - left.version);
        const totalItems = ordered.length;
        const offset = (query.page - 1) * query.pageSize;
        return {
          items: ordered.slice(offset, offset + query.pageSize),
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / query.pageSize),
          },
        };
      },
    );
  }

  find(id: string, principal: AuthenticatedPrincipal) {
    return this.telemetry.observe(
      this.telemetryContext('GET', '/payroll-closures/:id', 'DETAIL', principal),
      () => this.history.findByClosureId(id, principal),
    );
  }

  close(
    dto: ClosePayrollPeriodDto,
    idempotencyKey: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    return this.telemetry.observe(
      this.telemetryContext('POST', '/payroll-closures', 'CLOSE', principal),
      () => {
        const command: ClosePayrollPeriodCommandDto = {
          payrollRunId: dto.payrollRunId,
          expectedConsistencyToken: dto.expectedConsistencyToken,
          warningAcknowledgements: dto.warningAcknowledgements,
          ...(dto.note || dto.reason ? { note: dto.note ?? dto.reason } : {}),
          ...(dto.expectedClosureVersion === undefined
            ? {}
            : { expectedClosureVersion: dto.expectedClosureVersion }),
        };
        return this.operationalClosure.close(
          dto.payrollPeriodId,
          command,
          idempotencyKey,
          principal,
        );
      },
    );
  }

  reopen(
    payrollPeriodId: string,
    dto: ReopenPayrollPeriodDto,
    idempotencyKey: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    return this.telemetry.observe(
      this.telemetryContext(
        'POST',
        '/payroll-closures/:payrollPeriodId/reopen',
        'REOPEN',
        principal,
      ),
      () => this.controlledReopening.reopen(payrollPeriodId, dto, idempotencyKey, principal),
    );
  }

  private telemetryContext(
    method: 'GET' | 'POST',
    routeTemplate: string,
    operationAlias: 'LIST' | 'DETAIL' | 'CLOSE' | 'REOPEN',
    principal: AuthenticatedPrincipal,
  ) {
    return { method, routeTemplate, operationAlias, correlationId: principal.traceId } as const;
  }
}
