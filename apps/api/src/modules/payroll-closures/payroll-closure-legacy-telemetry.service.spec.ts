import { ConflictException } from '@nestjs/common';
import { PayrollClosureLegacyTelemetryService } from './payroll-closure-legacy-telemetry.service';

describe('PayrollClosureLegacyTelemetryService', () => {
  const logger = { log: jest.fn() };
  const telemetry = new PayrollClosureLegacyTelemetryService(logger as never);
  const context = {
    routeTemplate: '/payroll-closures',
    method: 'POST' as const,
    operationAlias: 'CLOSE' as const,
    correlationId: 'trace-safe',
  };

  beforeEach(() => jest.clearAllMocks());

  it('emits only the closed structural allowlist on success', async () => {
    await expect(telemetry.observe(context, async () => ({ ok: true }))).resolves.toEqual({
      ok: true,
    });
    expect(logger.log).toHaveBeenCalledWith(
      'Deprecated payroll closure route used',
      'PayrollClosureLegacyAdapter',
      {
        routeTemplate: '/payroll-closures',
        method: 'POST',
        operationAlias: 'CLOSE',
        resultClass: 'SUCCESS',
        correlationId: 'trace-safe',
        adapterVersion: 'p0-v1',
        deprecation: true,
      },
    );
    expect(JSON.stringify(logger.log.mock.calls)).not.toMatch(
      /body|query|authorization|token|reason|warning|payrollRunId|companyId|actor/i,
    );
  });

  it('records a sanitized result class and preserves the original error', async () => {
    const error = new ConflictException('sensitive reason must not be logged');
    await expect(telemetry.observe(context, async () => Promise.reject(error))).rejects.toBe(error);
    expect(logger.log.mock.calls[0]?.[2]).toMatchObject({ resultClass: 'HTTP_4XX' });
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('sensitive reason');
  });

  it('never changes the domain result when non-critical telemetry fails', async () => {
    logger.log.mockImplementation(() => {
      throw new Error('logger unavailable');
    });
    await expect(telemetry.observe(context, async () => 'domain-result')).resolves.toBe(
      'domain-result',
    );
  });
});
