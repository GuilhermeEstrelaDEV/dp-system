import { HttpException, Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logger/app-logger.service';

export type LegacyPayrollClosureOperation = 'LIST' | 'DETAIL' | 'CLOSE' | 'REOPEN';

interface LegacyPayrollClosureTelemetryContext {
  readonly routeTemplate: string;
  readonly method: 'GET' | 'POST';
  readonly operationAlias: LegacyPayrollClosureOperation;
  readonly correlationId: string;
}

@Injectable()
export class PayrollClosureLegacyTelemetryService {
  static readonly ADAPTER_VERSION = 'p0-v1';

  constructor(private readonly logger: AppLoggerService) {}

  async observe<T>(
    context: LegacyPayrollClosureTelemetryContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await operation();
      this.write('SUCCESS', context);
      return result;
    } catch (error: unknown) {
      const resultClass =
        error instanceof HttpException
          ? `HTTP_${Math.floor(error.getStatus() / 100)}XX`
          : 'UNEXPECTED_ERROR';
      this.write(resultClass, context);
      throw error;
    }
  }

  private write(resultClass: string, context: LegacyPayrollClosureTelemetryContext): void {
    try {
      this.logger.log('Deprecated payroll closure route used', 'PayrollClosureLegacyAdapter', {
        routeTemplate: context.routeTemplate,
        method: context.method,
        operationAlias: context.operationAlias,
        resultClass,
        correlationId: context.correlationId,
        adapterVersion: PayrollClosureLegacyTelemetryService.ADAPTER_VERSION,
        deprecation: true,
      });
    } catch {
      // Compatibility telemetry is deliberately non-critical and cannot change the domain result.
    }
  }
}
